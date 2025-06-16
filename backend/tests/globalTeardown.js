module.exports = async () => {
  // Limpeza global após todos os testes
  console.log('🧹 Limpando ambiente de testes...');
  
  // Fechar conexão com banco de dados de teste
  if (global.__DATABASE__) {
    global.__DATABASE__.close();
  }
  
  console.log('✅ Ambiente de testes finalizado');
};