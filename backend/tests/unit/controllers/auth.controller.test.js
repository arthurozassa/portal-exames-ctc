const AuthController = require('../../../src/controllers/auth.controller');
const AuthService = require('../../../src/services/auth.service');
const { validationResult } = require('express-validator');

// Mock dos serviços
jest.mock('../../../src/services/auth.service');
jest.mock('express-validator');

describe('AuthController Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Mock padrão para validationResult
    validationResult.mockReturnValue({ isEmpty: () => true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('Should register user successfully', async () => {
      const userData = testHelpers.generateTestUser();
      req.body = userData;

      const mockUser = { id: 1, cpf: userData.cpf, nome: userData.nome, email: userData.email };
      AuthService.register.mockResolvedValue(mockUser);

      await AuthController.register(req, res, next);

      expect(AuthService.register).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuário registrado com sucesso',
        user: mockUser
      });
    });

    test('Should handle validation errors', async () => {
      req.body = { cpf: 'invalid' };
      
      const mockErrors = {
        isEmpty: () => false,
        array: () => [{ msg: 'CPF inválido', param: 'cpf' }]
      };
      validationResult.mockReturnValue(mockErrors);

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dados inválidos',
        errors: [{ msg: 'CPF inválido', param: 'cpf' }]
      });
    });

    test('Should handle duplicate CPF error', async () => {
      const userData = testHelpers.generateTestUser();
      req.body = userData;

      const error = new Error('CPF já cadastrado');
      error.code = 'DUPLICATE_CPF';
      AuthService.register.mockRejectedValue(error);

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CPF já cadastrado'
      });
    });

    test('Should handle duplicate email error', async () => {
      const userData = testHelpers.generateTestUser();
      req.body = userData;

      const error = new Error('E-mail já cadastrado');
      error.code = 'DUPLICATE_EMAIL';
      AuthService.register.mockRejectedValue(error);

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'E-mail já cadastrado'
      });
    });

    test('Should handle unexpected errors', async () => {
      const userData = testHelpers.generateTestUser();
      req.body = userData;

      const error = new Error('Database connection failed');
      AuthService.register.mockRejectedValue(error);

      await AuthController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    test('Should login successfully and return 2FA requirement', async () => {
      req.body = { cpf: '12345678900', senha: 'teste123' };

      const mockResult = {
        requires2FA: true,
        tempToken: 'temp-token',
        user: { id: 1, cpf: '12345678900', nome: 'João Silva' }
      };
      AuthService.login.mockResolvedValue(mockResult);

      await AuthController.login(req, res, next);

      expect(AuthService.login).toHaveBeenCalledWith(
        '12345678900',
        'teste123',
        '127.0.0.1',
        'test-user-agent'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login realizado com sucesso. Insira o código 2FA.',
        requires2FA: true,
        tempToken: 'temp-token',
        user: mockResult.user
      });
    });

    test('Should handle invalid CPF', async () => {
      req.body = { cpf: '99999999999', senha: 'teste123' };

      const error = new Error('CPF não encontrado');
      error.code = 'USER_NOT_FOUND';
      AuthService.login.mockRejectedValue(error);

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CPF não encontrado. Verifique e tente novamente.'
      });
    });

    test('Should handle invalid password', async () => {
      req.body = { cpf: '12345678900', senha: 'senhaerrada' };

      const error = new Error('Senha inválida');
      error.code = 'INVALID_PASSWORD';
      AuthService.login.mockRejectedValue(error);

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Senha inválida. Tente novamente.'
      });
    });

    test('Should handle account locked', async () => {
      req.body = { cpf: '12345678900', senha: 'teste123' };

      const error = new Error('Conta bloqueada');
      error.code = 'ACCOUNT_LOCKED';
      AuthService.login.mockRejectedValue(error);

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login inválidas. Tente novamente em alguns minutos.'
      });
    });
  });

  describe('verify2FA', () => {
    test('Should verify 2FA successfully', async () => {
      req.body = { tempToken: 'temp-token', token: '123456' };

      const mockResult = {
        token: 'jwt-token',
        user: { id: 1, cpf: '12345678900', nome: 'João Silva' }
      };
      AuthService.verify2FA.mockResolvedValue(mockResult);

      await AuthController.verify2FA(req, res, next);

      expect(AuthService.verify2FA).toHaveBeenCalledWith('temp-token', '123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Autenticação realizada com sucesso',
        token: 'jwt-token',
        user: mockResult.user
      });
    });

    test('Should handle invalid 2FA token', async () => {
      req.body = { tempToken: 'temp-token', token: '000000' };

      const error = new Error('Token inválido');
      error.code = 'INVALID_2FA_TOKEN';
      AuthService.verify2FA.mockRejectedValue(error);

      await AuthController.verify2FA(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'O código informado está incorreto.'
      });
    });

    test('Should handle expired 2FA token', async () => {
      req.body = { tempToken: 'temp-token', token: '123456' };

      const error = new Error('Token expirado');
      error.code = 'EXPIRED_2FA_TOKEN';
      AuthService.verify2FA.mockRejectedValue(error);

      await AuthController.verify2FA(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Este código expirou. Solicite um novo para continuar.'
      });
    });
  });

  describe('forgotPassword', () => {
    test('Should send reset token successfully', async () => {
      req.body = { cpf: '12345678900' };

      AuthService.forgotPassword.mockResolvedValue();

      await AuthController.forgotPassword(req, res, next);

      expect(AuthService.forgotPassword).toHaveBeenCalledWith('12345678900');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Um código de recuperação foi enviado para o seu celular/e-mail cadastrado.'
      });
    });

    test('Should handle user not found', async () => {
      req.body = { cpf: '99999999999' };

      const error = new Error('Usuário não encontrado');
      error.code = 'USER_NOT_FOUND';
      AuthService.forgotPassword.mockRejectedValue(error);

      await AuthController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.'
      });
    });
  });

  describe('resetPassword', () => {
    test('Should reset password successfully', async () => {
      req.body = { token: 'reset-token', novaSenha: 'novasenha123' };

      AuthService.resetPassword.mockResolvedValue();

      await AuthController.resetPassword(req, res, next);

      expect(AuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'novasenha123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Senha alterada com sucesso. Você já pode fazer login com a nova senha.'
      });
    });

    test('Should handle invalid reset token', async () => {
      req.body = { token: 'invalid-token', novaSenha: 'novasenha123' };

      const error = new Error('Token inválido');
      error.code = 'INVALID_RESET_TOKEN';
      AuthService.resetPassword.mockRejectedValue(error);

      await AuthController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
      });
    });

    test('Should handle expired reset token', async () => {
      req.body = { token: 'expired-token', novaSenha: 'novasenha123' };

      const error = new Error('Token expirado');
      error.code = 'EXPIRED_RESET_TOKEN';
      AuthService.resetPassword.mockRejectedValue(error);

      await AuthController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
      });
    });
  });

  describe('logout', () => {
    test('Should logout successfully', async () => {
      req.user = { id: 1 };

      AuthService.logout.mockResolvedValue();

      await AuthController.logout(req, res, next);

      expect(AuthService.logout).toHaveBeenCalledWith(1);
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    });

    test('Should handle logout error', async () => {
      req.user = { id: 1 };

      const error = new Error('Logout failed');
      AuthService.logout.mockRejectedValue(error);

      await AuthController.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    test('Should get user profile successfully', async () => {
      req.user = { id: 1 };

      const mockUser = {
        id: 1,
        cpf: '12345678900',
        nome: 'João Silva',
        email: 'joao@teste.com'
      };
      AuthService.getProfile.mockResolvedValue(mockUser);

      await AuthController.getProfile(req, res, next);

      expect(AuthService.getProfile).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: mockUser
      });
    });

    test('Should handle profile not found', async () => {
      req.user = { id: 999 };

      const error = new Error('Usuário não encontrado');
      error.code = 'USER_NOT_FOUND';
      AuthService.getProfile.mockRejectedValue(error);

      await AuthController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não encontrado'
      });
    });
  });

  describe('updateProfile', () => {
    test('Should update profile successfully', async () => {
      req.user = { id: 1 };
      req.body = { nome: 'João Silva Santos', telefone: '11999999999' };

      const mockUpdatedUser = {
        id: 1,
        cpf: '12345678900',
        nome: 'João Silva Santos',
        email: 'joao@teste.com',
        telefone: '11999999999'
      };
      AuthService.updateProfile.mockResolvedValue(mockUpdatedUser);

      await AuthController.updateProfile(req, res, next);

      expect(AuthService.updateProfile).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: mockUpdatedUser
      });
    });

    test('Should handle validation errors on update', async () => {
      req.user = { id: 1 };
      req.body = { email: 'invalid-email' };

      const mockErrors = {
        isEmpty: () => false,
        array: () => [{ msg: 'E-mail inválido', param: 'email' }]
      };
      validationResult.mockReturnValue(mockErrors);

      await AuthController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dados inválidos',
        errors: [{ msg: 'E-mail inválido', param: 'email' }]
      });
    });
  });

  describe('changePassword', () => {
    test('Should change password successfully', async () => {
      req.user = { id: 1 };
      req.body = { senhaAtual: 'senha123', novaSenha: 'novasenha123' };

      AuthService.changePassword.mockResolvedValue();

      await AuthController.changePassword(req, res, next);

      expect(AuthService.changePassword).toHaveBeenCalledWith(1, 'senha123', 'novasenha123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    });

    test('Should handle incorrect current password', async () => {
      req.user = { id: 1 };
      req.body = { senhaAtual: 'senhaerrada', novaSenha: 'novasenha123' };

      const error = new Error('Senha atual incorreta');
      error.code = 'INVALID_CURRENT_PASSWORD';
      AuthService.changePassword.mockRejectedValue(error);

      await AuthController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Senha atual incorreta'
      });
    });
  });
});