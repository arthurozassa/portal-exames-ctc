const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../database/connection');
const AuthMiddleware = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/security');

class AuthController {
    // Login do paciente
    static async login(req, res) {
        try {
            const { cpf, password } = req.body;

            if (!cpf || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF e senha são obrigatórios'
                });
            }

            // Limpar CPF (remover formatação)
            const cleanCpf = cpf.replace(/[^\d]/g, '');
            
            // Buscar paciente pelo CPF
            const patients = await Database.query(
                'SELECT * FROM patients WHERE cpf = ? AND is_active = 1',
                [cleanCpf]
            );

            if (patients.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'CPF não encontrado. Verifique e tente novamente.'
                });
            }

            const patient = patients[0];

            // Verificar senha
            const passwordMatch = await bcrypt.compare(password, patient.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Senha inválida. Tente novamente.'
                });
            }

            // Verificar se precisa aceitar termo de consentimento
            const needsConsent = !patient.consent_accepted;

            // Gerar tokens
            const tokenPayload = {
                id: patient.id,
                cpf: patient.cpf,
                type: 'patient'
            };

            const token = AuthMiddleware.generateToken(tokenPayload);
            const refreshToken = AuthMiddleware.generateRefreshToken(tokenPayload);

            // Gerar token 2FA
            const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);

            // Salvar token 2FA
            await Database.query(
                'INSERT INTO tokens (patient_id, token, type, expires_at) VALUES (?, ?, "2fa", ?)',
                [patient.id, twoFactorToken, expiresAt]
            );

            // Log de auditoria
            logAuditEvent(req, 'login_success', 'auth', patient.id, {
                cpf: patient.cpf,
                needsConsent
            });

            // Simular envio do token 2FA
            console.log(`📱 Token 2FA para ${patient.name}: ${twoFactorToken}`);

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    patient: {
                        id: patient.id,
                        name: patient.name,
                        cpf: patient.cpf,
                        email: patient.email
                    },
                    token,
                    refreshToken,
                    needsConsent,
                    twoFactorRequired: true,
                    tokenSentTo: patient.phone || patient.email
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Verificar token 2FA
    static async verify2FA(req, res) {
        try {
            const { cpf, token } = req.body;

            if (!cpf || !token) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF e token são obrigatórios'
                });
            }

            // Código demo para desenvolvimento
            if (process.env.NODE_ENV === 'development' && token === '123456') {
                // Buscar paciente
                const patients = await Database.query(
                    'SELECT * FROM patients WHERE cpf = ?',
                    [cpf]
                );

                if (patients.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'CPF não encontrado'
                    });
                }

                const patient = patients[0];

                // Log de auditoria
                logAuditEvent(req, '2fa_verified_demo', 'auth', patient.id, {
                    cpf: patient.cpf
                });

                return res.json({
                    success: true,
                    message: '2FA verificado com sucesso (demo)',
                    data: {
                        verified: true
                    }
                });
            }

            // Buscar paciente e token real
            const result = await Database.query(`
                SELECT p.*, t.id as token_id, t.used, t.expires_at
                FROM patients p
                JOIN tokens t ON p.id = t.patient_id
                WHERE p.cpf = ? AND t.token = ? AND t.type = '2fa' AND t.used = false
                ORDER BY t.created_at DESC
                LIMIT 1
            `, [cpf, token]);

            if (result.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'O código informado está incorreto.'
                });
            }

            const patient = result[0];

            // Verificar se o token expirou
            if (new Date(patient.expires_at) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Este código expirou. Solicite um novo para continuar.'
                });
            }

            // Marcar token como usado
            await Database.query(
                'UPDATE tokens SET used = true WHERE id = ?',
                [patient.token_id]
            );

            // Log de auditoria
            logAuditEvent(req, '2fa_verified', 'auth', patient.id, {
                cpf: patient.cpf
            });

            res.json({
                success: true,
                message: '2FA verificado com sucesso',
                data: {
                    verified: true
                }
            });

        } catch (error) {
            console.error('Erro na verificação 2FA:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Solicitar recuperação de senha
    static async requestPasswordReset(req, res) {
        try {
            const { cpf } = req.body;

            if (!cpf) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF é obrigatório'
                });
            }

            // Buscar paciente
            const patients = await Database.query(
                'SELECT * FROM patients WHERE cpf = ? AND is_active = true',
                [cpf]
            );

            if (patients.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.'
                });
            }

            const patient = patients[0];

            // Gerar token de recuperação
            const recoveryToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

            // Invalidar tokens anteriores
            await Database.query(
                'UPDATE tokens SET used = true WHERE patient_id = ? AND type = "recovery" AND used = false',
                [patient.id]
            );

            // Salvar novo token
            await Database.query(
                'INSERT INTO tokens (patient_id, token, type, expires_at) VALUES (?, ?, "recovery", ?)',
                [patient.id, recoveryToken, expiresAt]
            );

            // Log de auditoria
            logAuditEvent(req, 'password_reset_requested', 'auth', patient.id, {
                cpf: patient.cpf
            });

            // Simular envio do token
            console.log(`📧 Token de recuperação para ${patient.name}: ${recoveryToken}`);

            res.json({
                success: true,
                message: 'Token de recuperação enviado com sucesso',
                data: {
                    tokenSentTo: patient.email,
                    expiresIn: '15 minutos'
                }
            });

        } catch (error) {
            console.error('Erro ao solicitar recuperação de senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Verificar token de recuperação
    static async verifyRecoveryToken(req, res) {
        try {
            const { cpf, token } = req.body;

            if (!cpf || !token) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF e token são obrigatórios'
                });
            }

            // Buscar token válido
            const result = await Database.query(`
                SELECT p.*, t.id as token_id, t.expires_at
                FROM patients p
                JOIN tokens t ON p.id = t.patient_id
                WHERE p.cpf = ? AND t.token = ? AND t.type = 'recovery' AND t.used = false
                ORDER BY t.created_at DESC
                LIMIT 1
            `, [cpf, token]);

            if (result.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
                });
            }

            const patient = result[0];

            // Verificar se o token expirou
            if (new Date(patient.expires_at) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
                });
            }

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    tokenValid: true,
                    patientId: patient.id
                }
            });

        } catch (error) {
            console.error('Erro ao verificar token de recuperação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Redefinir senha
    static async resetPassword(req, res) {
        try {
            const { cpf, token, newPassword } = req.body;

            if (!cpf || !token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF, token e nova senha são obrigatórios'
                });
            }

            if (newPassword.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'A nova senha deve ter pelo menos 4 caracteres'
                });
            }

            // Buscar token válido
            const result = await Database.query(`
                SELECT p.*, t.id as token_id
                FROM patients p
                JOIN tokens t ON p.id = t.patient_id
                WHERE p.cpf = ? AND t.token = ? AND t.type = 'recovery' AND t.used = false AND t.expires_at > NOW()
                ORDER BY t.created_at DESC
                LIMIT 1
            `, [cpf, token]);

            if (result.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Token inválido ou expirado'
                });
            }

            const patient = result[0];

            // Hash da nova senha
            const passwordHash = await bcrypt.hash(newPassword, 12);

            // Atualizar senha e marcar token como usado
            await Database.transaction(async (connection) => {
                await connection.execute(
                    'UPDATE patients SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE id = ?',
                    [passwordHash, patient.id]
                );
                
                await connection.execute(
                    'UPDATE tokens SET used = true WHERE id = ?',
                    [patient.token_id]
                );
            });

            // Log de auditoria
            logAuditEvent(req, 'password_reset_completed', 'auth', patient.id, {
                cpf: patient.cpf
            });

            res.json({
                success: true,
                message: 'Senha redefinida com sucesso'
            });

        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Aceitar termo de consentimento
    static async acceptConsent(req, res) {
        try {
            const patientId = req.user.id;

            await Database.query(
                'UPDATE patients SET consent_accepted = true, consent_date = NOW() WHERE id = ?',
                [patientId]
            );

            // Log de auditoria
            logAuditEvent(req, 'consent_accepted', 'patient', patientId);

            res.json({
                success: true,
                message: 'Termo de consentimento aceito com sucesso'
            });

        } catch (error) {
            console.error('Erro ao aceitar consentimento:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Login de administrador
    static async adminLogin(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuário e senha são obrigatórios'
                });
            }

            // Buscar admin
            const admins = await Database.query(
                'SELECT * FROM admins WHERE username = ? AND is_active = true',
                [username]
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos'
                });
            }

            const admin = admins[0];

            // Verificar senha
            const passwordMatch = await bcrypt.compare(password, admin.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos'
                });
            }

            // Atualizar último login
            await Database.query(
                'UPDATE admins SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            // Gerar token
            const tokenPayload = {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                type: 'admin'
            };

            const token = AuthMiddleware.generateToken(tokenPayload, '24h');
            const refreshToken = AuthMiddleware.generateRefreshToken(tokenPayload);

            // Log de auditoria
            logAuditEvent(req, 'admin_login', 'auth', admin.id, {
                username: admin.username,
                role: admin.role
            });

            res.json({
                success: true,
                message: 'Login de administrador realizado com sucesso',
                data: {
                    admin: {
                        id: admin.id,
                        username: admin.username,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role
                    },
                    token,
                    refreshToken
                }
            });

        } catch (error) {
            console.error('Erro no login de admin:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token é obrigatório'
                });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            
            // Gerar novo token
            const newToken = AuthMiddleware.generateToken({
                id: decoded.id,
                cpf: decoded.cpf,
                username: decoded.username,
                role: decoded.role,
                type: decoded.type
            });

            res.json({
                success: true,
                data: {
                    token: newToken
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Refresh token inválido'
            });
        }
    }

    // Logout
    static async logout(req, res) {
        try {
            // Log de auditoria
            logAuditEvent(req, 'logout', 'auth', req.user.id);

            res.json({
                success: true,
                message: 'Logout realizado com sucesso'
            });

        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = AuthController;