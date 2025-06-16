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

// Login do paciente
router.post('/login', 
    loginLimiter,
    cpfValidation,
    checkAccountLockout,
    logLoginAttempt,
    updateLoginAttempts,
    AuthController.login
);

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