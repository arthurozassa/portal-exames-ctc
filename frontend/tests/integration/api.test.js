import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock API responses
const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { cpf, password } = await request.json()
    
    if (cpf === '12345678900' && password === '1234') {
      return HttpResponse.json({
        success: true,
        user: {
          id: 1,
          name: 'João Silva',
          cpf: '12345678900',
          email: 'joao@email.com'
        },
        token: 'mock-jwt-token',
        requiresTwoFactor: true
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'CPF não encontrado. Verifique e tente novamente.' },
      { status: 401 }
    )
  }),

  http.post('/api/auth/verify-2fa', async ({ request }) => {
    const { token } = await request.json()
    
    if (token === '123456') {
      return HttpResponse.json({
        success: true,
        token: 'verified-jwt-token'
      })
    }
    
    if (token === '999999') {
      return HttpResponse.json(
        { success: false, message: 'Este código expirou. Solicite um novo para continuar.' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(
      { success: false, message: 'O código informado está incorreto.' },
      { status: 400 }
    )
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const { cpf } = await request.json()
    
    if (cpf === '12345678900') {
      return HttpResponse.json({
        success: true,
        message: 'Código de recuperação enviado.'
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Não encontramos esse CPF em nossa base.' },
      { status: 404 }
    )
  }),

  // Exams endpoints
  http.get('/api/exams', ({ request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '10'
    
    return HttpResponse.json({
      success: true,
      data: {
        exams: [
          {
            id: 1,
            type: 'Hemograma Completo',
            date: '2024-01-15',
            status: 'Concluído',
            unit: 'Unidade Centro',
            hasReport: true,
            hasPACS: false
          },
          {
            id: 2,
            type: 'Raio-X Tórax',
            date: '2024-01-10',
            status: 'Pendente',
            unit: 'Unidade Norte',
            hasReport: false,
            hasPACS: true
          }
        ],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 15,
          pages: 2
        }
      }
    })
  }),

  http.get('/api/exams/:id', ({ params }) => {
    const { id } = params
    
    if (id === '1') {
      return HttpResponse.json({
        success: true,
        data: {
          id: 1,
          type: 'Hemograma Completo',
          date: '2024-01-15',
          status: 'Concluído',
          unit: 'Unidade Centro',
          doctor: 'Dr. Carlos Santos',
          results: {
            hemoglobin: '14.2 g/dL',
            hematocrit: '42.5%',
            leukocytes: '7.200/mm³'
          },
          reportUrl: '/api/exams/1/report.pdf',
          hasReport: true,
          hasPACS: false
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Exame não encontrado.' },
      { status: 404 }
    )
  }),

  // Sharing endpoints
  http.post('/api/exams/:id/share', async ({ params, request }) => {
    const { id } = params
    const { doctorCRM, expirationDays } = await request.json()
    
    if (!doctorCRM) {
      return HttpResponse.json(
        { success: false, message: 'CRM do médico é obrigatório.' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        shareId: `share-${id}-${Date.now()}`,
        shareUrl: `https://portal.examestc.com/shared/${id}?token=abc123`,
        expiresAt: new Date(Date.now() + (expirationDays || 7) * 24 * 60 * 60 * 1000).toISOString()
      }
    })
  }),

  http.get('/api/shared-exams', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          examId: 1,
          examType: 'Hemograma Completo',
          doctorCRM: '12345-SP',
          doctorName: 'Dr. Carlos Santos',
          shareUrl: 'https://portal.examestc.com/shared/1?token=abc123',
          createdAt: '2024-01-15T10:00:00Z',
          expiresAt: '2024-01-22T10:00:00Z',
          status: 'active'
        }
      ]
    })
  }),

  // Timeline endpoints
  http.get('/api/timeline', ({ request }) => {
    const url = new URL(request.url)
    const examType = url.searchParams.get('type')
    
    const timelineData = {
      'hemograma': [
        { date: '2024-01-15', value: 14.2, reference: '12-16 g/dL', metric: 'Hemoglobina' },
        { date: '2023-12-15', value: 13.8, reference: '12-16 g/dL', metric: 'Hemoglobina' },
        { date: '2023-11-15', value: 13.5, reference: '12-16 g/dL', metric: 'Hemoglobina' }
      ],
      'colesterol': [
        { date: '2024-01-15', value: 180, reference: '<200 mg/dL', metric: 'Colesterol Total' },
        { date: '2023-12-15', value: 195, reference: '<200 mg/dL', metric: 'Colesterol Total' },
        { date: '2023-11-15', value: 210, reference: '<200 mg/dL', metric: 'Colesterol Total' }
      ]
    }
    
    return HttpResponse.json({
      success: true,
      data: timelineData[examType] || []
    })
  }),

  // User management
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: 'João Silva',
        cpf: '12345678900',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        birthDate: '1990-05-15',
        lastLogin: '2024-01-15T10:00:00Z'
      }
    })
  }),

  http.put('/api/user/profile', async ({ request }) => {
    const updates = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: updates.name || 'João Silva',
        email: updates.email || 'joao@email.com',
        phone: updates.phone || '(11) 99999-9999'
      }
    })
  }),

  // Error simulation
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    )
  })
]

// Setup MSW server
const server = setupServer(...handlers)

describe('API Integration Tests', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    server.resetHandlers()
  })

  describe('Authentication API', () => {
    test('should login with valid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '12345678900',
          password: '1234'
        })
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.name).toBe('João Silva')
      expect(data.requiresTwoFactor).toBe(true)
      expect(data.token).toBeTruthy()
    })

    test('should reject invalid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '99999999999',
          password: 'wrong'
        })
      })

      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toContain('CPF não encontrado')
    })

    test('should verify 2FA with correct token', async () => {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: '123456'
        })
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.token).toBe('verified-jwt-token')
    })

    test('should reject expired 2FA token', async () => {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: '999999'
        })
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('código expirou')
    })

    test('should handle password recovery', async () => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '12345678900'
        })
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Código de recuperação enviado')
    })
  })

  describe('Exams API', () => {
    test('should fetch exams list with pagination', async () => {
      const response = await fetch('/api/exams?page=1&limit=10')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data.exams)).toBe(true)
      expect(data.data.exams).toHaveLength(2)
      expect(data.data.pagination.page).toBe(1)
      expect(data.data.pagination.total).toBe(15)
    })

    test('should fetch specific exam details', async () => {
      const response = await fetch('/api/exams/1')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(1)
      expect(data.data.type).toBe('Hemograma Completo')
      expect(data.data.results).toBeDefined()
      expect(data.data.results.hemoglobin).toBe('14.2 g/dL')
    })

    test('should handle exam not found', async () => {
      const response = await fetch('/api/exams/999')
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Exame não encontrado')
    })

    test('should share exam with doctor', async () => {
      const response = await fetch('/api/exams/1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorCRM: '12345-SP',
          expirationDays: 7
        })
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.shareUrl).toBeTruthy()
      expect(data.data.shareId).toBeTruthy()
      expect(data.data.expiresAt).toBeTruthy()
    })

    test('should validate required fields for sharing', async () => {
      const response = await fetch('/api/exams/1/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expirationDays: 7
        })
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('CRM do médico é obrigatório')
    })

    test('should fetch shared exams list', async () => {
      const response = await fetch('/api/shared-exams')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data[0].doctorCRM).toBe('12345-SP')
      expect(data.data[0].status).toBe('active')
    })
  })

  describe('Timeline API', () => {
    test('should fetch hemograma timeline data', async () => {
      const response = await fetch('/api/timeline?type=hemograma')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data[0].metric).toBe('Hemoglobina')
      expect(data.data[0].value).toBe(14.2)
      expect(data.data[0].reference).toBe('12-16 g/dL')
    })

    test('should fetch colesterol timeline data', async () => {
      const response = await fetch('/api/timeline?type=colesterol')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].metric).toBe('Colesterol Total')
      expect(data.data[0].value).toBe(180)
    })

    test('should return empty array for unknown exam type', async () => {
      const response = await fetch('/api/timeline?type=unknown')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('User Profile API', () => {
    test('should fetch user profile', async () => {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('João Silva')
      expect(data.data.cpf).toBe('12345678900')
      expect(data.data.lastLogin).toBeTruthy()
    })

    test('should update user profile', async () => {
      const updates = {
        name: 'João Silva Santos',
        email: 'joao.santos@email.com'
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('João Silva Santos')
      expect(data.data.email).toBe('joao.santos@email.com')
    })
  })

  describe('Error Handling', () => {
    test('should handle server errors gracefully', async () => {
      const response = await fetch('/api/error-test')
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Erro interno do servidor')
    })

    test('should handle network timeouts', async () => {
      // Simulate timeout by delaying response
      server.use(
        http.get('/api/slow-endpoint', () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(HttpResponse.json({ success: true }))
            }, 6000) // 6 second delay
          })
        })
      )

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        await fetch('/api/slow-endpoint', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        throw new Error('Request should have been aborted')
      } catch (error) {
        clearTimeout(timeoutId)
        expect(error.name).toBe('AbortError')
      }
    })
  })

  describe('Data Validation', () => {
    test('should validate exam data structure', async () => {
      const response = await fetch('/api/exams/1')
      const data = await response.json()

      // Verify required fields are present
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('type')
      expect(data.data).toHaveProperty('date')
      expect(data.data).toHaveProperty('status')
      expect(data.data).toHaveProperty('unit')

      // Verify data types
      expect(typeof data.data.id).toBe('number')
      expect(typeof data.data.type).toBe('string')
      expect(typeof data.data.hasReport).toBe('boolean')
      expect(typeof data.data.hasPACS).toBe('boolean')

      // Verify date format
      expect(data.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('should validate timeline data structure', async () => {
      const response = await fetch('/api/timeline?type=hemograma')
      const data = await response.json()

      data.data.forEach(point => {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('value')
        expect(point).toHaveProperty('reference')
        expect(point).toHaveProperty('metric')
        
        expect(typeof point.value).toBe('number')
        expect(typeof point.metric).toBe('string')
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })
})