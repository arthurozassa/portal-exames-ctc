// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import 'cypress-axe'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configure Cypress for better testing
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that might come from React DevTools or other browser extensions
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  if (err.message.includes('Script error')) {
    return false
  }
  return true
})

// Set default options
before(() => {
  // Clear localStorage and sessionStorage before each test suite
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Set viewport
  cy.viewport(1280, 720)
})