# Portal de Exames CTC - Demo

Sistema completo de portal de exames médicos para demonstrações comerciais da CTC, com autenticação segura, painel white-label e integração PACS simulada.

## 🚀 Tecnologias

### Backend
- **Node.js** com Express.js
- **MySQL** para dados persistentes
- **JWT** para autenticação
- **bcrypt** para criptografia de senhas
- **Rate limiting** e middleware de segurança OWASP
- **2FA simulado** (SMS/WhatsApp/Email)

### Frontend
- **React** com Vite
- **TailwindCSS** para estilização
- **ShadCN UI** para componentes
- **React Router** para navegação
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários

## 📋 Funcionalidades

### Portal do Paciente
1. **Login seguro** - CPF + senha + 2FA
2. **Recuperação de senha** - Token via email/SMS/WhatsApp
3. **Termo de consentimento LGPD** - Obrigatório no primeiro acesso
4. **Dashboard** - Visão geral dos exames
5. **Lista de exames** - Filtros por tipo, data, status
6. **Detalhes do exame** - PDF + link PACS simulado
7. **Compartilhamento** - Links tokenizados para médicos (7 dias)
8. **Revogação de acesso** - Gerenciar compartilhamentos
9. **Delegação** - Cadastro de responsáveis legais
10. **Linha do tempo clínica** - Gráficos de evolução
11. **White-label** - Customização visual completa

### Painel Administrativo
- Upload de logo e customização de cores
- Edição de textos institucionais
- Visualização de logs de auditoria
- Gerenciamento de pacientes e exames
- Ativação/desativação de funcionalidades
- Dashboard com estatísticas

## 🔧 Instalação

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+
- Git

### 1. Clone o repositório
\`\`\`bash
git clone <url-do-repositorio>
cd portal-exames-ctc
\`\`\`

### 2. ✅ Banco de dados já configurado
O projeto usa **SQLite** para facilitar o setup - não precisa configurar MySQL!

### 3. Configure o Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env
\`\`\`

Edite o arquivo \`.env\` com suas configurações:
\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_exames_demo
DB_USER=portal_user
DB_PASSWORD=portal_password
JWT_SECRET=sua-chave-super-secreta-aqui
\`\`\`

### 4. Inicialize o banco de dados (SQLite)
\`\`\`bash
# O banco será criado automaticamente
node src/database/migrate.js
node src/database/seed-simple.js
\`\`\`

### 5. Configure o Frontend
\`\`\`bash
cd ../frontend
npm install
\`\`\`

## 🏃‍♂️ Executando

### Desenvolvimento (Forma fácil)
\`\`\`bash
# Execute tudo de uma vez
./scripts/dev.sh
\`\`\`

### Desenvolvimento (Manual)
\`\`\`bash
# Backend (porta 3001)
cd backend
npm install --legacy-peer-deps
npm run dev

# Frontend (porta 5173/5174) - em outro terminal
cd frontend
npm install --legacy-peer-deps
npm run dev
\`\`\`

### URLs da aplicação
- **Frontend:** http://localhost:5173 ou http://localhost:5174
- **Backend:** http://localhost:3001
- **API Health:** http://localhost:3001/health

### Produção com Docker
\`\`\`bash
docker-compose up -d
\`\`\`

## 🔑 Credenciais de Acesso

### Paciente Demo
- **CPF:** 12345678900
- **Senha:** 1234

### Administrador
- **Usuário:** admin
- **Senha:** admin123

### Médicos para teste (CRM)
- Dr. Roberto Santos - CRM/SP 123456
- Dra. Fernanda Lima - CRM/SP 654321
- Dr. Carlos Mendes - CRM/SP 789123

## 📡 API Endpoints

### Autenticação
\`\`\`
POST /api/auth/login           - Login do paciente
POST /api/auth/verify-2fa      - Verificar token 2FA
POST /api/auth/request-password-reset - Solicitar recuperação
POST /api/auth/reset-password  - Redefinir senha
POST /api/auth/admin/login     - Login de administrador
\`\`\`

### Exames
\`\`\`
GET  /api/exams                - Listar exames do paciente
GET  /api/exams/:id            - Detalhes do exame
POST /api/exams/:id/share      - Compartilhar com médico
GET  /api/exams/timeline/data  - Dados para gráficos
\`\`\`

### Administração
\`\`\`
GET  /api/admin/dashboard      - Dashboard administrativo
GET  /api/admin/settings       - Configurações white-label
PUT  /api/admin/settings/:key  - Atualizar configuração
POST /api/admin/upload/logo    - Upload de logo
GET  /api/admin/logs           - Logs de auditoria
\`\`\`

## 🧪 Dados de Teste

O sistema vem pré-populado com:
- **3 pacientes** fictícios
- **10+ exames** variados (últimos 6 meses)
- **3 médicos** com especialidades diferentes
- **Dados de linha do tempo** (colesterol, glicemia, etc.)
- **Compartilhamentos** de exemplo
- **Logs de auditoria** simulados

## 🔒 Segurança

### Implementações OWASP
- ✅ Sanitização de inputs
- ✅ Validação de CPF
- ✅ Rate limiting por IP
- ✅ Headers de segurança (Helmet)
- ✅ Hash seguro de senhas (bcrypt)
- ✅ Tokens JWT com expiração
- ✅ Bloqueio após tentativas inválidas
- ✅ Logs de auditoria completos
- ✅ CORS configurado

### Fluxo de Autenticação
1. Login com CPF + senha
2. Verificação de bloqueio de conta
3. Geração de token 2FA (5 min)
4. Verificação 2FA obrigatória
5. Geração de JWT (5 min) + Refresh token (7 dias)
6. Rate limiting por endpoint

## 🎨 Customização White-label

### Configurações disponíveis
- **Logo da empresa** (upload de imagem)
- **Cores primárias e secundárias** (color picker)
- **Textos institucionais** (termos, rodapé, privacidade)
- **Nome da empresa**
- **Ativação/desativação** de funcionalidades
- **Personalização** de emails/tokens

### Aplicação em tempo real
As mudanças são aplicadas imediatamente em todo o sistema, permitindo demonstrações dinâmicas da funcionalidade white-label.

## 🔗 Integração PACS

### Simulação para Demo
- Links para **OHIF Viewer** com dados públicos
- Integração com **Orthanc DICOM Server**
- URLs tokenizadas com expiração
- Suporte a visualizadores externos

### PACS Reais Suportados
- Carestream
- Fuji
- Pixeon
- Outros via API padrão DICOM

## 📱 Responsividade

O sistema é **totalmente responsivo** e otimizado para:
- 📱 **Mobile** (iOS/Android)
- 📱 **WebView** (apps híbridos)
- 💻 **Tablets**
- 🖥️ **Desktop**

## 🧪 Testes

### Backend
\`\`\`bash
cd backend
npm test                # Todos os testes
npm run test:watch     # Modo watch
npm run test:coverage  # Cobertura
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm test                # Testes unitários
npm run test:components # Testes de componentes
npm run test:coverage  # Cobertura
\`\`\`

## 📊 Performance

### Otimizações implementadas
- **Lazy loading** de componentes
- **Debounce** em busca/filtros
- **Paginação** em todas as listas
- **Cache** de consultas (React Query)
- **Compressão** de assets
- **Bundle splitting**

### Métricas alvo
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 90

## 🚀 Deploy

### Vercel (Frontend)
\`\`\`bash
npm install -g vercel
cd frontend
vercel --prod
\`\`\`

### Railway/Render (Backend)
1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Docker (Completo)
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## 📞 Suporte

### Para demonstrações comerciais
- **Email:** contato@ctc.com.br
- **WhatsApp:** +55 11 9999-9999
- **Site:** https://ctc.com.br

### Documentação técnica
- **API Docs:** http://localhost:3001/api-docs
- **Postman Collection:** `/docs/postman/`
- **Swagger UI:** http://localhost:3001/swagger

## 🏆 Diferenciais

### Para vendas
- ✅ **Demo funcional completa**
- ✅ **Customização em tempo real**
- ✅ **Dados realistas** de hospital
- ✅ **Fluxo de segurança** completo
- ✅ **Responsividade** total
- ✅ **Integração PACS** simulada
- ✅ **Painel administrativo** completo

### Tecnicamente
- ✅ **Arquitetura escalável**
- ✅ **Código limpo** e documentado
- ✅ **Testes automatizados**
- ✅ **Segurança OWASP**
- ✅ **Performance otimizada**
- ✅ **Deploy simplificado**

---

## 📝 Changelog

### v1.0.0 (2024-06-15)
- ✅ Implementação completa do backend
- ✅ Sistema de autenticação 2FA
- ✅ Interface responsiva completa
- ✅ Painel administrativo
- ✅ White-label funcional
- ✅ Integração PACS simulada
- ✅ Logs de auditoria
- ✅ Dados mockados realistas

## 🛠️ Solução de Problemas

### Problemas comuns do Frontend

**Erro: "ERESOLVE unable to resolve dependency tree"**
```bash
cd frontend
npm install --legacy-peer-deps
```

**Erro: "Cannot apply unknown utility class border-border"**
- Este é um aviso do TailwindCSS v4, mas não impede o funcionamento
- O frontend continuará funcionando normalmente

**Erro: "Timeline is not exported by lucide-react"**
- Já corrigido: Timeline foi substituído por Activity
- Se ainda aparecer, execute `npm install --legacy-peer-deps`

### Problemas comuns do Backend

**Erro: "connect ECONNREFUSED ::1:3306"**
```bash
# Verificar se o MySQL está rodando
mysql.server start
# ou
brew services start mysql
```

**Erro: "ER_BAD_DB_ERROR: Unknown database"**
```bash
# Criar o banco manualmente
mysql -u root -p
CREATE DATABASE portal_exames_demo;
exit
cd backend
npm run db:reset
```

**Erro: "JWT_SECRET is required"**
```bash
# Copiar o arquivo de exemplo
cd backend
cp .env.example .env
# Editar as configurações conforme necessário
```

### Performance

**Frontend muito lento:**
- Verifique se está usando `npm run dev` (modo desenvolvimento)
- Para produção, use `npm run build` + `npm run preview`

**Build muito grande:**
- Normal para o ambiente de demo
- Em produção, implementar code splitting

### Portas ocupadas

**Porta 3001 ocupada (Backend):**
```bash
# Matar processo na porta 3001
lsof -ti:3001 | xargs kill -9
```

**Porta 5173/5174 ocupada (Frontend):**
- O Vite automaticamente tentará a próxima porta disponível
- Verifique a mensagem no terminal para ver qual porta está sendo usada

---

**Portal de Exames CTC** - Tecnologia em Saúde 🏥💙