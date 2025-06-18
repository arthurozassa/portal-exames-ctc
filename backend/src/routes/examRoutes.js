const express = require('express');
const ExamController = require('../controllers/examController');
const AuthMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');

const router = express.Router();

// Rotas protegidas para pacientes
router.use(AuthMiddleware.authenticatePatient);

/**
 * @swagger
 * /api/exams/dashboard/stats:
 *   get:
 *     tags: [Exams]
 *     summary: Estatísticas do dashboard do paciente
 *     description: Retorna estatísticas resumidas dos exames do paciente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalExams:
 *                       type: integer
 *                       example: 10
 *                     recentExams:
 *                       type: integer
 *                       example: 3
 *                     pendingExams:
 *                       type: integer
 *                       example: 1
 *                     sharedExams:
 *                       type: integer
 *                       example: 5
 *                     lastExamDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-05-27"
 */
// Dashboard do paciente
router.get('/dashboard/stats',
    auditLogger('view_dashboard', 'exam'),
    ExamController.getDashboardStats
);

/**
 * @swagger
 * /api/exams:
 *   get:
 *     tags: [Exams]
 *     summary: Listar exames do paciente
 *     description: Retorna todos os exames do paciente autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de exame
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, shared]
 *         description: Filtrar por status
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *         description: Filtrar por unidade
 *     responses:
 *       200:
 *         description: Lista de exames obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       exam_type:
 *                         type: string
 *                         example: "Ressonância Magnética"
 *                       exam_date:
 *                         type: string
 *                         format: date
 *                         example: "2025-05-27"
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       unit:
 *                         type: string
 *                         example: "CTC Vila Mariana"
 *                       has_images:
 *                         type: boolean
 *                         example: true
 *                       doctor_name:
 *                         type: string
 *                         example: "Dr. Ricardo Santos"
 *                       doctor_crm:
 *                         type: string
 *                         example: "CRM/SP 12345"
 */
// Listar exames do paciente
router.get('/',
    auditLogger('view_exams', 'exam'),
    ExamController.getPatientExams
);

// Obter detalhes de um exame
router.get('/:examId',
    auditLogger('view_exam_details', 'exam'),
    ExamController.getExamDetails
);

// Compartilhar exame com médico
router.post('/:examId/share',
    auditLogger('share_exam', 'exam'),
    ExamController.shareExam
);

// Listar compartilhamentos do paciente
router.get('/shares/list',
    ExamController.getPatientShares
);

// Revogar compartilhamento
router.delete('/shares/:shareId',
    auditLogger('revoke_share', 'exam'),
    ExamController.revokeShare
);

/**
 * @swagger
 * /api/exams/timeline/data:
 *   get:
 *     tags: [Exams]
 *     summary: Dados da timeline médica
 *     description: Retorna dados evolutivos dos parâmetros médicos do paciente para gráficos de timeline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 6
 *           maximum: 36
 *           default: 12
 *         description: Período em meses para análise
 *       - in: query
 *         name: parameter
 *         schema:
 *           type: string
 *           enum: [hemoglobina, colesterol_total, glicose, creatinina, tsh, vitamina_d]
 *         description: Parâmetro específico para análise
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [hematologia, bioquimica, lipidios, hormonal, cardiovascular, vitaminas]
 *         description: Categoria médica
 *     responses:
 *       200:
 *         description: Dados da timeline obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     parameters:
 *                       type: array
 *                       description: Lista dos 27 parâmetros médicos disponíveis
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "hemoglobina"
 *                           name:
 *                             type: string
 *                             example: "Hemoglobina"
 *                           category:
 *                             type: string
 *                             example: "hematologia"
 *                           unit:
 *                             type: string
 *                             example: "g/dL"
 *                           reference_range:
 *                             type: object
 *                             properties:
 *                               min:
 *                                 type: number
 *                                 example: 12.0
 *                               max:
 *                                 type: number
 *                                 example: 16.0
 *                     timeline:
 *                       type: array
 *                       description: Evolução temporal dos valores
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2025-05-27"
 *                           parameter:
 *                             type: string
 *                             example: "hemoglobina"
 *                           value:
 *                             type: number
 *                             example: 14.2
 *                           status:
 *                             type: string
 *                             enum: [normal, limitrofe, baixo, alto]
 *                             example: "normal"
 *                           risk_level:
 *                             type: string
 *                             enum: [baixo, medio, alto]
 *                             example: "baixo"
 */
// Obter dados para linha do tempo
router.get('/timeline/data',
    auditLogger('view_timeline', 'exam'),
    ExamController.getTimelineData
);

// Download de PDF do exame
router.get('/:examId/pdf',
    auditLogger('download_pdf', 'exam'),
    ExamController.downloadExamPDF
);

// Download de relatório
router.get('/:examId/report',
    auditLogger('download_report', 'exam'),
    ExamController.downloadExamReport
);

// Upload de arquivo para exame
router.post('/:examId/upload',
    auditLogger('upload_file', 'exam'),
    ExamController.uploadExamFile
);

module.exports = router;