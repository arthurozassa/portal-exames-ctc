const Database = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../middleware/security');
const NotificationController = require('./notificationController');

class DelegationController {
    // Listar delegações do paciente
    static async getPatientDelegations(req, res) {
        try {
            const patientId = req.user.id;
            const { status = 'all' } = req.query;
            
            let whereConditions = ['patient_id = ?'];
            let params = [patientId];
            
            if (status === 'active') {
                whereConditions.push('status = "active"');
                whereConditions.push('end_date > datetime("now")');
            } else if (status === 'expired') {
                whereConditions.push('(status = "expired" OR end_date <= datetime("now"))');
            }
            
            const whereClause = whereConditions.join(' AND ');
            
            const delegations = await Database.query(`
                SELECT 
                    d.*,
                    doc.name as doctor_name,
                    doc.crm as doctor_crm,
                    doc.specialty as doctor_specialty
                FROM delegations d
                JOIN doctors doc ON d.doctor_id = doc.id
                WHERE ${whereClause}
                ORDER BY d.created_at DESC
            `, params);
            
            // Processar permissões (converter de JSON string para objeto)
            const processedDelegations = delegations.map(delegation => ({
                ...delegation,
                permissions: JSON.parse(delegation.permissions || '{}')
            }));
            
            res.json({
                success: true,
                data: {
                    delegations: processedDelegations
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar delegações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Criar nova delegação
    static async createDelegation(req, res) {
        try {
            const patientId = req.user.id;
            const { doctorCrm, startDate, endDate, permissions } = req.body;
            
            // Validações
            if (!doctorCrm || !startDate || !endDate || !permissions) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos os campos são obrigatórios'
                });
            }
            
            // Verificar se as datas são válidas
            const start = new Date(startDate);
            const end = new Date(endDate);
            const now = new Date();
            
            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'Data de início deve ser anterior à data de fim'
                });
            }
            
            if (end <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Data de fim deve ser futura'
                });
            }
            
            // Buscar médico pelo CRM
            const doctors = await Database.query(
                'SELECT * FROM doctors WHERE crm = ? AND is_active = true',
                [doctorCrm]
            );
            
            if (doctors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Médico não encontrado com este CRM'
                });
            }
            
            const doctor = doctors[0];
            
            // Verificar se já existe delegação ativa para este médico
            const existingDelegations = await Database.query(`
                SELECT * FROM delegations 
                WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
                AND end_date > datetime('now')
            `, [patientId, doctor.id]);
            
            if (existingDelegations.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Já existe uma delegação ativa para este médico'
                });
            }
            
            // Gerar token único
            const token = uuidv4();
            const status = start <= now ? 'active' : 'pending';
            
            // Criar delegação
            const result = await Database.query(`
                INSERT INTO delegations (
                    patient_id, doctor_id, start_date, end_date, 
                    permissions, status, token, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [
                patientId, 
                doctor.id, 
                startDate, 
                endDate, 
                JSON.stringify(permissions),
                status,
                token
            ]);
            
            // Criar notificação para o paciente
            await NotificationController.createNotification(
                patientId,
                'Delegação Criada',
                `Delegação criada com sucesso para Dr. ${doctor.name} (${doctor.crm})`,
                'success'
            );
            
            // Log de auditoria
            logAuditEvent(req, 'create_delegation', 'delegation', result.insertId, {
                doctorCrm: doctor.crm,
                doctorName: doctor.name,
                startDate,
                endDate,
                permissions,
                status
            });
            
            console.log(`👥 Delegação criada para Dr. ${doctor.name} (${doctor.crm})`);
            console.log(`🔗 Token: ${token}`);
            
            res.json({
                success: true,
                message: 'Delegação criada com sucesso',
                data: {
                    delegationId: result.insertId,
                    doctor: {
                        name: doctor.name,
                        crm: doctor.crm,
                        specialty: doctor.specialty
                    },
                    startDate,
                    endDate,
                    permissions,
                    status,
                    token
                }
            });
            
        } catch (error) {
            console.error('Erro ao criar delegação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Revogar delegação
    static async revokeDelegation(req, res) {
        try {
            const { delegationId } = req.params;
            const patientId = req.user.id;
            
            // Verificar se a delegação pertence ao paciente
            const delegations = await Database.query(`
                SELECT d.*, doc.name as doctor_name, doc.crm as doctor_crm
                FROM delegations d
                JOIN doctors doc ON d.doctor_id = doc.id
                WHERE d.id = ? AND d.patient_id = ? AND d.status = 'active'
            `, [delegationId, patientId]);
            
            if (delegations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Delegação não encontrada ou já revogada'
                });
            }
            
            const delegation = delegations[0];
            
            // Revogar delegação
            await Database.query(
                'UPDATE delegations SET status = "revoked", revoked_at = datetime("now") WHERE id = ?',
                [delegationId]
            );
            
            // Criar notificação
            await NotificationController.createNotification(
                patientId,
                'Delegação Revogada',
                `Delegação com Dr. ${delegation.doctor_name} foi revogada`,
                'warning'
            );
            
            // Log de auditoria
            logAuditEvent(req, 'revoke_delegation', 'delegation', delegationId, {
                doctorCrm: delegation.doctor_crm,
                doctorName: delegation.doctor_name
            });
            
            res.json({
                success: true,
                message: 'Delegação revogada com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao revogar delegação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Atualizar permissões de delegação
    static async updatePermissions(req, res) {
        try {
            const { delegationId } = req.params;
            const { permissions } = req.body;
            const patientId = req.user.id;
            
            if (!permissions) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissões são obrigatórias'
                });
            }
            
            // Verificar se a delegação pertence ao paciente
            const delegations = await Database.query(`
                SELECT d.*, doc.name as doctor_name, doc.crm as doctor_crm
                FROM delegations d
                JOIN doctors doc ON d.doctor_id = doc.id
                WHERE d.id = ? AND d.patient_id = ? AND d.status = 'active'
            `, [delegationId, patientId]);
            
            if (delegations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Delegação não encontrada ou não está ativa'
                });
            }
            
            const delegation = delegations[0];
            
            // Atualizar permissões
            await Database.query(
                'UPDATE delegations SET permissions = ?, updated_at = datetime("now") WHERE id = ?',
                [JSON.stringify(permissions), delegationId]
            );
            
            // Criar notificação
            await NotificationController.createNotification(
                patientId,
                'Delegação Atualizada',
                `Permissões da delegação com Dr. ${delegation.doctor_name} foram atualizadas`,
                'info'
            );
            
            // Log de auditoria
            logAuditEvent(req, 'update_delegation_permissions', 'delegation', delegationId, {
                doctorCrm: delegation.doctor_crm,
                doctorName: delegation.doctor_name,
                newPermissions: permissions
            });
            
            res.json({
                success: true,
                message: 'Permissões atualizadas com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao atualizar permissões:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Verificar delegação por token (para médicos)
    static async verifyDelegation(req, res) {
        try {
            const { token } = req.params;
            
            const delegations = await Database.query(`
                SELECT 
                    d.*,
                    p.name as patient_name,
                    p.cpf as patient_cpf,
                    p.birth_date as patient_birth_date,
                    doc.name as doctor_name,
                    doc.crm as doctor_crm
                FROM delegations d
                JOIN patients p ON d.patient_id = p.id
                JOIN doctors doc ON d.doctor_id = doc.id
                WHERE d.token = ? AND d.status = 'active' 
                AND d.start_date <= datetime('now') 
                AND d.end_date > datetime('now')
            `, [token]);
            
            if (delegations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Delegação inválida ou expirada'
                });
            }
            
            const delegation = delegations[0];
            
            // Registrar acesso
            await Database.query(
                'UPDATE delegations SET last_accessed = datetime("now") WHERE id = ?',
                [delegation.id]
            );
            
            res.json({
                success: true,
                data: {
                    delegation: {
                        id: delegation.id,
                        startDate: delegation.start_date,
                        endDate: delegation.end_date,
                        permissions: JSON.parse(delegation.permissions),
                        createdAt: delegation.created_at
                    },
                    patient: {
                        name: delegation.patient_name,
                        cpf: delegation.patient_cpf,
                        birthDate: delegation.patient_birth_date
                    },
                    doctor: {
                        name: delegation.doctor_name,
                        crm: delegation.doctor_crm
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao verificar delegação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = DelegationController;