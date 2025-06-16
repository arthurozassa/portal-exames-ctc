const { seedDatabase } = require('../database/seed');
const db = require('../src/models/database');

// Setup global para testes
beforeAll(async () => {
  // Conectar ao banco de dados em memória
  await db.connect();
  
  // Executar seed para popular dados de teste
  // await seedDatabase();
});

// Cleanup após todos os testes
afterAll(async () => {
  // Fechar conexão com o banco
  if (db.db) {
    db.close();
  }
});

// Setup antes de cada teste
beforeEach(() => {
  // Limpar console.log para testes mais limpos
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Cleanup após cada teste
afterEach(() => {
  // Restaurar console.log
  jest.restoreAllMocks();
});