const express = require('express');
const router = express.Router();

// Controllers
const AdminController = require('../controllers/adminController');

// Middleware
const { authenticateAdmin, requirePermission } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const { handleValidationErrors, sanitizeInput, validatePagination, validateNumericId, validateDateRange } = require('../middleware/validation');

/**
 * @route POST /api/admin/login
 * @desc Login administrativo
 * @access Public
 */
router.post('/login',
  authRateLimit,
  sanitizeInput,
  [
    require('express-validator').body('email')
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email inválido'),
    require('express-validator').body('senha')
      .notEmpty()
      .withMessage('Senha é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Senha deve ter pelo menos 4 caracteres')
  ],
  handleValidationErrors,
  AdminController.adminLogin
);

// ============= ROTAS AUTENTICADAS =============
// Todas as rotas abaixo requerem autenticação de administrador

router.use(authenticateAdmin);

/**
 * @route GET /api/admin/dashboard
 * @desc Obter dados do dashboard administrativo
 * @access Admin
 */
router.get('/dashboard',
  AdminController.getDashboard
);

/**
 * @route GET /api/admin/users
 * @desc Listar todos os usuários com filtros
 * @access Admin
 */
router.get('/users',
  validatePagination,
  AdminController.listUsers
);

/**
 * @route POST /api/admin/users/:id/unlock
 * @desc Desbloquear usuário
 * @access Admin
 */
router.post('/users/:id/unlock',
  validateNumericId('id'),
  AdminController.unlockUser
);

/**
 * @route PUT /api/admin/users/:id/status
 * @desc Ativar/Desativar usuário
 * @access Admin
 */
router.put('/users/:id/status',
  validateNumericId('id'),
  sanitizeInput,
  [
    require('express-validator').body('ativo')
      .notEmpty()
      .withMessage('Status ativo é obrigatório')
      .isBoolean()
      .withMessage('Status ativo deve ser true ou false')
  ],
  handleValidationErrors,
  AdminController.toggleUserStatus
);

/**
 * @route GET /api/admin/audit-logs
 * @desc Obter logs de auditoria
 * @access Admin
 */
router.get('/audit-logs',
  validatePagination,
  validateDateRange('dataInicio', 'dataFim'),
  AdminController.getAuditLogs
);

/**
 * @route GET /api/admin/shares/report
 * @desc Relatório de compartilhamentos
 * @access Admin
 */
router.get('/shares/report',
  validateDateRange('dataInicio', 'dataFim'),
  AdminController.getSharesReport
);

/**
 * @route POST /api/admin/backup
 * @desc Criar backup do banco de dados
 * @access Admin
 */
router.post('/backup',
  requirePermission('backup'),
  AdminController.createBackup
);

/**
 * @route GET /api/admin/settings
 * @desc Obter configurações do sistema
 * @access Admin
 */
router.get('/settings',
  AdminController.getSystemSettings
);

module.exports = router;