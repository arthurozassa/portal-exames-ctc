const express = require('express');
const router = express.Router();

// Controllers
const DoctorController = require('../controllers/doctorController');

// Middleware
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput, validatePagination, validateNumericId } = require('../middleware/validation');
const { validacoesMedico, validacoesParam } = require('../utils/validators');

/**
 * @route GET /api/doctors
 * @desc Listar médicos (público para usuários escolherem ao compartilhar)
 * @access Private
 */
router.get('/',
  authenticateToken,
  validatePagination,
  DoctorController.listDoctors
);

/**
 * @route GET /api/doctors/:id
 * @desc Obter detalhes de um médico específico
 * @access Private
 */
router.get('/:id',
  authenticateToken,
  validateNumericId('id'),
  DoctorController.getDoctor
);

/**
 * @route GET /api/doctors/stats
 * @desc Obter estatísticas dos médicos
 * @access Private
 */
router.get('/stats',
  authenticateToken,
  DoctorController.getDoctorStats
);

/**
 * @route GET /api/doctors/:id/shares
 * @desc Obter compartilhamentos recebidos por um médico
 * @access Private
 */
router.get('/:id/shares',
  authenticateToken,
  validateNumericId('id'),
  validatePagination,
  DoctorController.getDoctorShares
);

// ============= ROTAS ADMINISTRATIVAS =============
// Todas as rotas abaixo requerem autenticação de administrador

/**
 * @route POST /api/doctors
 * @desc Criar novo médico
 * @access Admin Only
 */
router.post('/',
  authenticateAdmin,
  sanitizeInput,
  validacoesMedico.criar,
  handleValidationErrors,
  DoctorController.createDoctor
);

/**
 * @route PUT /api/doctors/:id
 * @desc Atualizar médico
 * @access Admin Only
 */
router.put('/:id',
  authenticateAdmin,
  validateNumericId('id'),
  sanitizeInput,
  [
    require('express-validator').body('nome')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    require('express-validator').body('crm')
      .optional()
      .custom(require('../utils/validators').validarCRM)
      .withMessage('CRM inválido. Formato: XXXXXX/UF'),
    require('express-validator').body('especialidade')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Especialidade deve ter entre 2 e 100 caracteres'),
    require('express-validator').body('email')
      .optional()
      .isEmail()
      .withMessage('Email inválido'),
    require('express-validator').body('telefone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX')
  ],
  handleValidationErrors,
  DoctorController.updateDoctor
);

/**
 * @route DELETE /api/doctors/:id
 * @desc Desativar médico (soft delete)
 * @access Admin Only
 */
router.delete('/:id',
  authenticateAdmin,
  validateNumericId('id'),
  DoctorController.deleteDoctor
);

module.exports = router;