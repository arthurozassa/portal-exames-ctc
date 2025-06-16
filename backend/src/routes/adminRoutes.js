const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const Database = require('../database/connection');
const { auditLogger } = require('../middleware/security');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Todas as rotas requerem autenticação de admin
router.use(AuthMiddleware.authenticateAdmin);

// Dashboard administrativo
router.get('/dashboard',
    auditLogger('view_admin_dashboard', 'admin'),
    async (req, res) => {
        try {
            // Estatísticas gerais
            const stats = await Database.query(`
                SELECT 
                    (SELECT COUNT(*) FROM patients WHERE is_active = true) as total_patients,
                    (SELECT COUNT(*) FROM exams WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as exams_last_month,
                    (SELECT COUNT(*) FROM exam_shares WHERE is_active = true) as active_shares,
                    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as activity_last_24h
            `);
            
            // Exames por mês (últimos 6 meses)
            const examsByMonth = await Database.query(`
                SELECT 
                    DATE_FORMAT(exam_date, '%Y-%m') as month,
                    COUNT(*) as count
                FROM exams
                WHERE exam_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(exam_date, '%Y-%m')
                ORDER BY month
            `);
            
            // Atividades recentes
            const recentActivity = await Database.query(`
                SELECT 
                    al.*,
                    CASE 
                        WHEN al.user_type = 'patient' THEN p.name
                        WHEN al.user_type = 'admin' THEN a.name
                        ELSE 'Usuário anônimo'
                    END as user_name
                FROM audit_logs al
                LEFT JOIN patients p ON al.user_id = p.id AND al.user_type = 'patient'
                LEFT JOIN admins a ON al.user_id = a.id AND al.user_type = 'admin'
                ORDER BY al.created_at DESC
                LIMIT 20
            `);
            
            res.json({
                success: true,
                data: {
                    stats: stats[0],
                    examsByMonth,
                    recentActivity
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar dashboard admin:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Listar configurações white-label
router.get('/settings',
    auditLogger('view_settings', 'admin'),
    async (req, res) => {
        try {
            const settings = await Database.query(
                'SELECT * FROM white_label_settings ORDER BY setting_key'
            );
            
            res.json({
                success: true,
                data: { settings }
            });
            
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Atualizar configuração white-label
router.put('/settings/:key',
    auditLogger('update_setting', 'admin'),
    async (req, res) => {
        try {
            const { key } = req.params;
            const { value } = req.body;
            
            await Database.query(`
                UPDATE white_label_settings 
                SET setting_value = ?, updated_at = NOW()
                WHERE setting_key = ?
            `, [value, key]);
            
            res.json({
                success: true,
                message: 'Configuração atualizada com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Upload de logo
router.post('/upload/logo',
    upload.single('logo'),
    auditLogger('upload_logo', 'admin'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo enviado'
                });
            }
            
            const logoPath = `/uploads/${req.file.filename}`;
            
            // Atualizar configuração do logo
            await Database.query(`
                UPDATE white_label_settings 
                SET setting_value = ?, updated_at = NOW()
                WHERE setting_key = 'logo_path'
            `, [logoPath]);
            
            res.json({
                success: true,
                message: 'Logo enviado com sucesso',
                data: { logoPath }
            });
            
        } catch (error) {
            console.error('Erro ao fazer upload do logo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Listar logs de auditoria
router.get('/logs',
    AuthMiddleware.checkAdminRole(['super_admin', 'admin']),
    auditLogger('view_logs', 'admin'),
    async (req, res) => {
        try {
            const { page = 1, limit = 50, user_type, action, startDate, endDate } = req.query;
            
            let whereConditions = [];
            let params = [];
            
            if (user_type) {
                whereConditions.push('al.user_type = ?');
                params.push(user_type);
            }
            
            if (action) {
                whereConditions.push('al.action LIKE ?');
                params.push(`%${action}%`);
            }
            
            if (startDate) {
                whereConditions.push('al.created_at >= ?');
                params.push(startDate);
            }
            
            if (endDate) {
                whereConditions.push('al.created_at <= ?');
                params.push(endDate);
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            const offset = (page - 1) * limit;
            
            const logs = await Database.query(`
                SELECT 
                    al.*,
                    CASE 
                        WHEN al.user_type = 'patient' THEN p.name
                        WHEN al.user_type = 'admin' THEN a.name
                        ELSE 'Usuário anônimo'
                    END as user_name
                FROM audit_logs al
                LEFT JOIN patients p ON al.user_id = p.id AND al.user_type = 'patient'
                LEFT JOIN admins a ON al.user_id = a.id AND al.user_type = 'admin'
                ${whereClause}
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            const totalResult = await Database.query(`
                SELECT COUNT(*) as total FROM audit_logs al ${whereClause}
            `, params);
            
            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            res.json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Listar todos os pacientes
router.get('/patients',
    AuthMiddleware.checkAdminRole(['super_admin', 'admin']),
    auditLogger('view_patients', 'admin'),
    async (req, res) => {
        try {
            const { page = 1, limit = 20, search } = req.query;
            
            let whereCondition = '';
            let params = [];
            
            if (search) {
                whereCondition = 'WHERE (name LIKE ? OR cpf LIKE ? OR email LIKE ?)';
                params = [`%${search}%`, `%${search}%`, `%${search}%`];
            }
            
            const offset = (page - 1) * limit;
            
            const patients = await Database.query(`
                SELECT 
                    id, cpf, name, email, phone, birth_date, gender,
                    created_at, last_login, is_active,
                    (SELECT COUNT(*) FROM exams WHERE patient_id = patients.id) as exam_count
                FROM patients
                ${whereCondition}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            const totalResult = await Database.query(`
                SELECT COUNT(*) as total FROM patients ${whereCondition}
            `, params);
            
            const total = totalResult[0].total;
            
            res.json({
                success: true,
                data: {
                    patients,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Listar todos os exames
router.get('/exams',
    AuthMiddleware.checkAdminRole(['super_admin', 'admin']),
    auditLogger('view_all_exams', 'admin'),
    async (req, res) => {
        try {
            const { page = 1, limit = 20, status, type } = req.query;
            
            let whereConditions = [];
            let params = [];
            
            if (status) {
                whereConditions.push('e.status = ?');
                params.push(status);
            }
            
            if (type) {
                whereConditions.push('e.exam_type LIKE ?');
                params.push(`%${type}%`);
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            const offset = (page - 1) * limit;
            
            const exams = await Database.query(`
                SELECT 
                    e.*,
                    p.name as patient_name,
                    p.cpf as patient_cpf,
                    d.name as doctor_name,
                    d.crm as doctor_crm
                FROM exams e
                JOIN patients p ON e.patient_id = p.id
                LEFT JOIN doctors d ON e.doctor_id = d.id
                ${whereClause}
                ORDER BY e.exam_date DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            const totalResult = await Database.query(`
                SELECT COUNT(*) as total FROM exams e ${whereClause}
            `, params);
            
            const total = totalResult[0].total;
            
            res.json({
                success: true,
                data: {
                    exams,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar exames:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

module.exports = router;