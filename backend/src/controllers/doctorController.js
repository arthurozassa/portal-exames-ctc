const db = require('../models/database');
const AuthUtils = require('../utils/auth');

class DoctorController {
  // Listar médicos (para usuários escolherem ao compartilhar)
  static async listDoctors(req, res) {
    try {
      const { page = 1, limit = 20, search, especialidade } = req.query;
      const offset = (page - 1) * limit;

      // Construir query com filtros
      let whereClause = 'ativo = 1';
      let params = [];

      if (search) {
        whereClause += ' AND (nome LIKE ? OR crm LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (especialidade) {
        whereClause += ' AND especialidade LIKE ?';
        params.push(`%${especialidade}%`);
      }

      // Buscar médicos
      const medicos = await db.query(`
        SELECT 
          id,
          nome,
          crm,
          especialidade,
          email,
          telefone,
          criado_em
        FROM medicos
        WHERE ${whereClause}
        ORDER BY nome ASC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Contar total de médicos
      const { total } = await db.get(`
        SELECT COUNT(*) as total
        FROM medicos
        WHERE ${whereClause}
      `, params);

      // Buscar especialidades únicas para filtro
      const especialidades = await db.query(
        'SELECT DISTINCT especialidade FROM medicos WHERE ativo = 1 ORDER BY especialidade ASC'
      );

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            medicos,
            especialidades: especialidades.map(e => e.especialidade),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          },
          'Médicos listados com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao listar médicos:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Obter detalhes de um médico específico
  static async getDoctor(req, res) {
    try {
      const doctorId = req.params.id;

      const medico = await db.get(`
        SELECT 
          id,
          nome,
          crm,
          especialidade,
          email,
          telefone,
          criado_em
        FROM medicos
        WHERE id = ? AND ativo = 1
      `, [doctorId]);

      if (!medico) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Médico não encontrado', 'DOCTOR_NOT_FOUND')
        );
      }

      // Buscar estatísticas do médico (compartilhamentos recebidos)
      const stats = await db.get(`
        SELECT 
          COUNT(DISTINCT c.exame_id) as total_exames_compartilhados,
          COUNT(DISTINCT e.usuario_id) as total_pacientes,
          COUNT(CASE WHEN c.visualizado = 1 THEN 1 END) as exames_visualizados
        FROM compartilhamentos c
        JOIN exames e ON c.exame_id = e.id
        WHERE c.medico_id = ? AND c.ativo = 1
      `, [doctorId]);

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            ...medico,
            estatisticas: stats
          },
          'Detalhes do médico obtidos com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter médico:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Criar novo médico (apenas para administradores)
  static async createDoctor(req, res) {
    try {
      const { nome, crm, especialidade, email, telefone } = req.body;

      // Verificar se o CRM já existe
      const crmExistente = await db.get(
        'SELECT id FROM medicos WHERE crm = ? AND ativo = 1',
        [crm]
      );

      if (crmExistente) {
        return res.status(409).json(
          AuthUtils.generateErrorResponse('CRM já cadastrado', 'CRM_ALREADY_EXISTS')
        );
      }

      // Verificar se o email já existe
      const emailExistente = await db.get(
        'SELECT id FROM medicos WHERE email = ? AND ativo = 1',
        [email]
      );

      if (emailExistente) {
        return res.status(409).json(
          AuthUtils.generateErrorResponse('Email já cadastrado', 'EMAIL_ALREADY_EXISTS')
        );
      }

      // Inserir novo médico
      const result = await db.run(
        'INSERT INTO medicos (nome, crm, especialidade, email, telefone) VALUES (?, ?, ?, ?, ?)',
        [nome, crm, especialidade, email, telefone || null]
      );

      // Buscar médico criado
      const novoMedico = await db.get(
        'SELECT id, nome, crm, especialidade, email, telefone, criado_em FROM medicos WHERE id = ?',
        [result.id]
      );

      // Log de auditoria
      await this.logAuditoria(
        req.admin ? req.admin.id : null,
        'doctor_created',
        'medicos',
        result.id,
        null,
        { ip: req.ip, medico: novoMedico }
      );

      res.status(201).json(
        AuthUtils.generateSuccessResponse(novoMedico, 'Médico criado com sucesso')
      );
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Atualizar médico (apenas para administradores)
  static async updateDoctor(req, res) {
    try {
      const doctorId = req.params.id;
      const { nome, crm, especialidade, email, telefone } = req.body;

      // Buscar médico atual
      const medicoAtual = await db.get(
        'SELECT * FROM medicos WHERE id = ? AND ativo = 1',
        [doctorId]
      );

      if (!medicoAtual) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Médico não encontrado', 'DOCTOR_NOT_FOUND')
        );
      }

      // Verificar se o CRM já está em uso por outro médico
      if (crm && crm !== medicoAtual.crm) {
        const crmExistente = await db.get(
          'SELECT id FROM medicos WHERE crm = ? AND id != ? AND ativo = 1',
          [crm, doctorId]
        );

        if (crmExistente) {
          return res.status(409).json(
            AuthUtils.generateErrorResponse('CRM já está em uso', 'CRM_ALREADY_EXISTS')
          );
        }
      }

      // Verificar se o email já está em uso por outro médico
      if (email && email !== medicoAtual.email) {
        const emailExistente = await db.get(
          'SELECT id FROM medicos WHERE email = ? AND id != ? AND ativo = 1',
          [email, doctorId]
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

      if (nome && nome !== medicoAtual.nome) {
        camposAtualizacao.push('nome = ?');
        valores.push(nome);
      }

      if (crm && crm !== medicoAtual.crm) {
        camposAtualizacao.push('crm = ?');
        valores.push(crm);
      }

      if (especialidade && especialidade !== medicoAtual.especialidade) {
        camposAtualizacao.push('especialidade = ?');
        valores.push(especialidade);
      }

      if (email && email !== medicoAtual.email) {
        camposAtualizacao.push('email = ?');
        valores.push(email);
      }

      if (telefone !== undefined && telefone !== medicoAtual.telefone) {
        camposAtualizacao.push('telefone = ?');
        valores.push(telefone);
      }

      if (camposAtualizacao.length === 0) {
        return res.status(400).json(
          AuthUtils.generateErrorResponse('Nenhuma alteração detectada', 'NO_CHANGES')
        );
      }

      valores.push(doctorId);

      // Executar atualização
      await db.run(
        `UPDATE medicos SET ${camposAtualizacao.join(', ')} WHERE id = ?`,
        valores
      );

      // Buscar médico atualizado
      const medicoAtualizado = await db.get(
        'SELECT id, nome, crm, especialidade, email, telefone, criado_em FROM medicos WHERE id = ?',
        [doctorId]
      );

      // Log de auditoria
      await this.logAuditoria(
        req.admin ? req.admin.id : null,
        'doctor_updated',
        'medicos',
        doctorId,
        medicoAtual,
        { ip: req.ip, changes: req.body }
      );

      res.json(
        AuthUtils.generateSuccessResponse(medicoAtualizado, 'Médico atualizado com sucesso')
      );
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Desativar médico (soft delete - apenas para administradores)
  static async deleteDoctor(req, res) {
    try {
      const doctorId = req.params.id;

      // Buscar médico
      const medico = await db.get(
        'SELECT * FROM medicos WHERE id = ? AND ativo = 1',
        [doctorId]
      );

      if (!medico) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Médico não encontrado', 'DOCTOR_NOT_FOUND')
        );
      }

      // Verificar se o médico tem compartilhamentos ativos
      const compartilhamentosAtivos = await db.get(
        'SELECT COUNT(*) as total FROM compartilhamentos WHERE medico_id = ? AND ativo = 1 AND data_expiracao > datetime("now")',
        [doctorId]
      );

      if (compartilhamentosAtivos.total > 0) {
        return res.status(409).json(
          AuthUtils.generateErrorResponse(
            'Não é possível desativar médico com compartilhamentos ativos',
            'DOCTOR_HAS_ACTIVE_SHARES'
          )
        );
      }

      // Desativar médico
      await db.run(
        'UPDATE medicos SET ativo = 0 WHERE id = ?',
        [doctorId]
      );

      // Log de auditoria
      await this.logAuditoria(
        req.admin ? req.admin.id : null,
        'doctor_deactivated',
        'medicos',
        doctorId,
        medico,
        { ip: req.ip }
      );

      res.json(
        AuthUtils.generateSuccessResponse(null, 'Médico desativado com sucesso')
      );
    } catch (error) {
      console.error('Erro ao desativar médico:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Obter compartilhamentos recebidos por um médico
  static async getDoctorShares(req, res) {
    try {
      const doctorId = req.params.id;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      // Verificar se o médico existe
      const medico = await db.get(
        'SELECT id, nome, crm FROM medicos WHERE id = ? AND ativo = 1',
        [doctorId]
      );

      if (!medico) {
        return res.status(404).json(
          AuthUtils.generateErrorResponse('Médico não encontrado', 'DOCTOR_NOT_FOUND')
        );
      }

      // Construir query com filtros
      let whereClause = 'c.medico_id = ? AND c.ativo = 1';
      let params = [doctorId];

      if (status === 'ativo') {
        whereClause += ' AND c.data_expiracao > datetime("now")';
      } else if (status === 'expirado') {
        whereClause += ' AND c.data_expiracao <= datetime("now")';
      } else if (status === 'visualizado') {
        whereClause += ' AND c.visualizado = 1';
      } else if (status === 'nao_visualizado') {
        whereClause += ' AND c.visualizado = 0';
      }

      // Buscar compartilhamentos
      const compartilhamentos = await db.query(`
        SELECT 
          c.id,
          c.token,
          c.data_expiracao,
          c.visualizado,
          c.data_visualizacao,
          c.criado_em,
          e.tipo_exame,
          e.data_realizacao,
          e.descricao,
          u.nome as paciente_nome
        FROM compartilhamentos c
        JOIN exames e ON c.exame_id = e.id
        JOIN users u ON e.usuario_id = u.id
        WHERE ${whereClause}
        ORDER BY c.criado_em DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Contar total de compartilhamentos
      const { total } = await db.get(`
        SELECT COUNT(*) as total
        FROM compartilhamentos c
        JOIN exames e ON c.exame_id = e.id
        WHERE ${whereClause}
      `, params);

      // Mascarar dados sensíveis dos pacientes
      const compartilhamentosMascarados = compartilhamentos.map(comp => ({
        ...comp,
        paciente_nome: AuthUtils.maskSensitiveData({ nome: comp.paciente_nome }).nome || comp.paciente_nome
      }));

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            medico,
            compartilhamentos: compartilhamentosMascarados,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          },
          'Compartilhamentos do médico obtidos com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter compartilhamentos do médico:', error);
      res.status(500).json(
        AuthUtils.generateErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR')
      );
    }
  }

  // Obter estatísticas dos médicos
  static async getDoctorStats(req, res) {
    try {
      // Estatísticas gerais
      const statsGerais = await db.get(`
        SELECT 
          COUNT(*) as total_medicos,
          COUNT(CASE WHEN ativo = 1 THEN 1 END) as medicos_ativos,
          COUNT(DISTINCT especialidade) as especialidades_unicas
        FROM medicos
      `);

      // Médicos com mais compartilhamentos
      const medicosMaisCompartilhamentos = await db.query(`
        SELECT 
          m.nome,
          m.crm,
          m.especialidade,
          COUNT(c.id) as total_compartilhamentos,
          COUNT(CASE WHEN c.visualizado = 1 THEN 1 END) as visualizados
        FROM medicos m
        LEFT JOIN compartilhamentos c ON m.id = c.medico_id AND c.ativo = 1
        WHERE m.ativo = 1
        GROUP BY m.id
        ORDER BY total_compartilhamentos DESC
        LIMIT 10
      `);

      // Especialidades mais requisitadas
      const especialidadesMaisRequisitadas = await db.query(`
        SELECT 
          m.especialidade,
          COUNT(c.id) as total_compartilhamentos
        FROM medicos m
        JOIN compartilhamentos c ON m.id = c.medico_id
        WHERE m.ativo = 1 AND c.ativo = 1
        GROUP BY m.especialidade
        ORDER BY total_compartilhamentos DESC
        LIMIT 10
      `);

      res.json(
        AuthUtils.generateSuccessResponse(
          {
            estatisticasGerais: statsGerais,
            medicosMaisCompartilhamentos,
            especialidadesMaisRequisitadas
          },
          'Estatísticas dos médicos obtidas com sucesso'
        )
      );
    } catch (error) {
      console.error('Erro ao obter estatísticas dos médicos:', error);
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

module.exports = DoctorController;