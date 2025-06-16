const { body, param, query } = require('express-validator');

// Validação de CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

// Validação de CRM
const validarCRM = (crm) => {
  return /^\d{4,6}\/[A-Z]{2}$/.test(crm);
};

// Validações para autenticação
const validacoesAuth = {
  login: [
    body('cpf')
      .notEmpty()
      .withMessage('CPF é obrigatório')
      .custom(validarCPF)
      .withMessage('CPF inválido'),
    body('senha')
      .notEmpty()
      .withMessage('Senha é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Senha deve ter pelo menos 4 caracteres')
  ],

  verificarToken2FA: [
    body('cpf')
      .notEmpty()
      .withMessage('CPF é obrigatório')
      .custom(validarCPF)
      .withMessage('CPF inválido'),
    body('token')
      .notEmpty()
      .withMessage('Token é obrigatório')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token deve ter 6 dígitos')
      .isNumeric()
      .withMessage('Token deve conter apenas números')
  ],

  recuperarSenha: [
    body('cpf')
      .notEmpty()
      .withMessage('CPF é obrigatório')
      .custom(validarCPF)
      .withMessage('CPF inválido')
  ],

  redefinirSenha: [
    body('token')
      .notEmpty()
      .withMessage('Token é obrigatório'),
    body('novaSenha')
      .notEmpty()
      .withMessage('Nova senha é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Nova senha deve ter pelo menos 4 caracteres')
  ]
};

// Validações para usuários
const validacoesUsuario = {
  criar: [
    body('cpf')
      .notEmpty()
      .withMessage('CPF é obrigatório')
      .custom(validarCPF)
      .withMessage('CPF inválido'),
    body('nome')
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email inválido'),
    body('telefone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
    body('dataNascimento')
      .notEmpty()
      .withMessage('Data de nascimento é obrigatória')
      .isDate()
      .withMessage('Data de nascimento inválida'),
    body('senha')
      .notEmpty()
      .withMessage('Senha é obrigatória')
      .isLength({ min: 4 })
      .withMessage('Senha deve ter pelo menos 4 caracteres')
  ],

  atualizar: [
    param('id').isInt().withMessage('ID deve ser um número inteiro'),
    body('nome')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email inválido'),
    body('telefone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX')
  ]
};

// Validações para médicos
const validacoesMedico = {
  criar: [
    body('nome')
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('crm')
      .notEmpty()
      .withMessage('CRM é obrigatório')
      .custom(validarCRM)
      .withMessage('CRM inválido. Formato: XXXXXX/UF'),
    body('especialidade')
      .notEmpty()
      .withMessage('Especialidade é obrigatória')
      .isLength({ min: 2, max: 100 })
      .withMessage('Especialidade deve ter entre 2 e 100 caracteres'),
    body('email')
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email inválido'),
    body('telefone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX')
  ]
};

// Validações para exames
const validacoesExame = {
  criar: [
    body('tipoExame')
      .notEmpty()
      .withMessage('Tipo de exame é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Tipo de exame deve ter entre 2 e 100 caracteres'),
    body('dataRealizacao')
      .notEmpty()
      .withMessage('Data de realização é obrigatória')
      .isDate()
      .withMessage('Data de realização inválida'),
    body('medicoId')
      .optional()
      .isInt()
      .withMessage('ID do médico deve ser um número inteiro'),
    body('resultado')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Resultado deve ter no máximo 1000 caracteres')
  ],

  compartilhar: [
    body('exameId')
      .notEmpty()
      .withMessage('ID do exame é obrigatório')
      .isInt()
      .withMessage('ID do exame deve ser um número inteiro'),
    body('medicoId')
      .notEmpty()
      .withMessage('ID do médico é obrigatório')
      .isInt()
      .withMessage('ID do médico deve ser um número inteiro'),
    body('diasExpiracao')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Dias de expiração deve ser entre 1 e 30')
  ]
};

// Validações de parâmetros
const validacoesParam = {
  id: param('id').isInt().withMessage('ID deve ser um número inteiro'),
  token: param('token').notEmpty().withMessage('Token é obrigatório')
};

// Validações de query
const validacoesQuery = {
  paginacao: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ]
};

module.exports = {
  validarCPF,
  validarCRM,
  validacoesAuth,
  validacoesUsuario,
  validacoesMedico,
  validacoesExame,
  validacoesParam,
  validacoesQuery
};