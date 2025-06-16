const express = require('express');
const router = express.Router();

// Controllers
const UserController = require('../controllers/userController');

// Middleware
const { authenticateToken, checkResourceAccess } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput, validatePagination, validateNumericId } = require('../middleware/validation');
const { validacoesUsuario, validacoesParam } = require('../utils/validators');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route GET /api/users/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get('/profile',
  UserController.getProfile
);

/**
 * @route PUT /api/users/profile
 * @desc Atualizar perfil do usuário logado
 * @access Private
 */
router.put('/profile',
  sanitizeInput,
  validacoesUsuario.atualizar.filter(validation => 
    !validation.builder.fields.includes('id') // Remove validação de ID para esta rota
  ),
  handleValidationErrors,
  UserController.updateProfile
);

/**
 * @route POST /api/users/change-password
 * @desc Alterar senha do usuário
 * @access Private
 */
router.put('/change-password',
  sanitizeInput,
  [
    require('express-validator').body('senhaAtual')
      .notEmpty()
      .withMessage('Senha atual é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Senha atual deve ter pelo menos 4 caracteres'),
    require('express-validator').body('novaSenha')
      .notEmpty()
      .withMessage('Nova senha é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Nova senha deve ter pelo menos 4 caracteres')
  ],
  handleValidationErrors,
  UserController.changePassword
);

/**
 * @route GET /api/users/stats
 * @desc Obter estatísticas do usuário (exames, médicos, etc.)
 * @access Private
 */
router.get('/stats',
  UserController.getStats
);

/**
 * @route GET /api/users/activity-logs
 * @desc Obter logs de atividade do usuário
 * @access Private
 */
router.get('/activity-logs',
  validatePagination,
  UserController.getActivityLogs
);

/**
 * @route POST /api/users/responsaveis
 * @desc Adicionar responsável legal
 * @access Private
 */
router.post('/responsaveis',
  sanitizeInput,
  [
    require('express-validator').body('responsavelCpf')
      .notEmpty()
      .withMessage('CPF do responsável é obrigatório')
      .custom(require('../utils/validators').validarCPF)
      .withMessage('CPF do responsável é inválido'),
    require('express-validator').body('responsavelNome')
      .notEmpty()
      .withMessage('Nome do responsável é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    require('express-validator').body('responsavelEmail')
      .notEmpty()
      .withMessage('Email do responsável é obrigatório')
      .isEmail()
      .withMessage('Email do responsável é inválido'),
    require('express-validator').body('parentesco')
      .notEmpty()
      .withMessage('Parentesco é obrigatório')
      .isIn(['pai', 'mae', 'tutor', 'conjuge', 'filho', 'outro'])
      .withMessage('Parentesco deve ser: pai, mae, tutor, conjuge, filho ou outro')
  ],
  handleValidationErrors,
  UserController.addResponsavel
);

/**
 * @route DELETE /api/users/responsaveis/:id
 * @desc Remover responsável legal
 * @access Private
 */
router.delete('/responsaveis/:id',
  validateNumericId('id'),
  UserController.removeResponsavel
);

module.exports = router;