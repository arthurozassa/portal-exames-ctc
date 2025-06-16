#!/bin/bash

# Script de configuração para desenvolvimento - Portal de Exames CTC
# Este script configura o ambiente de desenvolvimento completo

set -e

echo "🚀 Configurando ambiente de desenvolvimento do Portal de Exames CTC..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18 ou superior é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Dependências verificadas com sucesso"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Revise as configurações se necessário."
else
    echo "✅ Arquivo .env já existe"
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# Configurar Husky (hooks de git)
echo "🔧 Configurando hooks do Git..."
cd backend && npx husky install && cd ..
cd frontend && npx husky install && cd ..

# Criar estrutura de diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p backend/database
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backups

# Build das imagens Docker
echo "🐳 Construindo imagens Docker..."
docker-compose build

# Inicializar banco de dados
echo "🗄️ Inicializando banco de dados..."
docker-compose run --rm backend npm run seed

# Executar testes para verificar se tudo está funcionando
echo "🧪 Executando testes..."
echo "Testando backend..."
cd backend && npm test -- --passWithNoTests && cd ..
echo "Testando frontend..."
cd frontend && npm test -- --run && cd ..

echo ""
echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Revise o arquivo .env e ajuste as configurações se necessário"
echo "2. Execute 'npm run dev' no diretório backend para iniciar o servidor"
echo "3. Execute 'npm run dev' no diretório frontend para iniciar a aplicação"
echo "4. Ou use 'docker-compose up' para iniciar tudo com Docker"
echo ""
echo "🔗 URLs de desenvolvimento:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:3001"
echo "- API Health Check: http://localhost:3001/api/health"
echo ""
echo "📖 Para mais informações, consulte o README.md"