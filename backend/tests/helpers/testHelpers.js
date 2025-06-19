const crypto = require('crypto');

class TestHelpers {
    /**
     * Generate test user data
     */
    static generateTestUser() {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000);
        
        return {
            cpf: this.generateValidCPF(),
            nome: `Test User ${timestamp}`,
            email: `test${timestamp}${randomSuffix}@example.com`,
            senha: 'TestPassword123!',
            telefone: `119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
        };
    }

    /**
     * Generate a valid CPF for testing
     */
    static generateValidCPF() {
        const cpfs = [
            '12345678901',
            '98765432100',
            '11144477735',
            '22255588846',
            '33366699957'
        ];
        
        return cpfs[Math.floor(Math.random() * cpfs.length)];
    }

    /**
     * Generate invalid CPF for testing
     */
    static generateInvalidCPF() {
        const invalidCpfs = [
            '12345678900', // Invalid check digits
            '00000000000', // All zeros
            '11111111111', // All same digit
            '123456789',   // Too short
            '123456789012' // Too long
        ];
        
        return invalidCpfs[Math.floor(Math.random() * invalidCpfs.length)];
    }

    /**
     * Generate test admin data
     */
    static generateTestAdmin() {
        const timestamp = Date.now();
        
        return {
            username: `admin${timestamp}`,
            name: `Admin User ${timestamp}`,
            email: `admin${timestamp}@example.com`,
            senha: 'AdminPassword123!',
            role: 'admin'
        };
    }

    /**
     * Generate test doctor data
     */
    static generateTestDoctor() {
        const timestamp = Date.now();
        
        return {
            nome: `Dr. Test ${timestamp}`,
            crm: `CRM${Math.floor(Math.random() * 100000)}`,
            especialidade: 'Clínica Geral',
            email: `doctor${timestamp}@example.com`,
            telefone: `119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
        };
    }

    /**
     * Generate test exam data
     */
    static generateTestExam(patientId) {
        const examTypes = [
            'Hemograma Completo',
            'Glicemia de Jejum',
            'Colesterol Total',
            'Triglicerídeos',
            'Ureia',
            'Creatinina',
            'Radiografia de Tórax',
            'Ultrassom Abdominal'
        ];
        
        const statuses = ['completed', 'pending', 'processing'];
        const units = ['Lab Central', 'Lab Norte', 'Lab Sul', 'Unidade Imaging'];
        
        return {
            patient_id: patientId,
            tipo: examTypes[Math.floor(Math.random() * examTypes.length)],
            data_coleta: this.generateRandomDate(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            unidade: units[Math.floor(Math.random() * units.length)],
            observacoes: 'Exam generated for testing purposes'
        };
    }

    /**
     * Generate random date within last 6 months
     */
    static generateRandomDate() {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
        return new Date(randomTime).toISOString().split('T')[0];
    }

    /**
     * Generate test token
     */
    static generateTestToken() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate random string
     */
    static generateRandomString(length = 10) {
        return crypto.randomBytes(length).toString('hex').substring(0, length);
    }

    /**
     * Generate test JWT token
     */
    static generateTestJWT(payload = {}) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { id: 1, cpf: '12345678901', type: 'patient', ...payload },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    }

    /**
     * Generate expired JWT token
     */
    static generateExpiredJWT(payload = {}) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { id: 1, cpf: '12345678901', type: 'patient', ...payload },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '-1h' } // Expired 1 hour ago
        );
    }

    /**
     * Validate error response structure
     */
    static validateErrorResponse(response, expectedStatus) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
    }

    /**
     * Validate success response structure
     */
    static validateSuccessResponse(response, expectedStatus = 200) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
    }

    /**
     * Create mock request object
     */
    static createMockRequest(overrides = {}) {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            user: null,
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent'),
            ...overrides
        };
    }

    /**
     * Create mock response object
     */
    static createMockResponse() {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
            locals: {}
        };
        
        return res;
    }

    /**
     * Create mock next function
     */
    static createMockNext() {
        return jest.fn();
    }

    /**
     * Wait for specified time (for async tests)
     */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up test data (helper for database cleanup)
     */
    static async cleanupTestData(Database, tables = []) {
        for (const table of tables) {
            try {
                await Database.query(`DELETE FROM ${table} WHERE created_at > datetime('now', '-1 hour')`);
            } catch (error) {
                console.warn(`Warning: Could not cleanup table ${table}:`, error.message);
            }
        }
    }

    /**
     * Setup test database with initial data
     */
    static async setupTestDatabase(Database) {
        try {
            // Create test patient
            const testUser = this.generateTestUser();
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(testUser.senha, 12);
            
            await Database.query(
                'INSERT OR IGNORE INTO patients (cpf, name, email, password_hash, phone, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [testUser.cpf, testUser.nome, testUser.email, passwordHash, testUser.telefone, true]
            );

            return testUser;
        } catch (error) {
            console.warn('Warning: Could not setup test database:', error.message);
            return null;
        }
    }

    /**
     * Generate test pagination parameters
     */
    static generateTestPagination() {
        return {
            page: Math.floor(Math.random() * 5) + 1,
            limit: [10, 20, 50][Math.floor(Math.random() * 3)]
        };
    }

    /**
     * Generate malicious payloads for security testing
     */
    static getMaliciousPayloads() {
        return {
            sql_injection: [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' UNION SELECT * FROM patients --"
            ],
            xss: [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>"
            ],
            path_traversal: [
                "../../../etc/passwd",
                "..\\..\\windows\\system32",
                "%2e%2e%2f%2e%2e%2f"
            ]
        };
    }
}

// Make testHelpers globally available for tests
global.testHelpers = TestHelpers;

module.exports = TestHelpers;