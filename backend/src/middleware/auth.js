const jwt = require('jsonwebtoken');
const Database = require('../database/connection');

class AuthMiddleware {
    // Middleware para autenticar pacientes
    static async authenticatePatient(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acesso não fornecido'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type !== 'patient') {
                return res.status(403).json({
                    success: false,
                    message: 'Tipo de token inválido'
                });
            }

            // Verificar se o paciente ainda existe e está ativo
            const patient = await Database.query(
                'SELECT id, cpf, name, email, is_active FROM patients WHERE id = ? AND is_active = true',
                [decoded.id]
            );

            if (patient.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado ou inativo'
                });
            }

            req.user = {
                id: patient[0].id,
                cpf: patient[0].cpf,
                name: patient[0].name,
                email: patient[0].email,
                type: 'patient'
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            console.error('Erro na autenticação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Middleware para autenticar administradores
    static async authenticateAdmin(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acesso não fornecido'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Verificar se o admin ainda existe e está ativo
            const admin = await Database.query(
                'SELECT id, username, name, email, role, is_active FROM admins WHERE id = ? AND is_active = true',
                [decoded.id]
            );

            if (admin.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Administrador não encontrado ou inativo'
                });
            }

            req.user = {
                id: admin[0].id,
                username: admin[0].username,
                name: admin[0].name,
                email: admin[0].email,
                role: admin[0].role,
                type: 'admin'
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            console.error('Erro na autenticação admin:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Middleware para verificar permissões de admin
    static checkAdminRole(roles = []) {
        return (req, res, next) => {
            if (!req.user || req.user.type !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Permissões insuficientes'
                });
            }

            next();
        };
    }

    // Middleware para validar token de compartilhamento
    static async validateShareToken(req, res, next) {
        try {
            const { token } = req.params;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token não fornecido'
                });
            }

            const share = await Database.query(`
                SELECT es.*, e.patient_id, e.exam_type, e.exam_date, 
                       p.name as patient_name, d.name as doctor_name
                FROM exam_shares es
                JOIN exams e ON es.exam_id = e.id
                JOIN patients p ON e.patient_id = p.id
                JOIN doctors d ON es.doctor_id = d.id
                WHERE es.token = ? AND es.is_active = true AND es.expires_at > NOW()
            `, [token]);

            if (share.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Link de compartilhamento inválido ou expirado'
                });
            }

            // Registrar acesso
            await Database.query(
                'UPDATE exam_shares SET accessed_at = NOW() WHERE id = ?',
                [share[0].id]
            );

            req.shareData = share[0];
            next();
        } catch (error) {
            console.error('Erro na validação do token de compartilhamento:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Gerar token JWT
    static generateToken(payload, expiresIn = null) {
        const options = {};
        if (expiresIn) {
            options.expiresIn = expiresIn;
        } else {
            options.expiresIn = process.env.JWT_EXPIRES_IN || '5m';
        }

        return jwt.sign(payload, process.env.JWT_SECRET, options);
    }

    // Gerar token de refresh
    static generateRefreshToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });
    }
}

module.exports = AuthMiddleware;