const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const Database = require('../database/connection');
const { auditLogger } = require('../middleware/security');

const router = express.Router();

// Rota pública para visualizar exame compartilhado
router.get('/shared/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const shares = await Database.query(`
            SELECT 
                es.*,
                e.*,
                p.name as patient_name,
                p.birth_date as patient_birth_date,
                d.name as doctor_name,
                d.crm as doctor_crm
            FROM exam_shares es
            JOIN exams e ON es.exam_id = e.id
            JOIN patients p ON e.patient_id = p.id
            JOIN doctors d ON es.doctor_id = d.id
            WHERE es.token = ? AND es.is_active = true AND es.expires_at > NOW()
        `, [token]);
        
        if (shares.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Link de compartilhamento inválido ou expirado'
            });
        }
        
        const share = shares[0];
        
        // Buscar valores do exame
        const values = await Database.query(
            'SELECT * FROM exam_values WHERE exam_id = ? ORDER BY parameter_name',
            [share.exam_id]
        );
        
        // Registrar acesso
        await Database.query(
            'UPDATE exam_shares SET accessed_at = NOW() WHERE id = ?',
            [share.id]
        );
        
        res.json({
            success: true,
            data: {
                exam: {
                    id: share.exam_id,
                    type: share.exam_type,
                    date: share.exam_date,
                    status: share.status,
                    unit: share.unit,
                    results: share.results,
                    observations: share.observations,
                    pdf_path: share.pdf_path,
                    pacs_link: share.pacs_link
                },
                patient: {
                    name: share.patient_name,
                    birth_date: share.patient_birth_date
                },
                doctor: {
                    name: share.doctor_name,
                    crm: share.doctor_crm
                },
                share: {
                    shared_at: share.shared_at,
                    expires_at: share.expires_at,
                    accessed_at: share.accessed_at
                },
                values
            }
        });
        
    } catch (error) {
        console.error('Erro ao visualizar exame compartilhado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rotas protegidas para pacientes
router.use(AuthMiddleware.authenticatePatient);

// Obter perfil do paciente
router.get('/profile', 
    auditLogger('view_profile', 'patient'),
    async (req, res) => {
        try {
            const patientId = req.user.id;
            
            const patients = await Database.query(
                'SELECT id, cpf, name, email, phone, birth_date, gender, address, created_at FROM patients WHERE id = ?',
                [patientId]
            );
            
            if (patients.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: { patient: patients[0] }
            });
            
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Obter dashboard/estatísticas do paciente
router.get('/dashboard',
    auditLogger('view_dashboard', 'patient'),
    async (req, res) => {
        try {
            const patientId = req.user.id;
            
            // Contar exames por status
            const examStats = await Database.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM exams 
                WHERE patient_id = ?
                GROUP BY status
            `, [patientId]);
            
            // Exames recentes
            const recentExams = await Database.query(`
                SELECT 
                    e.*,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exams e
                LEFT JOIN doctors d ON e.doctor_id = d.id
                WHERE e.patient_id = ?
                ORDER BY e.exam_date DESC
                LIMIT 5
            `, [patientId]);
            
            // Compartilhamentos ativos
            const activeShares = await Database.query(`
                SELECT COUNT(*) as count
                FROM exam_shares
                WHERE patient_id = ? AND is_active = true AND expires_at > NOW()
            `, [patientId]);
            
            // Próximos vencimentos de compartilhamento
            const expiringSoon = await Database.query(`
                SELECT 
                    es.*,
                    e.exam_type,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exam_shares es
                JOIN exams e ON es.exam_id = e.id
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.patient_id = ? 
                    AND es.is_active = true 
                    AND es.expires_at > NOW()
                    AND es.expires_at <= DATE_ADD(NOW(), INTERVAL 3 DAY)
                ORDER BY es.expires_at ASC
            `, [patientId]);
            
            res.json({
                success: true,
                data: {
                    examStats,
                    recentExams,
                    activeSharesCount: activeShares[0].count,
                    expiringSoon
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Buscar médicos por CRM (para autocomplete)
router.get('/doctors/search',
    async (req, res) => {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 3) {
                return res.json({
                    success: true,
                    data: { doctors: [] }
                });
            }
            
            const doctors = await Database.query(`
                SELECT crm, name, specialty
                FROM doctors
                WHERE (crm LIKE ? OR name LIKE ?) AND is_active = true
                ORDER BY name
                LIMIT 10
            `, [`%${q}%`, `%${q}%`]);
            
            res.json({
                success: true,
                data: { doctors }
            });
            
        } catch (error) {
            console.error('Erro ao buscar médicos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

module.exports = router;