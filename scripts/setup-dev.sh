#!/bin/bash

# Script de setup do ambiente de desenvolvimento
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "🚀 Configurando ambiente de desenvolvimento do Portal de Exames CTC..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado. Por favor, instale o Node.js 18+ antes de continuar."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js versão 18+ é necessário. Versão atual: $(node --version)"
    exit 1
fi

log_success "Node.js $(node --version) detectado"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado."
    exit 1
fi

log_success "npm $(npm --version) detectado"

# Instalar dependências do frontend
if [ -d "frontend" ]; then
    log_info "Instalando dependências do frontend..."
    cd frontend
    npm install --legacy-peer-deps
    cd ..
    log_success "Dependências do frontend instaladas"
else
    log_warning "Diretório frontend não encontrado"
fi

# Instalar dependências do backend
if [ -d "backend" ]; then
    log_info "Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
    log_success "Dependências do backend instaladas"
else
    log_warning "Diretório backend não encontrado"
fi

# Configurar Husky para git hooks
if [ -d ".git" ]; then
    log_info "Configurando git hooks com Husky..."
    if [ -d "frontend" ]; then
        cd frontend
        npx husky install
        cd ..
    fi
    log_success "Git hooks configurados"
else
    log_warning "Não é um repositório git, pulando configuração do Husky"
fi

# Criar arquivos de ambiente se não existirem
if [ ! -f "frontend/.env" ]; then
    log_info "Criando arquivo de ambiente do frontend..."
    cat > frontend/.env << EOF
# Desenvolvimento
VITE_API_URL=http://localhost:3001/api
VITE_APP_ENV=development
VITE_DEBUG=true

# URLs para testes
VITE_OHIF_VIEWER_URL=https://ohif-demo.netlify.app/viewer
VITE_PACS_SERVER_URL=http://localhost:3001/pacs

# Configurações de autenticação
VITE_JWT_EXPIRES_IN=24h
VITE_2FA_ENABLED=true
EOF
    log_success "Arquivo .env do frontend criado"
fi

if [ ! -f "backend/.env" ] && [ -d "backend" ]; then
    log_info "Criando arquivo de ambiente do backend..."
    cat > backend/.env << EOF
# Desenvolvimento
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=mysql://root:password@localhost:3306/portal_exames_dev
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_exames_dev
DB_USER=root
DB_PASSWORD=password

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=24h

# URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Upload
UPLOAD_MAX_SIZE=50MB
UPLOAD_PATH=./uploads

# Email (Mock para desenvolvimento)
EMAIL_ENABLED=false
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASS=password

# SMS (Mock para desenvolvimento)
SMS_ENABLED=false
SMS_API_KEY=your_sms_api_key

# PACS Integration (Mock para desenvolvimento)
PACS_ENABLED=false
PACS_SERVER_URL=http://localhost:8080
PACS_AE_TITLE=PORTAL_CTC
EOF
    log_success "Arquivo .env do backend criado"
fi

# Verificar se Docker está instalado (opcional)
if command -v docker &> /dev/null; then
    log_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) detectado"
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose detectado"
    else
        log_warning "Docker Compose não detectado. Instale para usar os containers."
    fi
else
    log_warning "Docker não detectado. Você pode instalar para usar os containers de desenvolvimento."
fi

# Verificar se MySQL está rodando (se usando localmente)
if command -v mysql &> /dev/null; then
    if mysql -u root -p"password" -e "SELECT 1;" &> /dev/null; then
        log_success "MySQL está rodando e acessível"
    else
        log_warning "MySQL não está acessível. Configure o banco de dados ou use Docker."
    fi
else
    log_warning "MySQL não detectado. Use Docker ou instale MySQL localmente."
fi

# Criar scripts de desenvolvimento
log_info "Criando scripts de desenvolvimento..."

cat > scripts/dev-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor de desenvolvimento do frontend..."
cd frontend && npm run dev
EOF

cat > scripts/dev-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor de desenvolvimento do backend..."
cd backend && npm run dev
EOF

cat > scripts/dev-full.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando ambiente completo de desenvolvimento..."

# Função para cleanup
cleanup() {
    echo "Finalizando servidores..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "Iniciando backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Aguardar um pouco antes de iniciar o frontend
sleep 3

# Iniciar frontend
echo "Iniciando frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Ambiente de desenvolvimento iniciado!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar
wait
EOF

chmod +x scripts/dev-*.sh

log_success "Scripts de desenvolvimento criados"

# Configurar VSCode settings (se VSCode estiver sendo usado)
if [ -d ".vscode" ] || command -v code &> /dev/null; then
    log_info "Configurando VSCode settings..."
    
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  },
  "testing.automaticallyOpenPeekView": "never"
}
EOF

    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer"
  ]
}
EOF

    log_success "VSCode configurado"
fi

log_info "Verificando se tudo está funcionando..."

# Testar se pode instalar dependências
cd frontend
if npm run test -- --run &> /dev/null; then
    log_success "Testes do frontend funcionando"
else
    log_warning "Testes do frontend podem ter problemas - verifique as dependências"
fi
cd ..

echo ""
log_success "🎉 Ambiente de desenvolvimento configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute 'scripts/dev-full.sh' para iniciar o ambiente completo"
echo "   2. Acesse http://localhost:5173 para o frontend"
echo "   3. Acesse http://localhost:3001 para o backend"
echo "   4. Execute 'scripts/run-tests.sh' para rodar todos os testes"
echo ""
echo "📚 Comandos úteis:"
echo "   npm run test           - Rodar testes (frontend)"
echo "   npm run test:e2e       - Rodar testes E2E"
echo "   npm run cypress:open   - Abrir Cypress interativo"
echo "   npm run build          - Build para produção"
echo ""
echo "📖 Veja TESTING.md para mais informações sobre testes"