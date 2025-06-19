# CI/CD Pipeline - Portal de Exames CTC

## Overview

Este projeto implementa um pipeline completo de CI/CD com múltiplas camadas de validação, testes e deployment automatizado.

## Arquitetura do Pipeline

### 🔄 Continuous Integration (CI)

#### 1. **Validação de Código**
- **Linting**: ESLint + Prettier
- **Formatação**: Verificação automática
- **Tipos**: TypeScript validation
- **Qualidade**: SonarCloud analysis

#### 2. **Testes Automatizados**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Unit Tests    │    │ Integration     │    │   E2E Tests     │
│                 │    │    Tests        │    │                 │
│ • Components    │    │ • API Routes    │    │ • User Flows    │
│ • Utils         │    │ • Database      │    │ • UI Behavior   │
│ • Services      │    │ • Auth Flow     │    │ • Cross-browser │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 3. **Testes Especializados**
- **Acessibilidade**: cypress-axe + WCAG validation
- **Performance**: Lighthouse CI + Core Web Vitals
- **Visual Regression**: Screenshot comparison
- **Mobile**: Responsive design validation
- **Security**: Vulnerability scanning

### 🚀 Continuous Deployment (CD)

#### 1. **Ambientes**
```
Development → Staging → Production
     ↓           ↓         ↓
   Feature    Preview   Live Site
   Branch      PR      Main Branch
```

#### 2. **Estratégia de Deploy**
- **Preview Deploys**: Para cada Pull Request
- **Staging**: Branch `develop`
- **Production**: Branch `main` + manual approval

## Workflows do GitHub Actions

### 📋 Workflow Principal (`ci.yml`)

**Triggers:**
- Push para `main` e `develop`
- Pull Requests para `main` e `develop`

**Jobs:**
1. **lint** - Validação de código
2. **test-unit** - Testes unitários com coverage
3. **test-components** - Testes específicos por categoria
4. **test-e2e** - Testes end-to-end multi-browser
5. **build** - Build de produção
6. **security** - Auditoria de segurança
7. **quality** - Análise de qualidade (SonarCloud)
8. **deploy-preview** - Deploy de preview (PRs)
9. **deploy-production** - Deploy de produção (main)
10. **notify** - Notificações

### 📊 Workflow de Performance (`performance.yml`)

**Triggers:**
- Push para `main`
- Pull Requests para `main`
- Schedule diário (2 AM UTC)

**Jobs:**
1. **lighthouse** - Performance testing
2. **accessibility** - Testes de acessibilidade
3. **bundle-analysis** - Análise de bundle size
4. **visual-regression** - Testes visuais
5. **mobile-testing** - Testes em dispositivos móveis
6. **load-testing** - Testes de carga
7. **performance-monitoring** - Monitoramento contínuo

## Configuração de Secrets

### GitHub Secrets Necessários

```bash
# Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Quality & Security
SONAR_TOKEN=your_sonarcloud_token
SNYK_TOKEN=your_snyk_token
CODECOV_TOKEN=your_codecov_token

# Monitoring
PRODUCTION_URL=https://your-production-url.com
MONITORING_WEBHOOK_URL=your_monitoring_webhook

# Notifications
SLACK_WEBHOOK_URL=your_slack_webhook
```

## Ferramentas de Qualidade

### 🔍 SonarCloud
- **Cobertura mínima**: 70%
- **Quality Gate**: Configurado para bloquear merges com issues
- **Métricas**: Bugs, Vulnerabilities, Code Smells, Duplicação

### 🛡️ Snyk Security
- **Vulnerability scanning**: Dependencies + Code
- **Threshold**: High severity issues bloqueiam pipeline
- **Auto-fix**: PRs automáticos para vulnerabilities

### 📸 Lighthouse CI
- **Performance**: Mínimo 80 pontos
- **Accessibility**: Mínimo 90 pontos
- **Best Practices**: Mínimo 80 pontos
- **SEO**: Mínimo 80 pontos

## Scripts de Automação

### 🔧 Setup do Ambiente
```bash
# Configurar ambiente de desenvolvimento
./scripts/setup-dev.sh

# Executar todos os testes
./scripts/run-tests.sh

# Executar testes específicos
./scripts/run-tests.sh --skip-e2e --skip-performance
```

### 📱 Testes Locais
```bash
# Frontend
cd frontend
npm run test:ci          # Todos os testes para CI
npm run test:e2e         # E2E tests
npm run test:e2e:mobile  # Mobile tests
npm run test:coverage    # Coverage report

# Docker
docker-compose -f docker-compose.test.yml up --build
```

## Monitoramento e Métricas

### 📊 Dashboards

1. **GitHub Actions**
   - Status dos workflows
   - Tempo de execução
   - Taxa de sucesso

2. **SonarCloud**
   - Quality metrics
   - Technical debt
   - Security hotspots

3. **Vercel Analytics**
   - Performance metrics
   - Error tracking
   - User analytics

### 🚨 Alertas

**Falhas de Pipeline:**
- Slack notifications
- Email alerts
- GitHub status checks

**Performance Degradation:**
- Lighthouse score drops
- Bundle size increases
- Response time alerts

## Estratégias de Branch

### 🌳 Git Flow Simplificado

```
main (production)
  ↑
develop (staging)
  ↑
feature/issue-123
```

**Proteções:**
- `main`: Require PR review + status checks
- `develop`: Require status checks
- Delete head branches after merge

### 🔀 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Development & Testing**
   ```bash
   npm run test:ci  # Local validation
   git commit -m "feat: add new feature"
   ```

3. **Create Pull Request**
   - Auto-triggers CI pipeline
   - Preview deployment created
   - Code review requested

4. **CI/CD Validation**
   - All tests pass
   - Security scan passes
   - Quality gates pass

5. **Merge to Develop**
   - Deploy to staging
   - Integration testing

6. **Merge to Main**
   - Deploy to production
   - Create release tag

## Performance Budgets

### 📏 Métricas Alvo

| Métrica | Target | Limite |
|---------|--------|--------|
| First Contentful Paint | < 1.8s | < 2.5s |
| Largest Contentful Paint | < 2.5s | < 4.0s |
| First Input Delay | < 100ms | < 300ms |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| Total Bundle Size | < 500KB | < 1MB |

### 🎯 Accessibility Standards

- **WCAG 2.1 AA**: 100% compliance
- **Keyboard Navigation**: Full support
- **Screen Reader**: Complete compatibility
- **Color Contrast**: Minimum 4.5:1

## Deployment Environments

### 🔧 Development
- **URL**: `http://localhost:5173`
- **Database**: Local/Docker MySQL
- **Features**: Debug mode, hot reload
- **Testing**: All test suites

### 🎭 Staging
- **URL**: `https://staging-portal-exames.vercel.app`
- **Database**: Staging MySQL (sanitized prod data)
- **Features**: Production-like environment
- **Testing**: Smoke tests, integration tests

### 🌍 Production
- **URL**: `https://portal-exames-ctc.vercel.app`
- **Database**: Production MySQL
- **Features**: Optimized, monitoring enabled
- **Testing**: Health checks, performance monitoring

## Troubleshooting

### ❌ Common CI/CD Issues

**Tests Failing Locally but Passing in CI:**
```bash
# Check environment differences
npm run test:ci
docker-compose -f docker-compose.test.yml up
```

**E2E Tests Timing Out:**
```bash
# Increase timeouts in cypress.config.js
# Check network connectivity
# Verify application startup time
```

**Build Failures:**
```bash
# Check for dependency conflicts
npm ci --legacy-peer-deps
# Verify Node.js version compatibility
# Check for missing environment variables
```

### 🔧 Debug Commands

```bash
# Local CI simulation
act -j test-unit  # Requires act (GitHub Actions locally)

# Verbose test output
npm run test -- --reporter=verbose

# Cypress debug mode
npm run cypress:open
DEBUG=cypress:* npm run cypress:run

# Bundle analysis
npm run build
npx vite-bundle-analyzer dist
```

## Contribuição

### 📝 Checklist para PRs

- [ ] Testes unitários adicionados/atualizados
- [ ] Testes E2E para novos fluxos
- [ ] Documentation atualizada
- [ ] Accessibility compliance
- [ ] Performance impact avaliado
- [ ] Security considerations
- [ ] Browser compatibility testada

### 🎯 Standards

- **Coverage mínima**: 70% para novas features
- **Performance**: Não degradar métricas existentes
- **Accessibility**: Manter compliance WCAG 2.1 AA
- **Security**: Zero vulnerabilities high/critical

## Roadmap

### 🚧 Próximas Implementações

- [ ] **Visual Regression**: Integração com Percy/Chromatic
- [ ] **A/B Testing**: Integração com feature flags
- [ ] **Canary Deployments**: Deploy gradual
- [ ] **Performance Monitoring**: Real User Monitoring (RUM)
- [ ] **Error Tracking**: Sentry integration
- [ ] **Log Aggregation**: Centralized logging
- [ ] **Infrastructure as Code**: Terraform/CDK
- [ ] **Multi-region**: Deploy em múltiplas regiões

### 📈 Melhorias Contínuas

- Otimização de tempo de build
- Paralelização de testes
- Cache inteligente
- Auto-scaling para testes
- Feedback loop automation