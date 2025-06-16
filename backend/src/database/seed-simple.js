const Database = require('./connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed simplificado...');

        // Limpar dados existentes
        await Database.query('PRAGMA foreign_keys = OFF');
        
        const tables = [
            'audit_logs', 'exam_values', 'exam_shares', 'tokens', 
            'exams', 'legal_guardians', 'white_label_settings', 
            'admins', 'doctors', 'patients'
        ];
        
        for (const table of tables) {
            await Database.query(`DELETE FROM ${table}`);
        }
        
        await Database.query('PRAGMA foreign_keys = ON');

        // Inserir paciente demo
        console.log('👥 Inserindo paciente demo...');
        const passwordHash = await bcrypt.hash('1234', 12);
        
        await Database.query(`
            INSERT INTO patients (cpf, name, email, phone, password_hash, birth_date, gender, address, consent_accepted, consent_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `, [
            '12345678900',
            'Maria Silva Santos',
            'maria.silva@demo.com',
            '(11) 98765-4321',
            passwordHash,
            '1980-05-15',
            'F',
            'Rua das Flores, 123 - São Paulo/SP'
        ]);

        // Inserir médicos
        console.log('👨‍⚕️ Inserindo médicos...');
        await Database.query(`
            INSERT INTO doctors (crm, name, email, phone, specialty)
            VALUES (?, ?, ?, ?, ?)
        `, ['CRM/SP 123456', 'Dr. Roberto Santos', 'dr.roberto@hospital.com', '(11) 3456-7890', 'Cardiologia']);

        await Database.query(`
            INSERT INTO doctors (crm, name, email, phone, specialty)
            VALUES (?, ?, ?, ?, ?)
        `, ['CRM/SP 654321', 'Dra. Fernanda Lima', 'dra.fernanda@hospital.com', '(11) 3456-7891', 'Endocrinologia']);

        // Inserir admin
        console.log('👨‍💼 Inserindo administrador...');
        const adminPassword = await bcrypt.hash('admin123', 12);
        await Database.query(`
            INSERT INTO admins (username, email, password_hash, name, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'admin@ctc.com', adminPassword, 'Administrador CTC', 'super_admin']);

        // Inserir alguns exames
        console.log('🔬 Inserindo exames...');
        const exams = [
            {
                type: 'Hemograma Completo',
                date: '2024-12-10',
                status: 'completed',
                doctor: 1,
                observations: 'Exame realizado conforme protocolo padrão. Resultados normais.'
            },
            {
                type: 'Glicemia de Jejum',
                date: '2024-12-05',
                status: 'completed', 
                doctor: 2,
                observations: 'Resultado dentro dos parâmetros normais'
            },
            {
                type: 'Raio-X Tórax',
                date: '2024-11-28',
                status: 'completed',
                doctor: 1,
                observations: 'Estruturas pulmonares normais. Coração com área cardíaca normal.'
            },
            {
                type: 'Ultrassom Abdomen',
                date: '2024-11-20',
                status: 'completed',
                doctor: 2,
                observations: 'Órgãos abdominais com aspecto ultrassonográfico normal.'
            },
            {
                type: 'Eletrocardiograma',
                date: '2024-11-15',
                status: 'completed',
                doctor: 1,
                observations: 'Traçado eletrocardiográfico normal'
            },
            {
                type: 'Ressonância Magnética',
                date: '2024-12-25',
                status: 'pending',
                doctor: 2,
                observations: 'Exame agendado - jejum de 8 horas'
            },
            {
                type: 'Colesterol Total',
                date: '2024-12-01',
                status: 'completed',
                doctor: 2,
                observations: 'Perfil lipídico completo'
            }
        ];

        for (const exam of exams) {
            await Database.query(`
                INSERT INTO exams (patient_id, exam_type, exam_date, status, unit, doctor_id, pdf_path, pacs_link, observations)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                1, 
                exam.type, 
                exam.date, 
                exam.status, 
                'Laboratório Central CTC', 
                exam.doctor, 
                `/pdf/exam_${exam.type.toLowerCase().replace(/\s+/g, '_')}_2024.pdf`,
                'https://viewer.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78',
                exam.observations
            ]);
        }

        // Inserir valores de exames para gráficos
        console.log('📊 Inserindo valores de exames...');
        const examValues = [
            // Hemograma Completo (exam_id: 1)
            { exam_id: 1, parameter: 'Hemoglobina', value: 14.5, unit: 'g/dL', min: 12.0, max: 16.0, normal: 1 },
            { exam_id: 1, parameter: 'Hematócrito', value: 42.0, unit: '%', min: 37.0, max: 48.0, normal: 1 },
            { exam_id: 1, parameter: 'Leucócitos', value: 7200, unit: '/mm³', min: 4000, max: 11000, normal: 1 },
            
            // Glicemia de Jejum (exam_id: 2)
            { exam_id: 2, parameter: 'Glicose', value: 95, unit: 'mg/dL', min: 70, max: 99, normal: 1 },
            
            // Colesterol Total (exam_id: 7)
            { exam_id: 7, parameter: 'Colesterol Total', value: 180, unit: 'mg/dL', min: 0, max: 200, normal: 1 },
            { exam_id: 7, parameter: 'HDL', value: 55, unit: 'mg/dL', min: 40, max: 999, normal: 1 },
            { exam_id: 7, parameter: 'LDL', value: 110, unit: 'mg/dL', min: 0, max: 130, normal: 1 },
            { exam_id: 7, parameter: 'Triglicerídeos', value: 120, unit: 'mg/dL', min: 0, max: 150, normal: 1 }
        ];

        for (const value of examValues) {
            await Database.query(`
                INSERT INTO exam_values (exam_id, parameter_name, value, unit, reference_min, reference_max, is_normal)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [value.exam_id, value.parameter, value.value, value.unit, value.min, value.max, value.normal]);
        }

        // Inserir configurações white-label
        console.log('🎨 Inserindo configurações white-label...');
        const settings = [
            ['primary_color', '#2563eb', 'color'],
            ['secondary_color', '#64748b', 'color'],
            ['company_name', 'Portal de Exames CTC', 'text'],
            ['footer_text', 'CTC - Tecnologia em Saúde', 'text'],
            ['enable_timeline', 'true', 'boolean'],
            ['enable_sharing', 'true', 'boolean']
        ];

        for (const [key, value, type] of settings) {
            await Database.query(`
                INSERT INTO white_label_settings (setting_key, setting_value, setting_type)
                VALUES (?, ?, ?)
            `, [key, value, type]);
        }

        console.log('🎉 Seed concluído com sucesso!');
        console.log('📋 Dados criados:');
        console.log('   - 1 paciente demo');
        console.log('   - 2 médicos');
        console.log('   - 2 exames');
        console.log('   - 1 administrador');
        console.log('   - Configurações white-label');
        console.log('');
        console.log('🔑 Credenciais de acesso:');
        console.log('   Paciente Demo: CPF 12345678900 / Senha: 1234');
        console.log('   Admin: admin / admin123');

    } catch (error) {
        console.error('❌ Erro ao executar seed:', error.message);
        throw error;
    }
}

// Executa o seed se o arquivo for executado diretamente
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedDatabase };