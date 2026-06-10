# Apresentação do Projeto Marquei - Sistema de Agendamento de Beleza

## 1. INTRODUÇÃO (2-3 minutos)

### Abertura
Bom dia/Boa tarde! Hoje vou apresentar o **Marquei**, um sistema completo de agendamento para salões de beleza que desenvolvi como solução para o teste técnico.

### Visão Geral do Projeto
O Marquei é uma aplicação full-stack que permite:
- Gestão completa de agendamentos
- Controle de profissionais, clientes e serviços
- Sistema de notificações e lembretes automáticos
- Importação em massa de dados
- Dashboard com métricas de negócio

---

## 2. ARQUITETURA E TECNOLOGIAS (3-4 minutos)

### Stack Tecnológica Escolhida

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM com PostgreSQL (Supabase)
- JWT para autenticação
- Bcrypt para segurança de senhas

**Frontend:**
- Next.js 14 com App Router
- React + TypeScript
- TailwindCSS para estilização
- Context API para gerenciamento de estado

### Por que essas escolhas?

1. **TypeScript em todo o projeto**: Garante type-safety, reduz bugs e melhora a manutenibilidade
2. **Prisma ORM**: Facilita migrações, oferece type-safety no banco de dados e excelente DX
3. **Next.js 14**: Framework moderno com SSR, otimizações automáticas e excelente performance
4. **PostgreSQL**: Banco robusto, relacional, ideal para dados estruturados como agendamentos
5. **Supabase**: Solução cloud que facilita deploy e oferece infraestrutura confiável

---

## 3. ESTRUTURA DO PROJETO (4-5 minutos)

### Backend (`marquei-backend/`)

```
src/
├── routes/          # Rotas da API (auth, appointments, clients, etc.)
├── middleware/      # Autenticação e autorização
├── database/        # Configuração do banco
├── lib/            # Prisma client
└── types/          # Tipos TypeScript compartilhados
```

**Principais funcionalidades implementadas:**
- Sistema de autenticação com 3 níveis de acesso (MANAGER, PROFESSIONAL, CLIENT)
- CRUD completo para serviços, profissionais, clientes e agendamentos
- Sistema de disponibilidade com verificação de conflitos
- Importação em massa via CSV/Excel com processamento assíncrono
- Notificações automáticas e lembretes

### Frontend (`marquei-frontend/`)

```
src/
├── app/            # Páginas (Next.js App Router)
├── components/     # Componentes reutilizáveis
├── contexts/       # Context API (AuthContext)
├── services/       # Chamadas à API
└── hooks/          # Custom hooks (useReminderService)
```

**Páginas principais:**
- Login/Register
- Dashboard com métricas
- Gestão de serviços, profissionais e clientes
- Agendamentos (visão geral e pessoal)
- Sistema de notificações
- Importação em massa

---

## 4. FUNCIONALIDADES PRINCIPAIS (5-6 minutos)

### 4.1 Sistema de Autenticação e Autorização
- JWT com refresh token
- 3 níveis de acesso com permissões específicas
- Middleware de proteção de rotas
- Redirecionamento automático baseado em role

### 4.2 Gestão de Agendamentos
- Criação com validação de disponibilidade
- Verificação de conflitos de horário
- Slots de 30 minutos
- Cálculo automático de horário de término baseado na duração do serviço
- Status: SCHEDULED, COMPLETED, NO_SHOW, CANCELLED

### 4.3 Sistema de Disponibilidade
- Horários configuráveis por profissional
- Verificação em tempo real de slots disponíveis
- Considera duração do serviço
- Previne double booking

### 4.4 Sistema de Notificações e Lembretes Automáticos

**Visão Geral:**
Sistema completo de notificações que mantém clientes e profissionais informados sobre seus agendamentos através de lembretes automáticos.

**Tipos de Notificações:**
- **APPOINTMENT_REMINDER**: Lembrete 24h antes do agendamento
- **APPOINTMENT_CONFIRMED**: Confirmação de novo agendamento
- **APPOINTMENT_CANCELLED**: Notificação de cancelamento
- **SYSTEM_NOTIFICATION**: Avisos gerais do sistema

**Funcionalidades:**
- **Lembretes automáticos**: Enviados 24h antes de cada agendamento
- **Processamento em background**: Roda automaticamente a cada 5 minutos
- **Notificações em tempo real**: Polling a cada 30 segundos no frontend
- **Contador de não lidas**: Badge visual no ícone de notificações
- **Histórico completo**: Todas as notificações ficam registradas
- **Marcação de leitura**: Usuário pode marcar como lida individualmente

**Fluxo Técnico - Lembretes Automáticos:**

1. **Agendamento Criado**:
   - Sistema registra data/hora do agendamento
   - Calcula quando enviar lembrete (24h antes)

2. **Processamento Periódico** (a cada 5 minutos):
   - Endpoint `/api/reminders/process` é chamado
   - Busca agendamentos nas próximas 24-25 horas
   - Filtra apenas agendamentos com status `SCHEDULED`
   - Verifica se já foi enviado lembrete (evita duplicatas)

3. **Criação da Notificação**:
   - Cria registro na tabela `Notification`
   - Vincula ao usuário (cliente ou profissional)
   - Define tipo como `APPOINTMENT_REMINDER`
   - Marca como não lida (`read: false`)
   - Inclui detalhes: serviço, data, hora, profissional

4. **Atualização do Agendamento**:
   - Campo `reminderSent` marcado como `true`
   - Previne envio duplicado do mesmo lembrete

5. **Exibição no Frontend**:
   - Polling a cada 30 segundos busca contador de não lidas
   - Badge atualiza automaticamente
   - Lista de notificações ordenada por data (mais recentes primeiro)
   - Ícone de sino com badge numérico

**Sincronização Frontend:**
- **Hook customizado**: `useReminderService` centraliza lógica
- **Eventos customizados**: `remindersProcessed` sincroniza componentes
- **Polling inteligente**: Apenas quando usuário está logado
- **Atualização automática**: Contador atualiza sem refresh da página

**Exemplo de Lembrete:**
```
Título: "Lembrete de Agendamento"
Mensagem: "Você tem um agendamento amanhã às 14:00 - Corte de Cabelo com João Silva"
Tipo: APPOINTMENT_REMINDER
Status: Não lida
```

**Otimizações:**
- **Índices no banco**: Queries otimizadas para buscar agendamentos futuros
- **Batch processing**: Processa múltiplos lembretes de uma vez
- **Cache de contador**: Reduz queries desnecessárias
- **Debounce**: Evita múltiplas requisições simultâneas

### 4.5 Importação em Massa (Sistema de Upload CSV/Excel)

**Visão Geral:**
Sistema completo para importação de dados legados de clientes e agendamentos através de arquivos CSV ou Excel.

**Funcionalidades:**
- **Suporte para múltiplos formatos**: CSV (.csv) e Excel (.xlsx, .xls)
- **Dois tipos de importação**:
  - **Clientes**: Nome, Email, Telefone
  - **Agendamentos**: Data, Hora, Cliente Email, Profissional Email, Serviço ID
- **Processamento assíncrono**: Não trava a aplicação durante upload de arquivos grandes
- **Sistema de Jobs**: Cada importação gera um job com ID único
- **Tracking em tempo real**: Barra de progresso mostra linhas processadas
- **Validação robusta**: Cada linha é validada antes da inserção
- **Relatório de erros**: Lista detalhada com número da linha e motivo do erro
- **Histórico completo**: Todas as importações ficam registradas com status

**Fluxo Técnico:**
1. **Upload**: Frontend envia arquivo via FormData para `/api/import`
2. **Criação do Job**: Backend cria registro com status `queued`
3. **Processamento Assíncrono**: 
   - Parse do arquivo (CSV Parser / XLSX)
   - Validação linha por linha
   - Inserção no banco com tratamento de erros
   - Atualização de progresso a cada 10 linhas
4. **Polling Frontend**: A cada 2 segundos busca status atualizado
5. **Finalização**: Job marcado como `completed` ou `completed_with_errors`

**Validações Implementadas:**
- **Clientes**: Email único, formato válido, campos obrigatórios
- **Agendamentos**: Cliente existe, profissional existe, serviço existe, horário válido, sem conflitos

**Status Possíveis:**
- `queued`: Aguardando processamento
- `processing`: Em processamento
- `completed`: Concluído com sucesso
- `completed_with_errors`: Concluído com algumas falhas

**Tratamento de Erros:**
- Erros não interrompem o processamento
- Cada erro é registrado com linha e mensagem
- Linhas com erro são puladas, válidas são inseridas
- Relatório final mostra: Total, Processadas, Sucesso, Erros

### 4.6 Dashboard e Métricas
- Taxa de ocupação
- Taxa de não comparecimento
- Faturamento estimado
- Serviços mais procurados
- Distribuição por status

---

## 5. DECISÕES TÉCNICAS IMPORTANTES (3-4 minutos)

### 5.1 Banco de Dados
**Decisão:** PostgreSQL com Prisma ORM

**Motivos:**
- Relacionamentos complexos entre entidades
- Necessidade de integridade referencial
- Suporte a JSON para campos flexíveis (workSchedule)
- Prisma oferece migrações seguras e type-safety

### 5.2 Autenticação
**Decisão:** JWT com localStorage

**Motivos:**
- Stateless, escalável
- Fácil integração entre frontend e backend
- Token contém role para autorização rápida

### 5.3 Sistema de Notificações
**Decisão:** Polling + Eventos customizados

**Motivos:**
- Simplicidade de implementação
- Não requer WebSocket ou infraestrutura adicional
- Suficiente para o escopo do projeto
- Eventos customizados para sincronização entre componentes

### 5.4 Importação Assíncrona
**Decisão:** Jobs com status tracking

**Motivos:**
- Evita timeout em uploads grandes
- Feedback visual para o usuário
- Permite processamento em background
- Relatório detalhado de erros

### 5.5 Validação de Horários
**Decisão:** Validação no backend + verificação no frontend

**Motivos:**
- Backend garante integridade dos dados
- Frontend oferece UX melhor com feedback imediato
- Previne condições de corrida

---

## 6. DESAFIOS E SOLUÇÕES (3-4 minutos)

### Desafio 1: Gerenciamento de Fusos Horários
**Problema:** Datas e horários podem ser interpretados incorretamente entre frontend e backend

**Solução:**
- Armazenar datas como strings UTC no formato ISO
- Separar data e hora em campos distintos
- Usar `timeZone: 'UTC'` nas conversões do frontend
- Validação consistente em ambos os lados

### Desafio 2: Verificação de Disponibilidade
**Problema:** Calcular slots disponíveis considerando duração variável de serviços

**Solução:**
- Algoritmo que itera em intervalos de 30 minutos
- Verifica se há tempo suficiente para o serviço completo
- Considera agendamentos existentes e horários de trabalho
- Retorna apenas slots válidos

### Desafio 3: Importação de Dados Legados
**Problema:** Processar grandes volumes de dados sem travar a aplicação

**Solução:**
- Sistema de jobs com status tracking
- Processamento em background
- Validação linha por linha com relatório de erros
- Atualização de progresso em tempo real

### Desafio 4: Sincronização de Estado
**Problema:** Manter notificações atualizadas em múltiplos componentes

**Solução:**
- Polling periódico para buscar contador
- Eventos customizados do browser (`remindersProcessed`)
- Hook customizado para centralizar lógica de lembretes
- Context API para estado global de autenticação

---

## 7. MELHORIAS FUTURAS (2-3 minutos)

### Curto Prazo
1. **WebSocket para notificações em tempo real** - Substituir polling por conexão persistente
2. **Testes automatizados** - Unit tests e E2E com Jest e Playwright
3. **Cache com Redis** - Melhorar performance de consultas frequentes
4. **Upload de imagens** - Fotos de perfil e galeria de serviços

### Médio Prazo
1. **Sistema de pagamentos** - Integração com Stripe/PagSeguro
2. **Relatórios avançados** - Exportação em PDF, gráficos detalhados
3. **App mobile** - React Native para clientes
4. **Integração com calendários** - Google Calendar, Outlook

### Longo Prazo
1. **Multi-tenancy** - Suporte para múltiplos salões
2. **IA para recomendações** - Sugerir horários e serviços
3. **Programa de fidelidade** - Pontos e recompensas
4. **Marketing automation** - Campanhas por email/SMS

---

## 8. DEMONSTRAÇÃO PRÁTICA (5-7 minutos)

### Fluxo 1: Gestor
1. Login como gestor
2. Visualizar dashboard com métricas
3. Criar novo serviço
4. Cadastrar profissional
5. Visualizar agendamentos

### Fluxo 2: Cliente
1. Login como cliente
2. Agendar novo serviço
3. Verificar disponibilidade em tempo real
4. Confirmar agendamento
5. Visualizar notificações

### Fluxo 3: Importação
1. Acessar página de importação
2. Upload de arquivo CSV
3. Acompanhar progresso
4. Verificar relatório de erros

---

## 9. PERGUNTAS FREQUENTES ANTECIPADAS

### P: Por que não usou MongoDB?
**R:** O domínio do problema exige relacionamentos complexos (agendamentos ↔ clientes ↔ profissionais ↔ serviços). PostgreSQL oferece integridade referencial, transactions e é mais adequado para dados estruturados.

### P: Por que não implementou WebSocket?
**R:** Para o escopo do projeto, polling a cada 30 segundos é suficiente e mais simples de implementar. WebSocket seria a próxima evolução natural.

### P: Como garantir que não haja double booking?
**R:** Validação no backend com queries que verificam conflitos antes de criar agendamento. Uso de transactions do Prisma para garantir atomicidade.

### P: O sistema escala?
**R:** Sim. A arquitetura stateless com JWT permite escalonamento horizontal. O banco PostgreSQL suporta milhões de registros. Para escala maior, seria necessário adicionar cache (Redis) e load balancer.

### P: Como lidar com cancelamentos de última hora?
**R:** Sistema valida que cancelamentos devem ser feitos com 4h de antecedência. Profissionais podem marcar como NO_SHOW se o cliente não comparecer.

### P: E se dois clientes tentarem agendar o mesmo horário simultaneamente?
**R:** O backend usa transactions do Prisma e validação atômica. O primeiro request que chegar será processado, o segundo receberá erro de conflito.

### P: Como funciona a importação de CSV? Por que não processar tudo de uma vez?
**R:** A importação usa processamento assíncrono por vários motivos:
1. **Evita timeout**: Arquivos grandes (milhares de linhas) podem levar minutos para processar
2. **Não trava a aplicação**: O usuário pode continuar usando o sistema enquanto importa
3. **Feedback em tempo real**: Barra de progresso mostra o andamento
4. **Melhor UX**: Usuário não fica esperando em uma tela congelada
5. **Escalabilidade**: Permite processar múltiplas importações simultaneamente

O sistema cria um "job" que roda em background, valida cada linha, registra erros e atualiza o progresso. O frontend faz polling a cada 2 segundos para atualizar a interface.

### P: O que acontece se houver erros no CSV?
**R:** O sistema é tolerante a falhas:
- **Validação linha por linha**: Cada linha é validada independentemente
- **Erros não param o processo**: Linhas válidas são importadas, inválidas são registradas
- **Relatório detalhado**: Mostra exatamente qual linha falhou e por quê (ex: "Linha 5: Email inválido")
- **Status final**: `completed_with_errors` indica que houve problemas parciais
- **Dados consistentes**: Apenas dados válidos entram no banco, mantendo integridade

Exemplo: Se um CSV tem 100 linhas e 5 têm emails duplicados, as 95 válidas são importadas e as 5 aparecem no relatório de erros.

### P: Quais formatos de arquivo são aceitos na importação?
**R:** CSV (.csv) e Excel (.xlsx, .xls). O sistema usa bibliotecas especializadas:
- **CSV**: `csv-parser` para parsing eficiente
- **Excel**: `xlsx` para ler arquivos .xlsx e .xls
- **Limite de tamanho**: 10MB por arquivo (configurável)
- **Validação de formato**: Verifica se as colunas esperadas existem

Para **clientes**: Nome, Email, Telefone
Para **agendamentos**: Data, Hora, Cliente Email, Profissional Email, Serviço ID

### P: Como funciona o sistema de notificações automáticas?
**R:** O sistema possui um processo automatizado que roda em background:
1. **Trigger automático**: A cada 5 minutos, o endpoint `/api/reminders/process` é chamado
2. **Busca inteligente**: Identifica agendamentos nas próximas 24-25 horas que ainda não receberam lembrete
3. **Criação de notificação**: Gera notificação vinculada ao cliente e ao profissional
4. **Prevenção de duplicatas**: Campo `reminderSent` garante que cada agendamento recebe apenas um lembrete
5. **Atualização em tempo real**: Frontend faz polling a cada 30 segundos para atualizar o contador

O sistema é totalmente automático - uma vez criado o agendamento, o lembrete será enviado sem intervenção manual.

### P: Por que usar polling ao invés de WebSocket para notificações?
**R:** Decisão baseada em trade-offs do projeto:

**Vantagens do Polling:**
- **Simplicidade**: Não requer infraestrutura adicional (servidor WebSocket)
- **Compatibilidade**: Funciona em qualquer ambiente sem configurações especiais
- **Suficiente para o escopo**: 30 segundos de delay é aceitável para lembretes
- **Menos complexidade**: Não precisa gerenciar conexões persistentes, reconexões, etc.
- **Fácil debug**: Requisições HTTP normais são mais fáceis de monitorar

**Quando usar WebSocket:**
- Chat em tempo real (delay < 1 segundo)
- Notificações críticas instantâneas
- Múltiplas atualizações por segundo
- Aplicações com muitos usuários simultâneos

Para lembretes de agendamento, onde o delay de 30 segundos não impacta a experiência, polling é uma solução pragmática e eficiente.

### P: Como evitar que lembretes sejam enviados em duplicata?
**R:** Múltiplas camadas de proteção:
1. **Campo `reminderSent`**: Booleano no modelo `Appointment` que marca se já foi enviado
2. **Query filtrada**: Busca apenas agendamentos com `reminderSent = false`
3. **Atualização atômica**: Após criar notificação, marca `reminderSent = true` na mesma transaction
4. **Janela de tempo**: Busca apenas agendamentos entre 24-25 horas no futuro
5. **Idempotência**: Mesmo que o processo rode múltiplas vezes, não cria duplicatas

Exemplo: Se o processo rodar às 14:00 e às 14:05, na segunda execução não encontrará os mesmos agendamentos porque `reminderSent` já está `true`.

---

## 10. CONCLUSÃO (2 minutos)

### Resumo
Desenvolvi um sistema completo de agendamento que:
- ✅ Atende todos os requisitos funcionais
- ✅ Usa tecnologias modernas e escaláveis
- ✅ Oferece excelente experiência de usuário
- ✅ Possui código limpo, tipado e bem estruturado
- ✅ Está pronto para produção com melhorias incrementais

### Diferenciais
- Sistema de notificações automático
- Importação em massa com tracking
- Dashboard com métricas de negócio
- Validação robusta de disponibilidade
- Arquitetura escalável

### Agradecimento
Obrigado pela oportunidade de desenvolver este projeto. Estou à disposição para responder perguntas e discutir qualquer aspecto técnico em mais detalhes.

---

## APÊNDICE: COMANDOS ÚTEIS

### Iniciar o projeto
```bash
# Backend
cd marquei-backend
npm install
npm run dev

# Frontend
cd marquei-frontend
npm install
npm run dev
```

### Usuários de teste
- **Gestor**: admin@marquei.com / senha123
- **Profissional**: joao@email.com / senha123
- **Cliente**: maria@email.com / senha123

### Endpoints principais
- API Base: http://localhost:3001/api
- Frontend: http://localhost:3000
- Health Check: http://localhost:3001/api/health
