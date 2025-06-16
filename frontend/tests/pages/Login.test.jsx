import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '@/pages/Login'
import { AuthProvider } from '@/context/AuthContext'

// Mock do hook de navegação
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Wrapper para testes
const createTestWrapper = (initialEntries = ['/login']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.testHelpers.clearAuth()
  })

  test('Should render login page with correct title and form', () => {
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Verificar elementos principais
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByText(/portal de exames/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  test('Should handle successful login flow', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Preencher formulário
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar resposta da API
    await waitFor(() => {
      expect(screen.getByText(/insira o código 2FA/i)).toBeInTheDocument()
    })
    
    // Verificar se campo de 2FA apareceu
    expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    
    // Inserir código 2FA
    await user.type(screen.getByLabelText(/código de verificação/i), '123456')
    await user.click(screen.getByRole('button', { name: /verificar/i }))
    
    // Aguardar redirecionamento
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('Should handle login with invalid credentials', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Tentar login com CPF inválido
    await user.type(screen.getByLabelText(/CPF/i), '99999999999')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Verificar mensagem de erro
    await waitFor(() => {
      expect(screen.getByText(/CPF não encontrado/i)).toBeInTheDocument()
    })
    
    // Verificar se o formulário ainda está visível
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  test('Should handle invalid 2FA token', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Fazer login inicial
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar 2FA
    await waitFor(() => {
      expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    })
    
    // Inserir código inválido
    await user.type(screen.getByLabelText(/código de verificação/i), '000000')
    await user.click(screen.getByRole('button', { name: /verificar/i }))
    
    // Verificar mensagem de erro
    await waitFor(() => {
      expect(screen.getByText(/código informado está incorreto/i)).toBeInTheDocument()
    })
  })

  test('Should navigate to forgot password page', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    const forgotPasswordLink = screen.getByText(/esqueci minha senha/i)
    await user.click(forgotPasswordLink)
    
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })

  test('Should show loading state during login', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    // Verificar estado de loading
    expect(screen.getByText(/entrando/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  test('Should redirect if user is already authenticated', () => {
    global.testHelpers.simulateAuth()
    
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Deve redirecionar para dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  test('Should handle network errors gracefully', async () => {
    const user = userEvent.setup()
    global.testHelpers.simulateNetworkError()
    
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument()
    })
  })

  test('Should validate form fields', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Tentar submeter formulário vazio
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/CPF é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/Senha é obrigatória/i)).toBeInTheDocument()
    })
  })

  test('Should handle 2FA token expiration', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Fazer login inicial
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar 2FA
    await waitFor(() => {
      expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    })
    
    // Inserir código expirado (simulado)
    await user.type(screen.getByLabelText(/código de verificação/i), '999999')
    await user.click(screen.getByRole('button', { name: /verificar/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/código expirou/i)).toBeInTheDocument()
    })
    
    // Verificar se link para reenviar código está disponível
    expect(screen.getByText(/reenviar código/i)).toBeInTheDocument()
  })

  test('Should allow resending 2FA code', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Fazer login inicial
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar 2FA
    await waitFor(() => {
      expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    })
    
    // Clicar em reenviar código
    const resendButton = screen.getByText(/reenviar código/i)
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/novo código enviado/i)).toBeInTheDocument()
    })
  })

  test('Should be responsive on mobile devices', () => {
    // Simular viewport mobile
    global.innerWidth = 375
    global.innerHeight = 667
    
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Verificar se elementos principais estão visíveis
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    
    // Verificar se não há scroll horizontal
    const form = screen.getByRole('form') || screen.getByLabelText(/CPF/i).closest('form')
    expect(form).toHaveStyle({ maxWidth: '100%' })
  })

  test('Should maintain form state during 2FA flow', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    const cpfValue = '12345678900'
    const passwordValue = 'teste123'
    
    // Preencher formulário
    await user.type(screen.getByLabelText(/CPF/i), cpfValue)
    await user.type(screen.getByLabelText(/senha/i), passwordValue)
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar 2FA
    await waitFor(() => {
      expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    })
    
    // Verificar se dados do formulário inicial foram mantidos
    expect(screen.getByDisplayValue(cpfValue)).toBeInTheDocument()
    expect(screen.getByDisplayValue(passwordValue)).toBeInTheDocument()
  })

  test('Should handle browser back button during 2FA', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    render(<LoginPage />, { wrapper: TestWrapper })
    
    // Fazer login inicial
    await user.type(screen.getByLabelText(/CPF/i), '12345678900')
    await user.type(screen.getByLabelText(/senha/i), 'teste123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    
    // Aguardar 2FA
    await waitFor(() => {
      expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument()
    })
    
    // Simular voltar para tela de login
    const backButton = screen.getByRole('button', { name: /voltar/i })
    await user.click(backButton)
    
    // Verificar se voltou para formulário de login
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/código de verificação/i)).not.toBeInTheDocument()
  })
})