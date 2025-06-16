const Database = require('../src/models/database');

module.exports = async () => {
  // Setup global para testes
  console.log('🧪 Configurando ambiente de testes...');
  
  // Conectar ao banco de dados de teste (em memória)
  await Database.connect();
  
  // Configurar dados de teste globais se necessário
  global.__DATABASE__ = Database;
  
  console.log('✅ Ambiente de testes configurado');
};