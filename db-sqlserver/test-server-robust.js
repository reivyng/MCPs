import { spawn } from 'child_process';

console.log('🔄 Probando nuevo servidor MCP robusto...');

// Simular cómo Claude Desktop ejecuta el servidor
const child = spawn('node', [
  'src/server.js'
], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: 'C:\\Users\\rmramirez\\Desktop\\MCPs\\db-sqlserver',
  env: {
    ...process.env,
    DB_SERVER: 'localhost',
    DB_PORT: '1433',
    DB_USER: 'sa',
    DB_PASSWORD: 'SqlServer123*',
    DB_NAME: 'qrs-orf',
    DB_ENCRYPT: 'false',
    DB_TRUST_CERT: 'true'
  }
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📤 STDOUT:', data.toString().trim());
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('📥 STDERR:', data.toString().trim());
});

child.on('close', (code) => {
  console.log(`\n🔚 Servidor MCP terminó con código: ${code}`);
  if (code === 0) {
    console.log('✅ Servidor MCP robusto funciona correctamente');
  } else {
    console.log('❌ Error en servidor MCP robusto');
    console.log('Error output:', errorOutput);
  }
});

child.on('error', (error) => {
  console.log('❌ Error al iniciar servidor MCP:', error.message);
});

// Enviar una señal de prueba MCP después de 2 segundos
setTimeout(() => {
  console.log('📤 Enviando señal de prueba MCP...');
  // Simular una petición MCP básica
  const testRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  }) + '\n';

  child.stdin.write(testRequest);
}, 2000);

// Terminar después de 8 segundos
setTimeout(() => {
  child.kill();
  console.log('\n⏰ Timeout: Terminando prueba del servidor MCP');
}, 8000);