const express = require('express');
const router = express.Router();

// Controllers
const ExamController = require('../controllers/examController');

// Middleware
const { authenticateToken, checkResourceAccess } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput, validatePagination, validateNumericId, validateDateRange } = require('../middleware/validation');
const { validacoesExame, validacoesParam } = require('../utils/validators');

// Aplicar autenticação em todas as rotas (exceto visualização de exames compartilhados)
router.use((req, res, next) => {
  // Rota pública para visualizar exames compartilhados
  if (req.path.startsWith('/shared/')) {
    return next();
  }
  // Aplicar autenticação para as demais rotas
  authenticateToken(req, res, next);
});

/**
 * @route GET /api/exams
 * @desc Listar exames do usuário logado com filtros e paginação
 * @access Private
 */
router.get('/',
  validatePagination,
  validateDateRange('dataInicio', 'dataFim'),
  ExamController.listExams
);

/**
 * @route GET /api/exams/:id
 * @desc Obter detalhes de um exame específico
 * @access Private
 */
router.get('/:id',
  validateNumericId('id'),
  checkResourceAccess('exame'),
  ExamController.getExam
);

/**
 * @route POST /api/exams
 * @desc Criar novo exame (apenas para administradores via middleware admin)
 * @access Admin Only
 */
router.post('/',
  require('../middleware/auth').authenticateAdmin,
  sanitizeInput,
  [
    require('express-validator').body('usuarioId')
      .notEmpty()
      .withMessage('ID do usuário é obrigatório')
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro'),
    require('express-validator').body('tipoExame')
      .notEmpty()
      .withMessage('Tipo de exame é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Tipo de exame deve ter entre 2 e 100 caracteres'),
    require('express-validator').body('dataRealizacao')
      .notEmpty()
      .withMessage('Data de realização é obrigatória')
      .isDate()
      .withMessage('Data de realização inválida'),
    require('express-validator').body('medicoId')
      .optional()
      .isInt()
      .withMessage('ID do médico deve ser um número inteiro'),
    require('express-validator').body('resultado')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Resultado deve ter no máximo 1000 caracteres'),
    require('express-validator').body('observacoes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Observações devem ter no máximo 500 caracteres')
  ],
  handleValidationErrors,
  ExamController.createExam
);

/**
 * @route POST /api/exams/share
 * @desc Compartilhar exame com médico
 * @access Private
 */
router.post('/share',
  sanitizeInput,
  validacoesExame.compartilhar,
  handleValidationErrors,
  ExamController.shareExam
);

/**
 * @route DELETE /api/exams/shares/:id
 * @desc Revogar compartilhamento de exame
 * @access Private
 */
router.delete('/shares/:id',
  validateNumericId('id'),
  ExamController.revokeShare
);

/**
 * @route GET /api/exams/shared/:token
 * @desc Visualizar exame compartilhado via token (sem autenticação)
 * @access Public
 */
router.get('/shared/:token',
  validacoesParam.token,
  handleValidationErrors,
  ExamController.viewSharedExam
);

/**
 * @route GET /api/exams/report
 * @desc Gerar relatório de exames por período
 * @access Private
 */
router.get('/report',
  validateDateRange('dataInicio', 'dataFim'),
  ExamController.getExamReport
);

module.exports = router;