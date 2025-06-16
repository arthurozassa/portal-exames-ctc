const db = require('../models/database');
const AuthUtils = require('../utils/auth');

class AdminController {
  // Login administrativo
  static async adminLogin(req, res) {
    try {
      const { email, senha } = req.body;

      // Buscar administrador
      const admin = await db.get(
        'SELECT * FROM administradores WHERE email = ? AND ativo = 1',
        [email]
      );

      if (!admin) {
        return res.status(401).json(
          AuthUtils.generateErrorResponse('Email não encontrado. Verifique e tente novamente.', 'INVALID_EMAIL')
        );
      }

      // Verificar senha
      const senhaValida = await AuthUtils.verifyPassword(senha, admin.senha_hash);
      
      if (!senhaValida) {
        return res.status(401).json(
          AuthUtils.generateErrorResponse('Senha inválida. Tente novamente.', 'INVALID_PASSWORD')
        );
      }

      // Gerar token JWT
      const accessToken = AuthUtils.generateToken(
        { adminId: admin.id, email: admin.email, permissions: admin.permissoes },
        '24h' // Admins têm token com duração maior
      );

      // Atualizar último login
      await db.run(
        'UPDATE administradores SET ultimo_login = ? WHERE id = ?',
        [new Date().toISOString(), admin.id]
      );

      // Log de auditoria
      await this.logAuditoria(admin.id, 'admin_login', 'administradores', admin.id, null, { ip: req.ip });

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            accessToken,
            expiresIn: '24h',
            admin: {
              id: admin.id,
              nome: admin.nome,
              email: admin.email,
              permissoes: admin.permissoes
            }
          },
          'Login administrativo realizado com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro no login administrativo:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Dashboard administrativo
  static async getDashboard(req, res) {
    try {
      // Estatísticas gerais
      const stats = await Promise.all([
        // Usuários
        db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN ativo = 1 THEN 1 END) as ativos,
            COUNT(CASE WHEN date(criado_em) = date('now') THEN 1 END) as hoje
          FROM users
        `),
        
        // Médicos
        db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN ativo = 1 THEN 1 END) as ativos
          FROM medicos
        `),
        
        // Exames
        db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN date(data_realizacao) = date('now') THEN 1 END) as hoje,
            COUNT(CASE WHEN date(data_realizacao) >= date('now', '-30 days') THEN 1 END) as ultimos_30_dias
          FROM exames
        `),
        
        // Compartilhamentos
        db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN ativo = 1 AND data_expiracao > datetime('now') THEN 1 END) as ativos,
            COUNT(CASE WHEN visualizado = 1 THEN 1 END) as visualizados
          FROM compartilhamentos
        `)
      ]);

      const [usuarios, medicos, exames, compartilhamentos] = stats;

      // Atividade recente
      const atividadeRecente = await db.query(`
        SELECT 
          acao,
          tabela,
          criado_em,
          ip_address
        FROM logs_auditoria
        ORDER BY criado_em DESC
        LIMIT 10
      `);

      // Exames por mês (últimos 12 meses)
      const examesPorMes = await db.query(`
        SELECT 
          strftime('%Y-%m', data_realizacao) as mes,
          COUNT(*) as quantidade
        FROM exames 
        WHERE date(data_realizacao) >= date('now', '-12 months')
        GROUP BY mes
        ORDER BY mes
      `);

      // Tipos de exames mais realizados
      const tiposExamesMaisRealizados = await db.query(`
        SELECT 
          tipo_exame,
          COUNT(*) as quantidade
        FROM exames
        GROUP BY tipo_exame
        ORDER BY quantidade DESC
        LIMIT 10
      `);

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            estatisticas: {
              usuarios,
              medicos,
              exames,
              compartilhamentos
            },
            graficos: {
              examesPorMes,
              tiposExamesMaisRealizados
            },
            atividadeRecente
          },
          'Dashboard obtido com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter dashboard:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Listar todos os usuários
  static async listUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (page - 1) * limit;

      // Construir query com filtros
      let whereClause = '1=1';
      let params = [];

      if (search) {
        whereClause += ' AND (nome LIKE ? OR cpf LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status === 'ativo') {
        whereClause += ' AND ativo = 1';
      } else if (status === 'inativo') {
        whereClause += ' AND ativo = 0';
      } else if (status === 'bloqueado') {
        whereClause += ' AND bloqueado_ate > datetime("now")';
      }

      // Buscar usuários
      const usuarios = await db.query(`
        SELECT 
          id,
          cpf,
          nome,
          email,
          telefone,
          data_nascimento,
          ativo,
          tentativas_login,
          bloqueado_ate,
          criado_em
        FROM users
        WHERE ${whereClause}
        ORDER BY criado_em DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Contar total de usuários
      const { total } = await db.get(`
        SELECT COUNT(*) as total
        FROM users
        WHERE ${whereClause}
      `, params);

      // Formatar dados dos usuários
      const usuariosFormatados = usuarios.map(usuario => ({
        ...usuario,
        cpf: AuthUtils.formatCPF(usuario.cpf),
        bloqueado: AuthUtils.isUserBlocked(usuario)
      }));

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            usuarios: usuariosFormatados,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          },
          'Usuários listados com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Desbloquear usuário
  static async unlockUser(req, res) {
    try {
      const userId = req.params.id;

      // Buscar usuário
      const usuario = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!usuario) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Usuário não encontrado', 'USER_NOT_FOUND')
        );
      }

      // Desbloquear usuário
      await db.run(
        'UPDATE users SET tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?',
        [userId]
      );

      // Log de auditoria
      await this.logAuditoria(
        req.admin.id,
        'user_unlocked',
        'users',
        userId,
        { bloqueado_ate: usuario.bloqueado_ate, tentativas_login: usuario.tentativas_login },
        { ip: req.ip, admin: req.admin.email }
      );

      res.json(
        AuthUtils.generateSuccessResponse(null, 'Usuário desbloqueado com sucesso')
      );
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Ativar/Desativar usuário
  static async toggleUserStatus(req, res) {
    try {
      const userId = req.params.id;
      const { ativo } = req.body;

      // Buscar usuário
      const usuario = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!usuario) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Usuário não encontrado', 'USER_NOT_FOUND')
        );
      }

      // Atualizar status
      await db.run(
        'UPDATE users SET ativo = ? WHERE id = ?',
        [ativo ? 1 : 0, userId]
      );

      // Se desativando, invalidar todos os tokens do usuário
      if (!ativo) {
        await db.run('UPDATE refresh_tokens SET ativo = 0 WHERE usuario_id = ?', [userId]);
      }

      // Log de auditoria
      await this.logAuditoria(
        req.admin.id,
        ativo ? 'user_activated' : 'user_deactivated',
        'users',
        userId,
        { ativo: usuario.ativo },
        { ip: req.ip, admin: req.admin.email }
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          null,
          `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
        )
      );
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Listar logs de auditoria
  static async getAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, acao, tabela, usuarioId, dataInicio, dataFim } = req.query;
      const offset = (page - 1) * limit;

      // Construir query com filtros
      let whereClause = '1=1';
      let params = [];

      if (acao) {
        whereClause += ' AND acao LIKE ?';
        params.push(`%${acao}%`);
      }

      if (tabela) {
        whereClause += ' AND tabela = ?';
        params.push(tabela);
      }

      if (usuarioId) {
        whereClause += ' AND usuario_id = ?';
        params.push(usuarioId);
      }

      if (dataInicio) {
        whereClause += ' AND date(criado_em) >= ?';
        params.push(dataInicio);
      }

      if (dataFim) {
        whereClause += ' AND date(criado_em) <= ?';
        params.push(dataFim);
      }

      // Buscar logs de auditoria
      const logs = await db.query(`
        SELECT 
          l.*,
          u.nome as usuario_nome,
          u.cpf as usuario_cpf
        FROM logs_auditoria l
        LEFT JOIN users u ON l.usuario_id = u.id
        WHERE ${whereClause}
        ORDER BY l.criado_em DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Contar total de logs
      const { total } = await db.get(`
        SELECT COUNT(*) as total
        FROM logs_auditoria l
        WHERE ${whereClause}
      `, params);

      // Formatar dados dos logs
      const logsFormatados = logs.map(log => ({
        ...log,
        usuario_cpf: log.usuario_cpf ? AuthUtils.formatCPF(log.usuario_cpf) : null
      }));

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            logs: logsFormatados,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          },
          'Logs de auditoria obtidos com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Relatório de compartilhamentos
  static async getSharesReport(req, res) {
    try {
      const { dataInicio, dataFim, medicoId, status } = req.query;

      // Construir query com filtros
      let whereClause = '1=1';
      let params = [];

      if (dataInicio) {
        whereClause += ' AND date(c.criado_em) >= ?';
        params.push(dataInicio);
      }

      if (dataFim) {
        whereClause += ' AND date(c.criado_em) <= ?';
        params.push(dataFim);
      }

      if (medicoId) {
        whereClause += ' AND c.medico_id = ?';
        params.push(medicoId);
      }

      if (status === 'ativo') {
        whereClause += ' AND c.ativo = 1 AND c.data_expiracao > datetime("now")';
      } else if (status === 'expirado') {
        whereClause += ' AND c.data_expiracao <= datetime("now")';
      } else if (status === 'visualizado') {
        whereClause += ' AND c.visualizado = 1';
      }

      // Buscar compartilhamentos
      const compartilhamentos = await db.query(`
        SELECT 
          c.id,
          c.data_expiracao,
          c.visualizado,
          c.data_visualizacao,
          c.criado_em,
          e.tipo_exame,
          e.data_realizacao,
          u.nome as paciente_nome,
          u.cpf as paciente_cpf,
          m.nome as medico_nome,
          m.crm as medico_crm,
          m.especialidade as medico_especialidade
        FROM compartilhamentos c
        JOIN exames e ON c.exame_id = e.id
        JOIN users u ON e.usuario_id = u.id
        JOIN medicos m ON c.medico_id = m.id
        WHERE ${whereClause}
        ORDER BY c.criado_em DESC
      `, params);

      // Estatísticas dos compartilhamentos
      const estatisticas = {
        total: compartilhamentos.length,
        ativos: compartilhamentos.filter(c => 
          c.ativo && new Date(c.data_expiracao) > new Date()
        ).length,
        visualizados: compartilhamentos.filter(c => c.visualizado).length,
        expirados: compartilhamentos.filter(c => 
          new Date(c.data_expiracao) <= new Date()
        ).length
      };

      // Compartilhamentos por médico
      const compartilhamentosPorMedico = {};
      compartilhamentos.forEach(comp => {
        const medico = `${comp.medico_nome} (${comp.medico_crm})`;
        compartilhamentosPorMedico[medico] = (compartilhamentosPorMedico[medico] || 0) + 1;
      });

      // Formatar dados sensíveis
      const compartilhamentosFormatados = compartilhamentos.map(comp => ({
        ...comp,
        paciente_cpf: AuthUtils.formatCPF(comp.paciente_cpf)
      }));

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            compartilhamentos: compartilhamentosFormatados,
            estatisticas,
            compartilhamentosPorMedico
          },
          'Relatório de compartilhamentos gerado com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao gerar relatório de compartilhamentos:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Backup do banco de dados
  static async createBackup(req, res) {
    try {
      // Em produção, implementar backup real do SQLite
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}.db`;
      
      // Log de auditoria
      await this.logAuditoria(
        req.admin.id,
        'backup_created',
        'system',
        null,
        null,
        { ip: req.ip, backup_name: backupName, admin: req.admin.email }
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          { backupName, timestamp },
          'Backup criado com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Configurações do sistema
  static async getSystemSettings(req, res) {
    try {
      const configuracoes = {
        seguranca: {
          max_login_attempts: process.env.MAX_LOGIN_ATTEMPTS || 5,
          jwt_expires_in: process.env.JWT_EXPIRES_IN || '5m',
          rate_limit_max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
          rate_limit_window: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
        },
        sistema: {
          node_env: process.env.NODE_ENV,
          versao: '1.0.0',
          ultima_atualizacao: new Date().toISOString()
        }
      };

      res.json(
        AuthUtils.generateSuccessResponse(configuracoes, 'Configurações obtidas com sucesso')
      );
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Método auxiliar para log de auditoria
  static async logAuditoria(usuarioId, acao, tabela, registroId, dadosAnteriores, detalhes = {}) {
    try {
      await db.run(
        'INSERT INTO logs_auditoria (usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos, ip_address, user_agent, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          usuarioId,
          acao,
          tabela,
          registroId,
          dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
          JSON.stringify(detalhes),
          detalhes.ip || null,
          detalhes.userAgent || null,
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error);
    }
  }
}

module.exports = AdminController;