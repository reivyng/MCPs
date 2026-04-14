console.log = () => {};

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import sql from "mssql";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

// Configuración de conexión a SQL Server
const config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT || "1433"),
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "master",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
};

// Pool de conexiones
const pool = new sql.ConnectionPool(config);
let isConnected = false;

// Función para conectar (lazy connection)
async function connectToDatabase() {
  if (isConnected) return true;

  try {
    await pool.connect();
    isConnected = true;
    console.error("Conectado a SQL Server");
    return true;
  } catch (err) {
    console.error("Error de conexión:", err.message);
    isConnected = false;
    return false;
  }
}

// Servidor MCP
const server = new Server(
  {
    name: "sqlserver-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 🔧 LISTAR TOOLS
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "test_connection",
        description: "Probar conexión a SQL Server",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_tables",
        description: "Lista las tablas de la base de datos",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "describe_table",
        description: "Describe la estructura de una tabla",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Nombre de la tabla",
            },
          },
          required: ["table"],
        },
      },
      {
        name: "query",
        description: "Ejecuta una consulta SQL",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "Consulta SQL a ejecutar",
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "execute",
        description: "Ejecuta un comando SQL (INSERT, UPDATE, DELETE)",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "Comando SQL a ejecutar",
            },
          },
          required: ["sql"],
        },
      },
    ],
  };
});

// ⚙️ EJECUTAR TOOLS
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Intentar conectar si no estamos conectados
    if (!isConnected) {
      const connected = await connectToDatabase();
      if (!connected) {
        throw new Error("No se pudo conectar a SQL Server. Verifica la configuración.");
      }
    }

    if (name === "test_connection") {
      const result = await pool.request().query("SELECT GETDATE() as now");
      return {
        content: [
          {
            type: "text",
            text: `✅ Conexión exitosa a SQL Server\n${JSON.stringify(
              result.recordset[0],
              null,
              2
            )}`,
          },
        ],
      };
    }

    if (name === "list_tables") {
      const result = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);

      const tables = result.recordset.map((row) => row.TABLE_NAME);
      return {
        content: [
          {
            type: "text",
            text: `📋 Tablas encontradas (${tables.length}):\n${tables
              .map((t) => `  - ${t}`)
              .join("\n")}`,
          },
        ],
      };
    }

    if (name === "describe_table") {
      const result = await pool
        .request()
        .input("tableName", sql.NVarChar, args.table)
        .query(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            NUMERIC_SCALE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);

      if (result.recordset.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Tabla '${args.table}' no encontrada`,
            },
          ],
        };
      }

      const columns = result.recordset
        .map((col) => {
          let type = col.DATA_TYPE;
          if (col.CHARACTER_MAXIMUM_LENGTH) {
            type += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
          }
          if (col.NUMERIC_PRECISION) {
            type += `(${col.NUMERIC_PRECISION},${col.NUMERIC_SCALE})`;
          }
          const nullable = col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
          return `  - ${col.COLUMN_NAME}: ${type} ${nullable}`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📊 Estructura de '${args.table}':\n${columns}`,
          },
        ],
      };
    }

    if (name === "query") {
      const result = await pool.request().query(args.sql);
      const rows = result.recordset;

      if (rows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "ℹ️ La consulta no retornó resultados",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ ${rows.length} fila(s) retornada(s):\n${JSON.stringify(
              rows,
              null,
              2
            )}`,
          },
        ],
      };
    }

    if (name === "execute") {
      const result = await pool.request().query(args.sql);
      return {
        content: [
          {
            type: "text",
            text: `✅ Comando ejecutado exitosamente\nFilas afectadas: ${result.rowsAffected[0]}`,
          },
        ],
      };
    }

    throw new Error(`Tool '${name}' no encontrada`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`,
        },
      ],
    };
  }
});

// 🚀 Conectar con Claude Desktop
const transport = new StdioServerTransport();
await server.connect(transport);

// Manejo de desconexión
process.on("SIGINT", async () => {
  await pool.close();
  process.exit(0);
});
