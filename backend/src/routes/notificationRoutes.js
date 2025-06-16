const express = require('express');
const NotificationController = require('../controllers/notificationController');
const AuthMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');

const router = express.Router();

// Rotas protegidas para pacientes
router.use(AuthMiddleware.authenticatePatient);

// Listar notificações do paciente
router.get('/',
    auditLogger('view_notifications', 'notification'),
    NotificationController.getPatientNotifications
);

// Marcar notificação como lida
router.patch('/:notificationId/read',
    auditLogger('mark_notification_read', 'notification'),
    NotificationController.markAsRead
);

// Marcar todas como lidas
router.patch('/mark-all-read',
    auditLogger('mark_all_notifications_read', 'notification'),
    NotificationController.markAllAsRead
);

module.exports = router;