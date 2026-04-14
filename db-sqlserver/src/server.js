#!/usr/bin/env node

// Script de inicio robusto para el servidor MCP de SQL Server
console.error = () => {}; // Deshabilitar console.error para evitar ruido en MCP
console.log = () => {}; // Deshabilitar console.log para evitar ruido en MCP

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

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

// Pool de conexiones global
let pool = null;
let isInitialized = false;

// Función para inicializar la conexión
async function initializeConnection() {
  if (isInitialized) return true;

  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    isInitialized = true;
    return true;
  } catch (error) {
    isInitialized = false;
    return false;
  }
}

// Función para obtener pool de conexiones
async function getPool() {
  if (!isInitialized) {
    await initializeConnection();
  }

  if (!pool || !pool.connected) {
    await initializeConnection();
  }

  return pool;
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
        description: "Ejecuta una consulta SQL SELECT",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "Consulta SQL SELECT a ejecutar",
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
    const pool = await getPool();

    if (!pool) {
      throw new Error("No se pudo establecer conexión con SQL Server");
    }

    if (name === "test_connection") {
      const result = await pool.request().query("SELECT GETDATE() as now");
      return {
        content: [
          {
            type: "text",
            text: `✅ Conexión exitosa a SQL Server\nFecha del servidor: ${result.recordset[0].now}`,
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
      // Validar que sea una consulta SELECT
      if (!args.sql.toUpperCase().trim().startsWith("SELECT")) {
        throw new Error("Solo se permiten consultas SELECT en esta herramienta");
      }

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
      // Validar que NO sea una consulta SELECT
      if (args.sql.toUpperCase().trim().startsWith("SELECT")) {
        throw new Error("Esta herramienta no permite consultas SELECT. Usa la herramienta 'query'");
      }

      const result = await pool.request().query(args.sql);
      return {
        content: [
          {
            type: "text",
            text: `✅ Comando ejecutado exitosamente\nFilas afectadas: ${result.rowsAffected[0] || 0}`,
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
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

startServer();

// Manejo de desconexión
process.on("SIGINT", async () => {
  if (pool) {
    try {
      await pool.close();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (pool) {
    try {
      await pool.close();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  }
  process.exit(0);
});