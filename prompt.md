**Título do Pedido:**
Portal de Exames CTC – Ambiente Demo Web Completo (com Banco de Dados, Fluxo Autêntico e Painel White-label)

---

**Descrição Geral:**
Estamos desenvolvendo um ambiente de demonstração para o nosso produto **Portal de Exames para Pacientes**, com a stack moderna (React.js + Node.js ou Laravel + MySQL). O objetivo é simular a experiência final do produto real, com navegação completa, autenticação segura, backoffice white-label e dados mockados.

Este ambiente será usado para **apresentações comerciais** e deve refletir fielmente o fluxo validado em escopo, com dados simulados e personalização por cliente (cores, logotipo, textos).

---

## 🔧 Stack Técnica

* **Frontend:** React.js + TailwindCSS + ShadCN UI

  * Utilizar os gráficos e componentes de [https://ui.shadcn.com/charts/bar#charts](https://ui.shadcn.com/charts/bar#charts)
  * Responsivo, com suporte a WebView (Mobile App)

* **Backend (escolher uma das opções):**

  * Node.js (Express.js)
  * Laravel (PHP 8+)

* **Banco de Dados:** MySQL (preferencial) ou SQLite (se mais simples no demo)

* **Autenticação Segura:**

  * Criptografia de senha com bcrypt
  * Boas práticas OWASP (ASVS)
  * Autenticação com dois fatores (2FA) via SMS, WhatsApp ou E-mail (mock)
  * Tokens expiram após 5 minutos e são de uso único
  * Bloqueio temporário após 5 tentativas inválidas

---

## 🔐 Fluxo de Recuperação de Senha

* Campo CPF com verificação de existência
* Envio de token de recuperação por e-mail/SMS/WhatsApp (simulado)
* Tela para nova senha
* Mensagens amigáveis:

  * CPF não encontrado → “Não encontramos esse CPF em nossa base. Verifique os números e tente novamente.”
  * Token inválido ou expirado → “O código informado está incorreto ou expirado. Clique em reenviar para gerar um novo.”

---

## ✅ Comportamento Esperado em Erros

* **CPF inválido no login:** “CPF não encontrado. Verifique e tente novamente.”
* **Senha errada:** “Senha inválida. Tente novamente.”
* **Token incorreto:** “O código informado está incorreto.”
* **Token expirado:** “Este código expirou. Solicite um novo para continuar.”
* **Sem exames cadastrados:** “Nenhum exame disponível para esse CPF ainda.”

---

## 📋 Telas e Funcionalidades

1. **Tela de Login (com 2FA)**
2. **Esqueci minha senha (com envio de token e troca segura)**
3. **Termo de Consentimento LGPD (obrigatório no 1º acesso)**
4. **Home logada do paciente**
5. **Lista de Exames (data, status, tipo)**
6. **Detalhe do Exame (PDF simulado + link imagem PACS)**
7. **Compartilhamento com Médico (formulário com CRM e link tokenizado)**
8. **Revogação de acesso compartilhado**
9. **Delegação de Acesso (cadastro de responsável legal)**
10. **Linha do Tempo Clínica (ex: colesterol/glicemia com alertas gráficos)**
11. **Backoffice Administrativo (white-label):**

    * Upload de logo
    * Configuração de cor
    * Edição de textos institucionais (termos, rodapé)
    * Visualização de logs de acesso e compartilhamento
    * Ativação/desativação de funcionalidades
    * Gerenciamento de médicos, procuradores e admins

---

## 🧪 Dados Simulados

* 3 pacientes (com CPF, e-mail, celular, senha)
* 10 exames variados, datas nos últimos 6 meses
* 3 médicos (CRM + nome)
* Tokens válidos e expirados
* Dados para gráficos da Linha do Tempo

---

## 🧩 Integração com PACS

* O produto real será integrado com PACS como Carestream, Fuji, Pixeon, entre outros.
* A navegação no exame deve conter link com acesso seguro e temporário à imagem (DICOM/PACS).
* No ambiente demo, simular com:

  * Link estático de sandbox pública (ex: OHIF Viewer com dados mockados)
  * Ou link simulado com token

**Exemplos de sandbox gratuitas:**

* [OHIF Viewer](https://ohif.org)
* [Orthanc DICOM Server](https://www.orthanc-server.com/static.php?page=samples)
* [DICOM test server UK](https://www.dicomserver.co.uk/)

---

## 📦 Extras Técnicos

* Repositório com `README.md` explicando instalação local
* Responsividade total para mobile, tablets e WebView
* Estrutura organizada para expansão futura (Fastcomm)
* API documentada (rotas simuladas)
* Componentes visuais com ShadCN UI (gráficos de evolução, tabelas, alertas)

---

## 🎯 Objetivo

Gerar um ambiente **demo funcional, navegável e seguro**, com interface profissional, responsiva e amigável para o paciente. O sistema será usado para **demonstrações comerciais do produto final da CTC**, com estrutura pronta para evoluir com integrações reais (ex: Fastcomm, Tasy, MV, PACS).
