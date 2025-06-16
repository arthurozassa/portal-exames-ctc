const request = require('supertest');
const app = require('../../src/app');
const Database = require('../../src/models/database');

describe('Authentication API Integration Tests', () => {
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

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    await Database.run('DELETE FROM users WHERE cpf = ?', ['12345678900']);
    await Database.run('DELETE FROM users WHERE email = ?', ['joao@teste.com']);
  });

  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const userData = testHelpers.generateTestUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testHelpers.validateApiResponse(response, 201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('usuário registrado');
      
      if (response.body.user) {
        testHelpers.validateUserStructure(response.body.user);
        expect(response.body.user.cpf).toBe(userData.cpf);
        expect(response.body.user.nome).toBe(userData.nome);
        expect(response.body.user.email).toBe(userData.email);
      }
    });

    test('Should reject duplicate CPF registration', async () => {
      const userData = testHelpers.generateTestUser();

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro com mesmo CPF
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toContain('CPF já cadastrado');
    });

    test('Should reject duplicate email registration', async () => {
      const userData1 = testHelpers.generateTestUser();
      const userData2 = {
        ...testHelpers.generateTestUser(),
        cpf: '98765432100',
        email: userData1.email
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData1)
        .expect(201);

      // Segundo registro com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData2)
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toContain('E-mail já cadastrado');
    });

    test('Should validate required fields', async () => {
      const requiredFields = ['cpf', 'nome', 'email', 'senha'];

      for (const field of requiredFields) {
        const userData = testHelpers.generateTestUser();
        delete userData[field];

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        testHelpers.validateErrorResponse(response, 400);
        expect(response.body.message).toContain(field);
      }
    });

    test('Should validate CPF format', async () => {
      const invalidCpfs = ['123', '12345678901', 'abc12345678', '000.000.000-00'];

      for (const cpf of invalidCpfs) {
        const userData = {
          ...testHelpers.generateTestUser(),
          cpf
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        testHelpers.validateErrorResponse(response, 400);
        expect(response.body.message).toContain('CPF inválido');
      }
    });

    test('Should validate email format', async () => {
      const invalidEmails = ['invalid-email', 'user@', '@domain.com', 'user.domain.com'];

      for (const email of invalidEmails) {
        const userData = {
          ...testHelpers.generateTestUser(),
          email
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        testHelpers.validateErrorResponse(response, 400);
        expect(response.body.message).toContain('E-mail inválido');
      }
    });

    test('Should validate password strength', async () => {
      const weakPasswords = ['123', 'abc', '12345', 'password'];

      for (const senha of weakPasswords) {
        const userData = {
          ...testHelpers.generateTestUser(),
          senha
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        testHelpers.validateErrorResponse(response, 400);
        expect(response.body.message).toContain('senha');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Registrar usuário de teste
      const userData = testHelpers.generateTestUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    test('Should login with valid credentials', async () => {
      const loginData = {
        cpf: '12345678900',
        senha: 'teste123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login realizado');
      
      if (response.body.token) {
        testHelpers.validateJwtToken(response.body.token);
      }
      
      if (response.body.user) {
        testHelpers.validateUserStructure(response.body.user);
      }
    });

    test('Should reject invalid CPF', async () => {
      const loginData = {
        cpf: '99999999999',
        senha: 'teste123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
      expect(response.body.message).toBe('CPF não encontrado. Verifique e tente novamente.');
    });

    test('Should reject invalid password', async () => {
      const loginData = {
        cpf: '12345678900',
        senha: 'senhaerrada'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
      expect(response.body.message).toBe('Senha inválida. Tente novamente.');
    });

    test('Should increment failed login attempts', async () => {
      const loginData = {
        cpf: '12345678900',
        senha: 'senhaerrada'
      };

      // Fazer múltiplas tentativas com senha errada
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);
      }

      // Verificar se tentativas foram incrementadas no banco
      const user = await Database.get('SELECT tentativas_login FROM users WHERE cpf = ?', ['12345678900']);
      expect(user.tentativas_login).toBe(3);
    });

    test('Should block account after max failed attempts', async () => {
      const loginData = {
        cpf: '12345678900',
        senha: 'senhaerrada'
      };

      // Fazer 5 tentativas com senha errada
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Próxima tentativa deve ser bloqueada
      const response = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678900', senha: 'teste123' })
        .expect(423);

      testHelpers.validateErrorResponse(response, 423);
      expect(response.body.message).toContain('bloqueada');
    });

    test('Should require 2FA token', async () => {
      const loginData = {
        cpf: '12345678900',
        senha: 'teste123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Primeira resposta deve indicar necessidade de 2FA
      expect(response.body.requires2FA).toBe(true);
      expect(response.body.message).toContain('2FA');
    });
  });

  describe('POST /api/auth/verify-2fa', () => {
    let tempToken;

    beforeEach(async () => {
      // Registrar usuário e fazer login para obter token temporário
      const userData = testHelpers.generateTestUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ cpf: userData.cpf, senha: userData.senha });

      tempToken = loginResponse.body.tempToken;
    });

    test('Should verify valid 2FA token', async () => {
      // Simular token 2FA válido (em produção seria enviado por SMS/email)
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          tempToken,
          token: '123456' // Token mockado
        })
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      
      if (response.body.token) {
        testHelpers.validateJwtToken(response.body.token);
      }
    });

    test('Should reject invalid 2FA token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          tempToken,
          token: '000000'
        })
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toBe('O código informado está incorreto.');
    });

    test('Should reject expired 2FA token', async () => {
      // Simular token expirado (implementação específica)
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          tempToken,
          token: 'expired'
        })
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toBe('Este código expirou. Solicite um novo para continuar.');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Registrar usuário de teste
      const userData = testHelpers.generateTestUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    test('Should send password reset token for valid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ cpf: '12345678900' })
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('código de recuperação');
    });

    test('Should reject invalid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ cpf: '99999999999' })
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.message).toBe('Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Registrar usuário e solicitar reset de senha
      const userData = testHelpers.generateTestUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ cpf: userData.cpf });

      // Em produção, o token seria enviado por email/SMS
      // Aqui simulamos obtendo do banco
      const user = await Database.get('SELECT token_recuperacao FROM users WHERE cpf = ?', [userData.cpf]);
      resetToken = user.token_recuperacao;
    });

    test('Should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          novaSenha: 'novasenha123'
        })
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('senha alterada');
    });

    test('Should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          novaSenha: 'novasenha123'
        })
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toBe('O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Registrar usuário e fazer login
      const userData = testHelpers.generateTestUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ cpf: userData.cpf, senha: userData.senha });

      authToken = loginResponse.body.token;
    });

    test('Should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logout');
    });

    test('Should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });
  });
});