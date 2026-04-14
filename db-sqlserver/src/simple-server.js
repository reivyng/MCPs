import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

// Configuración de conexión
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

// Función principal que maneja las peticiones MCP
async function handleRequest(request) {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    const { method, params } = request;

    if (method === "tools/list") {
      await pool.close();
      return {
        tools: [
          {
            name: "test_connection",
            description: "Probar conexión a SQL Server",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "list_tables",
            description: "Lista las tablas de la base de datos",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "describe_table",
            description: "Describe la estructura de una tabla",
            inputSchema: {
              type: "object",
              properties: { table: { type: "string", description: "Nombre de la tabla" } },
              required: ["table"],
            },
          },
          {
            name: "query",
            description: "Ejecuta una consulta SQL SELECT",
            inputSchema: {
              type: "object",
              properties: { sql: { type: "string", description: "Consulta SQL SELECT" } },
              required: ["sql"],
            },
          },
          {
            name: "execute",
            description: "Ejecuta un comando SQL (INSERT, UPDATE, DELETE)",
            inputSchema: {
              type: "object",
              properties: { sql: { type: "string", description: "Comando SQL" } },
              required: ["sql"],
            },
          },
        ],
      };
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;

      if (name === "test_connection") {
        const result = await pool.request().query("SELECT GETDATE() as now");
        await pool.close();
        return {
          content: [{ type: "text", text: `✅ Conexión exitosa\nFecha: ${result.recordset[0].now}` }],
        };
      }

      if (name === "list_tables") {
        const result = await pool.request().query(`
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME
        `);
        const tables = result.recordset.map(r => r.TABLE_NAME);
        await pool.close();
        return {
          content: [{ type: "text", text: `📋 Tablas (${tables.length}):\n${tables.map(t => `  - ${t}`).join('\n')}` }],
        };
      }

      if (name === "describe_table") {
        const result = await pool.request()
          .input("tableName", sql.NVarChar, args.table)
          .query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @tableName ORDER BY ORDINAL_POSITION
          `);

        if (result.recordset.length === 0) {
          await pool.close();
          return { content: [{ type: "text", text: `❌ Tabla '${args.table}' no encontrada` }] };
        }

        const columns = result.recordset.map(col =>
          `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`
        ).join('\n');

        await pool.close();
        return { content: [{ type: "text", text: `📊 Estructura de '${args.table}':\n${columns}` }] };
      }

      if (name === "query") {
        if (!args.sql.toUpperCase().trim().startsWith("SELECT")) {
          await pool.close();
          throw new Error("Solo SELECT permitido");
        }
        const result = await pool.request().query(args.sql);
        await pool.close();
        return {
          content: [{
            type: "text",
            text: `✅ ${result.recordset.length} filas:\n${JSON.stringify(result.recordset, null, 2)}`
          }],
        };
      }

      if (name === "execute") {
        if (args.sql.toUpperCase().trim().startsWith("SELECT")) {
          await pool.close();
          throw new Error("SELECT no permitido, usa query");
        }
        const result = await pool.request().query(args.sql);
        await pool.close();
        return {
          content: [{ type: "text", text: `✅ Ejecutado\nFilas afectadas: ${result.rowsAffected[0] || 0}` }],
        };
      }

      await pool.close();
      throw new Error(`Tool '${name}' no encontrada`);
    }

    await pool.close();
    throw new Error(`Método '${method}' no soportado`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `❌ Error: ${error.message}` }],
    };
  }
}

// Leer de stdin y escribir a stdout
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString().trim());
    const response = await handleRequest(request);
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: request.id,
      result: response,
    }) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: error.message },
    }) + '\n');
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));