import { spawn } from 'child_process';

console.log('🔄 Probando servidor MCP oficial de SQL Server...');

// Simular cómo Claude Desktop ejecuta el servidor
const child = spawn('npx', [
  '-y',
  '@modelcontextprotocol/server-sqlserver',
  'Server=localhost,1433;Database=qrs-orf;User Id=sa;Password=SqlServer123*;TrustServerCertificate=true;'
], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
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
    console.log('✅ Servidor MCP oficial funciona correctamente');
  } else {
    console.log('❌ Error en servidor MCP oficial');
    console.log('Error output:', errorOutput);
  }
});

child.on('error', (error) => {
  console.log('❌ Error al iniciar servidor MCP:', error.message);
});

// Terminar después de 10 segundos
setTimeout(() => {
  child.kill();
  console.log('\n⏰ Timeout: Terminando prueba del servidor MCP');
}, 10000);