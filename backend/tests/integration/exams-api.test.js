const request = require('supertest');
const app = require('../../src/app');
const Database = require('../../src/models/database');

describe('Exams API Integration Tests', () => {
  let server;
  let authToken;
  let userId;
  
  beforeAll(async () => {
    await Database.connect();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    Database.close();
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await Database.run('DELETE FROM exames WHERE usuario_id IN (SELECT id FROM users WHERE cpf = ?)', ['12345678900']);
    await Database.run('DELETE FROM users WHERE cpf = ?', ['12345678900']);
    await Database.run('DELETE FROM medicos WHERE crm = ?', ['123456-SP']);

    // Registrar usuário de teste e obter token
    const userData = testHelpers.generateTestUser();
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ cpf: userData.cpf, senha: userData.senha });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;

    // Criar médico de teste
    const doctorData = testHelpers.generateTestDoctor();
    await Database.run(
      'INSERT INTO medicos (nome, crm, especialidade, email, telefone) VALUES (?, ?, ?, ?, ?)',
      [doctorData.nome, doctorData.crm, doctorData.especialidade, doctorData.email, doctorData.telefone]
    );
  });

  describe('GET /api/exames', () => {
    beforeEach(async () => {
      // Criar exames de teste
      const examData = testHelpers.generateTestExam(userId);
      await Database.run(
        'INSERT INTO exames (usuario_id, tipo_exame, descricao, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?, ?)',
        [examData.usuario_id, examData.tipo_exame, examData.descricao, examData.data_realizacao, examData.resultado, examData.status]
      );
    });

    test('Should get user exams with valid token', async () => {
      const response = await request(app)
        .get('/api/exames')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.exames).toBeDefined();
      expect(Array.isArray(response.body.exames)).toBe(true);
      expect(response.body.exames.length).toBeGreaterThan(0);

      // Validar estrutura do exame
      const exam = response.body.exames[0];
      expect(exam).toHaveProperty('id');
      expect(exam).toHaveProperty('tipo_exame');
      expect(exam).toHaveProperty('data_realizacao');
      expect(exam).toHaveProperty('status');
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/exames')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
      expect(response.body.message).toContain('Token não fornecido');
    });

    test('Should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/exames')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });

    test('Should return empty array when no exams exist', async () => {
      // Limpar exames
      await Database.run('DELETE FROM exames WHERE usuario_id = ?', [userId]);

      const response = await request(app)
        .get('/api/exames')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.exames).toEqual([]);
      expect(response.body.message).toBe('Nenhum exame disponível para esse CPF ainda.');
    });

    test('Should filter exams by date range', async () => {
      const response = await request(app)
        .get('/api/exames')
        .query({
          dataInicio: '2024-01-01',
          dataFim: '2024-12-31'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.exames).toBeDefined();
    });

    test('Should filter exams by type', async () => {
      const response = await request(app)
        .get('/api/exames')
        .query({ tipo: 'Hemograma' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.exames).toBeDefined();
    });

    test('Should paginate results', async () => {
      const response = await request(app)
        .get('/api/exames')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.exames).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/exames/:id', () => {
    let examId;

    beforeEach(async () => {
      // Criar exame de teste
      const examData = testHelpers.generateTestExam(userId);
      const result = await Database.run(
        'INSERT INTO exames (usuario_id, tipo_exame, descricao, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?, ?)',
        [examData.usuario_id, examData.tipo_exame, examData.descricao, examData.data_realizacao, examData.resultado, examData.status]
      );
      examId = result.id;
    });

    test('Should get specific exam with valid ID', async () => {
      const response = await request(app)
        .get(`/api/exames/${examId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.exame).toBeDefined();
      expect(response.body.exame.id).toBe(examId);
      expect(response.body.exame.tipo_exame).toBe('Hemograma');
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get(`/api/exames/${examId}`)
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });

    test('Should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .get('/api/exames/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.message).toContain('Exame não encontrado');
    });

    test('Should prevent access to other users exams', async () => {
      // Criar outro usuário
      const userData2 = {
        ...testHelpers.generateTestUser(),
        cpf: '98765432100',
        email: 'outro@teste.com'
      };
      await request(app)
        .post('/api/auth/register')
        .send(userData2);

      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send({ cpf: userData2.cpf, senha: userData2.senha });

      // Tentar acessar exame do primeiro usuário com token do segundo
      const response = await request(app)
        .get(`/api/exames/${examId}`)
        .set('Authorization', `Bearer ${loginResponse2.body.token}`)
        .expect(403);

      testHelpers.validateErrorResponse(response, 403);
      expect(response.body.message).toContain('Acesso negado');
    });
  });

  describe('POST /api/exames/:id/share', () => {
    let examId;

    beforeEach(async () => {
      // Criar exame de teste
      const examData = testHelpers.generateTestExam(userId);
      const result = await Database.run(
        'INSERT INTO exames (usuario_id, tipo_exame, descricao, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?, ?)',
        [examData.usuario_id, examData.tipo_exame, examData.descricao, examData.data_realizacao, examData.resultado, examData.status]
      );
      examId = result.id;
    });

    test('Should share exam with doctor', async () => {
      const shareData = {
        crm: '123456-SP',
        observacoes: 'Compartilhamento para consulta'
      };

      const response = await request(app)
        .post(`/api/exames/${examId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.dataExpiracao).toBeDefined();
      expect(response.body.message).toContain('compartilhado');
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .post(`/api/exames/${examId}/share`)
        .send({ crm: '123456-SP' })
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });

    test('Should validate required CRM', async () => {
      const response = await request(app)
        .post(`/api/exames/${examId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      testHelpers.validateErrorResponse(response, 400);
      expect(response.body.message).toContain('CRM');
    });

    test('Should validate doctor exists', async () => {
      const response = await request(app)
        .post(`/api/exames/${examId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ crm: '999999-XX' })
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
      expect(response.body.message).toContain('Médico não encontrado');
    });

    test('Should prevent sharing non-existent exam', async () => {
      const response = await request(app)
        .post('/api/exames/99999/share')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ crm: '123456-SP' })
        .expect(404);

      testHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('GET /api/exames/:id/shared', () => {
    let examId;
    let shareToken;

    beforeEach(async () => {
      // Criar exame e compartilhamento de teste
      const examData = testHelpers.generateTestExam(userId);
      const examResult = await Database.run(
        'INSERT INTO exames (usuario_id, tipo_exame, descricao, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?, ?)',
        [examData.usuario_id, examData.tipo_exame, examData.descricao, examData.data_realizacao, examData.resultado, examData.status]
      );
      examId = examResult.id;

      // Compartilhar exame
      const shareResponse = await request(app)
        .post(`/api/exames/${examId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ crm: '123456-SP' });

      shareToken = shareResponse.body.token;
    });

    test('Should access shared exam with valid token', async () => {
      const response = await request(app)
        .get(`/api/exames/${examId}/shared`)
        .query({ token: shareToken })
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.exame).toBeDefined();
      expect(response.body.exame.id).toBe(examId);
      expect(response.body.paciente).toBeDefined();
      expect(response.body.medico).toBeDefined();
    });

    test('Should reject invalid share token', async () => {
      const response = await request(app)
        .get(`/api/exames/${examId}/shared`)
        .query({ token: 'invalid-token' })
        .expect(403);

      testHelpers.validateErrorResponse(response, 403);
      expect(response.body.message).toContain('Token inválido');
    });

    test('Should reject expired share token', async () => {
      // Criar compartilhamento expirado
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 dia atrás
      await Database.run(
        'UPDATE compartilhamentos SET data_expiracao = ? WHERE token = ?',
        [expiredDate.toISOString(), shareToken]
      );

      const response = await request(app)
        .get(`/api/exames/${examId}/shared`)
        .query({ token: shareToken })
        .expect(403);

      testHelpers.validateErrorResponse(response, 403);
      expect(response.body.message).toContain('expirado');
    });

    test('Should mark token as viewed', async () => {
      await request(app)
        .get(`/api/exames/${examId}/shared`)
        .query({ token: shareToken })
        .expect(200);

      // Verificar se foi marcado como visualizado
      const share = await Database.get(
        'SELECT visualizado, data_visualizacao FROM compartilhamentos WHERE token = ?',
        [shareToken]
      );

      expect(share.visualizado).toBe(1);
      expect(share.data_visualizacao).toBeDefined();
    });
  });

  describe('DELETE /api/exames/:id/share/:shareId', () => {
    let examId;
    let shareId;

    beforeEach(async () => {
      // Criar exame e compartilhamento de teste
      const examData = testHelpers.generateTestExam(userId);
      const examResult = await Database.run(
        'INSERT INTO exames (usuario_id, tipo_exame, descricao, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?, ?)',
        [examData.usuario_id, examData.tipo_exame, examData.descricao, examData.data_realizacao, examData.resultado, examData.status]
      );
      examId = examResult.id;

      // Compartilhar exame
      const shareResponse = await request(app)
        .post(`/api/exames/${examId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ crm: '123456-SP' });

      // Obter ID do compartilhamento
      const share = await Database.get(
        'SELECT id FROM compartilhamentos WHERE token = ?',
        [shareResponse.body.token]
      );
      shareId = share.id;
    });

    test('Should revoke exam share', async () => {
      const response = await request(app)
        .delete(`/api/exames/${examId}/share/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('revogado');

      // Verificar se foi desativado no banco
      const share = await Database.get(
        'SELECT ativo FROM compartilhamentos WHERE id = ?',
        [shareId]
      );
      expect(share.ativo).toBe(0);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/exames/${examId}/share/${shareId}`)
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });

    test('Should prevent revoking other users shares', async () => {
      // Criar outro usuário
      const userData2 = {
        ...testHelpers.generateTestUser(),
        cpf: '98765432100',
        email: 'outro@teste.com'
      };
      await request(app)
        .post('/api/auth/register')
        .send(userData2);

      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send({ cpf: userData2.cpf, senha: userData2.senha });

      // Tentar revogar compartilhamento do primeiro usuário
      const response = await request(app)
        .delete(`/api/exames/${examId}/share/${shareId}`)
        .set('Authorization', `Bearer ${loginResponse2.body.token}`)
        .expect(403);

      testHelpers.validateErrorResponse(response, 403);
    });
  });

  describe('GET /api/exames/timeline', () => {
    beforeEach(async () => {
      // Criar múltiplos exames para timeline
      const examTypes = ['Hemograma', 'Colesterol', 'Glicemia'];
      for (const type of examTypes) {
        await Database.run(
          'INSERT INTO exames (usuario_id, tipo_exame, data_realizacao, resultado, status) VALUES (?, ?, ?, ?, ?)',
          [userId, type, '2024-01-15', 'Normal', 'concluido']
        );
      }
    });

    test('Should get clinical timeline data', async () => {
      const response = await request(app)
        .get('/api/exames/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.timeline).toBeDefined();
      expect(Array.isArray(response.body.timeline)).toBe(true);
    });

    test('Should filter timeline by exam type', async () => {
      const response = await request(app)
        .get('/api/exames/timeline')
        .query({ tipo: 'Hemograma' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      testHelpers.validateApiResponse(response, 200);
      expect(response.body.timeline).toBeDefined();
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .get('/api/exames/timeline')
        .expect(401);

      testHelpers.validateErrorResponse(response, 401);
    });
  });
});