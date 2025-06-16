const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        try {
            // Usar SQLite para facilitar o demo
            const dbPath = path.join(__dirname, '../../database.sqlite');
            
            this.db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            // Habilitar foreign keys
            await this.db.exec('PRAGMA foreign_keys = ON');

            console.log('✅ Conectado ao SQLite com sucesso');
            console.log(`📁 Banco de dados: ${dbPath}`);
            return this.db;
        } catch (error) {
            console.error('❌ Erro ao conectar com SQLite:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.db) {
            await this.db.close();
            console.log('🔌 Desconectado do SQLite');
        }
    }

    async query(sql, params = []) {
        if (!this.db) {
            await this.connect();
        }

        try {
            // Se é um SELECT, usar all(), senão usar run()
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const rows = await this.db.all(sql, params);
                return rows;
            } else {
                const result = await this.db.run(sql, params);
                return { insertId: result.lastID, affectedRows: result.changes };
            }
        } catch (error) {
            console.error('❌ Erro na query:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    async transaction(callback) {
        if (!this.db) {
            await this.connect();
        }

        await this.db.exec('BEGIN TRANSACTION');
        
        try {
            const result = await callback(this.db);
            await this.db.exec('COMMIT');
            return result;
        } catch (error) {
            await this.db.exec('ROLLBACK');
            throw error;
        }
    }
}

module.exports = new Database();