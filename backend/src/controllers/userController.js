const db = require('../models/database');
const AuthUtils = require('../utils/auth');

class UserController {
  // Obter perfil do usuário logado
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await db.get(
        'SELECT id, cpf, nome, email, telefone, data_nascimento, criado_em FROM users WHERE id = ? AND ativo = 1',
        [userId]
      );

      if (!user) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Usuário não encontrado', 'USER_NOT_FOUND')
        );
      }

      // Buscar dados de responsáveis legais
      const responsaveis = await db.query(
        'SELECT id, responsavel_cpf, responsavel_nome, responsavel_email, parentesco FROM responsaveis WHERE usuario_id = ? AND ativo = 1',
        [userId]
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            ...user,
            cpf: AuthUtils.formatCPF(user.cpf),
            responsaveis
          },
          'Perfil obtido com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { nome, email, telefone } = req.body;

      // Buscar dados atuais do usuário
      const userAtual = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (!userAtual) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Usuário não encontrado', 'USER_NOT_FOUND')
        );
      }

      // Verificar se o email já está em uso por outro usuário
      if (email && email !== userAtual.email) {
        const emailExistente = await db.get(
          'SELECT id FROM users WHERE email = ? AND id != ? AND ativo = 1',
          [email, userId]
        );

        if (emailExistente) {
          return res.status(409).json(
            AuthUtils.generateErrorResponse('Email já está em uso', 'EMAIL_ALREADY_EXISTS')
          );
        }
      }

      // Preparar campos para atualização
      const camposAtualizacao = [];
      const valores = [];

      if (nome && nome !== userAtual.nome) {
        camposAtualizacao.push('nome = ?');
        valores.push(nome);
      }

      if (email && email !== userAtual.email) {
        camposAtualizacao.push('email = ?');
        valores.push(email);
      }

      if (telefone !== undefined && telefone !== userAtual.telefone) {
        camposAtualizacao.push('telefone = ?');
        valores.push(telefone);
      }

      if (camposAtualizacao.length === 0) {
        return res.status(400).json(
          AuthUtils.generateErrorResponse('Nenhuma alteração detectada', 'NO_CHANGES')
        );
      }

      // Adicionar timestamp de atualização
      camposAtualizacao.push('atualizado_em = ?');
      valores.push(new Date().toISOString());
      valores.push(userId);

      // Executar atualização
      await db.run(
        `UPDATE users SET ${camposAtualizacao.join(', ')} WHERE id = ?`,
        valores
      );

      // Buscar dados atualizados
      const userAtualizado = await db.get(
        'SELECT id, cpf, nome, email, telefone, data_nascimento, criado_em, atualizado_em FROM users WHERE id = ?',
        [userId]
      );

      // Log de auditoria
      await this.logAuditoria(
        userId,
        'profile_updated',
        'users',
        userId,
        AuthUtils.sanitizeUser(userAtual),
        { ip: req.ip, changes: req.body }
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            ...userAtualizado,
            cpf: AuthUtils.formatCPF(userAtualizado.cpf)
          },
          'Perfil atualizado com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Alterar senha
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { senhaAtual, novaSenha } = req.body;

      // Buscar dados do usuário
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (!user) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Usuário não encontrado', 'USER_NOT_FOUND')
        );
      }

      // Verificar senha atual
      const senhaValida = await AuthUtils.verifyPassword(senhaAtual, user.senha_hash);
      
      if (!senhaValida) {
        return res.status(401).json(
          AuthUtils.generateErrorResponse('Senha atual incorreta', 'INVALID_CURRENT_PASSWORD')
        );
      }

      // Verificar se a nova senha é diferente da atual
      const novaSenhaIgual = await AuthUtils.verifyPassword(novaSenha, user.senha_hash);
      
      if (novaSenhaIgual) {
        return res.status(400).json(
          AuthUtils.generateErrorResponse('A nova senha deve ser diferente da atual', 'SAME_PASSWORD')
        );
      }

      // Gerar hash da nova senha
      const novaSenhaHash = await AuthUtils.hashPassword(novaSenha);

      // Atualizar senha
      await db.run(
        'UPDATE users SET senha_hash = ?, atualizado_em = ? WHERE id = ?',
        [novaSenhaHash, new Date().toISOString(), userId]
      );

      // Invalidar todos os refresh tokens (forçar novo login)
      await db.run('UPDATE refresh_tokens SET ativo = 0 WHERE usuario_id = ?', [userId]);

      // Log de auditoria
      await this.logAuditoria(userId, 'password_changed', 'users', userId, null, { ip: req.ip });

      res.json(
        AuthUtils.generateSuccessResponse(null, 'Senha alterada com sucesso')
      );
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Adicionar responsável legal
  static async addResponsavel(req, res) {
    try {
      const userId = req.user.id;
      const { responsavelCpf, responsavelNome, responsavelEmail, parentesco } = req.body;

      // Verificar se já existe um responsável com o mesmo CPF
      const responsavelExistente = await db.get(
        'SELECT id FROM responsaveis WHERE usuario_id = ? AND responsavel_cpf = ? AND ativo = 1',
        [userId, AuthUtils.cleanCPF(responsavelCpf)]
      );

      if (responsavelExistente) {
        return res.status(409).json(
          AuthUtils.generateErrorResponse('Responsável já cadastrado', 'RESPONSAVEL_ALREADY_EXISTS')
        );
      }

      // Inserir novo responsável
      const result = await db.run(
        'INSERT INTO responsaveis (usuario_id, responsavel_cpf, responsavel_nome, responsavel_email, parentesco) VALUES (?, ?, ?, ?, ?)',
        [userId, AuthUtils.cleanCPF(responsavelCpf), responsavelNome, responsavelEmail, parentesco]
      );

      // Buscar dados do responsável inserido
      const novoResponsavel = await db.get(
        'SELECT id, responsavel_cpf, responsavel_nome, responsavel_email, parentesco, criado_em FROM responsaveis WHERE id = ?',
        [result.id]
      );

      // Log de auditoria
      await this.logAuditoria(userId, 'responsavel_added', 'responsaveis', result.id, null, { ip: req.ip, responsavel: novoResponsavel });

      res.status(201).json(
        AuthUtils.generateSuccessResponse(
          {
            ...novoResponsavel,
            responsavel_cpf: AuthUtils.formatCPF(novoResponsavel.responsavel_cpf)
          },
          'Responsável adicionado com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Remover responsável legal
  static async removeResponsavel(req, res) {
    try {
      const userId = req.user.id;
      const responsavelId = req.params.id;

      // Buscar responsável
      const responsavel = await db.get(
        'SELECT * FROM responsaveis WHERE id = ? AND usuario_id = ? AND ativo = 1',
        [responsavelId, userId]
      );

      if (!responsavel) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Responsável não encontrado', 'RESPONSAVEL_NOT_FOUND')
        );
      }

      // Desativar responsável (soft delete)
      await db.run(
        'UPDATE responsaveis SET ativo = 0 WHERE id = ?',
        [responsavelId]
      );

      // Log de auditoria
      await this.logAuditoria(userId, 'responsavel_removed', 'responsaveis', responsavelId, responsavel, { ip: req.ip });

      res.json(
        AuthUtils.generateSuccessResponse(null, 'Responsável removido com sucesso')
      );
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Obter estatísticas do usuário
  static async getStats(req, res) {
    try {
      const userId = req.user.id;

      // Contar exames por período
      const statsQuery = `
        SELECT 
          COUNT(*) as total_exames,
          COUNT(CASE WHEN date(data_realizacao) >= date('now', '-30 days') THEN 1 END) as exames_ultimos_30_dias,
          COUNT(CASE WHEN date(data_realizacao) >= date('now', '-90 days') THEN 1 END) as exames_ultimos_90_dias,
          COUNT(DISTINCT medico_id) as total_medicos,
          COUNT(DISTINCT tipo_exame) as tipos_exames
        FROM exames 
        WHERE usuario_id = ?
      `;

      const stats = await db.get(statsQuery, [userId]);

      // Exames por tipo
      const examesPorTipo = await db.query(
        'SELECT tipo_exame, COUNT(*) as quantidade FROM exames WHERE usuario_id = ? GROUP BY tipo_exame ORDER BY quantidade DESC',
        [userId]
      );

      // Exames por mês (últimos 12 meses)
      const examesPorMes = await db.query(`
        SELECT 
          strftime('%Y-%m', data_realizacao) as mes,
          COUNT(*) as quantidade
        FROM exames 
        WHERE usuario_id = ? AND date(data_realizacao) >= date('now', '-12 months')
        GROUP BY mes
        ORDER BY mes
      `, [userId]);

      // Compartilhamentos ativos
      const compartilhamentosAtivos = await db.get(
        'SELECT COUNT(*) as total FROM compartilhamentos WHERE exame_id IN (SELECT id FROM exames WHERE usuario_id = ?) AND ativo = 1 AND data_expiracao > datetime("now")',
        [userId]
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            resumo: stats,
            examesPorTipo,
            examesPorMes,
            compartilhamentosAtivos: compartilhamentosAtivos.total
          },
          'Estatísticas obtidas com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Obter logs de atividade do usuário
  static async getActivityLogs(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Buscar logs de auditoria
      const logs = await db.query(`
        SELECT 
          acao,
          tabela,
          criado_em,
          ip_address
        FROM logs_auditoria 
        WHERE usuario_id = ? 
        ORDER BY criado_em DESC 
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      // Contar total de logs
      const totalLogs = await db.get(
        'SELECT COUNT(*) as total FROM logs_auditoria WHERE usuario_id = ?',
        [userId]
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            logs,
            pagination: {
              page,
              limit,
              total: totalLogs.total,
              totalPages: Math.ceil(totalLogs.total / limit)
            }
          },
          'Logs de atividade obtidos com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter logs de atividade:', error);
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

module.exports = UserController;