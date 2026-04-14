# MCP SQL Server - Conexión con Claude Desktop

## 🚀 Instalación Rápida

### 1. Instalar dependencias
```bash
cd db-sqlserver
npm install
```

### 2. Configurar conexión
Edita el archivo `.env` con tus datos de SQL Server:
```env
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=tu_password
DB_NAME=tu_base_datos
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### 3. Conectar con Claude Desktop

**Windows:**
- Abre el archivo: `C:\Users\[tu_usuario]\AppData\Roaming\Claude\claude_desktop_config.json`
- Agrega esta configuración:

```json
{
  "mcpServers": {
    "sqlserver": {
      "command": "node",
      "args": ["C:\\Users\\rmramirez\\Desktop\\MCPs\\db-sqlserver\\src\\server.js"],
      "env": {
        "DB_SERVER": "localhost",
        "DB_PORT": "1433",
        "DB_USER": "sa",
        "DB_PASSWORD": "tu_password",
        "DB_NAME": "tu_base_datos",
        "DB_ENCRYPT": "false",
        "DB_TRUST_CERT": "true"
      }
    }
  }
}
```

### 4. Reinicia Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo. Las herramientas MCP estarán disponibles.

## 🛠️ Herramientas disponibles

Una vez conectado, podrás usar comandos como:
- "lista las tablas de sql server"
- "describe la tabla usuarios"
- "ejecuta SELECT * FROM tabla LIMIT 10"
- "prueba la conexión a sql server"

## 📋 Requisitos

- Node.js 18+
- SQL Server 2019+ ejecutándose
- Claude Desktop instalado

## 🔧 Solución de problemas

Si no funciona:
1. Verifica que SQL Server esté ejecutándose en el puerto 1433
2. Prueba la conexión manualmente: `node test-connection.js`
3. Reinicia Claude Desktop completamente
4. Revisa que la ruta en `claude_desktop_config.json` sea correcta