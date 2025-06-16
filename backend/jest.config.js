module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Diretórios de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Ignorar node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/database/',
    '/coverage/'
  ],
  
  // Setup antes de cada teste
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coleta de coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Arquivo principal
    '!src/models/database.js' // Database connection
  ],
  
  // Relatório de coverage
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Timeout de testes
  testTimeout: 10000,
  
  // Variáveis de ambiente para testes
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  
  // Verbose output
  verbose: true,
  
  // Limpar mocks automaticamente
  clearMocks: true,
  
  // Restaurar mocks automaticamente
  restoreMocks: true
};