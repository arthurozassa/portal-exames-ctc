describe('Basic Test', () => {
  it('should load the login page', () => {
    cy.visit('/login')
    cy.contains('Portal de Exames CTC')
  })
})