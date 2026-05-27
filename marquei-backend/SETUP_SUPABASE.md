# 🚀 Setup Supabase PostgreSQL - Guia Completo

Supabase é PostgreSQL na nuvem, grátis e não precisa instalar nada!

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase (grátis)

## 🎯 Por que Supabase?

✅ **Grátis** - 500MB de banco, 50MB de backup  
✅ **Sem instalação** - Apenas browser  
✅ **PostgreSQL real** - Não é emulador  
✅ **Production-ready** - Escala infinita  
✅ **Dashboard GUI** - Interface visual  
✅ **API REST** - Pronta para usar  

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Projeto Supabase

1. Acesse https://supabase.com
2. Clique "Start your project"
3. Faça login com GitHub/Google
4. Clique "New Project"
5. Escolha organização (ou crie)
6. Nome do projeto: `marquei-app`
7. Senha do banco: `senha123` (ou qualquer uma)
8. Região: escolha a mais próxima
9. Aguarde 1-2 minutos

### 2. Obter URL do Banco

No painel do Supabase:
1. Vá para **Settings** > **Database**
2. Copie a **Connection string**
3. Use a **URI** (não a pooling)

Exemplo:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
```

### 3. Configurar Backend

```bash
# Copiar .env.example
cp .env.example .env

# Editar .env com a URL do Supabase
DATABASE_URL="postgresql://postgres:sua_senha@db.seu_projeto.supabase.co:5432/postgres"
```

### 4. Rodar Migrations

```bash
# Gerar Prisma Client
npm run prisma:generate

# Push schema para Supabase
npm run prisma:push

# Popular banco com dados iniciais
npm run prisma:seed
```

### 5. Iniciar Backend

```bash
npm run dev
```

## 🔍 Verificação

### Teste via Browser

1. Acesse o painel Supabase
2. Vá para **Table Editor**
3. Você deve ver as tabelas:
   - `users`
   - `services`
   - `professionals`
   - `clients`
   - `appointments`
   - `notifications`
   - `import_jobs`

### Teste via API

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor@marquei.com","password":"senha123"}'
```

### Prisma Studio

```bash
npm run prisma:studio
```

Abra http://localhost:5555 para visualizar os dados!

## 🛠️ Comandos Úteis

### Prisma

```bash
npm run prisma:generate  # Gerar client
npm run prisma:push      # Push schema
npm run prisma:seed      # Popular banco
npm run prisma:studio    # GUI do banco
```

### Supabase

```bash
# Resetar banco (via painel)
# Settings > Database > Reset Database Password
```

## ⚠️ Troubleshooting

### Erro: "Connection refused"

```bash
# Verifique a DATABASE_URL no .env
# Deve ser exatamente como no painel Supabase
```

### Erro: "Database does not exist"

```bash
# Execute prisma:push novamente
npm run prisma:push
```

### Erro: "Authentication failed"

1. Verifique a senha no `.env`
2. Copie a URL novamente do painel
3. Confirme se está usando a URI (não pooling)

### Resetar Tudo

```bash
# No painel Supabase:
# Settings > Database > Reset Database

# Depois rode:
npm run prisma:push
npm run prisma:seed
```

## 🌐 Produção

Para produção, o Supabase já está pronto!

**Upgrade do plano grátis:**
- **Pro**: $25/mês - 8GB banco, 1GB backup
- **Team**: $599/mês - 100GB banco, 10GB backup

**Features extras:**
- Edge Functions (serverless)
- Auth (login social)
- Storage (arquivos)
- Realtime (WebSocket)

## 📱 Alternativas ao Supabase

Se preferir outras opções grátis:

**Neon:**
- https://neon.tech
- PostgreSQL serverless
- Branching automático

**Railway:**
- https://railway.app
- $5/mês após trial
- Deploy automático

**Render:**
- https://render.com
- PostgreSQL grátis
- Deploy fácil

## ✅ Checklist Final

- [ ] Projeto Supabase criado
- [ ] DATABASE_URL copiada para `.env`
- [ ] `npm run prisma:push` executado
- [ ] `npm run prisma:seed` executado
- [ ] Backend rodando (`npm run dev`)
- [ ] Login funcionando
- [ ] Tabelas visíveis no painel

## 🎓 Dicas Pro

### 1. Backup Automático

No painel Supabase:
- Settings > Database
- Enable "Daily backups"

### 2. Monitoramento

- Dashboard > Logs
- Verifique queries lentas
- Monitore uso de memória

### 3. Performance

- Adicione índices via Prisma
- Use connection pooling
- Cache queries frequentes

### 4. Segurança

- Use Row Level Security (RLS)
- Configure API keys
- Monitore acesso

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/with-prisma)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🎉 Parabéns!

Você agora tem:
- ✅ PostgreSQL na nuvem
- ✅ Schema versionado
- ✅ Dados populados
- ✅ Backend production-ready
- ✅ Dashboard GUI

Tudo funcionando sem instalar nada localmente! 🚀
