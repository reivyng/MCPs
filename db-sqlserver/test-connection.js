import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

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

async function testConnection() {
  try {
    console.log("🔄 Intentando conectar a SQL Server...");
    console.log(`Servidor: ${config.server}:${config.port}`);
    console.log(`Usuario: ${config.user}`);
    console.log(`Base de datos: ${config.database}`);

    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    console.log("✅ Conexión exitosa!");

    const result = await pool.request().query("SELECT GETDATE() as fecha_actual, @@VERSION as version");
    console.log("📅 Fecha del servidor:", result.recordset[0].fecha_actual);
    console.log("📋 Versión SQL Server:", result.recordset[0].version.substring(0, 50) + "...");

    await pool.close();
    console.log("🔌 Conexión cerrada");
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    if (error.code) {
      console.error("Código de error:", error.code);
    }
  }
}

testConnection();