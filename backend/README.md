# Portal de Exames CTC - Backend

Backend completo para o Portal de Exames CTC desenvolvido com Node.js, Express.js e SQLite.

## 🚀 Funcionalidades

### Autenticação e Segurança
- **Login seguro** com CPF + senha + 2FA simulado
- **JWT tokens** com expiração configurável (5 minutos por padrão)
- **Refresh tokens** para renovação automática
- **Rate limiting** e proteção contra força bruta
- **Bloqueio automático** após 5 tentativas inválidas
- **Recuperação de senha** com tokens seguros
- **Headers de segurança** (Helmet.js)
- **Sanitização de inputs** e proteção contra XSS/SQL Injection

### APIs Principais
- **CRUD de usuários/pacientes** com validação completa
- **CRUD de exames** com filtros e paginação
- **CRUD de médicos** com especialidades
- **Sistema de compartilhamento** com links tokenizados
- **Delegação de acesso** para responsáveis legais
- **Logs de auditoria** completos
- **Dashboard administrativo** com métricas

### Dados e Relatórios
- **3 pacientes fictícios** pré-cadastrados
- **10+ exames** dos últimos 6 meses
- **5 médicos** com CRM e especialidades
- **Gráficos de timeline** e estatísticas
- **Relatórios por período** com exportação

## 📋 Pré-requisitos

- Node.js 16.0.0 ou superior
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute o seed do banco de dados**
```bash
npm run seed
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
NODE_ENV=development
PORT=3001
DB_PATH=./database/portal_exames.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=5m
JWT_REFRESH_EXPIRES_IN=7d

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MS=1800000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Autenticação

#### Login (Etapa 1)
```http
POST /api/auth/login
Content-Type: application/json

{
  "cpf": "12345678900",
  "senha": "1234"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Código de verificação enviado via SMS/Email",
  "data": {
    "requer2FA": true,
    "cpf": "123.456.789-00",
    "nome": "João Silva",
    "email": "j***@email.com"
  }
}
```

#### Verificar 2FA (Etapa 2)
```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "cpf": "12345678900",
  "token": "123456"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456...",
    "expiresIn": "5m",
    "user": {
      "id": 1,
      "cpf": "123.456.789-00",
      "nome": "João Silva",
      "email": "joao.silva@email.com"
    }
  }
}
```

### Usuários

#### Obter Perfil
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Atualizar Perfil
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "telefone": "(11) 99999-9999"
}
```

#### Alterar Senha
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "senhaAtual": "1234",
  "novaSenha": "nova123"
}
```

### Exames

#### Listar Exames
```http
GET /api/exams?page=1&limit=10&tipo=hemograma&dataInicio=2024-01-01
Authorization: Bearer <token>
```

#### Obter Exame
```http
GET /api/exams/1
Authorization: Bearer <token>
```

#### Compartilhar Exame
```http
POST /api/exams/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "exameId": 1,
  "medicoId": 2,
  "diasExpiracao": 7
}
```

#### Visualizar Exame Compartilhado (Público)
```http
GET /api/exams/shared/abcd1234efgh5678ijkl9012mnop3456
```

### Médicos

#### Listar Médicos
```http
GET /api/doctors?page=1&limit=20&especialidade=cardiologia
Authorization: Bearer <token>
```

#### Obter Médico
```http
GET /api/doctors/1
Authorization: Bearer <token>
```

### Administração

#### Login Admin
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@ctc.com.br",
  "senha": "admin123"
}
```

#### Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Listar Usuários
```http
GET /api/admin/users?page=1&status=ativo&search=joão
Authorization: Bearer <admin-token>
```

## 🔐 Credenciais Demo

### Usuários
- **CPF:** 12345678900 / **Senha:** 1234
- **CPF:** 98765432100 / **Senha:** 1234
- **CPF:** 11122233344 / **Senha:** 1234

### Administrador
- **Email:** admin@ctc.com.br / **Senha:** admin123

### Links de Compartilhamento Demo
- Token 1: `abcd1234efgh5678ijkl9012mnop3456`
- Token 2: `wxyz7890abcd1234efgh5678ijkl9012`
- Token 3: `mnop3456qrst7890uvwx1234yzab5678`

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de coverage
npm test -- --coverage
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/          # Controladores da API
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── examController.js
│   │   ├── doctorController.js
│   │   └── adminController.js
│   ├── middleware/           # Middlewares
│   │   ├── auth.js          # Autenticação JWT
│   │   ├── validation.js    # Validação de dados
│   │   └── security.js      # Rate limiting e segurança
│   ├── models/              # Modelos de dados
│   │   └── database.js      # Conexão SQLite
│   ├── routes/              # Definição de rotas
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── exams.js
│   │   ├── doctors.js
│   │   └── admin.js
│   ├── services/            # Lógica de negócio
│   ├── utils/               # Utilitários
│   │   ├── auth.js          # Helpers de autenticação
│   │   └── validators.js    # Validadores customizados
│   └── app.js               # Arquivo principal
├── database/                # Banco de dados
│   ├── portal_exames.db     # SQLite database
│   └── seed.js              # Script de população
├── tests/                   # Testes automatizados
│   ├── auth.test.js
│   ├── setup.js
│   └── env.setup.js
├── .env                     # Variáveis de ambiente
├── package.json
└── README.md
```

## 🔒 Recursos de Segurança

### Autenticação
- ✅ JWT com expiração curta (5 minutos)
- ✅ Refresh tokens para renovação
- ✅ 2FA simulado com códigos de 6 dígitos
- ✅ Bloqueio automático após falhas
- ✅ Recuperação segura de senha

### Proteções
- ✅ Rate limiting por IP e endpoint
- ✅ Headers de segurança (Helmet)
- ✅ CORS configurado
- ✅ Sanitização de inputs
- ✅ Proteção contra XSS
- ✅ Proteção contra SQL Injection
- ✅ Validação rigorosa de dados

### Logs e Auditoria
- ✅ Log de todas as ações sensíveis
- ✅ Rastreamento de IPs
- ✅ Histórico de compartilhamentos
- ✅ Monitoramento de tentativas de acesso

## 📊 Monitoramento

### Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 3600
}
```

### Métricas Disponíveis
- Total de usuários ativos
- Exames realizados por período
- Compartilhamentos por médico
- Taxa de visualização de compartilhamentos
- Logs de auditoria por ação

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build    # Se houver build step
npm start
```

### Docker (Opcional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@ctc.com.br
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: https://ctc.com.br

---

**Portal de Exames CTC** - Desenvolvido com ❤️ para facilitar o acesso aos seus exames médicos.