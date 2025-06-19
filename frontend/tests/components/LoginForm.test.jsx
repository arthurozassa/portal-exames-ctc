import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from '@/components/forms/LoginForm'
import { AuthProvider } from '@/contexts/AuthContext'

// Wrapper para testes com contexto
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('LoginForm Component', () => {
  const mockOnLogin = vi.fn()
  const mockOnForgotPassword = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderLoginForm = (props = {}) => {
    return render(
      <TestWrapper>
        <LoginForm 
          onLogin={mockOnLogin}
          onForgotPassword={mockOnForgotPassword}
          {...props}
        />
      </TestWrapper>
    )
  }

  test('Should render login form with all required fields', () => {
    renderLoginForm()
    
    // Verificar se todos os campos estão presentes
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByText(/esqueci minha senha/i)).toBeInTheDocument()
  })

  test('Should display validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    // Verificar se mensagens de erro aparecem
    await waitFor(() => {
      expect(screen.getByText(/CPF é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/Senha é obrigatória/i)).toBeInTheDocument()
    })
  })

  test('Should validate CPF format', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    await user.type(cpfInput, '123')
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/CPF deve ter 11 dígitos/i)).toBeInTheDocument()
    })
  })

  test('Should format CPF input correctly', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    await user.type(cpfInput, '12345678900')
    
    // Verificar se o CPF foi formatado
    expect(cpfInput.value).toBe('123.456.789-00')
  })

  test('Should submit form with valid data', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(cpfInput, '12345678900')
    await user.type(passwordInput, 'teste123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        cpf: '12345678900',
        senha: 'teste123'
      })
    })
  })

  test('Should show loading state during submission', async () => {
    const user = userEvent.setup()
    renderLoginForm({ loading: true })
    
    const submitButton = screen.getByRole('button', { name: /entrando/i })
    
    // Verificar se o botão está desabilitado e mostra loading
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/entrando/i)).toBeInTheDocument()
  })

  test('Should display error message when login fails', () => {
    const errorMessage = 'CPF não encontrado. Verifique e tente novamente.'
    renderLoginForm({ error: errorMessage })
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  test('Should call forgot password handler', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const forgotPasswordLink = screen.getByText(/esqueci minha senha/i)
    await user.click(forgotPasswordLink)
    
    expect(mockOnForgotPassword).toHaveBeenCalled()
  })

  test('Should toggle password visibility', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i })
    
    // Inicialmente senha deve estar oculta
    expect(passwordInput.type).toBe('password')
    
    // Clicar para mostrar senha
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    // Clicar novamente para ocultar
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  test('Should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    // Navegar com Tab
    await user.tab()
    expect(cpfInput).toHaveFocus()
    
    await user.tab()
    expect(passwordInput).toHaveFocus()
    
    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  test('Should submit form with Enter key', async () => {
    const user = userEvent.setup()
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    
    await user.type(cpfInput, '12345678900')
    await user.type(passwordInput, 'teste123')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        cpf: '12345678900',
        senha: 'teste123'
      })
    })
  })

  test('Should clear form when reset', () => {
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    
    // Preencher campos
    fireEvent.change(cpfInput, { target: { value: '12345678900' } })
    fireEvent.change(passwordInput, { target: { value: 'teste123' } })
    
    // Simular reset
    fireEvent.reset(cpfInput.closest('form'))
    
    expect(cpfInput.value).toBe('')
    expect(passwordInput.value).toBe('')
  })

  test('Should be accessible with screen readers', () => {
    renderLoginForm()
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    // Verificar atributos de acessibilidade
    expect(cpfInput).toHaveAttribute('aria-required', 'true')
    expect(passwordInput).toHaveAttribute('aria-required', 'true')
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  test('Should display appropriate error messages based on error code', () => {
    const errorCodes = [
      { code: 'USER_NOT_FOUND', message: 'CPF não encontrado. Verifique e tente novamente.' },
      { code: 'INVALID_PASSWORD', message: 'Senha inválida. Tente novamente.' },
      { code: 'ACCOUNT_LOCKED', message: 'Conta temporariamente bloqueada.' }
    ]
    
    errorCodes.forEach(({ code, message }) => {
      const { rerender } = renderLoginForm({ error: message, errorCode: code })
      
      expect(screen.getByText(message)).toBeInTheDocument()
      
      // Rerender para próximo teste
      rerender(
        <TestWrapper>
          <LoginForm onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />
        </TestWrapper>
      )
    })
  })

  test('Should prevent multiple submissions', async () => {
    const user = userEvent.setup()
    renderLoginForm({ loading: true })
    
    const cpfInput = screen.getByLabelText(/CPF/i)
    const passwordInput = screen.getByLabelText(/^Senha$/i)
    const submitButton = screen.getByRole('button', { name: /entrando/i })
    
    await user.type(cpfInput, '12345678900')
    await user.type(passwordInput, 'teste123')
    
    // Deve ter sido chamado zero vezes porque está em loading
    expect(mockOnLogin).toHaveBeenCalledTimes(0)
    expect(submitButton).toBeDisabled()
  })
})