# 🐘 Setup PostgreSQL - Guia Completo

Este guia mostra como configurar o PostgreSQL para o projeto Marquei.

## 📋 Pré-requisitos

- Docker instalado (recomendado)
- OU PostgreSQL instalado localmente
- Node.js 18+

## 🚀 Opção 1: Docker (Recomendado)

### 1. Inicie o PostgreSQL

```bash
docker-compose up -d
```

Isso irá:
- Criar container PostgreSQL 16
- Expor porta 5432
- Criar banco `marquei_db`
- Usuário: `postgres`
- Senha: `senha123`

### 2. Verifique se está rodando

```bash
docker ps
```

Você deve ver o container `postgres-marquei` rodando.

### 3. Configure o .env

```bash
cp .env.example .env
```

O `.env` deve conter:
```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/marquei_db"
```

### 4. Execute as Migrations

```bash
npm run prisma:push
```

### 5. Popule o Banco (Seed)

```bash
npm run prisma:seed
```

### 6. Inicie o Backend

```bash
npm run dev
```

## 🔧 Opção 2: PostgreSQL Local

### 1. Instale o PostgreSQL

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Ou via Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Crie o Banco

```bash
# Acesse o PostgreSQL
psql -U postgres

# Crie o banco
CREATE DATABASE marquei_db;

# Saia
\q
```

### 3. Configure o .env

```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/marquei_db"
```

### 4. Execute Migrations e Seed

```bash
npm run prisma:push
npm run prisma:seed
npm run dev
```

## 🛠️ Comandos Úteis

### Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# Push schema sem migration
npm run prisma:push

# Seed (popular banco)
npm run prisma:seed

# Abrir Prisma Studio (GUI)
npm run prisma:studio
```

### Docker

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Parar PostgreSQL
docker-compose down

# Ver logs
docker-compose logs -f postgres

# Resetar banco (CUIDADO!)
docker-compose down -v
docker-compose up -d
```

### PostgreSQL

```bash
# Conectar ao banco
docker exec -it postgres-marquei psql -U postgres -d marquei_db

# Ou localmente
psql -U postgres -d marquei_db

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d users

# Sair
\q
```

## 🔍 Verificação

### 1. Teste a Conexão

```bash
# Via Prisma Studio
npm run prisma:studio
```

Abra http://localhost:5555 no navegador.

### 2. Verifique os Dados

```sql
-- Contar usuários
SELECT COUNT(*) FROM users;

-- Ver todos os usuários
SELECT id, name, email, role FROM users;

-- Ver serviços
SELECT * FROM services;
```

### 3. Teste o Backend

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor@marquei.com","password":"senha123"}'
```

## ⚠️ Troubleshooting

### Erro: "Connection refused"

```bash
# Verifique se o PostgreSQL está rodando
docker ps

# Ou
sudo systemctl status postgresql
```

### Erro: "Database does not exist"

```bash
# Recrie o banco
docker-compose down -v
docker-compose up -d
npm run prisma:push
npm run prisma:seed
```

### Erro: "Authentication failed"

Verifique a `DATABASE_URL` no `.env`:
- Usuário correto?
- Senha correta?
- Host correto? (localhost ou 127.0.0.1)
- Porta correta? (5432)

### Resetar Tudo

```bash
# Parar e remover volumes
docker-compose down -v

# Subir novamente
docker-compose up -d

# Recriar schema
npm run prisma:push

# Popular dados
npm run prisma:seed
```

## 🌐 Produção

Para produção, use serviços gerenciados:

- **Supabase** (recomendado) - PostgreSQL grátis
- **Railway** - Deploy fácil
- **Render** - PostgreSQL grátis
- **Heroku** - PostgreSQL addon
- **AWS RDS** - Produção enterprise

Exemplo de `DATABASE_URL` para produção:
```env
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres?pgbouncer=true"
```

## ✅ Checklist Final

- [ ] PostgreSQL rodando (Docker ou local)
- [ ] `.env` configurado com `DATABASE_URL`
- [ ] Migrations executadas (`npm run prisma:push`)
- [ ] Banco populado (`npm run prisma:seed`)
- [ ] Backend rodando (`npm run dev`)
- [ ] Teste de login funcionando

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
