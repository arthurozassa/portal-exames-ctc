# Testing Setup - Portal de Exames CTC

## Overview

Este projeto implementa uma estratégia completa de testes com três camadas:

1. **Unit/Component Tests** - Vitest + Testing Library
2. **Integration Tests** - Vitest + Testing Library  
3. **End-to-End Tests** - Cypress

## Tecnologias Utilizadas

### Testing Framework
- **Vitest**: Framework de teste rápido e moderno
- **@testing-library/react**: Utilities para testar componentes React
- **@testing-library/jest-dom**: Matchers personalizados para DOM
- **@testing-library/user-event**: Simular interações do usuário

### E2E Testing
- **Cypress**: Framework de teste E2E completo
- **cypress-axe**: Testes de acessibilidade (configurado)

## Estrutura de Testes

```
frontend/
├── tests/
│   ├── setup.js                 # Configuração global dos testes
│   ├── components/               # Testes de componentes
│   │   └── LoginForm.test.jsx    
│   ├── pages/                    # Testes de páginas
│   │   └── Login.test.jsx        
│   └── utils/                    # Testes de utilitários
├── cypress/
│   ├── e2e/                      # Testes E2E
│   │   └── auth/
│   │       └── login.cy.js       
│   ├── fixtures/                 # Dados de teste
│   │   └── auth/
│   ├── support/                  # Comandos e configurações
│   │   ├── commands.js
│   │   └── e2e.js
│   └── downloads/                # Arquivos baixados nos testes
└── vitest.config.js              # Configuração do Vitest
└── cypress.config.js             # Configuração do Cypress
```

## Comandos Disponíveis

### Testes Unitários/Integração (Vitest)
```bash
npm run test                    # Executar todos os testes em modo watch
npm run test -- --run          # Executar todos os testes uma vez
npm run test:coverage           # Executar com relatório de cobertura
npm run test:ui                 # Interface gráfica do Vitest
npm run test:components         # Apenas testes de componentes
npm run test:pages              # Apenas testes de páginas
npm run test:utils              # Apenas testes de utilitários
```

### Testes E2E (Cypress)
```bash
npm run cypress:open            # Abrir Cypress em modo interativo
npm run cypress:run             # Executar testes Cypress em modo headless
npm run test:e2e                # Alias para cypress:run
npm run test:e2e:dev            # Alias para cypress:open
```

## Configuração de Cobertura

### Thresholds de Cobertura (vitest.config.js)
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Arquivos Incluídos na Cobertura
- `src/**/*.{js,jsx,ts,tsx}`

### Arquivos Excluídos da Cobertura
- Arquivos de teste (`*.test.*`, `*.spec.*`)
- `src/main.jsx`
- Arquivos de definição TypeScript (`*.d.ts`)

## Componentes Testados

### LoginForm Component
- ✅ Renderização correta dos campos
- ✅ Validação de formulário
- ✅ Formatação de CPF
- ✅ Toggle de visibilidade da senha
- ✅ Navegação por teclado
- ✅ Acessibilidade (ARIA)
- ✅ Estados de loading
- ✅ Tratamento de erros

### Login Page
- ✅ Fluxo completo de login
- ✅ Verificação 2FA
- ✅ Navegação entre telas
- ✅ Responsividade
- ✅ Estados de loading
- ✅ Tratamento de erros

## Testes E2E (Cypress)

### Fluxos Testados
- **Autenticação**:
  - Login com credenciais válidas
  - Login com credenciais inválidas
  - Fluxo 2FA completo
  - Recuperação de senha
  - Logout

- **Navegação**:
  - Redirecionamentos
  - Navegação entre páginas
  - Estados de loading

- **Acessibilidade**:
  - Navegação por teclado
  - ARIA attributes
  - Screen reader compatibility

- **Responsividade**:
  - Teste em diferentes tamanhos de tela
  - Compatibilidade mobile

### Data Attributes para E2E
Todos os elementos interativos possuem `data-cy` attributes:
- `data-cy="cpf-input"`
- `data-cy="password-input"`
- `data-cy="login-button"`
- `data-cy="2fa-input"`
- `data-cy="verify-button"`
- E muitos outros...

## Mocks e Fixtures

### AuthContext Mock
O `AuthContext` está configurado com dados mock para facilitar os testes:
- CPF: `12345678900`
- Senha: `teste123`
- Código 2FA: `123456`

### API Mocks
As chamadas de API são mockadas para retornar respostas consistentes:
- Login bem-sucedido com 2FA
- Códigos de erro específicos
- Timeouts simulados

## Helpers de Teste

### Global Test Helpers
```javascript
global.testHelpers = {
  clearAuth,           // Limpar dados de autenticação
  simulateAuth,        // Simular usuário autenticado
  simulateNetworkError // Simular erro de rede
}
```

### Custom Cypress Commands
```javascript
cy.login()              // Login completo
cy.logout()             // Logout
cy.clearAppData()       // Limpar dados da aplicação
cy.fillCPF()           // Preencher CPF formatado
cy.testMobile()        // Testar em viewport mobile
cy.testResponsive()    // Testar responsividade
```

## Boas Práticas Implementadas

### Testes Unitários
- Testes isolados e independentes
- Mocks apropriados para dependências externas
- Testes de comportamento, não implementação
- Cobertura de casos de erro

### Testes E2E
- Page Object Pattern implícito
- Data attributes dedicados para testes
- Testes que simulam fluxos reais do usuário
- Configuração para diferentes ambientes

### Organização
- Estrutura clara de diretórios
- Nomenclatura consistente
- Documentação inline quando necessário
- Separação entre unit, integration e E2E

## Configuração de CI/CD (Preparado)

### GitHub Actions (exemplo)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test -- --run
      - name: Run E2E tests
        run: npm run test:e2e
```

## Status Atual

### ✅ Implementado
- [x] Configuração completa do Vitest
- [x] Configuração completa do Cypress
- [x] Testes do componente LoginForm (100%)
- [x] Setup de mocks e fixtures
- [x] Data attributes para E2E
- [x] Comandos customizados do Cypress
- [x] Configuração de cobertura

### 🔄 Em Progresso
- [ ] Correção de alguns testes da página Login
- [ ] Baseline de cobertura estabelecido

### 📋 Próximos Passos
- [ ] Implementar testes para outros componentes
- [ ] Configurar pipeline CI/CD
- [ ] Adicionar testes de performance
- [ ] Implementar testes de acessibilidade com cypress-axe

## Comandos Úteis

### Debug de Testes
```bash
# Ver output detalhado dos testes
npm run test -- --reporter=verbose

# Executar teste específico
npm run test LoginForm.test.jsx

# Debug do Cypress
npm run cypress:open
```

### Coverage Reports
```bash
# Gerar relatório de cobertura
npm run test:coverage

# Ver relatório HTML
open coverage/index.html
```

## Contribuindo

1. Todos os novos componentes devem ter testes
2. Manter cobertura acima dos thresholds definidos
3. Adicionar data-cy attributes para elementos interativos
4. Escrever testes E2E para fluxos críticos
5. Documentar novos helpers e patterns