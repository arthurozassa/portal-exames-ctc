#!/usr/bin/env node

const Database = require('../src/database/connection');
const { runMigrations } = require('../src/database/migrate');
const { seedDatabase } = require('../src/database/seed');

async function initializeDatabase() {
    console.log('🔄 Inicializando banco de dados...');
    
    try {
        // Conectar ao banco
        await Database.connect();
        
        // Executar migrations
        console.log('📊 Executando migrations...');
        await runMigrations();
        
        // Executar seed
        console.log('🌱 Populando banco com dados de exemplo...');
        await seedDatabase();
        
        console.log('✅ Banco de dados inicializado com sucesso!');
        console.log('');
        console.log('🔑 Credenciais de acesso:');
        console.log('   Paciente Demo: CPF 12345678900 / Senha: 1234');
        console.log('   Admin: admin / admin123');
        console.log('');
        console.log('📍 Para testar a API:');
        console.log('   GET http://localhost:3001/health');
        console.log('   POST http://localhost:3001/api/auth/login');
        
        await Database.disconnect();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        await Database.disconnect();
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };