import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:3001/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json()
    
    if (body.cpf === '12345678900' && body.senha === 'teste123') {
      return HttpResponse.json({
        success: true,
        message: 'Login realizado com sucesso. Insira o código 2FA.',
        requires2FA: true,
        tempToken: 'temp-token-123',
        user: global.testHelpers.mockUser
      })
    }
    
    if (body.cpf === '99999999999') {
      return HttpResponse.json({
        success: false,
        message: 'CPF não encontrado. Verifique e tente novamente.'
      }, { status: 401 })
    }
    
    if (body.senha === 'senhaerrada') {
      return HttpResponse.json({
        success: false,
        message: 'Senha inválida. Tente novamente.'
      }, { status: 401 })
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Login realizado com sucesso. Insira o código 2FA.',
      requires2FA: true,
      tempToken: 'temp-token-123',
      user: global.testHelpers.mockUser
    })
  }),

  http.post(`${API_BASE_URL}/auth/verify-2fa`, async ({ request }) => {
    const body = await request.json()
    
    if (body.token === '123456') {
      return HttpResponse.json({
        success: true,
        message: 'Autenticação realizada com sucesso',
        token: global.testHelpers.mockToken,
        user: global.testHelpers.mockUser
      })
    }
    
    if (body.token === '000000') {
      return HttpResponse.json({
        success: false,
        message: 'O código informado está incorreto.'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: false,
      message: 'Este código expirou. Solicite um novo para continuar.'
    }, { status: 400 })
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json()
    
    if (body.cpf === '12345678900') {
      return HttpResponse.json({
        success: false,
        message: 'CPF já cadastrado'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: 2,
        cpf: body.cpf,
        nome: body.nome,
        email: body.email
      }
    }, { status: 201 })
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json()
    
    if (body.cpf === '99999999999') {
      return HttpResponse.json({
        success: false,
        message: 'Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.'
      }, { status: 404 })
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Um código de recuperação foi enviado para o seu celular/e-mail cadastrado.'
    })
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json()
    
    if (body.token === 'invalid-token') {
      return HttpResponse.json({
        success: false,
        message: 'O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Senha alterada com sucesso. Você já pode fazer login com a nova senha.'
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  }),

  // Exams endpoints
  http.get(`${API_BASE_URL}/exames`, ({ request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get('page') || 1
    const limit = url.searchParams.get('limit') || 10
    
    const mockExams = [
      { ...global.testHelpers.mockExam, id: 1 },
      { ...global.testHelpers.mockExam, id: 2, tipo_exame: 'Colesterol' },
      { ...global.testHelpers.mockExam, id: 3, tipo_exame: 'Glicemia' }
    ]
    
    return HttpResponse.json({
      success: true,
      exames: mockExams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockExams.length,
        totalPages: Math.ceil(mockExams.length / limit)
      }
    })
  }),

  http.get(`${API_BASE_URL}/exames/:id`, ({ params }) => {
    const { id } = params
    
    if (id === '999') {
      return HttpResponse.json({
        success: false,
        message: 'Exame não encontrado'
      }, { status: 404 })
    }
    
    return HttpResponse.json({
      success: true,
      exame: { ...global.testHelpers.mockExam, id: parseInt(id) }
    })
  }),

  http.post(`${API_BASE_URL}/exames/:id/share`, ({ params }) => {
    const { id } = params
    
    return HttpResponse.json({
      success: true,
      message: 'Exame compartilhado com sucesso',
      token: 'share-token-123',
      dataExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }),

  http.get(`${API_BASE_URL}/exames/:id/shared`, ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    
    if (token === 'invalid-token') {
      return HttpResponse.json({
        success: false,
        message: 'Token inválido ou expirado'
      }, { status: 403 })
    }
    
    return HttpResponse.json({
      success: true,
      exame: global.testHelpers.mockExam,
      paciente: global.testHelpers.mockUser,
      medico: global.testHelpers.mockDoctor
    })
  }),

  http.delete(`${API_BASE_URL}/exames/:id/share/:shareId`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Compartilhamento revogado com sucesso'
    })
  }),

  http.get(`${API_BASE_URL}/exames/timeline`, ({ request }) => {
    const url = new URL(request.url)
    const tipo = url.searchParams.get('tipo')
    
    const timelineData = [
      {
        data: '2024-01-15',
        tipo_exame: 'Hemograma',
        valor: 12.5,
        referencia: '10-15',
        status: 'normal'
      },
      {
        data: '2024-01-10',
        tipo_exame: 'Colesterol',
        valor: 180,
        referencia: '<200',
        status: 'normal'
      },
      {
        data: '2024-01-05',
        tipo_exame: 'Glicemia',
        valor: 95,
        referencia: '70-100',
        status: 'normal'
      }
    ]
    
    const filteredData = tipo 
      ? timelineData.filter(item => item.tipo_exame === tipo)
      : timelineData
    
    return HttpResponse.json({
      success: true,
      timeline: filteredData
    })
  }),

  // Doctors endpoints
  http.get(`${API_BASE_URL}/medicos`, () => {
    return HttpResponse.json({
      success: true,
      medicos: [global.testHelpers.mockDoctor]
    })
  }),

  // Health check
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      success: true,
      message: 'API funcionando corretamente',
      timestamp: new Date().toISOString()
    })
  }),

  // Generic error handler
  http.get('*', () => {
    return HttpResponse.json({
      success: false,
      message: 'Endpoint não encontrado'
    }, { status: 404 })
  })
]