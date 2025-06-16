# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Portal de Exames CTC** - a medical exam portal demo system designed for commercial presentations. The system simulates a complete patient exam portal with secure authentication, white-label admin panel, and mock data.

## Development Commands

### Quick Start (Recommended)
```bash
./scripts/dev.sh  # Starts both backend and frontend concurrently
```

### Backend (Node.js/Express)
```bash
cd backend
npm install --legacy-peer-deps
npm run dev          # Start development server (nodemon on port 3001)
npm start           # Start production server
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run db:migrate  # Initialize database schema
npm run db:seed     # Populate with demo data
npm run db:reset    # Reset and reseed database
```

### Frontend (React/Vite)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev         # Start Vite dev server (port 5173/5174)
npm run build       # Build for production
npm run preview     # Preview production build
npm test            # Run Vitest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage  # Generate test coverage
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run test:components  # Run component tests only
npm run test:pages      # Run page tests only
npm run test:utils      # Run utility tests only
```

### Full Test Suite
```bash
./scripts/run-tests.sh  # Comprehensive test suite (unit, integration, security, builds)
```

### Docker
```bash
docker-compose up -d          # Development environment
docker-compose -f docker-compose.prod.yml up -d  # Production environment
```

## Architecture

**Frontend:** React.js + Vite + TailwindCSS + ShadCN UI
- Located in `/frontend` directory
- Uses React Router for navigation, React Query for state management
- ShadCN UI components with Recharts for data visualization
- Vitest + Testing Library for testing
- ESLint for code quality

**Backend:** Node.js + Express.js
- Located in `/backend` directory  
- SQLite database (with MySQL option) for demo simplicity
- JWT authentication with 2FA simulation
- Jest for testing with security and integration test suites
- Rate limiting and OWASP security practices

**Database:** SQLite for demo simplicity (MySQL support available)
- Database file: `backend/database.sqlite`
- Migration script: `backend/src/database/migrate.js`
- Seed data: `backend/src/database/seed.js`

**Project Structure:**
```
backend/
  src/
    controllers/     # API route handlers
    middleware/      # Auth, security, validation middleware
    models/         # Database models
    routes/         # Express route definitions
    services/       # Business logic layer
    utils/          # Helper functions
  tests/           # Jest test suites (unit, integration, security)
frontend/
  src/
    components/     # Reusable React components
    pages/         # Route-specific page components
    hooks/         # Custom React hooks
    services/      # API client functions
    utils/         # Utility functions
  tests/          # Vitest test suites
```

**Authentication:** 
- bcrypt password encryption
- OWASP ASVS security practices
- 2FA via SMS/WhatsApp/Email (mocked)
- Tokens expire after 5 minutes and are single-use
- Temporary lockout after 5 invalid attempts

## Core Features

### Patient Portal (13 required screens)
1. **Login** - CPF + Password + 2FA
2. **Password Recovery** - Token via SMS/email/WhatsApp
3. **Consent Terms** - Required on first login
4. **Home Dashboard** - Patient name + navigation
5. **Exam List** - Table with type, date, status, unit
6. **Exam Details** - PDF reports + PACS image links
7. **Share with Doctor** - CRM field + 7-day expiring token links
8. **Revoke Access** - Manage doctor access permissions
9. **Delegate Access** - Legal guardian registration
10. **Clinical Timeline** - Charts by exam type with visual alerts
11. **Admin Backoffice** - White-label customization
12. **User/Admin CRUD** - Administrator management
13. **Activity logs** - Access and sharing audit trail

### White-label Admin Panel
- Logo and brand manual upload
- Primary color picker customization
- Institutional text editor (terms, footer, privacy)
- Timeline charts toggle
- Doctor and guardian registration
- Email/token message customization

## Mock Data Requirements

- 3 fictional patients (CPF, name, password, phone, email)
- 10 diverse exams with status, date, unit, type (last 6 months)
- 3 fictional doctors with CRM numbers
- Valid and expired tokens for testing
- Timeline chart data (cholesterol, glucose levels, etc.)
- Simulated access and activity logs

## Demo Credentials

- **CPF:** 12345678900
- **Password:** 1234

## Key Technical Considerations

- All external services (SMS, email, PACS) should be mocked
- No dependencies on external APIs for demo functionality
- Focus on clean UI and complete navigation flow
- Security implementation should follow OWASP guidelines
- Deployment target: Vercel, Render, or Docker local

## Error Messages (Portuguese)

- **Invalid CPF at login:** "CPF não encontrado. Verifique e tente novamente."
- **Wrong password:** "Senha inválida. Tente novamente."
- **Invalid token:** "O código informado está incorreto."
- **Expired token:** "Este código expirou. Solicite um novo para continuar."
- **No exams found:** "Nenhum exame disponível para esse CPF ainda."
- **CPF not found (recovery):** "Não encontramos esse CPF em nossa base. Verifique os números e tente novamente."
- **Invalid/expired token (recovery):** "O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo."

## PACS Integration

Real product integrates with PACS systems (Carestream, Fuji, Pixeon). For demo:
- Use public sandbox links (OHIF Viewer with mock data)
- Or simulate with token-based links
- Examples: OHIF Viewer, Orthanc DICOM Server, DICOM test server UK

## Development Priority

This is a **demo environment for sales presentations** - prioritize visual fidelity and complete user flows over advanced backend optimization. The system must simulate the real product experience convincingly and be ready for future integration expansion (Fastcomm, Tasy, MV).