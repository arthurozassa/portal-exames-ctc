-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    exam_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Tabela de delegações médicas
CREATE TABLE IF NOT EXISTS delegations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    permissions TEXT NOT NULL, -- JSON com permissões
    status TEXT DEFAULT 'pending', -- pending, active, expired, revoked
    token TEXT UNIQUE NOT NULL,
    last_accessed DATETIME,
    revoked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Tabela de arquivos de exames
CREATE TABLE IF NOT EXISTS exam_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Adicionar coluna has_images na tabela exams se não existir
-- Esta coluna indica se o exame possui imagens PACS
-- ALTER TABLE exams ADD COLUMN has_images BOOLEAN DEFAULT false;

-- Inserir algumas notificações de demonstração
INSERT OR IGNORE INTO notifications (patient_id, title, message, type, created_at) VALUES
(1, 'Novo exame disponível', 'Seu exame de sangue do dia 10/06 está pronto para visualização', 'success', datetime('now', '-2 hours')),
(1, 'Exame compartilhado', 'Você compartilhou o exame de ultrassom com Dr. João Silva', 'info', datetime('now', '-1 day')),
(1, 'Delegação criada', 'Nova delegação criada para Dr. Maria Santos (CRM: 123456/SP)', 'success', datetime('now', '-2 days')),
(1, 'Resultado alterado', 'Seu exame de colesterol apresentou valores acima do normal', 'warning', datetime('now', '-3 days')),
(1, 'Lembrete de exame', 'Você tem um exame agendado para amanhã às 14:00', 'info', datetime('now', '-4 days'));

-- Inserir alguns dados de delegação de demonstração
INSERT OR IGNORE INTO delegations (patient_id, doctor_id, start_date, end_date, permissions, status, token, created_at) VALUES
(1, 1, '2025-06-01', '2025-12-31', '{"viewExams": true, "downloadReports": true, "shareExams": false}', 'active', 'demo-token-1', '2025-06-01 10:00:00'),
(1, 2, '2025-05-15', '2025-11-15', '{"viewExams": true, "downloadReports": false, "shareExams": true}', 'active', 'demo-token-2', '2025-05-15 14:30:00');