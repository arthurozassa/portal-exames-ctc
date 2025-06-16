const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'portal_exames.db');

// Função para criar hash de senha
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Função para gerar data aleatória nos últimos 6 meses
function randomDateInLast6Months() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
}

async function seedDatabase() {
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // ============= ADMINISTRADORES =============
    console.log('👤 Criando administradores...');
    
    const adminPassword = await hashPassword('admin123');
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO administradores (id, email, senha_hash, nome, permissoes, ativo)
        VALUES (1, 'admin@ctc.com.br', ?, 'Administrador CTC', 'admin', 1)
      `, [adminPassword], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // ============= MÉDICOS =============
    console.log('👨‍⚕️ Criando médicos...');
    
    const medicos = [
      {
        nome: 'Dr. Carlos Silva',
        crm: '123456/SP',
        especialidade: 'Cardiologia',
        email: 'carlos.silva@hospital.com.br',
        telefone: '(11) 99999-1111'
      },
      {
        nome: 'Dra. Ana Santos',
        crm: '789012/RJ',
        especialidade: 'Endocrinologia',
        email: 'ana.santos@clinica.com.br',
        telefone: '(21) 99999-2222'
      },
      {
        nome: 'Dr. Roberto Oliveira',
        crm: '345678/MG',
        especialidade: 'Neurologia',
        email: 'roberto.oliveira@neuro.com.br',
        telefone: '(31) 99999-3333'
      },
      {
        nome: 'Dra. Mariana Costa',
        crm: '901234/RS',
        especialidade: 'Dermatologia',
        email: 'mariana.costa@derma.com.br',
        telefone: '(51) 99999-4444'
      },
      {
        nome: 'Dr. Paulo Mendes',
        crm: '567890/PR',
        especialidade: 'Ortopedia',
        email: 'paulo.mendes@ortho.com.br',
        telefone: '(41) 99999-5555'
      }
    ];

    for (const medico of medicos) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO medicos (nome, crm, especialidade, email, telefone)
          VALUES (?, ?, ?, ?, ?)
        `, [medico.nome, medico.crm, medico.especialidade, medico.email, medico.telefone], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // ============= USUÁRIOS =============
    console.log('👥 Criando usuários...');
    
    const demoPassword = await hashPassword('1234');
    
    const usuarios = [
      {
        cpf: '12345678900',
        nome: 'João Silva',
        email: 'joao.silva@email.com',
        telefone: '(11) 98765-4321',
        data_nascimento: '1985-03-15',
        senha_hash: demoPassword
      },
      {
        cpf: '98765432100',
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@email.com',
        telefone: '(21) 87654-3210',
        data_nascimento: '1990-07-22',
        senha_hash: demoPassword
      },
      {
        cpf: '11122233344',
        nome: 'Pedro Santos',
        email: 'pedro.santos@email.com',
        telefone: '(31) 76543-2109',
        data_nascimento: '1978-11-08',
        senha_hash: demoPassword
      }
    ];

    const userIds = [];
    for (const usuario of usuarios) {
      const result = await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO users (cpf, nome, email, telefone, data_nascimento, senha_hash)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [usuario.cpf, usuario.nome, usuario.email, usuario.telefone, usuario.data_nascimento, usuario.senha_hash], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
      userIds.push(result.lastID);
    }

    // ============= EXAMES =============
    console.log('🔬 Criando exames...');
    
    const tiposExames = [
      'Hemograma Completo',
      'Glicemia de Jejum',
      'Colesterol Total',
      'Triglicerídeos',
      'Ureia',
      'Creatinina',
      'Ácido Úrico',
      'TGO/AST',
      'TGP/ALT',
      'Eletrocardiograma',
      'Raio-X de Tórax',
      'Ultrassonografia Abdominal',
      'Tomografia Computadorizada',
      'Ressonância Magnética',
      'Ecocardiograma'
    ];

    const resultadosExemplo = [
      'Resultado dentro dos parâmetros normais.',
      'Alterações leves detectadas. Acompanhamento recomendado.',
      'Valores elevados. Necessário reavaliação médica.',
      'Exame normal sem achados patológicos.',
      'Pequenas variações nos valores de referência.',
      'Resultado satisfatório.',
      'Indicado repetir exame em 3 meses.',
      'Valores limítrofes. Orientações dietéticas necessárias.',
      'Exame sem alterações significativas.',
      'Resultado compatível com boa saúde.'
    ];

    let examId = 1;
    for (let userId of userIds) {
      // Criar entre 3-4 exames por usuário
      const numExames = 3 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numExames; i++) {
        const tipoExame = tiposExames[Math.floor(Math.random() * tiposExames.length)];
        const resultado = resultadosExemplo[Math.floor(Math.random() * resultadosExemplo.length)];
        const medicoId = 1 + Math.floor(Math.random() * 5); // IDs 1-5 dos médicos
        const dataRealizacao = randomDateInLast6Months();
        
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO exames (usuario_id, medico_id, tipo_exame, descricao, data_realizacao, resultado, status)
            VALUES (?, ?, ?, ?, ?, ?, 'concluido')
          `, [userId, medicoId, tipoExame, `Descrição do exame: ${tipoExame}`, dataRealizacao, resultado], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });
        
        examId++;
      }
    }

    // ============= RESPONSÁVEIS LEGAIS =============
    console.log('👨‍👩‍👧‍👦 Criando responsáveis legais...');
    
    const responsaveis = [
      {
        usuario_id: userIds[0], // João Silva
        responsavel_cpf: '55566677788',
        responsavel_nome: 'Ana Silva',
        responsavel_email: 'ana.silva@email.com',
        parentesco: 'conjuge'
      },
      {
        usuario_id: userIds[2], // Pedro Santos (menor de idade fictício)
        responsavel_cpf: '99988877766',
        responsavel_nome: 'José Santos',
        responsavel_email: 'jose.santos@email.com',
        parentesco: 'pai'
      }
    ];

    for (const responsavel of responsaveis) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO responsaveis (usuario_id, responsavel_cpf, responsavel_nome, responsavel_email, parentesco)
          VALUES (?, ?, ?, ?, ?)
        `, [responsavel.usuario_id, responsavel.responsavel_cpf, responsavel.responsavel_nome, responsavel.responsavel_email, responsavel.parentesco], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // ============= COMPARTILHAMENTOS =============
    console.log('🔗 Criando compartilhamentos...');
    
    // Gerar alguns compartilhamentos de exemplo
    const compartilhamentos = [
      {
        exame_id: 1,
        medico_id: 2,
        token: 'abcd1234efgh5678ijkl9012mnop3456',
        data_expiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        visualizado: 1,
        data_visualizacao: new Date().toISOString()
      },
      {
        exame_id: 2,
        medico_id: 1,
        token: 'wxyz7890abcd1234efgh5678ijkl9012',
        data_expiracao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias
        visualizado: 0,
        data_visualizacao: null
      },
      {
        exame_id: 5,
        medico_id: 3,
        token: 'mnop3456qrst7890uvwx1234yzab5678',
        data_expiracao: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias
        visualizado: 0,
        data_visualizacao: null
      }
    ];

    for (const comp of compartilhamentos) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO compartilhamentos (exame_id, medico_id, token, data_expiracao, visualizado, data_visualizacao)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [comp.exame_id, comp.medico_id, comp.token, comp.data_expiracao, comp.visualizado, comp.data_visualizacao], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // ============= LOGS DE AUDITORIA =============
    console.log('📋 Criando logs de auditoria...');
    
    const logsAuditoria = [
      {
        usuario_id: userIds[0],
        acao: 'login_success',
        tabela: 'users',
        registro_id: userIds[0],
        dados_novos: JSON.stringify({ ip: '192.168.1.100' }),
        ip_address: '192.168.1.100'
      },
      {
        usuario_id: userIds[0],
        acao: 'exam_shared',
        tabela: 'compartilhamentos',
        registro_id: 1,
        dados_novos: JSON.stringify({ medico: 'Dra. Ana Santos', exame: 'Hemograma Completo' }),
        ip_address: '192.168.1.100'
      },
      {
        usuario_id: userIds[1],
        acao: 'profile_updated',
        tabela: 'users',
        registro_id: userIds[1],
        dados_novos: JSON.stringify({ changes: { telefone: '(21) 87654-3210' } }),
        ip_address: '192.168.1.101'
      }
    ];

    for (const log of logsAuditoria) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO logs_auditoria (usuario_id, acao, tabela, registro_id, dados_novos, ip_address, criado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [log.usuario_id, log.acao, log.tabela, log.registro_id, log.dados_novos, log.ip_address, new Date().toISOString()], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log(`  👤 1 Administrador`);
    console.log(`  👨‍⚕️ ${medicos.length} Médicos`);
    console.log(`  👥 ${usuarios.length} Usuários`);
    console.log(`  🔬 ~${usuarios.length * 3.5} Exames`);
    console.log(`  👨‍👩‍👧‍👦 ${responsaveis.length} Responsáveis legais`);
    console.log(`  🔗 ${compartilhamentos.length} Compartilhamentos`);
    
    console.log('\n🔐 Credenciais para teste:');
    console.log('  📱 Usuário demo:');
    console.log('    CPF: 12345678900');
    console.log('    Senha: 1234');
    console.log('  🏥 Admin:');
    console.log('    Email: admin@ctc.com.br');
    console.log('    Senha: admin123');
    
    console.log('\n🔗 Links de compartilhamento de exemplo:');
    compartilhamentos.forEach((comp, index) => {
      console.log(`    Token ${index + 1}: ${comp.token}`);
    });

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Executar seed se este arquivo for executado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Seed finalizado! Você pode iniciar o servidor agora.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha no seed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };