const express = require('express');
const router = express.Router();

// Controllers
const AuthController = require('../controllers/authController');

// Middleware
const { authRateLimit, passwordRecoveryRateLimit } = require('../middleware/security');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');
const { validacoesAuth } = require('../utils/validators');

/**
 * @route POST /api/auth/login
 * @desc Login inicial (CPF + senha) - Envia código 2FA
 * @access Public
 */
router.post('/login',
  authRateLimit,
  sanitizeInput,
  validacoesAuth.login,
  handleValidationErrors,
  AuthController.login
);

/**
 * @route POST /api/auth/verify-2fa
 * @desc Verificar código 2FA e retornar tokens JWT
 * @access Public
 */
router.post('/verify-2fa',
  authRateLimit,
  sanitizeInput,
  validacoesAuth.verificarToken2FA,
  handleValidationErrors,
  AuthController.verify2FA
);

/**
 * @route POST /api/auth/resend-2fa
 * @desc Reenviar código 2FA
 * @access Public
 */
router.post('/resend-2fa',
  authRateLimit,
  sanitizeInput,
  validacoesAuth.recuperarSenha, // Usa mesma validação (só CPF)
  handleValidationErrors,
  AuthController.resend2FA
);

/**
 * @route POST /api/auth/refresh
 * @desc Renovar token de acesso usando refresh token
 * @access Public
 */
router.post('/refresh',
  sanitizeInput,
  (req, res, next) => {
    if (!req.body.refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token de refresh é obrigatório'
        }
      });
    }
    next();
  },
  AuthController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc Logout do usuário (invalidar refresh token)
 * @access Private
 */
router.post('/logout',
  require('../middleware/auth').authenticateToken,
  sanitizeInput,
  AuthController.logout
);

/**
 * @route POST /api/auth/recover-password
 * @desc Solicitar recuperação de senha (envia token por email)
 * @access Public
 */
router.post('/recover-password',
  passwordRecoveryRateLimit,
  sanitizeInput,
  validacoesAuth.recuperarSenha,
  handleValidationErrors,
  AuthController.recoverPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Redefinir senha usando token de recuperação
 * @access Public
 */
router.post('/reset-password',
  sanitizeInput,
  validacoesAuth.redefinirSenha,
  handleValidationErrors,
  AuthController.resetPassword
);

module.exports = router;