# Marquei Backend

API RESTful para o sistema de agendamento Marquei.

## � Credenciais de Acesso

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

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Prisma ORM** - ORM moderno para TypeScript
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Morgan** - Logging de requisições
- **Helmet** - Segurança
- **CORS** - Compartilhamento de recursos

## 📋 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout

### Serviços
- `GET /api/services` - Listar todos os serviços
- `GET /api/services/:id` - Obter serviço específico
- `POST /api/services` - Criar novo serviço (manager)
- `PUT /api/services/:id` - Atualizar serviço (manager)
- `DELETE /api/services/:id` - Excluir serviço (manager)

### Profissionais
- `GET /api/professionals` - Listar todos os profissionais
- `GET /api/professionals/:id` - Obter profissional específico
- `POST /api/professionals` - Criar novo profissional (manager)
- `PUT /api/professionals/:id` - Atualizar profissional (manager)
- `DELETE /api/professionals/:id` - Excluir profissional (manager)

### Clientes
- `GET /api/clients` - Listar todos os clientes (manager)
- `GET /api/clients/:id` - Obter cliente específico (manager)
- `POST /api/clients` - Criar novo cliente (manager)
- `PUT /api/clients/:id` - Atualizar cliente (manager)
- `DELETE /api/clients/:id` - Excluir cliente (manager)

### Agendamentos
- `GET /api/appointments` - Listar agendamentos (com filtros)
- `GET /api/appointments/:id` - Obter agendamento específico
- `POST /api/appointments` - Criar novo agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Excluir agendamento (manager)

### Dashboard
- `GET /api/dashboard` - Métricas do dashboard (manager)
- `GET /api/dashboard/appointments-by-date` - Agendamentos por período (manager)
- `GET /api/dashboard/professional-performance` - Desempenho dos profissionais (manager)

### Health Check
- `GET /api/health` - Verificar status da API

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos, inclua o token no header:

```
Authorization: Bearer <seu_token_jwt>
```

## 👥 Perfis de Acesso

- **Manager**: Acesso completo a todas as funcionalidades
- **Professional**: Acesso limitado aos próprios agendamentos
- **Client**: Acesso limitado aos próprios agendamentos e criação de novos

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd marquei-backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o PostgreSQL (escolha uma opção):

**Opção A: Supabase (Recomendado - Grátis, sem instalação)**
```bash
# 1. Crie projeto em https://supabase.com
# 2. Copie a DATABASE_URL do painel
# 3. Cole no arquivo .env
# 4. Execute:
npm run prisma:push
npm run prisma:seed
```

**Opção B: Docker**
```bash
docker-compose up -d
npm run prisma:push
npm run prisma:seed
```

**Opção C: PostgreSQL Local**
```bash
# Instale PostgreSQL e crie o banco
createdb marquei_db
# Configure DATABASE_URL no .env
npm run prisma:push
npm run prisma:seed
```

5. Execute em modo desenvolvimento:
```bash
npm run dev
```

5. Ou build e execute em produção:
```bash
npm run build
npm start
```

## 🌍 Variáveis de Ambiente

- `DATABASE_URL` - URL de conexão PostgreSQL
- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (development/production)
- `JWT_SECRET` - Chave secreta para JWT
- `JWT_EXPIRES_IN` - Tempo de expiração do token (padrão: 7d)

## 📊 Banco de Dados

O sistema utiliza **PostgreSQL** com **Prisma ORM**:

- **Desenvolvimento:** Supabase (grátis, sem instalação) ou Docker
- **Produção:** Supabase, Railway, Neon, etc.
- **ORM:** Prisma para type-safe queries
- **Migrations:** Versionamento automático do schema
- **Seed:** Dados iniciais com senhas hash (bcryptjs)

### 🚀 Setup Recomendado: Supabase

1. Crie projeto grátis em https://supabase.com
2. Copie a `DATABASE_URL` do painel
3. Cole no `.env`
4. Rode `npm run prisma:push` e `npm run prisma:seed`

Veja `SETUP_SUPABASE.md` para guia completo.

## 🧪 Testes

```bash
# Testar health check
curl http://localhost:3001/api/health

# Testar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor@marquei.com","password":"123456"}'
```

## 📝 Estrutura do Projeto

```
src/
├── app.ts                 # Aplicação Express
├── database/
│   └── database.ts        # Banco de dados em memória
├── middleware/
│   └── auth.ts           # Middleware de autenticação
├── routes/               # Rotas da API
│   ├── auth.ts          # Autenticação
│   ├── services.ts      # Serviços
│   ├── professionals.ts # Profissionais
│   ├── clients.ts       # Clientes
│   ├── appointments.ts  # Agendamentos
│   └── dashboard.ts     # Dashboard
└── types/
    └── index.ts         # Tipos TypeScript
```

## 🚀 Próximos Passos

- [ ] Integrar com PostgreSQL
- [ ] Implementar sistema de notificações
- [ ] Adicionar validação de dados
- [ ] Implementar rate limiting
- [ ] Adicionar testes unitários
- [ ] Implementar logging estruturado
