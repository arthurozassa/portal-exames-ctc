const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/portal_exames.db');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar com o banco de dados:', err.message);
          reject(err);
        } else {
          console.log('Conectado ao banco de dados SQLite');
          this.createTables();
          resolve(this.db);
        }
      });
    });
  }

  createTables() {
    const tables = [
      // Tabela de usuários (pacientes)
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpf TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefone TEXT,
        data_nascimento DATE,
        senha_hash TEXT NOT NULL,
        tentativas_login INTEGER DEFAULT 0,
        bloqueado_ate DATETIME,
        token_2fa TEXT,
        token_2fa_expira DATETIME,
        token_recuperacao TEXT,
        token_recuperacao_expira DATETIME,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de médicos
      `CREATE TABLE IF NOT EXISTS medicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        crm TEXT UNIQUE NOT NULL,
        especialidade TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefone TEXT,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de exames
      `CREATE TABLE IF NOT EXISTS exames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        medico_id INTEGER,
        tipo_exame TEXT NOT NULL,
        descricao TEXT,
        data_realizacao DATE NOT NULL,
        resultado TEXT,
        arquivo_url TEXT,
        status TEXT DEFAULT 'concluido',
        observacoes TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users (id),
        FOREIGN KEY (medico_id) REFERENCES medicos (id)
      )`,

      // Tabela de compartilhamentos
      `CREATE TABLE IF NOT EXISTS compartilhamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exame_id INTEGER NOT NULL,
        medico_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        data_expiracao DATETIME NOT NULL,
        visualizado BOOLEAN DEFAULT 0,
        data_visualizacao DATETIME,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exame_id) REFERENCES exames (id),
        FOREIGN KEY (medico_id) REFERENCES medicos (id)
      )`,

      // Tabela de responsáveis legais
      `CREATE TABLE IF NOT EXISTS responsaveis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        responsavel_cpf TEXT NOT NULL,
        responsavel_nome TEXT NOT NULL,
        responsavel_email TEXT NOT NULL,
        parentesco TEXT NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users (id)
      )`,

      // Tabela de logs de auditoria
      `CREATE TABLE IF NOT EXISTS logs_auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        acao TEXT NOT NULL,
        tabela TEXT,
        registro_id INTEGER,
        dados_anteriores TEXT,
        dados_novos TEXT,
        ip_address TEXT,
        user_agent TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users (id)
      )`,

      // Tabela de administradores
      `CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        nome TEXT NOT NULL,
        permissoes TEXT DEFAULT 'admin',
        ativo BOOLEAN DEFAULT 1,
        ultimo_login DATETIME,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de tokens de refresh
      `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expira_em DATETIME NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users (id)
      )`
    ];

    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Erro ao criar tabela:', err.message);
        }
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
          console.log('Conexão com o banco de dados fechada');
        }
      });
    }
  }
}

module.exports = new Database();