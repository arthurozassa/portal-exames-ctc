describe('Mobile Responsive Tests', () => {
  const devices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 }
  ]

  devices.forEach(device => {
    describe(`${device.name} (${device.width}x${device.height})`, () => {
      beforeEach(() => {
        cy.viewport(device.width, device.height)
        cy.visit('/login')
      })

      it('should display login form correctly', () => {
        cy.get('[data-cy="cpf-input"]').should('be.visible')
        cy.get('[data-cy="password-input"]').should('be.visible')
        cy.get('[data-cy="login-button"]').should('be.visible')
        cy.get('[data-cy="forgot-password-link"]').should('be.visible')
      })

      it('should handle form interaction on mobile', () => {
        cy.get('[data-cy="cpf-input"]').tap().type('12345678900')
        cy.get('[data-cy="password-input"]').tap().type('teste123')
        cy.get('[data-cy="login-button"]').tap()
        
        cy.get('[data-cy="2fa-input"]').should('be.visible')
      })

      it('should handle virtual keyboard properly', () => {
        cy.get('[data-cy="cpf-input"]').focus()
        
        // Check if form adjusts when virtual keyboard appears
        cy.get('[data-cy="login-button"]').should('be.visible')
        
        // Test scrolling if needed
        if (device.height < 700) {
          cy.get('[data-cy="login-button"]').scrollIntoView()
        }
      })

      it('should handle orientation change', () => {
        // Portrait
        cy.viewport(device.width, device.height)
        cy.get('[data-cy="cpf-input"]').should('be.visible')
        
        // Landscape
        cy.viewport(device.height, device.width)
        cy.get('[data-cy="cpf-input"]').should('be.visible')
        cy.get('[data-cy="login-button"]').should('be.visible')
      })

      it('should handle touch gestures', () => {
        // Test swipe if navigation exists
        cy.get('body').trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        cy.get('body').trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
        cy.get('body').trigger('touchend')
        
        // Should still be on login page
        cy.get('[data-cy="cpf-input"]').should('be.visible')
      })

      it('should maintain accessibility on mobile', () => {
        cy.get('[data-cy="cpf-input"]').should('have.attr', 'aria-required', 'true')
        cy.get('[data-cy="password-input"]').should('have.attr', 'aria-required', 'true')
        
        // Test large touch targets (minimum 44px)
        cy.get('[data-cy="login-button"]').then($el => {
          const rect = $el[0].getBoundingClientRect()
          expect(rect.height).to.be.at.least(44)
        })
      })

      it('should handle offline state', () => {
        cy.intercept('POST', '**/auth/login', { forceNetworkError: true })
        
        cy.get('[data-cy="cpf-input"]').type('12345678900')
        cy.get('[data-cy="password-input"]').type('teste123')
        cy.get('[data-cy="login-button"]').click()
        
        // Should show appropriate error message
        cy.get('[data-cy="error-alert"]').should('contain.text', 'erro')
      })
    })
  })

  describe('Mobile-specific features', () => {
    beforeEach(() => {
      cy.viewport('iphone-x')
      cy.visit('/login')
    })

    it('should trigger mobile keyboard types', () => {
      // CPF input should trigger numeric keyboard
      cy.get('[data-cy="cpf-input"]')
        .should('have.attr', 'inputmode', 'numeric')
        .or('have.attr', 'type', 'tel')
    })

    it('should handle safe area insets', () => {
      // Check if content respects safe area
      cy.get('body').invoke('css', 'padding-top').should('not.equal', '0px')
    })

    it('should work with mobile browsers', () => {
      // Test different mobile browsers behavior
      cy.window().then(win => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(win.navigator.userAgent)
        if (isMobile) {
          cy.get('[data-cy="cpf-input"]').should('be.visible')
        }
      })
    })
  })
})