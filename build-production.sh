#!/bin/bash

echo "🚀 Portal de Exames CTC - Build de Produção"
echo "============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    log_error "Execute este script na raiz do projeto Portal de Exames"
    exit 1
fi

# 1. Preparar Backend
log_info "Preparando Backend..."
cd backend

# Instalar dependências
log_info "Instalando dependências do backend..."
npm install --production

# Verificar .env
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado, copiando .env.example..."
    cp .env.example .env
fi

# Rodar migrações do banco
log_info "Executando migrações do banco..."
node src/database/migrate.js
node src/database/seed-simple.js

log_success "Backend preparado!"

# 2. Preparar Frontend
log_info "Preparando Frontend..."
cd ../frontend

# Instalar dependências
log_info "Instalando dependências do frontend..."
npm install --legacy-peer-deps

# Build do frontend
log_info "Gerando build de produção do frontend..."
npm run build

log_success "Frontend buildado!"

# 3. Criar estrutura de produção
log_info "Criando estrutura de produção..."
cd ..

# Criar diretório de produção
mkdir -p production
cd production

# Copiar arquivos do backend
log_info "Copiando backend..."
cp -r ../backend .
rm -rf backend/node_modules
cd backend && npm install --production --silent && cd ..

# Copiar build do frontend
log_info "Copiando frontend buildado..."
cp -r ../frontend/dist ./frontend
cp ../frontend/dist/app-integrated.html ./frontend/index.html

# Criar arquivo de inicialização
log_info "Criando scripts de inicialização..."

cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Portal de Exames CTC - Produção"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar Python para servir frontend
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python3 primeiro."
    exit 1
fi

echo "📡 Iniciando Backend (porta 3001)..."
cd backend && npm start &
BACKEND_PID=$!

echo "🌐 Iniciando Frontend (porta 8080)..."
cd ../frontend && python3 -m http.server 8080 &
FRONTEND_PID=$!

echo ""
echo "✅ Portal de Exames CTC iniciado com sucesso!"
echo ""
echo "🔗 URLs de acesso:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001/health"
echo ""
echo "📋 Para parar os serviços:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços..."

# Função para cleanup quando Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Serviços parados!"
    exit 0
}

trap cleanup SIGINT

# Manter script rodando
wait
EOF

chmod +x start.sh

# Criar README de produção
cat > README-PRODUCTION.md << 'EOF'
# Portal de Exames CTC - Versão de Produção

## 🚀 Como executar

### Pré-requisitos
- Node.js 18+
- Python 3

### Iniciando a aplicação
```bash
./start.sh
```

### URLs de acesso
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

### Credenciais de teste
- **CPF:** 12345678900
- **Senha:** 1234
- **2FA:** qualquer código (ex: 123456)

## 📁 Estrutura

```
production/
├── backend/           # API Node.js + SQLite
├── frontend/          # Interface React (build)
├── start.sh          # Script de inicialização
└── README-PRODUCTION.md
```

## 🔧 Configurações

### Backend (.env)
Edite `backend/.env` para configurar:
- Banco de dados
- JWT secrets
- Configurações de email/SMS
- URLs de integração

### Banco de dados
- SQLite (arquivo: backend/database.sqlite)
- Dados demo já populados
- Resetar: delete o arquivo e rode as migrações

## 🛡️ Segurança implementada

- ✅ Autenticação JWT
- ✅ 2FA simulado
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ Sanitização de inputs
- ✅ CORS configurado
- ✅ Logs de auditoria

## 🎨 Funcionalidades

- ✅ Login + 2FA
- ✅ Dashboard com métricas
- ✅ Lista de exames
- ✅ Compartilhamento
- ✅ Timeline clínica
- ✅ Configurações
- ✅ White-label (backend)
- ✅ API REST completa

## 📞 Suporte

Para demonstrações comerciais ou suporte técnico:
- Email: contato@ctc.com.br
- Documentação: http://localhost:3001/api-docs
EOF

log_success "Build de produção criado!"

# 4. Informações finais
echo ""
echo "🎉 Build de produção concluído com sucesso!"
echo ""
echo "📁 Localização: $(pwd)"
echo ""
echo "🚀 Para executar:"
echo "   cd production"
echo "   ./start.sh"
echo ""
echo "🔗 URLs de acesso após iniciar:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001/health"
echo ""
log_success "Tudo pronto para produção!"