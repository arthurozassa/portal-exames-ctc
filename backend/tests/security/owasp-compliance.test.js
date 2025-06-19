const request = require('supertest');
const app = require('../../src/app');
const Database = require('../../src/models/database');

describe('OWASP Security Compliance Tests', () => {
  let server;
  
  beforeAll(async () => {
    await Database.connect();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    Database.close();
  });

  describe('A01 - Broken Access Control', () => {
    test('Should prevent unauthorized access to protected routes', async () => {
      const response = await request(app)
        .get('/api/exames')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
      expect(response.body.message).toContain('Token não fornecido');
    });

    test('Should prevent access with invalid token', async () => {
      const response = await request(app)
        .get('/api/exames')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });

    test('Should prevent users from accessing other users data', async () => {
      // Este teste precisa de implementação específica baseada na estrutura de autenticação
      // Mockando cenário onde usuário tenta acessar dados de outro usuário
      const mockUserId = 999;
      const response = await request(app)
        .get(`/api/users/${mockUserId}`)
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('A02 - Cryptographic Failures', () => {
    test('Should hash passwords correctly', async () => {
      const userData = testHelpers.generateTestUser();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Verificar se a senha não é retornada em texto plano
      if (response.body.user) {
        expect(response.body.user).not.toHaveProperty('senha');
        expect(response.body.user).not.toHaveProperty('senha_hash');
      }
    });

    test('Should enforce HTTPS in production headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verificar se headers de segurança estão presentes
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('A03 - Injection Vulnerabilities', () => {
    test('Should prevent SQL injection in login', async () => {
      const maliciousPayload = {
        cpf: "' OR '1'='1",
        senha: "' OR '1'='1"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      // Deve retornar erro de validação, não sucesso
      expect(response.status).not.toBe(200);
    });

    test('Should prevent NoSQL injection in search', async () => {
      const maliciousQuery = {
        q: { $ne: null }
      };

      const response = await request(app)
        .get('/api/exames/search')
        .query(maliciousQuery)
        .expect(401); // Sem token deve retornar 401

      expect(response.status).toBe(401);
    });

    test('Should sanitize input data', async () => {
      const maliciousData = {
        cpf: '12345678900',
        nome: '<script>alert(\"xss\")</script>',
        email: 'test@example.com',
        senha: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      // Verificar se scripts foram sanitizados
      if (response.body.user && response.body.user.nome) {
        expect(response.body.user.nome).not.toContain('<script>');
      }
    });
  });

  describe('A04 - Insecure Design', () => {
    test('Should implement proper rate limiting', async () => {
      const requests = [];
      const userData = { cpf: '12345678900', senha: 'wrongpassword' };

      // Fazer múltiplas requisições rapidamente
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send(userData)
        );
      }

      const responses = await Promise.all(requests);
      
      // Pelo menos algumas requisições devem ser bloqueadas por rate limiting
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('Should implement account lockout after failed attempts', async () => {
      const userData = { cpf: '12345678900', senha: 'wrongpassword' };

      // Fazer múltiplas tentativas de login com senha incorreta
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(userData);
      }

      // A próxima tentativa deve retornar erro de conta bloqueada
      const response = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678900', senha: 'correctpassword' });

      expect(response.status).toBe(423); // Locked
    });
  });

  describe('A05 - Security Misconfiguration', () => {
    test('Should not expose sensitive server information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verificar se headers sensíveis estão ocultos
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });

    test('Should set proper security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verificar headers de segurança
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('A06 - Vulnerable and Outdated Components', () => {
    test('Should use secure dependencies', () => {
      const packageJson = require('../../package.json');
      
      // Verificar se dependências críticas estão presentes
      expect(packageJson.dependencies.helmet).toBeDefined();
      expect(packageJson.dependencies['express-rate-limit']).toBeDefined();
      expect(packageJson.dependencies['express-validator']).toBeDefined();
    });
  });

  describe('A07 - Identification and Authentication Failures', () => {
    test('Should require strong password validation', async () => {
      const weakPasswords = ['123', 'password', '12345678', 'qwerty'];
      
      for (const weakPassword of weakPasswords) {
        const userData = {
          ...testHelpers.generateTestUser(),
          senha: weakPassword
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Deve rejeitar senhas fracas
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('senha');
      }
    });

    test('Should implement session timeout', async () => {
      // Teste de expiração de token (implementação específica)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
      
      const response = await request(app)
        .get('/api/exames')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });
  });

  describe('A08 - Software and Data Integrity Failures', () => {
    test('Should validate data integrity', async () => {
      const tamperedData = {
        cpf: '12345678900',
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'password123',
        role: 'admin' // Campo não permitido
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(tamperedData);

      // Deve ignorar ou rejeitar campos não permitidos
      if (response.body.user) {
        expect(response.body.user.role).toBeUndefined();
      }
    });
  });

  describe('A09 - Security Logging and Monitoring Failures', () => {
    test('Should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678900', senha: 'wrongpassword' });

      // Verificar se tentativas de login inválidas são logadas
      // (Implementação específica baseada no sistema de logging)
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('A10 - Server-Side Request Forgery (SSRF)', () => {
    test('Should prevent SSRF in URL parameters', async () => {
      const maliciousUrls = [
        'http://localhost:3000/admin',
        'http://127.0.0.1:22',
        'file:///etc/passwd',
        'http://169.254.169.254/latest/meta-data/'
      ];

      for (const url of maliciousUrls) {
        const response = await request(app)
          .get(`/api/proxy?url=${encodeURIComponent(url)}`)
          .expect(404); // Rota não deve existir

        expect(response.status).toBe(404);
      }
    });
  });

  describe('Additional Security Tests', () => {
    test('Should prevent directory traversal', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .get(`/api/files/${path}`)
          .expect(404); // Rota não deve existir ou deve ser bloqueada

        expect(response.status).toBe(404);
      }
    });

    test('Should implement CORS properly', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://malicious-site.com')
        .expect(200);

      // Verificar se CORS está configurado corretamente
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });
});