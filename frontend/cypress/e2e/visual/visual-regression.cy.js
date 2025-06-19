describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should match login page screenshot', () => {
    cy.get('[data-cy="portal-title"]').should('be.visible')
    cy.compareSnapshot('login-page')
  })

  it('should match 2FA page screenshot', () => {
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    cy.get('[data-cy="login-button"]').click()
    
    cy.get('[data-cy="2fa-input"]').should('be.visible')
    cy.compareSnapshot('2fa-page')
  })

  it('should match error state screenshot', () => {
    cy.get('[data-cy="login-button"]').click()
    
    cy.get('[data-cy="cpf-error"]').should('be.visible')
    cy.compareSnapshot('login-error-state')
  })

  it('should match loading state screenshot', () => {
    cy.intercept('POST', '**/auth/login', (req) => {
      req.reply((res) => {
        res.delay(2000)
        return res
      })
    })
    
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    cy.get('[data-cy="login-button"]').click()
    
    cy.get('[data-cy="login-button"]').should('contain.text', 'Entrando...')
    cy.compareSnapshot('login-loading-state')
  })

  it('should match dark mode if implemented', () => {
    // If dark mode is implemented
    cy.get('body').invoke('addClass', 'dark')
    cy.compareSnapshot('login-page-dark')
  })
})