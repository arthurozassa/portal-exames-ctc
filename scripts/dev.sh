#!/bin/bash

# Script para executar o ambiente de desenvolvimento

echo "🚀 Portal de Exames CTC - Ambiente de Desenvolvimento"
echo ""

# Verificar se está no diretório correto
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Função para parar processos
cleanup() {
    echo ""
    echo "🛑 Parando aplicação..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Trap para capturar Ctrl+C
trap cleanup SIGINT

echo "📦 Verificando dependências..."

# Verificar dependências do backend
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Instalando dependências do backend..."
    cd backend && npm install --legacy-peer-deps
    cd ..
fi

# Verificar dependências do frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Instalando dependências do frontend..."
    cd frontend && npm install --legacy-peer-deps
    cd ..
fi

echo ""
echo "🔄 Iniciando serviços..."

# Iniciar backend em background
echo "🖥️  Iniciando backend (porta 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Esperar um pouco para o backend iniciar
sleep 3

# Iniciar frontend em background
echo "🌐 Iniciando frontend (porta 5173/5174)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Aplicação iniciada com sucesso!"
echo ""
echo "📍 URLs disponíveis:"
echo "   🖥️  Backend:  http://localhost:3001"
echo "   🌐 Frontend: http://localhost:5173 (ou 5174)"
echo "   🔍 Health:   http://localhost:3001/health"
echo ""
echo "🔑 Credenciais de teste:"
echo "   👤 Paciente: CPF 12345678900 / Senha: 1234"
echo "   👨‍💼 Admin:    admin / admin123"
echo ""
echo "💡 Pressione Ctrl+C para parar todos os serviços"
echo ""

# Aguardar indefinidamente
wait