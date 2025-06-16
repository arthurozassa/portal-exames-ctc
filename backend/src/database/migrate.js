const Database = require('./connection');

const migrations = [
    // Tabela de pacientes
    `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpf TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        birth_date TEXT,
        gender TEXT DEFAULT 'O' CHECK(gender IN ('M', 'F', 'O')),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME NULL,
        last_login DATETIME NULL,
        consent_accepted INTEGER DEFAULT 0,
        consent_date DATETIME NULL,
        is_active INTEGER DEFAULT 1
    )`,

    // Tabela de médicos
    `CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crm TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        specialty TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )`,

    // Tabela de responsáveis legais
    `CREATE TABLE IF NOT EXISTS legal_guardians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        valid_until TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )`,

    // Tabela de exames
    `CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        exam_type TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('completed', 'pending', 'cancelled')),
        unit TEXT NOT NULL,
        doctor_id INTEGER,
        results TEXT,
        pdf_path TEXT,
        pacs_link TEXT,
        observations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
    )`,

    // Tabela de valores de exames (para gráficos)
    `CREATE TABLE IF NOT EXISTS exam_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL,
        parameter_name TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        reference_min REAL,
        reference_max REAL,
        is_normal INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    )`,

    // Tabela de compartilhamentos
    `CREATE TABLE IF NOT EXISTS exam_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_at DATETIME NULL,
        is_active INTEGER DEFAULT 1,
        revoked_at DATETIME NULL,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )`,

    // Tabela de tokens (2FA, recuperação de senha)
    `CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        token TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('2fa', 'recovery', 'verification')),
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )`,

    // Tabela de administradores
    `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin' CHECK(role IN ('super_admin', 'admin', 'moderator')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME NULL,
        is_active INTEGER DEFAULT 1
    )`,

    // Tabela de configurações white-label
    `CREATE TABLE IF NOT EXISTS white_label_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT DEFAULT 'text' CHECK(setting_type IN ('text', 'color', 'file', 'boolean', 'json')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tabela de logs de auditoria
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_type TEXT NOT NULL CHECK(user_type IN ('patient', 'admin', 'doctor')),
        action TEXT NOT NULL,
        resource TEXT,
        resource_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Índices para performance
    `CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf)`,
    `CREATE INDEX IF NOT EXISTS idx_exams_patient_date ON exams(patient_id, exam_date)`,
    `CREATE INDEX IF NOT EXISTS idx_tokens_patient_type ON tokens(patient_id, type)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, user_type)`,
    `CREATE INDEX IF NOT EXISTS idx_exam_shares_token ON exam_shares(token)`,
    `CREATE INDEX IF NOT EXISTS idx_exam_values_exam ON exam_values(exam_id)`
];

async function runMigrations() {
    try {
        console.log('🔄 Executando migrations SQLite...');
        
        for (let i = 0; i < migrations.length; i++) {
            await Database.query(migrations[i]);
            console.log(`✅ Migration ${i + 1}/${migrations.length} executada`);
        }
        
        console.log('🎉 Todas as migrations foram executadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao executar migrations:', error.message);
        throw error;
    }
}

// Executa as migrations se o arquivo for executado diretamente
if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { runMigrations };