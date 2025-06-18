const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuração básica do Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Portal de Exames CTC API',
            version: '1.0.0',
            description: `
                API completa para o Portal de Exames CTC - Sistema médico de demonstração comercial.
                
                ## Funcionalidades Principais:
                - 🔐 **Autenticação com 2FA** - Login seguro com token SMS/WhatsApp/Email
                - 🏥 **Gestão de Exames** - CRUD completo de exames médicos
                - 📊 **Timeline Médica** - 27 parâmetros médicos em 6 categorias
                - 👥 **Administração** - Gestão de usuários e configurações white-label
                - 🔗 **Integração PACS** - Visualização de imagens DICOM
                - 📱 **Notificações** - Sistema de alertas e comunicações
                - 🤝 **Delegações** - Gestão de acesso por responsáveis legais
                
                ## Segurança:
                - Autenticação JWT com refresh tokens
                - Passwords com bcrypt hash
                - Rate limiting e validação de entrada
                - Headers de segurança OWASP
                
                ## Demo Credentials:
                - **CPF:** 12345678900
                - **Senha:** 1234
                - **2FA Token:** 123456 (desenvolvimento)
            `,
            contact: {
                name: 'CTC - Centro de Tecnologia Clínica',
                url: 'https://github.com/arthurozassa/portal-exames-ctc',
                email: 'contato@ctc.com.br'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Servidor de Desenvolvimento'
            },
            {
                url: 'https://portal-exames-ctc.herokuapp.com',
                description: 'Servidor de Produção (se disponível)'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido no login'
                }
            },
            schemas: {
                // Schemas serão definidos inline nos endpoints
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'Endpoints de autenticação e autorização'
            },
            {
                name: 'Patients',
                description: 'Gestão de pacientes'
            },
            {
                name: 'Exams',
                description: 'Gestão de exames médicos e timeline'
            },
            {
                name: 'Admin',
                description: 'Administração e configurações'
            },
            {
                name: 'Notifications',
                description: 'Sistema de notificações'
            },
            {
                name: 'Delegations',
                description: 'Delegações e responsáveis legais'
            },
            {
                name: 'PACS',
                description: 'Integração com sistemas PACS/DICOM'
            },
            {
                name: 'System',
                description: 'Endpoints do sistema'
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/docs/endpoints/*.yaml'
    ]
};

const specs = swaggerJSDoc(options);

module.exports = {
    swaggerUi,
    specs
};