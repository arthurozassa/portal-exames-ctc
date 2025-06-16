const Database = require('./connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Dados mockados para demo
const seedData = {
    patients: [
        {
            cpf: '12345678900',
            name: 'Maria Silva Santos',
            email: 'maria.silva@demo.com',
            phone: '(11) 98765-4321',
            birth_date: '1980-05-15',
            gender: 'F',
            address: 'Rua das Flores, 123 - São Paulo/SP'
        },
        {
            cpf: '98765432100',
            name: 'João Carlos Oliveira',
            email: 'joao.carlos@demo.com',
            phone: '(11) 99123-4567',
            birth_date: '1975-10-22',
            gender: 'M',
            address: 'Av. Paulista, 456 - São Paulo/SP'
        },
        {
            cpf: '11122233344',
            name: 'Ana Paula Costa',
            email: 'ana.paula@demo.com',
            phone: '(11) 94567-8901',
            birth_date: '1990-03-08',
            gender: 'F',
            address: 'Rua Augusta, 789 - São Paulo/SP'
        }
    ],

    doctors: [
        {
            crm: 'CRM/SP 123456',
            name: 'Dr. Roberto Santos',
            email: 'dr.roberto@hospital.com',
            phone: '(11) 3456-7890',
            specialty: 'Cardiologia'
        },
        {
            crm: 'CRM/SP 654321',
            name: 'Dra. Fernanda Lima',
            email: 'dra.fernanda@hospital.com',
            phone: '(11) 3456-7891',
            specialty: 'Endocrinologia'
        },
        {
            crm: 'CRM/SP 789123',
            name: 'Dr. Carlos Mendes',
            email: 'dr.carlos@hospital.com',
            phone: '(11) 3456-7892',
            specialty: 'Neurologia'
        }
    ],

    examTypes: [
        'Hemograma Completo',
        'Glicemia de Jejum',
        'Colesterol Total e Frações',
        'Triglicerídeos',
        'Ureia e Creatinina',
        'Ácido Úrico',
        'TGO/TGP',
        'TSH e T4 Livre',
        'Raio-X de Tórax',
        'Eletrocardiograma'
    ],

    units: [
        'Laboratório Central CTC',
        'Unidade Vila Madalena',
        'Unidade Morumbi',
        'Unidade Tatuapé'
    ],

    whiteLabel: [
        { key: 'primary_color', value: '#2563eb', type: 'color' },
        { key: 'secondary_color', value: '#64748b', type: 'color' },
        { key: 'logo_path', value: '/uploads/logo-ctc.png', type: 'file' },
        { key: 'company_name', value: 'Portal de Exames CTC', type: 'text' },
        { key: 'footer_text', value: 'CTC - Tecnologia em Saúde', type: 'text' },
        { key: 'privacy_policy', value: 'Política de Privacidade padrão...', type: 'text' },
        { key: 'terms_of_use', value: 'Termos de Uso padrão...', type: 'text' },
        { key: 'consent_text', value: 'Declaro que li e aceito os termos...', type: 'text' },
        { key: 'enable_timeline', value: 'true', type: 'boolean' },
        { key: 'enable_sharing', value: 'true', type: 'boolean' }
    ]
};

// Parâmetros para exames laboratoriais
const examParameters = {
    'Hemograma Completo': [
        { name: 'Hemoglobina', unit: 'g/dL', ref_min: 12.0, ref_max: 16.0 },
        { name: 'Hematócrito', unit: '%', ref_min: 36.0, ref_max: 46.0 },
        { name: 'Leucócitos', unit: '/mm³', ref_min: 4000, ref_max: 11000 }
    ],
    'Glicemia de Jejum': [
        { name: 'Glicose', unit: 'mg/dL', ref_min: 70, ref_max: 99 }
    ],
    'Colesterol Total e Frações': [
        { name: 'Colesterol Total', unit: 'mg/dL', ref_min: 0, ref_max: 200 },
        { name: 'HDL', unit: 'mg/dL', ref_min: 40, ref_max: 999 },
        { name: 'LDL', unit: 'mg/dL', ref_min: 0, ref_max: 130 }
    ],
    'Triglicerídeos': [
        { name: 'Triglicerídeos', unit: 'mg/dL', ref_min: 0, ref_max: 150 }
    ]
};

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed do banco de dados...');

        // Limpar dados existentes
        await Database.query('PRAGMA foreign_keys = OFF');
        await Database.query('DELETE FROM audit_logs');
        await Database.query('DELETE FROM exam_values');
        await Database.query('DELETE FROM exam_shares');
        await Database.query('DELETE FROM tokens');
        await Database.query('DELETE FROM exams');
        await Database.query('DELETE FROM legal_guardians');
        await Database.query('DELETE FROM white_label_settings');
        await Database.query('DELETE FROM admins');
        await Database.query('DELETE FROM doctors');
        await Database.query('DELETE FROM patients');
        await Database.query('PRAGMA foreign_keys = ON');

        // Seed patients
        console.log('👥 Inserindo pacientes...');
        const patientIds = [];
        for (const patient of seedData.patients) {
            const passwordHash = await bcrypt.hash('1234', 12);
            const result = await Database.query(`
                INSERT INTO patients (cpf, name, email, phone, password_hash, birth_date, gender, address, consent_accepted, consent_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
            `, [
                patient.cpf, patient.name, patient.email, patient.phone,
                passwordHash, patient.birth_date, patient.gender, patient.address
            ]);
            patientIds.push(result.insertId);
        }

        // Seed doctors
        console.log('👨‍⚕️ Inserindo médicos...');
        const doctorIds = [];
        for (const doctor of seedData.doctors) {
            const result = await Database.query(`
                INSERT INTO doctors (crm, name, email, phone, specialty)
                VALUES (?, ?, ?, ?, ?)
            `, [doctor.crm, doctor.name, doctor.email, doctor.phone, doctor.specialty]);
            doctorIds.push(result.insertId);
        }

        // Seed admin
        console.log('👨‍💼 Inserindo administrador...');
        const adminPassword = await bcrypt.hash('admin123', 12);
        await Database.query(`
            INSERT INTO admins (username, email, password_hash, name, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'admin@ctc.com', adminPassword, 'Administrador CTC', 'super_admin']);

        // Seed exams (últimos 6 meses)
        console.log('🔬 Inserindo exames...');
        const examIds = [];
        for (let i = 0; i < patientIds.length; i++) {
            const patientId = patientIds[i];
            
            // 3-4 exames por paciente
            for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
                const examType = seedData.examTypes[Math.floor(Math.random() * seedData.examTypes.length)];
                const unit = seedData.units[Math.floor(Math.random() * seedData.units.length)];
                const doctorId = doctorIds[Math.floor(Math.random() * doctorIds.length)];
                
                // Data aleatória nos últimos 6 meses
                const examDate = new Date();
                examDate.setMonth(examDate.getMonth() - Math.floor(Math.random() * 6));
                
                const result = await Database.query(`
                    INSERT INTO exams (patient_id, exam_type, exam_date, status, unit, doctor_id, pdf_path, pacs_link, observations)
                    VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?)
                `, [
                    patientId, examType, examDate.toISOString().split('T')[0], unit, doctorId,
                    `/pdf/exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`,
                    `https://viewer.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78`,
                    'Exame realizado conforme protocolo padrão'
                ]);
                
                examIds.push(result.insertId);
                
                // Adicionar valores para exames laboratoriais
                if (examParameters[examType]) {
                    for (const param of examParameters[examType]) {
                        const value = param.ref_min + (Math.random() * (param.ref_max - param.ref_min) * 1.2);
                        const isNormal = value >= param.ref_min && value <= param.ref_max;
                        
                        await Database.query(`
                            INSERT INTO exam_values (exam_id, parameter_name, value, unit, reference_min, reference_max, is_normal)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [result.insertId, param.name, value.toFixed(2), param.unit, param.ref_min, param.ref_max, isNormal]);
                    }
                }
            }
        }

        // Seed white label settings
        console.log('🎨 Inserindo configurações white-label...');
        for (const setting of seedData.whiteLabel) {
            await Database.query(`
                INSERT INTO white_label_settings (setting_key, setting_value, setting_type)
                VALUES (?, ?, ?)
            `, [setting.key, setting.value, setting.type]);
        }

        // Seed alguns compartilhamentos
        console.log('🔗 Inserindo compartilhamentos de exemplo...');
        for (let i = 0; i < 3; i++) {
            const examId = examIds[Math.floor(Math.random() * examIds.length)];
            const doctorId = doctorIds[Math.floor(Math.random() * doctorIds.length)];
            const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
            const token = uuidv4();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            await Database.query(`
                INSERT INTO exam_shares (exam_id, doctor_id, patient_id, token, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `, [examId, doctorId, patientId, token, expiresAt]);
        }

        // Seed audit logs
        console.log('📝 Inserindo logs de auditoria...');
        for (let i = 0; i < 10; i++) {
            const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
            const actions = ['login', 'view_exam', 'share_exam', 'revoke_access'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            
            await Database.query(`
                INSERT INTO audit_logs (user_id, user_type, action, resource, ip_address, user_agent, details)
                VALUES (?, 'patient', ?, 'exam', '192.168.1.100', 'Mozilla/5.0 Demo Browser', JSON_OBJECT('timestamp', NOW()))
            `, [patientId, action]);
        }

        console.log('🎉 Seed concluído com sucesso!');
        console.log('📋 Dados criados:');
        console.log(`   - ${seedData.patients.length} pacientes`);
        console.log(`   - ${seedData.doctors.length} médicos`);
        console.log(`   - ${examIds.length} exames`);
        console.log(`   - 1 administrador`);
        console.log(`   - ${seedData.whiteLabel.length} configurações white-label`);
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