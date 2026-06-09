<div align="center">
  <h1>Cogniux</h1>
  <p>Plataforma de avaliação pedagógica com correção automática e análise por IA.</p>

  ![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white&style=flat-square)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white&style=flat-square)
  ![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase&logoColor=black&style=flat-square)
  ![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white&style=flat-square)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white&style=flat-square)
</div>

---

## Sobre

Cogniux é uma plataforma web voltada para professores criarem, aplicarem e analisarem provas com correção automática. Alunos acessam as atividades por um portal público, sem necessidade de cadastro. Resultados são analisados por IA com recomendações pedagógicas.

## Funcionalidades

- **Criação de provas** com gabarito manual ou gerado por IA a partir de tema e arquivos (PDF/imagem)
- **Portal do aluno** com acesso por código único ou token individual por aluno
- **Correção automática** no envio — nota calculada instantaneamente
- **Dashboard analítico** com gráficos de distribuição de notas, aprovação, evolução mensal e ranking de alunos
- **Gabarito oficial** com toggle de visibilidade e impressão de folhas de resposta em branco ou preenchidas por aluno
- **Plano pedagógico** gerado por IA com análise da turma e recomendações práticas
- **Exportação CSV** de notas por prova
- **QR Code** de acesso direto para cada prova
- **Temas** claro, escuro e sistema

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Estilização | Tailwind CSS v4, shadcn/ui (Base UI), Geist |
| Roteamento | React Router v7 |
| Estado / Cache | TanStack Query v5 |
| Formulários | React Hook Form + Zod |
| Backend / DB | Firebase Firestore |
| Auth | Firebase Authentication (Google) |
| IA | Google Gemini 2.0 Flash (`@google/genai`) |
| Gráficos | Recharts |
| Impressão | react-to-print |
| Testes | Vitest |

---

## Início Rápido

### Pré-requisitos

- **Node.js 20+**
- Projeto no [Firebase Console](https://console.firebase.google.com) com **Authentication** (provedor Google) e **Firestore** habilitados
- Chave de API do [Google AI Studio](https://aistudio.google.com)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/FernaandoJr/cogniux.git
cd cogniux

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local com suas credenciais

# 4. Aplique as regras do Firestore
npm run deploy:firestore-rules

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de Ambiente

Crie `.env.local` na raiz do projeto. Todas as variáveis `VITE_` são obrigatórias — a aplicação lança erro na inicialização se alguma estiver ausente.

```env
# ─── Firebase ────────────────────────────────────────────────────────────────
# Firebase Console → Configurações do projeto → Seus apps
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=         # opcional
VITE_FIREBASE_FIRESTORE_DATABASE_ID=  # use (default) se não criou um banco nomeado

# ─── Google Gemini ────────────────────────────────────────────────────────────
# aistudio.google.com → Get API Key
GEMINI_API_KEY=
```

> [!WARNING]
> `GEMINI_API_KEY` é injetada no bundle via Vite e fica exposta no client. Para um deploy público, mova as chamadas à API Gemini para um backend ou Cloud Function.

---

## Estrutura do Projeto

```
cogniux/
├── src/
│   ├── components/
│   │   ├── ui/                  # Componentes base (shadcn/ui)
│   │   ├── dashboard/           # Cards e tabela do dashboard
│   │   ├── landing/             # Hero, Navbar e seções da landing
│   │   ├── ExamCreator.tsx      # Formulário de criação/edição de provas
│   │   ├── ExamDetail.tsx       # Página de detalhes com abas
│   │   ├── ExamEditDialog.tsx   # Modal de edição rápida de prova
│   │   ├── ExamPrintView.tsx    # Layout de impressão de gabaritos
│   │   ├── Dashboard.tsx        # Painel analítico
│   │   ├── OnlineExam.tsx       # Interface de prova online do aluno
│   │   ├── ProfileDialog.tsx    # Modal de perfil do professor
│   │   └── StudentPortal.tsx    # Portal público do aluno
│   ├── hooks/                   # Custom hooks (useAuth, useExams, useTheme…)
│   ├── lib/                     # Utilitários, Firebase, queries, schemas
│   ├── pages/                   # Páginas roteadas
│   ├── routes/                  # AppRouter, ProtectedRoute, layouts
│   ├── services/                # Integração Gemini (prompts + chamadas)
│   └── types/                   # Interfaces globais (Exam, Student, Submission…)
├── scripts/                     # Scripts Node para Firestore (regras, seed)
├── firestore.rules              # Regras de segurança do Firestore
├── firestore.indexes.json       # Índices compostos do Firestore
└── vite.config.ts
```

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | público | Landing page |
| `/auth` | público | Portal do aluno e login do professor |
| `/online/:examId` | público | Prova online |
| `/dashboard` | professor | Painel com visão geral |
| `/exams` | professor | Lista de provas |
| `/exams/create` | professor | Criação de prova |
| `/exams/:id/edit` | professor | Edição completa de prova |
| `/exams/:id/:tab` | professor | Detalhes da prova (resumo · alunos · notas · plano) |
| `/seed` | professor | Popular banco com dados fictícios |

---

## Modelo de Dados (Firestore)

```
exams/{examId}
  ├── subject, course, className, unit, semester
  ├── numQuestions, alternativesPerQuestion
  ├── answerKey: string[]
  ├── questions?: { text, options[], correctAnswer }[]
  ├── isOnline: boolean
  ├── professorId: string
  ├── createdAt, updatedAt
  │
  ├── submissions/{subId}
  │     studentName, answers[], score, gradedAt, isOnline, accessToken
  │
  ├── students/{studentId}
  │     name, registrationId, createdAt
  │
  └── plans/{planId}
        analysis, recommendations[], createdAt

access_tokens/{token}
  examId, studentName, isUsed, createdAt, usedAt
```

---

## Integração com IA

Todas as chamadas usam `gemini-2.0-flash` com schema JSON estruturado e retry automático (3 tentativas, backoff de 1 s, timeout de 30 s).

| Função | Entrada | Saída |
|---|---|---|
| Gerar questões | matéria, tópico, quantidade, arquivos opcionais | `{ text, options[], correctAnswer }[]` |
| Gerar gabarito | matéria, tópico, quantidade, arquivos opcionais | `string[]` |
| Plano pedagógico | matéria + estatísticas da turma | `{ analysis, recommendations[] }` |

---

## Scripts

```bash
npm run dev                       # servidor de desenvolvimento (porta 3000)
npm run build                     # type-check + build de produção
npm run preview                   # pré-visualização do build

npm run lint                      # ESLint + tsc
npm run format                    # Prettier

npm run test                      # testes unitários em modo watch
npm run test:run                  # testes unitários (CI)
npm run test:coverage             # relatório de cobertura

npm run check:firestore           # verifica conexão com Firestore
npm run deploy:firestore-rules    # publica regras de segurança
npm run deploy:firestore-indexes  # publica índices compostos
npm run deploy:firestore          # publica regras + índices
```

---

## Segurança

- As regras do Firestore (`firestore.rules`) garantem que professores acessem apenas seus próprios dados e que alunos só consigam criar submissions com token válido. Revise antes de qualquer deploy público.
- Para dados de exemplo em desenvolvimento, acesse `/seed` autenticado como professor — a página limpa e recria um conjunto de provas, alunos e notas fictícias.

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.
