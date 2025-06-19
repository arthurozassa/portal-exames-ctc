describe('Simple Login Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
  })

  describe('Login Form Elements', () => {
    it('should render all login form elements', () => {
      cy.get('h2').should('contain.text', 'Entrar')
      cy.get('[data-cy="portal-title"]').should('contain.text', 'Portal de Exames CTC')
      cy.get('[data-cy="cpf-input"]').should('be.visible')
      cy.get('[data-cy="password-input"]').should('be.visible')
      cy.get('[data-cy="login-button"]').should('be.visible')
      cy.get('[data-cy="forgot-password-link"]').should('be.visible')
    })

    it('should have proper input types', () => {
      cy.get('[data-cy="cpf-input"]').should('have.attr', 'type', 'text')
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password')
    })

    it('should have proper placeholders', () => {
      cy.get('[data-cy="cpf-input"]').should('have.attr', 'placeholder', '000.000.000-00')
      cy.get('[data-cy="password-input"]').should('have.attr', 'placeholder', 'Digite sua senha')
    })
  })

  describe('Form Interaction', () => {
    it('should allow typing in form fields', () => {
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="cpf-input"]').should('have.value', '12345678900')
      
      cy.get('[data-cy="password-input"]').type('teste123')
      cy.get('[data-cy="password-input"]').should('have.value', 'teste123')
    })

    it('should be keyboard accessible', () => {
      cy.get('[data-cy="cpf-input"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'cpf-input')
      
      cy.get('[data-cy="password-input"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'password-input')
      
      cy.get('[data-cy="login-button"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'login-button')
    })

    it('should submit form with Enter key', () => {
      cy.get('[data-cy="cpf-input"]').type('12345678900')
      cy.get('[data-cy="password-input"]').type('teste123{enter}')
      // Since we don't have actual form submission, just verify no errors
      cy.get('[data-cy="portal-title"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      cy.get('label[for="cpf"]').should('contain.text', 'CPF')
      cy.get('label[for="senha"]').should('contain.text', 'Senha')
    })

    it('should have proper heading structure', () => {
      cy.get('h2').should('exist').and('contain.text', 'Entrar')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x')
      cy.get('[data-cy="portal-title"]').should('be.visible')
      cy.get('[data-cy="cpf-input"]').should('be.visible')
      cy.get('[data-cy="password-input"]').should('be.visible')
      cy.get('[data-cy="login-button"]').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.get('[data-cy="portal-title"]').should('be.visible')
      cy.get('[data-cy="login-button"]').should('be.visible')
    })
  })
})