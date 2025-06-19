describe('Login Page Accessibility', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.injectAxe()
  })

  it('should not have any accessibility violations', () => {
    cy.checkA11y()
  })

  it('should not have any accessibility violations in 2FA step', () => {
    // Navigate to 2FA step
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    cy.get('[data-cy="login-button"]').click()
    
    cy.get('[data-cy="2fa-input"]').should('be.visible')
    cy.checkA11y()
  })

  it('should be keyboard accessible', () => {
    // Test tab navigation
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-cy', 'cpf-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-cy', 'password-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-cy', 'login-button')
  })

  it('should have proper ARIA labels', () => {
    cy.get('[data-cy="cpf-input"]')
      .should('have.attr', 'aria-required', 'true')
      .should('have.attr', 'aria-invalid', 'false')
    
    cy.get('[data-cy="password-input"]')
      .should('have.attr', 'aria-required', 'true')
      .should('have.attr', 'aria-invalid', 'false')
      
    cy.get('[data-cy="toggle-password"]')
      .should('have.attr', 'aria-label')
  })

  it('should show validation errors with proper ARIA', () => {
    cy.get('[data-cy="login-button"]').click()
    
    // Check error messages have proper role
    cy.get('[data-cy="cpf-error"]')
      .should('be.visible')
      .should('have.attr', 'role', 'alert')
      
    cy.get('[data-cy="password-error"]')
      .should('be.visible')
      .should('have.attr', 'role', 'alert')
      
    // Check inputs are marked as invalid
    cy.get('[data-cy="cpf-input"]')
      .should('have.attr', 'aria-invalid', 'true')
      
    cy.get('[data-cy="password-input"]')
      .should('have.attr', 'aria-invalid', 'true')
  })

  it('should have proper heading structure', () => {
    cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
      const headings = Array.from($headings).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent
      }))
      
      // Should have proper heading hierarchy
      expect(headings[0].level).to.equal(2) // Main heading
      expect(headings[0].text).to.contain('Entrar')
    })
  })

  it('should have sufficient color contrast', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  it('should work with screen readers', () => {
    // Test landmarks
    cy.get('main, [role="main"]').should('exist')
    
    // Test form structure
    cy.get('form').should('exist')
    cy.get('label[for="cpf"]').should('exist')
    cy.get('label[for="senha"]').should('exist')
  })

  it('should handle focus management correctly', () => {
    // Test initial focus
    cy.get('[data-cy="cpf-input"]').focus().should('be.focused')
    
    // Test focus after error
    cy.get('[data-cy="login-button"]').click()
    cy.get('[data-cy="cpf-input"]').should('be.focused')
  })

  it('should support high contrast mode', () => {
    // Simulate high contrast mode
    cy.get('body').invoke('attr', 'style', 'filter: contrast(200%)')
    cy.checkA11y()
  })

  it('should work at 200% zoom', () => {
    cy.viewport(640, 480) // Simulate 200% zoom on 1280x960
    cy.checkA11y()
    
    // Ensure all elements are still accessible
    cy.get('[data-cy="cpf-input"]').should('be.visible')
    cy.get('[data-cy="password-input"]').should('be.visible')
    cy.get('[data-cy="login-button"]').should('be.visible')
  })
})