import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Simple fetch mock for testing without MSW
global.fetch = vi.fn()

// Configurar ambiente de teste
beforeAll(() => {
  
  // Mock de localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  global.localStorage = localStorageMock
  
  // Mock de sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  global.sessionStorage = sessionStorageMock
  
  // Mock de window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  
  // Mock de IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
  
  // Mock de ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
  
  // Mock de HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn()
  
  // Mock de URL.createObjectURL
  global.URL.createObjectURL = vi.fn()
  global.URL.revokeObjectURL = vi.fn()
})

// Limpeza após cada teste
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Limpeza final
afterAll(() => {
  // Clean up any remaining mocks
})

// Helpers globais para testes
global.testHelpers = {
  // Dados de teste
  mockUser: {
    id: 1,
    cpf: '12345678900',
    nome: 'João Silva',
    email: 'joao@teste.com',
    telefone: '11999999999'
  },
  
  mockExam: {
    id: 1,
    tipo_exame: 'Hemograma',
    descricao: 'Exame de sangue completo',
    data_realizacao: '2024-01-15',
    resultado: 'Normal',
    status: 'concluido'
  },
  
  mockDoctor: {
    id: 1,
    nome: 'Dr. Maria Santos',
    crm: '123456-SP',
    especialidade: 'Cardiologia',
    email: 'dra.maria@teste.com'
  },
  
  // Funções utilitárias
  waitForLoadingToFinish: async () => {
    const { waitForElementToBeRemoved } = await import('@testing-library/react')
    await waitForElementToBeRemoved(
      () => document.querySelector('[data-testid="loading"]'),
      { timeout: 3000 }
    )
  },
  
  // Mock de token JWT
  mockToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwNjE4NDAwMCwiZXhwIjoxNzA2MTg3NjAwfQ.test-signature',
  
  // Simular autenticação
  simulateAuth: () => {
    localStorage.setItem('token', global.testHelpers.mockToken)
    localStorage.setItem('user', JSON.stringify(global.testHelpers.mockUser))
  },
  
  // Limpar autenticação
  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  
  // Simular erro de rede
  simulateNetworkError: () => {
    global.fetch.mockRejectedValue(new Error('Network error'))
  }
}

// Configurar console para testes mais limpos
const originalError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return
  }
  originalError.call(console, ...args)
}