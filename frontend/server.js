import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'app-working.html'));
});

// Rota para o app integrado
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'app-integrated.html'));
});

// Rota para o app que estava funcionando
app.get('/dist/app-working.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'app-working.html'));
});

// Rota para debug do menu
app.get('/debug-menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug-menu.html'));
});

// Rota para versão corrigida
app.get('/fixed', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'app-working-fixed.html'));
});

// Rota para versão com navegação funcional
app.get('/v2', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'app-working-v2.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Acesse a aplicação em: http://localhost:${PORT}/app`);
});