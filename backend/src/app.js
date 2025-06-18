const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Swagger Documentation
const { swaggerUi, specs } = require('./docs/swagger');

const Database = require('./database/connection');
const { 
    securityHeaders, 
    sanitizeInput, 
    apiLimiter 
} = require('./middleware/security');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const delegationRoutes = require('./routes/delegationRoutes');
const pacsRoutes = require('./routes/pacsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(securityHeaders);
app.use(apiLimiter);

// CORS
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:3000',
        'http://localhost:3005',
        'http://127.0.0.1:9000',
        'http://localhost:9000',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de inputs
app.use(sanitizeInput);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Portal de Exames CTC - API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true
    }
}));

// Redirect root to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Portal de Exames CTC API - Online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        documentation: `${req.protocol}://${req.get('host')}/api-docs`
    });
});

// Routes principais
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/delegations', delegationRoutes);
app.use('/api/pacs', pacsRoutes);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Erro interno do servidor' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl
    });
});

// Inicializar servidor
async function startServer() {
    try {
        // Conectar ao banco de dados
        await Database.connect();
        
        app.listen(PORT, () => {
            console.log('🚀 Portal de Exames CTC Backend');
            console.log(`🌐 Servidor rodando na porta ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('✅ Backend inicializado com sucesso!');
        });
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    await Database.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, encerrando servidor...');
    await Database.disconnect();
    process.exit(0);
});

// Inicializar
startServer();

module.exports = app;