const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');
const { 
    loginLimiter, 
    passwordRecoveryLimiter,
    cpfValidation,
    checkAccountLockout,
    updateLoginAttempts,
    logLoginAttempt,
    auditLogger
} = require('../middleware/security');

const router = express.Router();

// Rotas públicas (sem autenticação)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login do paciente
 *     description: Autentica um paciente usando CPF e senha, retorna tokens e inicia processo 2FA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - password
 *             properties:
 *               cpf:
 *                 type: string
 *                 description: CPF do paciente (apenas números)
 *                 example: "12345678900"
 *               password:
 *                 type: string
 *                 description: Senha do paciente
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login realizado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     patient:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Maria Silva Santos"
 *                         cpf:
 *                           type: string
 *                           example: "12345678900"
 *                         email:
 *                           type: string
 *                           example: "maria.silva@demo.com"
 *                     token:
 *                       type: string
 *                       description: Token JWT temporário para 2FA
 *                     refreshToken:
 *                       type: string
 *                       description: Token para renovação
 *                     needsConsent:
 *                       type: boolean
 *                       example: false
 *                     twoFactorRequired:
 *                       type: boolean
 *                       example: true
 *                     tokenSentTo:
 *                       type: string
 *                       example: "(11) 98765-4321"
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 *       429:
 *         description: Muitas tentativas de login
 */
// Login do paciente
router.post('/login', 
    loginLimiter,
    cpfValidation,
    checkAccountLockout,
    logLoginAttempt,
    updateLoginAttempts,
    AuthController.login
);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     tags: [Authentication]
 *     summary: Verificar token 2FA
 *     description: Valida o código 2FA enviado por SMS/WhatsApp/Email e completa o login
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - token
 *             properties:
 *               cpf:
 *                 type: string
 *                 description: CPF do paciente
 *                 example: "12345678900"
 *               token:
 *                 type: string
 *                 description: Código 2FA de 6 dígitos
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "2FA verificado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token JWT final para acesso
 *                     patient:
 *                       type: object
 *                       description: Dados do paciente autenticado
 *       400:
 *         description: Token inválido ou expirado
 *       401:
 *         description: Não autorizado
 */
// Verificar token 2FA
router.post('/verify-2fa',
    auditLogger('2fa_attempt', 'auth'),
    AuthController.verify2FA
);

// Solicitar recuperação de senha
router.post('/request-password-reset',
    passwordRecoveryLimiter,
    cpfValidation,
    auditLogger('password_reset_request', 'auth'),
    AuthController.requestPasswordReset
);

// Verificar token de recuperação
router.post('/verify-recovery-token',
    cpfValidation,
    AuthController.verifyRecoveryToken
);

// Redefinir senha
router.post('/reset-password',
    cpfValidation,
    auditLogger('password_reset', 'auth'),
    AuthController.resetPassword
);

// Login de administrador
router.post('/admin/login',
    loginLimiter,
    auditLogger('admin_login_attempt', 'auth'),
    AuthController.adminLogin
);

// Refresh token
router.post('/refresh',
    AuthController.refreshToken
);

// Rotas protegidas (requerem autenticação)

// Aceitar termo de consentimento
router.post('/accept-consent',
    AuthMiddleware.authenticatePatient,
    auditLogger('consent_accepted', 'patient'),
    AuthController.acceptConsent
);

// Logout
router.post('/logout',
    AuthMiddleware.authenticatePatient,
    auditLogger('logout', 'auth'),
    AuthController.logout
);

// Logout de administrador
router.post('/admin/logout',
    AuthMiddleware.authenticateAdmin,
    auditLogger('admin_logout', 'auth'),
    AuthController.logout
);

// Verificar token (para validação no frontend)
router.get('/verify',
    AuthMiddleware.authenticatePatient,
    (req, res) => {
        res.json({
            success: true,
            message: 'Token válido',
            user: req.user
        });
    }
);

// Verificar token de admin
router.get('/admin/verify',
    AuthMiddleware.authenticateAdmin,
    (req, res) => {
        res.json({
            success: true,
            message: 'Token de admin válido',
            user: req.user
        });
    }
);

module.exports = router;