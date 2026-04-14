# MCP SQL Server

Un proveedor MCP (Model Context Protocol) para integrar SQL Server con Claude Desktop.

## 📋 Requisitos

- Node.js 18+
- SQL Server 2019+ (local o remoto)
- Claude Desktop instalado

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=tu_contraseña
DB_NAME=master
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

**Explicación de variables:**
- `DB_SERVER`: Host del servidor SQL Server (ej: `localhost`, `192.168.1.10`, `sql.example.com`)
- `DB_PORT`: Puerto (por defecto 1433)
- `DB_USER`: Usuario (ej: `sa` para admin local)
- `DB_PASSWORD`: Contraseña del usuario
- `DB_NAME`: Base de datos por defecto
- `DB_ENCRYPT`: `true` si usas conexión encriptada (Azure SQL)
- `DB_TRUST_CERT`: `true` para certificados autofirmados

### 3. Conectar a Claude Desktop

Edita el archivo de configuración de Claude Desktop según tu SO:

**Windows:**
```
C:\Users\{usuario}\AppData\Roaming\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

Agrega esta configuración (reemplaza la ruta según tu sistema):

```json
{
  "mcpServers": {
    "sqlserver": {
      "command": "node",
      "args": [
        "C:\\Users\\{usuario}\\Desktop\\MCPs\\db-sqlserver\\src\\index.js"
      ],
      "env": {
        "DB_SERVER": "localhost",
        "DB_PORT": "1433",
        "DB_USER": "sa",
        "DB_PASSWORD": "tu_contraseña",
        "DB_NAME": "master",
        "DB_ENCRYPT": "false",
        "DB_TRUST_CERT": "true"
      }
    }
  }
}
```

> **Nota:** Usa rutas completas y reemplaza `{usuario}` con tu usuario de Windows.

## ✨ Herramientas disponibles

Una vez conectado, tendrás acceso a estas herramientas en Claude:

### 1. `test_connection`
Verifica que la conexión a SQL Server funciona correctamente.

```
Uso: /test_connection
Respuesta: Muestra la fecha/hora actual del servidor
```

### 2. `list_tables`
Lista todas las tablas de la base de datos actual.

```
Uso: /list_tables
Respuesta: Nombre de todas las tablas
```

### 3. `describe_table`
Muestra la estructura de una tabla (columnas, tipos de datos, etc).

```
Uso: /describe_table (nombre_tabla)
Ejemplo: /describe_table Usuarios
```

### 4. `query`
Ejecuta consultas SELECT (lectura de datos).

```
Uso: /query (SQL)
Ejemplo: SELECT * FROM Usuarios WHERE activo = 1
```

### 5. `execute`
Ejecuta comandos INSERT, UPDATE, DELETE.

```
Uso: /execute (SQL)
Ejemplo: UPDATE Usuarios SET activo = 0 WHERE id = 5
```

## 🔧 Pruebas locales

Puedes probar el MCP sin Claude:

```bash
node src/index.js
```

Para desarrollo con logs, comenta esta línea en `src/index.js`:
```javascript
console.log = () => {}; // ← Comenta esta línea
```

## 📚 Ejemplos de uso en Claude

Una vez conectado, puedes pedir a Claude:

- "¿Cuáles son las tablas en mi base de datos?"
- "Muestra la estructura de la tabla Usuarios"
- "Dame los últimos 10 registros de Pedidos donde el estado sea pendiente"
- "Cuántos usuarios activos hay en total?"

## 🐛 Troubleshooting

### Error: "Connection timeout"
- Verifica que SQL Server está corriendo: `SELECT 1`
- Comprueba el firewall (puerto 1433)
- Verifica que las credenciales son correctas

### Error: "Login failed"
- Verifica usuario y contraseña
- Si usas SQL Server en local, el usuario por defecto es `sa`
- Asegúrate de que las credenciales tienen permiso a la BD

### Error: "Database does not exist"
- Verifica el nombre en `DB_NAME`
- Crea la BD antes de conectar

### Claude no ve el MCP
- Reinicia Claude Desktop completamente
- Verifica que la ruta en config es correcta
- Revisa los logs en: `%APPDATA%\Claude\debug-logs\`

## 📝 Licencia

MIT
