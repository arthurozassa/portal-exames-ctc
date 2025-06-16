const Database = require('../database/connection');
const { logAuditEvent } = require('../middleware/security');

class NotificationController {
    // Listar notificações do paciente
    static async getPatientNotifications(req, res) {
        try {
            const patientId = req.user.id;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;
            
            let whereConditions = ['patient_id = ?'];
            let params = [patientId];
            
            if (unreadOnly === 'true') {
                whereConditions.push('is_read = false');
            }
            
            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * limit;
            
            // Buscar notificações
            const notifications = await Database.query(`
                SELECT *
                FROM notifications
                WHERE ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            // Contar total
            const totalResult = await Database.query(`
                SELECT COUNT(*) as total
                FROM notifications
                WHERE ${whereClause}
            `, params);
            
            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Contar não lidas
            const unreadResult = await Database.query(`
                SELECT COUNT(*) as unread
                FROM notifications
                WHERE patient_id = ? AND is_read = false
            `, [patientId]);
            
            const unreadCount = unreadResult[0].unread;
            
            res.json({
                success: true,
                data: {
                    notifications,
                    unreadCount,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Marcar notificação como lida
    static async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            const patientId = req.user.id;
            
            // Verificar se a notificação pertence ao paciente
            const notifications = await Database.query(
                'SELECT * FROM notifications WHERE id = ? AND patient_id = ?',
                [notificationId, patientId]
            );
            
            if (notifications.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notificação não encontrada'
                });
            }
            
            // Marcar como lida
            await Database.query(
                'UPDATE notifications SET is_read = true, read_at = datetime("now") WHERE id = ?',
                [notificationId]
            );
            
            // Log de auditoria
            logAuditEvent(req, 'mark_notification_read', 'notification', notificationId);
            
            res.json({
                success: true,
                message: 'Notificação marcada como lida'
            });
            
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Marcar todas as notificações como lidas
    static async markAllAsRead(req, res) {
        try {
            const patientId = req.user.id;
            
            await Database.query(
                'UPDATE notifications SET is_read = true, read_at = datetime("now") WHERE patient_id = ? AND is_read = false',
                [patientId]
            );
            
            // Log de auditoria
            logAuditEvent(req, 'mark_all_notifications_read', 'notification', null, {
                patientId
            });
            
            res.json({
                success: true,
                message: 'Todas as notificações foram marcadas como lidas'
            });
            
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Criar nova notificação (uso interno)
    static async createNotification(patientId, title, message, type = 'info', examId = null) {
        try {
            const result = await Database.query(`
                INSERT INTO notifications (patient_id, title, message, type, exam_id, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [patientId, title, message, type, examId]);
            
            console.log(`📱 Notificação criada para paciente ${patientId}: ${title}`);
            
            return result.insertId;
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            throw error;
        }
    }
}

module.exports = NotificationController;