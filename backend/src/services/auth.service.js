const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../database/connection');
const { logAuditEvent } = require('../middleware/security');

class AuthService {
    /**
     * Register a new user
     */
    static async register(userData) {
        try {
            const { cpf, nome, email, senha, telefone } = userData;

            // Check if CPF already exists
            const existingCpf = await Database.query(
                'SELECT id FROM patients WHERE cpf = ?',
                [cpf]
            );

            if (existingCpf.length > 0) {
                const error = new Error('CPF já cadastrado');
                error.code = 'DUPLICATE_CPF';
                throw error;
            }

            // Check if email already exists
            const existingEmail = await Database.query(
                'SELECT id FROM patients WHERE email = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                const error = new Error('E-mail já cadastrado');
                error.code = 'DUPLICATE_EMAIL';
                throw error;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(senha, 12);

            // Insert new user
            const result = await Database.query(
                'INSERT INTO patients (cpf, name, email, password_hash, phone, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [cpf, nome, email, passwordHash, telefone, true]
            );

            // Return user without password
            return {
                id: result.insertId,
                cpf,
                nome,
                email,
                telefone
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Login user
     */
    static async login(cpf, senha, ip, userAgent) {
        try {
            // Clean CPF
            const cleanCpf = cpf.replace(/[^\d]/g, '');

            // Find user
            const users = await Database.query(
                'SELECT * FROM patients WHERE cpf = ? AND is_active = 1',
                [cleanCpf]
            );

            if (users.length === 0) {
                const error = new Error('CPF não encontrado');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const user = users[0];

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const error = new Error('Conta bloqueada');
                error.code = 'ACCOUNT_LOCKED';
                throw error;
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(senha, user.password_hash);
            if (!passwordMatch) {
                // Increment login attempts
                await Database.query(
                    'UPDATE patients SET login_attempts = login_attempts + 1 WHERE id = ?',
                    [user.id]
                );

                // Lock account after 5 failed attempts
                if (user.login_attempts >= 4) {
                    const lockUntil = new Date();
                    lockUntil.setMinutes(lockUntil.getMinutes() + 15);
                    
                    await Database.query(
                        'UPDATE patients SET locked_until = ? WHERE id = ?',
                        [lockUntil, user.id]
                    );
                }

                const error = new Error('Senha inválida');
                error.code = 'INVALID_PASSWORD';
                throw error;
            }

            // Reset login attempts
            await Database.query(
                'UPDATE patients SET login_attempts = 0, locked_until = NULL WHERE id = ?',
                [user.id]
            );

            // Generate 2FA token
            const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);

            // Save 2FA token
            await Database.query(
                'INSERT INTO tokens (patient_id, token, type, expires_at) VALUES (?, ?, "2fa", ?)',
                [user.id, twoFactorToken, expiresAt]
            );

            // Generate temporary token for 2FA verification
            const tempToken = jwt.sign(
                { userId: user.id, cpf: user.cpf, type: 'temp' },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            // Simulate sending 2FA token
            console.log(`📱 Token 2FA para ${user.name}: ${twoFactorToken}`);

            return {
                requires2FA: true,
                tempToken,
                user: {
                    id: user.id,
                    cpf: user.cpf,
                    nome: user.name,
                    email: user.email
                }
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify 2FA token
     */
    static async verify2FA(tempToken, token) {
        try {
            // Verify temp token
            const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
            
            if (decoded.type !== 'temp') {
                const error = new Error('Token temporário inválido');
                error.code = 'INVALID_TEMP_TOKEN';
                throw error;
            }

            // Development bypass
            if (process.env.NODE_ENV === 'development' && token === '123456') {
                const user = await Database.query(
                    'SELECT * FROM patients WHERE id = ?',
                    [decoded.userId]
                );

                if (user.length === 0) {
                    const error = new Error('Usuário não encontrado');
                    error.code = 'USER_NOT_FOUND';
                    throw error;
                }

                // Generate final token
                const finalToken = jwt.sign(
                    { 
                        id: user[0].id, 
                        cpf: user[0].cpf, 
                        type: 'patient' 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    token: finalToken,
                    user: {
                        id: user[0].id,
                        cpf: user[0].cpf,
                        nome: user[0].name,
                        email: user[0].email
                    }
                };
            }

            // Find valid token
            const result = await Database.query(`
                SELECT p.*, t.id as token_id, t.expires_at
                FROM patients p
                JOIN tokens t ON p.id = t.patient_id
                WHERE p.id = ? AND t.token = ? AND t.type = '2fa' AND t.used = false
                ORDER BY t.created_at DESC
                LIMIT 1
            `, [decoded.userId, token]);

            if (result.length === 0) {
                const error = new Error('Token inválido');
                error.code = 'INVALID_2FA_TOKEN';
                throw error;
            }

            const user = result[0];

            // Check if token expired
            if (new Date(user.expires_at) < new Date()) {
                const error = new Error('Token expirado');
                error.code = 'EXPIRED_2FA_TOKEN';
                throw error;
            }

            // Mark token as used
            await Database.query(
                'UPDATE tokens SET used = true WHERE id = ?',
                [user.token_id]
            );

            // Generate final token
            const finalToken = jwt.sign(
                { 
                    id: user.id, 
                    cpf: user.cpf, 
                    type: 'patient' 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                token: finalToken,
                user: {
                    id: user.id,
                    cpf: user.cpf,
                    nome: user.name,
                    email: user.email
                }
            };

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                const customError = new Error('Token temporário inválido');
                customError.code = 'INVALID_TEMP_TOKEN';
                throw customError;
            }
            throw error;
        }
    }

    /**
     * Forgot password - send recovery token
     */
    static async forgotPassword(cpf) {
        try {
            const cleanCpf = cpf.replace(/[^\d]/g, '');

            // Find user
            const users = await Database.query(
                'SELECT * FROM patients WHERE cpf = ? AND is_active = 1',
                [cleanCpf]
            );

            if (users.length === 0) {
                const error = new Error('Usuário não encontrado');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const user = users[0];

            // Generate recovery token
            const recoveryToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);

            // Invalidate previous tokens
            await Database.query(
                'UPDATE tokens SET used = true WHERE patient_id = ? AND type = "recovery" AND used = false',
                [user.id]
            );

            // Save new token
            await Database.query(
                'INSERT INTO tokens (patient_id, token, type, expires_at) VALUES (?, ?, "recovery", ?)',
                [user.id, recoveryToken, expiresAt]
            );

            // Simulate sending recovery token
            console.log(`📧 Token de recuperação para ${user.name}: ${recoveryToken}`);

            return true;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(token, novaSenha) {
        try {
            // Find valid token
            const result = await Database.query(`
                SELECT p.*, t.id as token_id
                FROM patients p
                JOIN tokens t ON p.id = t.patient_id
                WHERE t.token = ? AND t.type = 'recovery' AND t.used = false AND t.expires_at > NOW()
                ORDER BY t.created_at DESC
                LIMIT 1
            `, [token]);

            if (result.length === 0) {
                const error = new Error('Token inválido');
                error.code = 'INVALID_RESET_TOKEN';
                throw error;
            }

            const user = result[0];

            // Check if token expired
            if (new Date(user.expires_at) < new Date()) {
                const error = new Error('Token expirado');
                error.code = 'EXPIRED_RESET_TOKEN';
                throw error;
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(novaSenha, 12);

            // Update password and mark token as used
            await Database.transaction(async (connection) => {
                await connection.execute(
                    'UPDATE patients SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE id = ?',
                    [passwordHash, user.id]
                );
                
                await connection.execute(
                    'UPDATE tokens SET used = true WHERE id = ?',
                    [user.token_id]
                );
            });

            return true;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user
     */
    static async logout(userId) {
        try {
            // In a real implementation, you might want to blacklist the token
            // For now, just log the event
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user profile
     */
    static async getProfile(userId) {
        try {
            const users = await Database.query(
                'SELECT id, cpf, name, email, phone, created_at FROM patients WHERE id = ? AND is_active = 1',
                [userId]
            );

            if (users.length === 0) {
                const error = new Error('Usuário não encontrado');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            return users[0];

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(userId, updateData) {
        try {
            const { nome, telefone, email } = updateData;
            
            // Check if email is already in use by another user
            if (email) {
                const existingEmail = await Database.query(
                    'SELECT id FROM patients WHERE email = ? AND id != ?',
                    [email, userId]
                );

                if (existingEmail.length > 0) {
                    const error = new Error('E-mail já está em uso');
                    error.code = 'DUPLICATE_EMAIL';
                    throw error;
                }
            }

            // Update user
            await Database.query(
                'UPDATE patients SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?',
                [nome, telefone, email, userId]
            );

            // Return updated user
            return await this.getProfile(userId);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Change password
     */
    static async changePassword(userId, senhaAtual, novaSenha) {
        try {
            // Get current user
            const users = await Database.query(
                'SELECT password_hash FROM patients WHERE id = ? AND is_active = 1',
                [userId]
            );

            if (users.length === 0) {
                const error = new Error('Usuário não encontrado');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const user = users[0];

            // Verify current password
            const passwordMatch = await bcrypt.compare(senhaAtual, user.password_hash);
            if (!passwordMatch) {
                const error = new Error('Senha atual incorreta');
                error.code = 'INVALID_CURRENT_PASSWORD';
                throw error;
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(novaSenha, 12);

            // Update password
            await Database.query(
                'UPDATE patients SET password_hash = ? WHERE id = ?',
                [passwordHash, userId]
            );

            return true;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthService;