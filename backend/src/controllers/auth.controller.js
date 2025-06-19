const AuthService = require('../services/auth.service');
const { validationResult } = require('express-validator');

class AuthController {
    /**
     * Register new user
     */
    static async register(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const user = await AuthService.register(req.body);

            res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso',
                user
            });

        } catch (error) {
            if (error.code === 'DUPLICATE_CPF' || error.code === 'DUPLICATE_EMAIL') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            next(error);
        }
    }

    /**
     * Login user
     */
    static async login(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const { cpf, senha } = req.body;
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            const result = await AuthService.login(cpf, senha, ip, userAgent);

            if (result.requires2FA) {
                return res.status(200).json({
                    success: true,
                    message: 'Login realizado com sucesso. Insira o código 2FA.',
                    requires2FA: true,
                    tempToken: result.tempToken,
                    user: result.user
                });
            }

            res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso',
                token: result.token,
                user: result.user
            });

        } catch (error) {
            if (error.code === 'USER_NOT_FOUND') {
                return res.status(401).json({
                    success: false,
                    message: 'CPF não encontrado. Verifique e tente novamente.'
                });
            }

            if (error.code === 'INVALID_PASSWORD') {
                return res.status(401).json({
                    success: false,
                    message: 'Senha inválida. Tente novamente.'
                });
            }

            if (error.code === 'ACCOUNT_LOCKED') {
                return res.status(423).json({
                    success: false,
                    message: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login inválidas. Tente novamente em alguns minutos.'
                });
            }

            next(error);
        }
    }

    /**
     * Verify 2FA token
     */
    static async verify2FA(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const { tempToken, token } = req.body;

            const result = await AuthService.verify2FA(tempToken, token);

            res.status(200).json({
                success: true,
                message: 'Autenticação realizada com sucesso',
                token: result.token,
                user: result.user
            });

        } catch (error) {
            if (error.code === 'INVALID_2FA_TOKEN') {
                return res.status(400).json({
                    success: false,
                    message: 'O código informado está incorreto.'
                });
            }

            if (error.code === 'EXPIRED_2FA_TOKEN') {
                return res.status(400).json({
                    success: false,
                    message: 'Este código expirou. Solicite um novo para continuar.'
                });
            }

            next(error);
        }
    }

    /**
     * Forgot password
     */
    static async forgotPassword(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const { cpf } = req.body;

            await AuthService.forgotPassword(cpf);

            res.status(200).json({
                success: true,
                message: 'Um código de recuperação foi enviado para o seu celular/e-mail cadastrado.'
            });

        } catch (error) {
            if (error.code === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: 'Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.'
                });
            }

            next(error);
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const { token, novaSenha } = req.body;

            await AuthService.resetPassword(token, novaSenha);

            res.status(200).json({
                success: true,
                message: 'Senha alterada com sucesso. Você já pode fazer login com a nova senha.'
            });

        } catch (error) {
            if (error.code === 'INVALID_RESET_TOKEN' || error.code === 'EXPIRED_RESET_TOKEN') {
                return res.status(400).json({
                    success: false,
                    message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
                });
            }

            next(error);
        }
    }

    /**
     * Logout user
     */
    static async logout(req, res, next) {
        try {
            const userId = req.user.id;

            await AuthService.logout(userId);

            res.clearCookie('token');
            res.status(200).json({
                success: true,
                message: 'Logout realizado com sucesso'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = req.user.id;

            const user = await AuthService.getProfile(userId);

            res.status(200).json({
                success: true,
                user
            });

        } catch (error) {
            if (error.code === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            next(error);
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const updateData = req.body;

            const user = await AuthService.updateProfile(userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Perfil atualizado com sucesso',
                user
            });

        } catch (error) {
            if (error.code === 'DUPLICATE_EMAIL') {
                return res.status(400).json({
                    success: false,
                    message: 'E-mail já está em uso'
                });
            }

            next(error);
        }
    }

    /**
     * Change password
     */
    static async changePassword(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { senhaAtual, novaSenha } = req.body;

            await AuthService.changePassword(userId, senhaAtual, novaSenha);

            res.status(200).json({
                success: true,
                message: 'Senha alterada com sucesso'
            });

        } catch (error) {
            if (error.code === 'INVALID_CURRENT_PASSWORD') {
                return res.status(400).json({
                    success: false,
                    message: 'Senha atual incorreta'
                });
            }

            next(error);
        }
    }
}

module.exports = AuthController;