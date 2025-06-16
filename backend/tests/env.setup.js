// Configuração de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '5m';
process.env.DB_PATH = ':memory:'; // SQLite em memória para testes
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.FRONTEND_URL = 'http://localhost:3000';