const { validationResult } = require('express-validator');
const AuthUtils = require('../utils/auth');

// Middleware para processar resultados de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos fornecidos',
        details: errorMessages
      }
    });
  }

  next();
};

// Middleware de sanitização de dados
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings removendo scripts e tags HTML
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Função recursiva para sanitizar objetos
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitizar body, query e params
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// Middleware para validar Content-Type em requisições POST/PUT
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json(
        AuthUtils.generateErrorResponse(
          'Content-Type deve ser application/json',
          'INVALID_CONTENT_TYPE'
        )
      );
    }
  }
  
  next();
};

// Middleware para validar tamanho do body
const validateBodySize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const maxSizeBytes = parseBodySize(maxSize);
      
      if (parseInt(contentLength) > maxSizeBytes) {
        return res.status(413).json(
          AuthUtils.generateErrorResponse(
            'Payload muito grande',
            'PAYLOAD_TOO_LARGE'
          )
        );
      }
    }
    
    next();
  };
};

// Função auxiliar para converter tamanho do body
const parseBodySize = (size) => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  if (!match) return 1024 * 1024; // 1MB padrão
  
  const [, number, unit] = match;
  return parseInt(number) * units[unit];
};

// Middleware para validar parâmetros de paginação
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json(
      AuthUtils.generateErrorResponse(
        'Número da página deve ser um inteiro positivo',
        'INVALID_PAGE'
      )
    );
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json(
      AuthUtils.generateErrorResponse(
        'Limite deve ser um inteiro entre 1 e 100',
        'INVALID_LIMIT'
      )
    );
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

// Middleware para validar datas
const validateDateRange = (startDateField = 'dataInicio', endDateField = 'dataFim') => {
  return (req, res, next) => {
    const startDate = req.query[startDateField] || req.body[startDateField];
    const endDate = req.query[endDateField] || req.body[endDateField];
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json(
          AuthUtils.generateErrorResponse(
            'Datas fornecidas são inválidas',
            'INVALID_DATE_FORMAT'
          )
        );
      }
      
      if (start > end) {
        return res.status(400).json(
          AuthUtils.generateErrorResponse(
            'Data de início deve ser anterior à data de fim',
            'INVALID_DATE_RANGE'
          )
        );
      }
      
      // Adicionar datas validadas à requisição
      req.dateRange = { start, end };
    }
    
    next();
  };
};

// Middleware para validar IDs numéricos
const validateNumericId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json(
        AuthUtils.generateErrorResponse(
          `${paramName} deve ser um número válido`,
          'INVALID_ID'
        )
      );
    }
    
    req.params[paramName] = parseInt(id);
    next();
  };
};

// Middleware para limpar dados sensíveis da resposta
const cleanSensitiveData = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && typeof data === 'object') {
      // Remover campos sensíveis recursivamente
      const cleanData = removeSensitiveFields(data);
      return originalJson.call(this, cleanData);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Função auxiliar para remover campos sensíveis
const removeSensitiveFields = (obj) => {
  const sensitiveFields = [
    'senha_hash',
    'token_2fa',
    'token_recuperacao',
    'senha',
    'password'
  ];
  
  if (Array.isArray(obj)) {
    return obj.map(removeSensitiveFields);
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (!sensitiveFields.includes(key.toLowerCase())) {
        cleaned[key] = removeSensitiveFields(value);
      }
    }
    
    return cleaned;
  }
  
  return obj;
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  validateContentType,
  validateBodySize,
  validatePagination,
  validateDateRange,
  validateNumericId,
  cleanSensitiveData
};