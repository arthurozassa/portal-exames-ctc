const express = require('express');
const ExamController = require('../controllers/examController');
const AuthMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');

const router = express.Router();

// Rotas protegidas para pacientes
router.use(AuthMiddleware.authenticatePatient);

// Dashboard do paciente
router.get('/dashboard/stats',
    auditLogger('view_dashboard', 'exam'),
    ExamController.getDashboardStats
);

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