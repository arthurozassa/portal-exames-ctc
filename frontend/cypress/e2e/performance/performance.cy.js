describe('Performance Tests', () => {
  beforeEach(() => {
    // Start performance monitoring
    cy.window().then(win => {
      win.performance.mark('test-start')
    })
  })

  afterEach(() => {
    // End performance monitoring
    cy.window().then(win => {
      win.performance.mark('test-end')
      win.performance.measure('test-duration', 'test-start', 'test-end')
      
      const measures = win.performance.getEntriesByType('measure')
      const testDuration = measures.find(m => m.name === 'test-duration')
      
      if (testDuration) {
        cy.log(`Test duration: ${testDuration.duration}ms`)
      }
    })
  })

  it('should load login page within 2 seconds', () => {
    const start = Date.now()
    cy.visit('/login')
    
    cy.get('[data-cy="cpf-input"]').should('be.visible').then(() => {
      const loadTime = Date.now() - start
      expect(loadTime).to.be.lessThan(2000)
      cy.log(`Page load time: ${loadTime}ms`)
    })
  })

  it('should render components quickly', () => {
    cy.visit('/login')
    
    // Measure rendering time for each component
    cy.get('[data-cy="cpf-input"]').should('be.visible')
    cy.get('[data-cy="password-input"]').should('be.visible')
    cy.get('[data-cy="login-button"]').should('be.visible')
    
    // All components should be visible within 500ms
    cy.window().then(win => {
      const navigationStart = win.performance.timing.navigationStart
      const domContentLoaded = win.performance.timing.domContentLoadedEventEnd
      const renderTime = domContentLoaded - navigationStart
      
      expect(renderTime).to.be.lessThan(500)
      cy.log(`DOM render time: ${renderTime}ms`)
    })
  })

  it('should handle form interactions quickly', () => {
    cy.visit('/login')
    
    const start = Date.now()
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    
    const inputTime = Date.now() - start
    expect(inputTime).to.be.lessThan(1000)
    cy.log(`Form input time: ${inputTime}ms`)
  })

  it('should transition to 2FA quickly', () => {
    cy.visit('/login')
    
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    
    const start = Date.now()
    cy.get('[data-cy="login-button"]').click()
    
    cy.get('[data-cy="2fa-input"]').should('be.visible').then(() => {
      const transitionTime = Date.now() - start
      expect(transitionTime).to.be.lessThan(1000)
      cy.log(`2FA transition time: ${transitionTime}ms`)
    })
  })

  it('should not cause memory leaks', () => {
    cy.visit('/login')
    
    // Perform multiple interactions
    for (let i = 0; i < 10; i++) {
      cy.get('[data-cy="cpf-input"]').clear().type('12345678900')
      cy.get('[data-cy="password-input"]').clear().type('teste123')
      cy.get('[data-cy="toggle-password"]').click().click()
    }
    
    cy.window().then(win => {
      if (win.performance.memory) {
        const memoryInfo = win.performance.memory
        cy.log(`Memory used: ${memoryInfo.usedJSHeapSize / 1024 / 1024}MB`)
        
        // Should not use more than 50MB
        expect(memoryInfo.usedJSHeapSize).to.be.lessThan(50 * 1024 * 1024)
      }
    })
  })

  it('should handle slow network gracefully', () => {
    // Simulate slow 3G
    cy.intercept('**', (req) => {
      req.reply((res) => {
        res.delay(1000) // 1 second delay
        return res
      })
    })
    
    cy.visit('/login')
    
    // Should show loading state
    cy.get('[data-cy="cpf-input"]').type('12345678900')
    cy.get('[data-cy="password-input"]').type('teste123')
    cy.get('[data-cy="login-button"]').click()
    
    // Should show loading state within 100ms
    cy.get('[data-cy="login-button"]', { timeout: 100 })
      .should('contain.text', 'Entrando...')
  })

  it('should optimize bundle size', () => {
    cy.visit('/login')
    
    cy.window().then(win => {
      const resources = win.performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.includes('.js'))
      
      let totalJSSize = 0
      jsResources.forEach(resource => {
        if (resource.transferSize) {
          totalJSSize += resource.transferSize
        }
      })
      
      cy.log(`Total JS bundle size: ${totalJSSize / 1024}KB`)
      
      // Should not exceed 500KB for login page
      expect(totalJSSize).to.be.lessThan(500 * 1024)
    })
  })

  it('should have good Core Web Vitals', () => {
    cy.visit('/login')
    
    cy.window().then(win => {
      // Simulate user interaction for FID
      cy.get('[data-cy="cpf-input"]').click()
      
      setTimeout(() => {
        const navigation = win.performance.getEntriesByType('navigation')[0]
        
        if (navigation) {
          // First Contentful Paint should be < 1.8s
          const fcp = navigation.responseEnd - navigation.fetchStart
          expect(fcp).to.be.lessThan(1800)
          cy.log(`First Contentful Paint: ${fcp}ms`)
          
          // Largest Contentful Paint should be < 2.5s
          const lcp = navigation.loadEventEnd - navigation.fetchStart
          expect(lcp).to.be.lessThan(2500)
          cy.log(`Largest Contentful Paint: ${lcp}ms`)
        }
      }, 100)
    })
  })

  it('should handle concurrent users simulation', () => {
    // Simulate multiple form submissions
    const promises = []
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        cy.window().then(win => {
          return fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cpf: '12345678900',
              senha: 'teste123'
            })
          })
        })
      )
    }
    
    // All requests should complete within 5 seconds
    const start = Date.now()
    Promise.all(promises).then(() => {
      const duration = Date.now() - start
      expect(duration).to.be.lessThan(5000)
      cy.log(`Concurrent requests duration: ${duration}ms`)
    })
  })
})