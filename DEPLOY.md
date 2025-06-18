# 🚀 Deploy Instructions - Portal de Exames CTC

## Criar Repositório no GitHub

### Opção 1: Via GitHub Web Interface (Recomendado)

1. **Acesse:** https://github.com/new
2. **Repository name:** `portal-exames-ctc`
3. **Description:** `Portal de Exames CTC - Complete medical exam portal with advanced Timeline, authentication, and 27 medical parameters. Demo ready for commercial presentations.`
4. **Visibility:** Public ✅
5. **Initialize repository:** ❌ NÃO marque nenhuma opção (já temos os arquivos)
6. **Click:** "Create repository"

### Opção 2: Via GitHub CLI (se tiver instalado)

```bash
# Instalar GitHub CLI (se necessário)
brew install gh

# Fazer login
gh auth login

# Criar repositório
gh repo create portal-exames-ctc --public --description "Portal de Exames CTC - Complete medical exam portal with advanced Timeline, authentication, and 27 medical parameters. Demo ready for commercial presentations."
```

## Conectar e Fazer Push

Após criar o repositório no GitHub, execute estes comandos:

```bash
# Navegar para o diretório do projeto
cd "/Users/macikv04macctc/Desktop/Claude/Portal de Exames-claudecode"

# Adicionar repositório remoto (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/portal-exames-ctc.git

# Verificar se foi adicionado corretamente
git remote -v

# Fazer push do código para o GitHub
git push -u origin main
```

## Verificar Deploy

Após o push, verifique:

1. **Repositório:** https://github.com/SEU-USUARIO/portal-exames-ctc
2. **README:** Deve aparecer automaticamente
3. **Arquivos:** Todos os 131 arquivos devem estar lá
4. **Commit:** "Initial commit: Portal de Exames CTC - Complete medical exam portal"

## Configurações Adicionais (Opcional)

### Habilitar GitHub Pages

1. Vá em **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **root**
4. Save

### Adicionar Topics/Tags

No repositório, clique na engrenagem ⚙️ ao lado de "About" e adicione:

**Topics:** `medical-portal`, `react`, `nodejs`, `healthcare`, `timeline`, `authentication`, `demo`, `ctc`, `exam-portal`, `medical-dashboard`

### Configurar Issues Templates

```bash
# Criar pasta para templates
mkdir -p .github/ISSUE_TEMPLATE

# Adicionar templates básicos
echo "name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
" > .github/ISSUE_TEMPLATE/bug_report.md
```

## URLs Importantes

- **Repositório:** https://github.com/SEU-USUARIO/portal-exames-ctc
- **Issues:** https://github.com/SEU-USUARIO/portal-exames-ctc/issues  
- **Actions:** https://github.com/SEU-USUARIO/portal-exames-ctc/actions
- **Releases:** https://github.com/SEU-USUARIO/portal-exames-ctc/releases

## Deploy em Produção

### Vercel (Frontend)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Railway/Render (Backend)
1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Docker (Completo)
```bash
# Build e run
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✨ Features do Portal

- 🏥 **13 telas médicas** obrigatórias
- 🔐 **Autenticação segura** com 2FA
- 📊 **Timeline com 27 parâmetros** médicos
- 🩺 **5 médicos especialistas** com CRM
- 📱 **Design responsivo** mobile/desktop
- 🎨 **White-label** customizável
- 📈 **Dashboard de saúde** com análise de risco
- 🔍 **Filtros avançados** por categoria médica
- 📄 **Exportação PDF/CSV** profissional
- 🧪 **Integração PACS** simulada

**Pronto para demonstrações comerciais!** 🚀