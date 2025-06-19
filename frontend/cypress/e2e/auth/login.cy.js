describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/login')
  })

  describe('Login Form', () => {
    it('should render login form correctly', () => {
      // Check page elements
      cy.get('h2').should('contain.text', 'Entrar')
      cy.get('[data-cy="portal-title"]').should('contain.text', 'Portal de Exames CTC')
      
      // Check form fields
      cy.get('[data-cy="cpf-input"]').should('be.visible')
      cy.get('[data-cy="password-input"]').should('be.visible')
      cy.get('[data-cy="login-button"]').should('be.visible')
      cy.get('[data-cy="forgot-password-link"]').should('be.visible')
    })

    it('should validate empty form submission', () => {
      cy.get('[data-cy="login-button"]').click()
      
      // Check validation errors
      cy.get('[data-cy="cpf-error"]').should('contain.text', 'CPF é obrigatório')
      cy.get('[data-cy="password-error"]').should('contain.text', 'Senha é obrigatória')
    })

    it('should validate CPF format', () => {
      cy.get('[data-cy="cpf-input"]').type('123')
      cy.get('[data-cy="login-button"]').click()
      
      cy.get('[data-cy="cpf-error"]').should('contain.text', 'CPF deve ter 11 dígitos')
    })

    it('should format CPF correctly while typing', () => {
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="cpf-input"]').should('have.value', '123.456.789-00')
    })

    it('should toggle password visibility', () => {
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password')
      cy.get('[data-cy="toggle-password"]').click()
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text')
      cy.get('[data-cy="toggle-password"]').click()
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password')
    })
  })

  describe('Authentication Flow', () => {
    it('should handle successful login with 2FA', () => {
      // Fill login form
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Should show 2FA form
      cy.get('h2').should('contain.text', 'Verificação 2FA')
      cy.get('[data-cy="2fa-input"]').should('be.visible')
      cy.get('[data-cy="verify-button"]').should('be.visible')

      // Enter 2FA code
      cy.get('[data-cy="2fa-input"]').type('123456')
      cy.get('[data-cy="verify-button"]').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
    })

    it('should handle invalid credentials', () => {
      cy.get('[data-cy="cpf-input"]').type('99999999999')
      cy.get('[data-cy="password-input"]').type('wrongpassword')
      cy.get('[data-cy="login-button"]').click()

      // Should show error message
      cy.get('[data-cy="error-alert"]').should('contain.text', 'CPF não encontrado')
    })

    it('should handle invalid 2FA code', () => {
      // First login
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Enter invalid 2FA code
      cy.get('[data-cy="2fa-input"]').type('000000')
      cy.get('[data-cy="verify-button"]').click()

      // Should show error
      cy.get('[data-cy="error-alert"]').should('contain.text', 'código informado está incorreto')
    })

    it('should handle expired 2FA code', () => {
      // First login
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Enter expired 2FA code
      cy.get('[data-cy="2fa-input"]').type('999999')
      cy.get('[data-cy="verify-button"]').click()

      // Should show expiration error
      cy.get('[data-cy="error-alert"]').should('contain.text', 'código expirou')
    })

    it('should allow going back from 2FA to login', () => {
      // First login
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Go back to login
      cy.get('[data-cy="back-to-login"]').click()

      // Should be back on login form
      cy.get('h2').should('contain.text', 'Entrar')
      cy.get('[data-cy="cpf-input"]').should('be.visible')
    })

    it('should handle resending 2FA code', () => {
      // First login
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Click resend
      cy.get('[data-cy="resend-code"]').click()

      // Should show success message or handle resend (mocked)
      // This would depend on how the resend functionality is implemented
    })
  })

  describe('Navigation', () => {
    it('should navigate to forgot password', () => {
      cy.get('[data-cy="forgot-password-link"]').click()
      cy.url().should('include', '/forgot-password')
    })

    it('should redirect authenticated users to dashboard', () => {
      // Mock authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: '1',
          nome: 'João Silva',
          cpf: '12345678900'
        }))
      })
      
      cy.visit('/login')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab through form elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-cy', 'cpf-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'password-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'login-button')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'forgot-password-link')
    })

    it('should submit form with Enter key', () => {
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123{enter}')

      // Should proceed to 2FA
      cy.get('h2').should('contain.text', 'Verificação 2FA')
    })

    it('should have proper ARIA attributes', () => {
      cy.get('[data-cy="cpf-input"]').should('have.attr', 'aria-required', 'true')
      cy.get('[data-cy="password-input"]').should('have.attr', 'aria-required', 'true')
      
      // Test validation ARIA
      cy.get('[data-cy="login-button"]').click()
      cy.get('[data-cy="cpf-input"]').should('have.attr', 'aria-invalid', 'true')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.testMobile(() => {
        cy.get('[data-cy="cpf-input"]').should('be.visible')
        cy.get('[data-cy="password-input"]').should('be.visible')
        cy.get('[data-cy="login-button"]').should('be.visible')
      })
    })

    it('should work across different screen sizes', () => {
      cy.testResponsive((viewport) => {
        cy.get('[data-cy="cpf-input"]').should('be.visible')
        cy.get('[data-cy="password-input"]').should('be.visible')
        cy.get('[data-cy="login-button"]').should('be.visible')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during login', () => {
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      
      // Simulate slow network
      cy.simulateSlowNetwork()
      
      cy.get('[data-cy="login-button"]').click()
      
      // Check loading state
      cy.get('[data-cy="login-button"]').should('contain.text', 'Entrando...')
      cy.get('[data-cy="login-button"]').should('be.disabled')
    })

    it('should show loading state during 2FA verification', () => {
      // First login
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="login-button"]').click()

      // Simulate slow network for 2FA
      cy.simulateSlowNetwork()
      
      cy.get('[data-cy="2fa-input"]').type('123456')
      cy.get('[data-cy="verify-button"]').click()
      
      // Check loading state
      cy.get('[data-cy="verify-button"]').should('contain.text', 'Verificando...')
      cy.get('[data-cy="verify-button"]').should('be.disabled')
    })
  })
})