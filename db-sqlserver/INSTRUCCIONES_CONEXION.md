# 🔗 Guía: Conectar SQL Server MCP a Claude Desktop

## ✅ CONFIGURACIÓN COMPLETA Y FUNCIONANDO

El servidor MCP de SQL Server está completamente configurado y probado con las siguientes credenciales:

- **Servidor**: localhost ✅
- **Puerto**: 1433 ✅
- **Usuario**: sa ✅
- **Contraseña**: SqlServer123* ✅
- **Base de datos**: qrs-orf ✅
- **Encriptación**: false ✅
- **Confiar en certificado**: true ✅

## 🧪 PRUEBA DE CONEXIÓN EXITOSA

La conexión ha sido probada y funciona correctamente:
- ✅ SQL Server está ejecutándose en puerto 1433
- ✅ Credenciales de autenticación válidas
- ✅ Base de datos "qrs-orf" existe y es accesible
- ✅ Consultas SQL se ejecutan correctamente

## 🚀 Para usar en Claude Desktop:

1. **Reinicia Claude Desktop** para que cargue la nueva configuración
2. **Las herramientas MCP disponibles son**:
   - `test_connection`: Prueba la conexión a SQL Server
   - `list_tables`: Lista todas las tablas de la BD "qrs-orf"
   - `describe_table`: Muestra la estructura de una tabla específica
   - `query`: Ejecuta consultas SELECT en "qrs-orf"
   - `execute`: Ejecuta comandos INSERT/UPDATE/DELETE en "qrs-orf"

## 📁 Archivos configurados:

- ✅ `claude_desktop_config.json` - Configuración de Claude Desktop actualizada
- ✅ `.env` - Variables de entorno locales
- ✅ `package.json` - Dependencias instaladas
- ✅ `src/index.js` - Servidor MCP implementado y corregido
- ✅ `test-connection.js` - Script de prueba funcional

## 🔧 Para probar manualmente:

```bash
cd C:\Users\rmramirez\Desktop\MCPs\db-sqlserver
node test-connection.js
```

5. Agrega esta configuración para SQL Server:

```json
{
  "mcpServers": {
    "sqlserver": {
      "command": "node",
      "args": ["C:\\Users\\rmramirez\\Desktop\\MCPs\\db-sqlserver\\src\\index.js"],
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

⚠️ **Importante**: 
- Reemplaza `tu_contraseña` con tu contraseña real
- Usa barras invertidas dobles `\\` en las rutas Windows
- Si tienes otros MCPs, agrégalo junto a los existentes (no reemplaces todo)

## Ejemplo del archivo completo con varios MCPs:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "node",
      "args": ["C:\\Users\\rmramirez\\Desktop\\MCPs\\db-postgres\\src\\index.js"]
    },
    "sqlserver": {
      "command": "node",
      "args": ["C:\\Users\\rmramirez\\Desktop\\MCPs\\db-sqlserver\\src\\index.js"],
      "env": {
        "DB_SERVER": "localhost",
        "DB_PORT": "1433",
        "DB_USER": "sa",
        "DB_PASSWORD": "tu_contraseña",
        "DB_NAME": "master",
        "DB_ENCRYPT": "false",
        "DB_TRUST_CERT": "true"
      }
    },
    "filesystem": {
      "command": "node",
      "args": ["C:\\Users\\rmramirez\\Desktop\\MCPs\\filesystem\\src\\index.js"]
    }
  }
}
```

## Paso 5: Reiniciar Claude Desktop

- Cierra completamente Claude Desktop (no solo minimizar)
- Espera 5 segundos
- Abre Claude Desktop nuevamente

## Paso 6: Verificar que está conectado

1. En Claude, presiona `@` para ver los MCPs disponibles
2. Deberías ver `sqlserver` en la lista
3. Prueba diciendo: "usando la herramienta SQL Server, test_connection"

## 🎉 ¡Listo!

Ahora puedes pedirle a Claude que:
- Liste tus tablas
- Describa la estructura de una tabla
- Ejecute consultas
- Muestre datos específicos

Ejemplos:
- "¿Cuáles son las tablas en mi base de datos?"
- "Muestra los 5 primeros registros de Usuarios"
- "¿Cuántos registros activos hay?"

---

## Solución de problemas

### ❌ "MCP not responding"
1. Verifica que SQL Server está corriendo
2. Revisa el archivo `.env` tiene credenciales correctas
3. Intenta conectarte manualmente:
   ```powershell
   node src\index.js
   ```
   Si da error aquí, el problema está en la configuración

### ❌ No veo el MCP en Claude
1. Verifica la sintaxis JSON en `claude_desktop_config.json`
   - Usa https://jsonlint.com/ si dudas
2. Asegúrate de que las rutas usan barras invertidas dobles `\\`
3. En PowerShell, valida:
   ```powershell
   Test-Path "C:\Users\rmramirez\Desktop\MCPs\db-sqlserver\src\index.js"
   ```

### ❌ Error de conexión a SQL Server
- Verifica que SQL Server está corriendo: `sqlcmd -U sa`
- Comprueba usuario/contraseña en `.env`
- Si es remoto, verifica firewall puerto 1433
