const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthUtils {
  // Gerar hash da senha
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verificar senha
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Gerar token JWT
  static generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // Verificar token JWT
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Gerar token de refresh
  static generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Gerar código 2FA
  static generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Gerar token de recuperação
  static generateRecoveryToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Gerar token para compartilhamento
  static generateShareToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Extrair token do header Authorization
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Verificar se o usuário está bloqueado
  static isUserBlocked(user) {
    if (!user.bloqueado_ate) return false;
    return new Date() < new Date(user.bloqueado_ate);
  }

  // Calcular tempo de bloqueio
  static calculateLockoutTime(attempts) {
    // Bloqueio progressivo: 5min, 15min, 30min, 1h, 2h
    const timeouts = [5, 15, 30, 60, 120];
    const minutes = timeouts[Math.min(attempts - 5, timeouts.length - 1)] || 120;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // Sanitizar dados do usuário para resposta
  static sanitizeUser(user) {
    const { senha_hash, token_2fa, token_recuperacao, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Verificar força da senha
  static validatePasswordStrength(password) {
    const minLength = 4;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    return {
      isValid: password.length >= minLength,
      length: password.length >= minLength,
      hasNumber,
      hasLetter,
      score: [
        password.length >= minLength,
        hasNumber,
        hasLetter,
        password.length >= 8
      ].filter(Boolean).length
    };
  }

  // Gerar resposta de erro padronizada
  static generateErrorResponse(message, code = 'AUTH_ERROR', statusCode = 401) {
    return {
      success: false,
      error: {
        code,
        message,
        statusCode
      }
    };
  }

  // Gerar resposta de sucesso padronizada
  static generateSuccessResponse(data, message = 'Operação realizada com sucesso') {
    return {
      success: true,
      message,
      data
    };
  }

  // Validar formato de email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Formatar CPF
  static formatCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Limpar CPF (remover formatação)
  static cleanCPF(cpf) {
    return cpf.replace(/\D/g, '');
  }

  // Gerar hash para tokens
  static generateTokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Verificar se o token expirou
  static isTokenExpired(expirationDate) {
    return new Date() > new Date(expirationDate);
  }

  // Calcular data de expiração
  static calculateExpirationDate(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // Mascarar dados sensíveis
  static maskSensitiveData(data, fields = ['cpf', 'email', 'telefone']) {
    const masked = { ...data };
    
    fields.forEach(field => {
      if (masked[field]) {
        switch (field) {
          case 'cpf':
            masked[field] = masked[field].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.***-**');
            break;
          case 'email':
            const [user, domain] = masked[field].split('@');
            masked[field] = `${user.substring(0, 2)}***@${domain}`;
            break;
          case 'telefone':
            masked[field] = masked[field].replace(/(\(\d{2}\)\s)(\d+)(-\d{4})/, '$1****$3');
            break;
        }
      }
    });
    
    return masked;
  }

  // Rate limiting por IP
  static createRateLimitKey(ip, action = 'general') {
    return `rate_limit:${action}:${ip}`;
  }

  // Log de segurança
  static createSecurityLog(action, details, userId = null, ip = null) {
    return {
      timestamp: new Date().toISOString(),
      action,
      userId,
      ip,
      details,
      severity: this.getActionSeverity(action)
    };
  }

  // Determinar severidade da ação
  static getActionSeverity(action) {
    const highSeverity = ['failed_login', 'account_locked', 'suspicious_activity'];
    const mediumSeverity = ['password_changed', 'email_changed', 'data_export'];
    const lowSeverity = ['login', 'logout', 'data_view'];

    if (highSeverity.includes(action)) return 'high';
    if (mediumSeverity.includes(action)) return 'medium';
    if (lowSeverity.includes(action)) return 'low';
    return 'info';
  }
}

module.exports = AuthUtils;