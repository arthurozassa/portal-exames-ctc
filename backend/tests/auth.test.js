const request = require('supertest');
const app = require('../src/app');

describe('Authentication Endpoints', () => {
  
  describe('POST /api/auth/login', () => {
    it('should return error for missing CPF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          senha: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for invalid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345',
          senha: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345678900'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require 2FA for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345678900',
          senha: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.requer2FA).toBe(true);
      expect(response.body.data.cpf).toBe('123.456.789-00');
    });

    it('should return error for invalid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '00000000000',
          senha: '1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CPF');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345678900',
          senha: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });
  });

  describe('POST /api/auth/verify-2fa', () => {
    it('should return error for missing CPF', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          token: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          cpf: '12345678900'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          cpf: '12345678900',
          token: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/recover-password', () => {
    it('should return success for valid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/recover-password')
        .send({
          cpf: '12345678900'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('receberá instruções');
    });

    it('should return success even for invalid CPF (security)', async () => {
      const response = await request(app)
        .post('/api/auth/recover-password')
        .send({
          cpf: '00000000000'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });
});

describe('Rate Limiting', () => {
  it('should apply rate limiting to auth endpoints', async () => {
    // Fazer muitas requisições rapidamente
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({
            cpf: '12345678900',
            senha: 'wrongpassword'
          })
      );
    }

    const responses = await Promise.all(promises);
    
    // Pelo menos uma resposta deve ser rate limited
    const rateLimited = responses.some(response => response.status === 429);
    expect(rateLimited).toBe(true);
  });
});

describe('Input Validation and Sanitization', () => {
  it('should sanitize HTML in inputs', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        cpf: '<script>alert("xss")</script>12345678900',
        senha: '<script>alert("xss")</script>1234'
      });

    // Deve validar o CPF sanitizado e retornar erro de CPF inválido
    expect(response.status).toBe(400);
  });

  it('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        cpf: "'; DROP TABLE users; --",
        senha: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SQL_INJECTION_DETECTED');
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-xss-protection']).toBeDefined();
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.version).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('404 Handling', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});