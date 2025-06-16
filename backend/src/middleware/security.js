const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const Database = require('../database/connection');

// Rate limiting para login (relaxado para demo)
const loginLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
    max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 tentativas dev, 5 prod
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: false,
    legacyHeaders: false,
    handler: (req, res) => {
        logAuditEvent(req, 'rate_limit_exceeded', 'login', null, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Rate limiting geral para API (relaxado para demo)
const apiLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 requests dev, 100 prod
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: false,
    legacyHeaders: false
});

// Rate limiting para recuperação de senha
const passwordRecoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 tentativas por IP por hora
    message: {
        success: false,
        message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: false,
    legacyHeaders: false
});

// Middleware de segurança com Helmet
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Middleware para sanitizar input
const sanitizeInput = (req, res, next) => {
    // Sanitizar parâmetros da query
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
        }
    }

    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }

    next();
};

// Função para sanitizar objetos recursivamente
function sanitizeObject(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
            // Remover caracteres potencialmente perigosos
            obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}

// Middleware para validar CPF
const validateCPF = (cpf) => {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
};

// Middleware para validar formato de CPF (relaxado para demo)
const cpfValidation = (req, res, next) => {
    const { cpf } = req.body;
    
    // Skip validation in development for demo CPF
    if (process.env.NODE_ENV === 'development' && cpf === '12345678900') {
        return next();
    }
    
    if (cpf && !validateCPF(cpf)) {
        return res.status(400).json({
            success: false,
            message: 'CPF inválido',
            field: 'cpf'
        });
    }
    
    next();
};

// Middleware para registrar tentativas de login
const logLoginAttempt = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Se a resposta indica falha na autenticação
        if (!data.success && req.body.cpf) {
            logAuditEvent(req, 'login_failed', 'auth', null, {
                cpf: req.body.cpf,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                error: data.message
            });
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Função para registrar eventos de auditoria
async function logAuditEvent(req, action, resource, resourceId = null, details = {}) {
    try {
        const userId = req.user?.id || null;
        const userType = req.user?.type || 'anonymous';
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        
        await Database.query(`
            INSERT INTO audit_logs (user_id, user_type, action, resource, resource_id, ip_address, user_agent, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, userType, action, resource, resourceId, ip, userAgent, JSON.stringify(details)]);
    } catch (error) {
        console.error('Erro ao registrar log de auditoria:', error);
    }
}

// Middleware para registrar ações do usuário
const auditLogger = (action, resource) => {
    return async (req, res, next) => {
        // Registra a ação após a resposta
        const originalJson = res.json;
        
        res.json = function(data) {
            if (data.success) {
                logAuditEvent(req, action, resource, data.id || null, {
                    method: req.method,
                    url: req.originalUrl,
                    params: req.params,
                    query: req.query
                });
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Middleware para verificar bloqueio de conta
const checkAccountLockout = async (req, res, next) => {
    try {
        const { cpf } = req.body;
        
        if (!cpf) {
            return next();
        }
        
        const patient = await Database.query(
            'SELECT login_attempts, locked_until FROM patients WHERE cpf = ?',
            [cpf]
        );
        
        if (patient.length === 0) {
            return next();
        }
        
        const { login_attempts, locked_until } = patient[0];
        
        // Verifica se a conta está bloqueada
        if (locked_until && new Date(locked_until) > new Date()) {
            return res.status(423).json({
                success: false,
                message: 'Conta temporariamente bloqueada devido a muitas tentativas inválidas. Tente novamente mais tarde.',
                code: 'ACCOUNT_LOCKED'
            });
        }
        
        // Se passou do tempo de bloqueio, reseta as tentativas
        if (locked_until && new Date(locked_until) <= new Date()) {
            await Database.query(
                'UPDATE patients SET login_attempts = 0, locked_until = NULL WHERE cpf = ?',
                [cpf]
            );
        }
        
        req.loginAttempts = login_attempts || 0;
        next();
    } catch (error) {
        console.error('Erro ao verificar bloqueio de conta:', error);
        next();
    }
};

// Middleware para atualizar tentativas de login
const updateLoginAttempts = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (req.body.cpf) {
            if (data.success) {
                // Reset tentativas em caso de sucesso
                Database.query(
                    'UPDATE patients SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE cpf = ?',
                    [req.body.cpf]
                ).catch(console.error);
            } else {
                // Incrementa tentativas em caso de falha
                const newAttempts = (req.loginAttempts || 0) + 1;
                const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
                const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 15;
                
                if (newAttempts >= maxAttempts) {
                    const lockUntil = new Date();
                    lockUntil.setMinutes(lockUntil.getMinutes() + lockoutTime);
                    
                    Database.query(
                        'UPDATE patients SET login_attempts = ?, locked_until = ? WHERE cpf = ?',
                        [newAttempts, lockUntil, req.body.cpf]
                    ).catch(console.error);
                } else {
                    Database.query(
                        'UPDATE patients SET login_attempts = ? WHERE cpf = ?',
                        [newAttempts, req.body.cpf]
                    ).catch(console.error);
                }
            }
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

module.exports = {
    loginLimiter,
    apiLimiter,
    passwordRecoveryLimiter,
    securityHeaders,
    sanitizeInput,
    cpfValidation,
    logLoginAttempt,
    auditLogger,
    checkAccountLockout,
    updateLoginAttempts,
    validateCPF,
    logAuditEvent
};