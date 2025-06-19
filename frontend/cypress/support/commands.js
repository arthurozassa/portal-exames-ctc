// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (cpf = '12345678900', senha = 'teste123') => {
  cy.visit('/login')
  
  // Fill login form
  cy.get('[data-cy="cpf-input"]').type(cpf)
  cy.get('[data-cy="password-input"]').type(senha)
  cy.get('[data-cy="login-button"]').click()
  
  // Handle 2FA if required
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="2fa-input"]').length > 0) {
      cy.get('[data-cy="2fa-input"]').type('123456')
      cy.get('[data-cy="verify-2fa-button"]').click()
    }
  })
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard')
})

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Custom command for clearing app data
Cypress.Commands.add('clearAppData', () => {
  cy.clearLocalStorage()
  cy.clearCookies()
  cy.clearAllSessionStorage()
})

// Custom command for waiting for loading to finish
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist')
})

// Custom command for checking accessibility
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.checkA11y(context, options)
})

// Custom command for visual regression testing (placeholder)
Cypress.Commands.add('compareSnapshot', (name) => {
  // This would integrate with percy or similar for visual testing
  cy.screenshot(name)
  // cy.percySnapshot(name) // When percy is configured
})

// Custom command for intercepting API calls
Cypress.Commands.add('interceptAuth', () => {
  cy.intercept('POST', '**/auth/login', { fixture: 'auth/login-success.json' }).as('login')
  cy.intercept('POST', '**/auth/verify-2fa', { fixture: 'auth/2fa-success.json' }).as('verify2fa')
  cy.intercept('POST', '**/auth/logout', { statusCode: 200 }).as('logout')
})

Cypress.Commands.add('interceptExams', () => {
  cy.intercept('GET', '**/exams', { fixture: 'exams/list.json' }).as('getExams')
  cy.intercept('GET', '**/exams/*', { fixture: 'exams/details.json' }).as('getExamDetails')
})

// Custom command for filling CPF with formatting
Cypress.Commands.add('fillCPF', (selector, cpf) => {
  cy.get(selector).clear().type(cpf)
  // CPF should be automatically formatted
  const formatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  cy.get(selector).should('have.value', formatted)
})

// Custom command for checking form validation
Cypress.Commands.add('checkFormValidation', (selector, errorMessage) => {
  cy.get(selector).should('be.visible')
  cy.get(selector).should('contain.text', errorMessage)
})

// Custom command for mobile testing
Cypress.Commands.add('testMobile', (callback) => {
  cy.viewport('iphone-x')
  callback()
  cy.viewport(1280, 720) // Reset to desktop
})

// Custom command for testing responsiveness
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 320, height: 568 }, // iPhone SE
    { width: 768, height: 1024 }, // iPad
    { width: 1280, height: 720 }, // Desktop
    { width: 1920, height: 1080 } // Large Desktop
  ]
  
  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height)
    callback(viewport)
  })
})

// Command to simulate slow network
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(2000) // 2 second delay
      return res
    })
  })
})

// Command to check loading states
Cypress.Commands.add('checkLoadingState', (selector) => {
  cy.get(selector).should('contain.text', 'Carregando')
  cy.get(selector).should('be.disabled')
})