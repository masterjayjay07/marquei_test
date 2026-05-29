# Marquei - Sistema de Agendamento de Beleza

Sistema completo de agendamento online para salões de beleza e clínicas de estética, com backend em Node.js/Express e frontend em Next.js.

## 📋 Visão Geral

Este projeto consiste em duas partes:
- **marquei-backend**: API RESTful com autenticação JWT, PostgreSQL e Prisma ORM
- **marquei-frontend**: Interface web em Next.js com Tailwind CSS

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passo 1: Configurar o Backend

1. Navegue para o diretório do backend:
```bash
cd marquei-backend
```

2. Instale as dependências:
```bash
npm install
```

3. O arquivo `.env` já está configurado com a DATABASE_URL. Se precisar recriar o banco:
```bash
npm run prisma:push
npm run prisma:seed
```

4. Execute o servidor em modo desenvolvimento:
```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### Passo 2: Configurar o Frontend

1. Abra um novo terminal e navegue para o diretório do frontend:
```bash
cd marquei-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 🔐 Credenciais de Acesso

### Usuários de Teste

**Gestor:**
- Email: `gestor@marquei.com`
- Senha: `senha123`

**Profissional:**
- Email: `profissional@marquei.com`
- Senha: `senha123`

**Cliente:**
- Email: `cliente@marquei.com`
- Senha: `senha123`

**Para novos clientes:**
- Acesse `http://localhost:3000/register` para se cadastrar

## 📚 Documentação Detalhada

Para mais informações sobre cada parte do projeto, consulte:

- [Backend README](./marquei-backend/README.md) - Documentação completa da API
- [Frontend README](./marquei-frontend/README.md) - Documentação da interface

## 🏗️ Estrutura do Projeto

```
marquei_test/
├── marquei-backend/          # API RESTful
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   └── lib/            # Bibliotecas (prisma, etc)
│   ├── prisma/             # Schema do banco
│   └── package.json
└── marquei-frontend/        # Interface Next.js
    ├── src/
    │   ├── app/            # Páginas do Next.js
    │   ├── components/     # Componentes reutilizáveis
    │   ├── contexts/       # Contextos React
    │   └── services/       # API client
    └── package.json
```

## 🎯 Funcionalidades

### Gestor
- Dashboard com métricas e indicadores
- Gerenciamento de serviços, profissionais e clientes
- Visualização completa da agenda do salão
- Importação em massa de dados (CSV/Excel)
- Análise de desempenho e relatórios

### Profissional
- Visualização da própria agenda do dia
- Marcação de atendimentos como realizados, no-show ou cancelados
- Histórico de atendimentos

### Cliente
- Cadastro de novos clientes
- Agendamento online de serviços
- Remarcação e cancelamento de horários
- Visualização de agendamentos passados e futuros

## 🛠️ Tecnologias

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcryptjs

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Context API