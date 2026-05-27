# Marquei - Sistema de Agendamento de Beleza

Frontend do sistema Marquei, uma plataforma de agendamento online para salões de beleza e clínicas de estética.

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilização
- **React Context API** - Gerenciamento de estado

## 📋 Funcionalidades

### 🏢 Gestor
- Dashboard com métricas e indicadores
- Gerenciamento de serviços, profissionais e clientes
- Visualização completa da agenda do salão
- Importação em massa de dados (CSV/Excel)
- Análise de desempenho e relatórios

### 💇‍♀️ Profissional
- Visualização da própria agenda do dia
- Marcação de atendimentos como realizados, no-show ou cancelados
- Histórico de atendimentos

### 👤 Cliente
- Agendamento online de serviços
- Remarcação e cancelamento de horários
- Visualização de agendamentos passados e futuros
- Recebimento de notificações automáticas

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd marquei-frontend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador.

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

## 📁 Estrutura do Projeto

```
src/
├── app/                  # App Router do Next.js
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página inicial (redirecionamento)
├── components/          # Componentes reutilizáveis
│   └── Layout.tsx       # Layout com navegação
├── contexts/            # Contextos React
│   └── AuthContext.tsx  # Contexto de autenticação
├── pages/               # Páginas do sistema
│   ├── login.tsx        # Login
│   ├── dashboard.tsx    # Dashboard do gestor
│   ├── services.tsx     # Gerenciamento de serviços
│   ├── professionals.tsx # Gerenciamento de profissionais
│   ├── clients.tsx      # Gerenciamento de clientes
│   ├── appointments.tsx # Agendamentos
│   ├── book.tsx         # Agendamento para clientes
│   ├── schedule.tsx     # Agenda do profissional
│   ├── my-appointments.tsx # Agendamentos do cliente
│   └── import.tsx       # Importação em massa
└── types/               # Tipos TypeScript
    └── index.ts         # Definições de tipos
```

## 🎯 Fluxo do Sistema

1. **Login**: Usuário faz login com seu perfil (gestor, profissional ou cliente)
2. **Redirecionamento**: Sistema redireciona para a página principal do perfil
3. **Navegação**: Menu lateral com opções específicas para cada perfil
4. **Funcionalidades**: Cada perfil tem acesso às funcionalidades correspondentes

## 🔧 Desenvolvimento

### Build para Produção
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## 📝 Notas

- Este é um frontend standalone com dados mockados
- Para integração completa, é necessário desenvolver o backend
- As notificações são simuladas localmente
- A importação de arquivos processa dados mockados

## 🚀 Próximos Passos

- [ ] Desenvolver backend com Node.js e PostgreSQL
- [ ] Implementar sistema de notificações reais
- [ ] Conectar com APIs externas para envio de emails/SMS
- [ ] Implementar sistema de pagamento
- [ ] Adicionar funcionalidades de relatórios avançados
