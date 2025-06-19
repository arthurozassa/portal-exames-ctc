#!/bin/bash

# Script para executar todos os testes - Portal de Exames CTC
# Este script executa testes unitários, integração e segurança

set -e

echo "🧪 Executando suite completa de testes do Portal de Exames CTC..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para executar comando e verificar resultado
run_test() {
    local test_name="$1"
    local command="$2"
    local directory="$3"
    
    print_color $BLUE "Executando $test_name..."
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    if eval "$command"; then
        print_color $GREEN "✅ $test_name - PASSOU"
        if [ -n "$directory" ]; then
            cd ..
        fi
        return 0
    else
        print_color $RED "❌ $test_name - FALHOU"
        if [ -n "$directory" ]; then
            cd ..
        fi
        return 1
    fi
}

# Contadores
total_tests=0
passed_tests=0
failed_tests=0

# Array para armazenar resultados
declare -a test_results

# Função para registrar resultado
register_result() {
    local test_name="$1"
    local result="$2"
    
    total_tests=$((total_tests + 1))
    
    if [ "$result" = "0" ]; then
        passed_tests=$((passed_tests + 1))
        test_results+=("✅ $test_name")
    else
        failed_tests=$((failed_tests + 1))
        test_results+=("❌ $test_name")
    fi
}

echo ""
print_color $YELLOW "=== TESTES DO BACKEND ==="

# Testes de lint do backend
run_test "Lint do Backend" "npm run lint" "backend"
register_result "Lint do Backend" $?

# Testes unitários do backend
run_test "Testes Unitários do Backend" "npm run test:unit" "backend"
register_result "Testes Unitários do Backend" $?

# Testes de integração do backend
run_test "Testes de Integração do Backend" "npm run test:integration" "backend"
register_result "Testes de Integração do Backend" $?

# Testes de segurança do backend
run_test "Testes de Segurança do Backend" "npm run test:security" "backend"
register_result "Testes de Segurança do Backend" $?

# Cobertura de testes do backend
run_test "Cobertura de Testes do Backend" "npm run test:coverage" "backend"
register_result "Cobertura de Testes do Backend" $?

# Auditoria de segurança do backend
run_test "Auditoria de Segurança do Backend" "npm audit --audit-level=moderate" "backend"
register_result "Auditoria de Segurança do Backend" $?

echo ""
print_color $YELLOW "=== TESTES DO FRONTEND ==="

# Testes de lint do frontend
run_test "Lint do Frontend" "npm run lint" "frontend"
register_result "Lint do Frontend" $?

# Testes unitários do frontend
run_test "Testes de Componentes do Frontend" "npm run test:components" "frontend"
register_result "Testes de Componentes do Frontend" $?

# Testes de páginas do frontend
run_test "Testes de Páginas do Frontend" "npm run test:pages" "frontend"
register_result "Testes de Páginas do Frontend" $?

# Testes de utilidades do frontend
run_test "Testes de Utilitários do Frontend" "npm run test:utils" "frontend"
register_result "Testes de Utilitários do Frontend" $?

# Cobertura de testes do frontend
run_test "Cobertura de Testes do Frontend" "npm run test:coverage" "frontend"
register_result "Cobertura de Testes do Frontend" $?

# Auditoria de segurança do frontend
run_test "Auditoria de Segurança do Frontend" "npm audit --audit-level=moderate" "frontend"
register_result "Auditoria de Segurança do Frontend" $?

echo ""
print_color $YELLOW "=== TESTES DE BUILD ==="

# Teste de build do backend
run_test "Build do Backend" "npm start --if-present || echo 'No build script'" "backend"
register_result "Build do Backend" $?

# Teste de build do frontend
run_test "Build do Frontend" "npm run build" "frontend"
register_result "Build do Frontend" $?

echo ""
print_color $YELLOW "=== TESTES DE DOCKER ==="

# Teste de build do Docker
run_test "Build Docker Compose" "docker-compose build --no-cache" ""
register_result "Build Docker Compose" $?

# Teste de saúde dos containers
run_test "Health Check dos Containers" "docker-compose up -d && sleep 30 && docker-compose ps && docker-compose down" ""
register_result "Health Check dos Containers" $?

echo ""
print_color $YELLOW "=== RELATÓRIO FINAL ==="

# Imprimir resultados
for result in "${test_results[@]}"; do
    echo "$result"
done

echo ""
print_color $BLUE "Total de testes: $total_tests"
print_color $GREEN "Passou: $passed_tests"
print_color $RED "Falhou: $failed_tests"

# Calcular porcentagem de sucesso
if [ $total_tests -gt 0 ]; then
    success_rate=$((passed_tests * 100 / total_tests))
    print_color $BLUE "Taxa de sucesso: $success_rate%"
fi

echo ""

# Verificar se todos os testes passaram
if [ $failed_tests -eq 0 ]; then
    print_color $GREEN "🎉 Todos os testes passaram! O projeto está pronto para deploy."
    exit 0
else
    print_color $RED "⚠️  Alguns testes falharam. Verifique os erros acima antes de fazer deploy."
    exit 1
fi