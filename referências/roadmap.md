# Roadmap Backend — JobWatch

> Backend completo para um SaaS de monitoramento de vagas, com foco inicial em Amazon Warehouse Jobs em Richmond, CA e cidades próximas.
>
> **Stack principal:** NestJS + TypeScript + Prisma ORM + PostgreSQL + Redis + BullMQ + Docker.
>
> **Objetivo:** permitir que usuários criem monitoramentos, o sistema consulte fontes de vagas em segundo plano, detecte vagas novas, persista o histórico e dispare notificações somente quando houver uma nova vaga relevante.

---

# 1. Visão geral da arquitetura

O backend será dividido em quatro responsabilidades principais:

1. **API REST**
   - autenticação;
   - usuários;
   - buscas/monitoramentos;
   - vagas;
   - notificações;
   - dashboard;
   - configurações.

2. **Worker de monitoramento**
   - executa buscas automaticamente;
   - consulta a fonte de vagas;
   - normaliza os resultados;
   - identifica vagas novas;
   - atualiza o banco;
   - gera eventos de notificação.

3. **Fila de tarefas**
   - controla quando cada monitoramento deve executar;
   - evita bloquear a API;
   - permite retry;
   - controla concorrência;
   - mantém o processamento separado do servidor HTTP.

4. **Persistência**
   - PostgreSQL como banco principal;
   - Prisma como ORM;
   - Redis para filas, jobs e controle operacional.

Fluxo principal:

```text
Frontend
   |
   | HTTP/REST
   v
NestJS API
   |
   +----------------------+
   |                      |
   v                      v
PostgreSQL              Redis
   ^                      |
   |                      v
   |                    BullMQ
   |                      |
   +----------<-----------+
              |
              v
        Monitoring Worker
              |
              v
        Job Source Adapter
              |
              v
      Novas vagas detectadas
              |
              v
        PostgreSQL
              |
              v
      Notification Queue
              |
              v
       Email / Push
```

---

# 2. Fase 0 — Definição técnica e preparação do projeto

## Objetivo

Criar a base do backend antes de implementar as regras de negócio.

## Tecnologias

- Node.js
- TypeScript
- NestJS
- npm
- ESLint
- Prettier
- Git
- Docker
- Docker Compose

## Etapas

### 2.1 Criar o projeto NestJS

Inicializar o projeto:

```bash
npx @nestjs/cli new jobwatch-api
```

Configurar TypeScript em modo estrito.

Verificar:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2.2 Definir scripts

Criar scripts para:

```text
dev
build
start
start:prod
lint
format
test
test:e2e
```

### 2.3 Configurar ESLint e Prettier

Padronizar:

- indentação;
- aspas;
- trailing commas;
- imports;
- nomes de arquivos;
- nomes de classes;
- organização do código.

### 2.4 Criar estrutura inicial

```text
src/
├── main.ts
├── app.module.ts
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── exceptions/
│   └── utils/
│
├── config/
│
├── database/
│
├── auth/
├── users/
├── jobs/
├── searches/
├── monitoring/
├── notifications/
└── dashboard/
```

### 2.5 Configuração por ambiente

Criar:

```text
.env
.env.example
.env.test
```

Variáveis previstas:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

CORS_ORIGIN=
```

Nunca versionar `.env`.

---

# 3. Fase 1 — Banco de dados com PostgreSQL + Prisma

## Objetivo

Criar o modelo de dados que sustentará todo o sistema.

## Tecnologias

- PostgreSQL
- Prisma ORM
- Prisma Migrate
- TypeScript

---

## 3.1 Instalar Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

Configurar:

```env
DATABASE_URL="postgresql://..."
```

---

## 3.2 Modelagem inicial

Entidades principais:

```text
User
Search
SearchKeyword
SearchLocation
Job
JobSearch
MonitoringExecution
Notification
NotificationDelivery
```

---

## 3.3 User

Responsável pela conta.

Campos sugeridos:

```text
id
name
email
passwordHash
timezone
isActive
createdAt
updatedAt
```

Regras:

- email único;
- senha nunca armazenada em texto;
- usuário pode possuir várias buscas;
- usuário pode possuir várias notificações.

---

## 3.4 Search

Representa um monitoramento configurado pelo usuário.

Campos:

```text
id
userId
name
status
frequencyMinutes
radiusMiles
lastCheckedAt
nextCheckAt
createdAt
updatedAt
```

Status:

```text
ACTIVE
PAUSED
ERROR
```

---

## 3.5 SearchKeyword

Permite várias palavras-chave por busca.

Exemplo:

```text
Warehouse Associate
Fulfillment Center
Delivery Station
```

Relacionamento:

```text
Search 1:N SearchKeyword
```

---

## 3.6 SearchLocation

Permite configurar localização principal e cidades adicionais.

Exemplo:

```text
Richmond, CA
San Pablo, CA
Pinole, CA
Hercules, CA
El Cerrito, CA
```

Campos:

```text
id
searchId
city
state
country
latitude
longitude
isPrimary
```

---

## 3.7 Job

Representa uma vaga encontrada.

Campos sugeridos:

```text
id
externalId
source
title
company
location
city
state
country
url
jobType
description
firstSeenAt
lastSeenAt
isActive
createdAt
updatedAt
```

Criar índice para:

```text
externalId
source
city
state
firstSeenAt
```

A combinação:

```text
source + externalId
```

deve ser única para impedir duplicação.

---

## 3.8 JobSearch

Relaciona vagas aos monitoramentos que as encontraram.

Isso permite que a mesma vaga possa aparecer em mais de uma busca.

```text
Job N:N Search
```

através de:

```text
JobSearch
```

---

## 3.9 MonitoringExecution

Histórico das execuções.

Campos:

```text
id
searchId
startedAt
finishedAt
status
jobsFound
newJobs
errorMessage
createdAt
```

Status:

```text
RUNNING
SUCCESS
FAILED
```

Esse histórico será utilizado pelo frontend para mostrar a timeline de verificações.

---

## 3.10 Notification

Representa uma notificação gerada pelo sistema.

Campos:

```text
id
userId
jobId
searchId
type
status
createdAt
sentAt
```

Tipos:

```text
NEW_JOB
```

Status:

```text
PENDING
SENT
FAILED
```

---

## 3.11 NotificationDelivery

Permite futuramente múltiplos canais.

Campos:

```text
id
notificationId
channel
status
attempts
sentAt
errorMessage
createdAt
```

Canais:

```text
EMAIL
PUSH
```

---

## 3.12 Criar migrations

Executar:

```bash
npx prisma migrate dev --name init
```

Gerar client:

```bash
npx prisma generate
```

---

## 3.13 Criar seed

Criar dados de desenvolvimento:

- usuário;
- busca de Richmond;
- palavras-chave;
- localizações;
- algumas vagas;
- histórico de execuções;
- notificações.

Comando:

```bash
npx prisma db seed
```

---

# 4. Fase 2 — Configuração global da API

## Objetivo

Criar a infraestrutura base utilizada por todos os módulos.

## Tecnologias

- NestJS
- ConfigModule
- ValidationPipe
- Swagger
- class-validator
- class-transformer

---

## 4.1 ConfigModule

Carregar variáveis de ambiente de forma centralizada.

Validar obrigatórios:

```text
DATABASE_URL
JWT_SECRET
REDIS_HOST
REDIS_PORT
```

---

## 4.2 ValidationPipe global

Configurar:

```text
whitelist: true
forbidNonWhitelisted: true
transform: true
```

Isso impede que propriedades inesperadas sejam aceitas pelos endpoints.

---

## 4.3 Exception Filter

Criar tratamento padronizado.

Resposta:

```json
{
  "statusCode": 400,
  "message": "Mensagem amigável",
  "error": "Bad Request",
  "timestamp": "...",
  "path": "/api/..."
}
```

Nunca retornar stack trace em produção.

---

## 4.4 API prefix

Usar:

```text
/api
```

Exemplos:

```text
GET /api/jobs
GET /api/searches
GET /api/notifications
```

---

## 4.5 Swagger

Instalar/configurar Swagger.

Disponibilizar:

```text
/api/docs
```

Documentar:

- endpoints;
- DTOs;
- autenticação;
- respostas;
- erros;
- parâmetros.

---

# 5. Fase 3 — Autenticação

## Objetivo

Implementar login seguro e proteção da API.

## Tecnologias

- JWT
- Passport
- bcrypt ou Argon2
- NestJS Guards

---

## 5.1 Cadastro

Endpoint:

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Lucas",
  "email": "email@example.com",
  "password": "..."
}
```

Fluxo:

```text
request
  ↓
validation
  ↓
verificar email
  ↓
hash da senha
  ↓
criar usuário
  ↓
retornar sessão/token
```

---

## 5.2 Login

```http
POST /api/auth/login
```

Validar:

- email;
- senha;
- usuário ativo.

Retornar:

```json
{
  "accessToken": "...",
  "user": {}
}
```

---

## 5.3 Hash de senha

Nunca armazenar senha diretamente.

Preferência:

```text
Argon2
```

ou:

```text
bcrypt
```

---

## 5.4 JWT Guard

Criar:

```text
JwtAuthGuard
```

Endpoints protegidos exigirão:

```http
Authorization: Bearer TOKEN
```

---

## 5.5 Usuário atual

Endpoint:

```http
GET /api/auth/me
```

Usado pelo frontend para restaurar a sessão.

---

## 5.6 Logout

Se utilizar access token stateless, o frontend remove a sessão.

Para uma arquitetura mais robusta posteriormente:

```text
Access Token
+
Refresh Token
+
Token rotation
```

A implementação de refresh token pode ser adicionada antes do primeiro deploy de produção.

---

# 6. Fase 4 — Users

## Objetivo

Implementar gerenciamento do usuário autenticado.

Endpoints:

```text
GET /api/users/me
PATCH /api/users/me
PATCH /api/users/me/password
```

Permitir alterar:

- nome;
- timezone;
- preferências.

Nunca permitir que um usuário altere:

- id;
- email de outro usuário;
- dados pertencentes a outro usuário.

---

# 7. Fase 5 — Sistema de Jobs

## Objetivo

Criar o CRUD de vagas e a camada de domínio responsável por elas.

## Tecnologias

- NestJS
- Prisma
- DTOs
- REST

---

## 7.1 Job Repository / Service

Centralizar operações:

```text
findMany
findOne
findNew
create
upsert
markViewed
```

---

## 7.2 Listagem

Endpoint:

```http
GET /api/jobs
```

Filtros:

```text
search
location
city
status
newOnly
from
to
page
limit
sort
```

Exemplo:

```text
/api/jobs?city=Richmond&newOnly=true&page=1
```

---

## 7.3 Nova vaga

Uma vaga será considerada nova quando for identificada pela primeira vez.

Usar:

```text
firstSeenAt
```

em vez de depender apenas de um campo booleano.

---

## 7.4 Visualização

Endpoint:

```http
PATCH /api/jobs/:id/viewed
```

Caso seja necessário persistir visualização por usuário, criar posteriormente:

```text
JobUser
```

ou:

```text
JobView
```

Isso é importante caso o SaaS tenha múltiplos usuários.

---

# 8. Fase 6 — Sistema de Searches

## Objetivo

Permitir que o usuário configure o que será monitorado.

Endpoints:

```text
GET /api/searches
POST /api/searches
GET /api/searches/:id
PATCH /api/searches/:id
DELETE /api/searches/:id
POST /api/searches/:id/pause
POST /api/searches/:id/resume
```

---

## 8.1 Criar busca

DTO:

```text
CreateSearchDto
```

Campos:

```text
name
keywords[]
locations[]
radiusMiles
frequencyMinutes
notificationChannels[]
```

Validar:

- frequência mínima;
- raio válido;
- pelo menos uma palavra-chave;
- localização válida;
- canais suportados.

---

## 8.2 Ownership

Toda consulta deve respeitar:

```text
search.userId === authenticatedUser.id
```

Nunca confiar no `userId` enviado pelo frontend.

O usuário autenticado será obtido do JWT.

---

## 8.3 Pausar monitoramento

```http
POST /api/searches/:id/pause
```

Alterar:

```text
ACTIVE → PAUSED
```

---

## 8.4 Retomar

```http
POST /api/searches/:id/resume
```

Alterar:

```text
PAUSED → ACTIVE
```

Ao retomar, agendar uma nova execução.

---

# 9. Fase 7 — Redis + BullMQ

## Objetivo

Tirar o processamento pesado da API HTTP.

## Tecnologias

- Redis
- BullMQ
- NestJS BullMQ integration

---

## 9.1 Por que Redis?

Redis será utilizado principalmente como infraestrutura de fila.

Ele permitirá:

- jobs assíncronos;
- retries;
- delayed jobs;
- concorrência;
- controle de workers;
- processamento independente da API.

---

## 9.2 Criar filas

Filas iniciais:

```text
monitoring
notifications
```

Futuramente:

```text
emails
cleanup
analytics
```

---

## 9.3 Monitoring Queue

Cada execução de monitoramento será um job.

Payload:

```json
{
  "searchId": "..."
}
```

---

## 9.4 Notification Queue

Quando uma vaga nova for detectada:

```text
monitoring worker
       ↓
new job
       ↓
create notification
       ↓
enqueue notification
```

---

## 9.5 Retry

Configurar retries para erros temporários.

Exemplo conceitual:

```text
attempts: 3
backoff: exponential
```

Não fazer retry infinito.

---

# 10. Fase 8 — Engine de monitoramento

## Objetivo

Criar o núcleo do produto.

Esse serviço será responsável por executar uma busca e descobrir novas vagas.

Estrutura:

```text
monitoring/
├── monitoring.module.ts
├── monitoring.service.ts
├── monitoring.processor.ts
├── adapters/
├── parsers/
├── normalizers/
└── interfaces/
```

---

# 11. Fase 9 — Source Adapter

## Objetivo

Não acoplar o sistema diretamente à Amazon.

Criar uma abstração:

```ts
interface JobSourceAdapter {
  search(params: JobSearchParams): Promise<ExternalJob[]>;
}
```

Implementação inicial:

```text
AmazonJobsAdapter
```

Isso permite futuramente adicionar:

```text
IndeedAdapter
LinkedInAdapter
GlassdoorAdapter
OtherJobSourceAdapter
```

sem alterar a engine de monitoramento.

---

# 12. Fase 10 — Consulta da fonte de vagas

## Objetivo

Implementar a integração responsável por obter os resultados da fonte configurada.

A camada de integração deve ser isolada do restante do sistema.

Fluxo:

```text
Search
 ↓
Search parameters
 ↓
AmazonJobsAdapter
 ↓
HTTP/browser request
 ↓
Raw response
 ↓
Parser
 ↓
Normalized jobs
```

---

## 12.1 HTTP

Quando a fonte disponibilizar endpoints HTTP adequados:

```text
undici
ou
axios
```

Usar timeout.

Nunca deixar uma requisição externa pendurada indefinidamente.

---

## 12.2 Browser automation

Se a página depender de JavaScript e não houver endpoint HTTP apropriado, avaliar:

```text
Playwright
```

O Playwright deve ficar somente no worker.

A API NestJS não deve executar browser automation durante uma requisição do usuário.

---

## 12.3 Rate limiting

Implementar controle para evitar excesso de consultas.

A frequência configurada pelo usuário será respeitada pelo scheduler.

Também deve existir uma proteção global para limitar a quantidade de consultas simultâneas.

---

# 13. Fase 11 — Parser e normalização

## Objetivo

Transformar dados externos em um formato interno consistente.

Criar:

```text
ExternalJob
NormalizedJob
```

Exemplo:

```text
ExternalJob
   ↓
Parser
   ↓
NormalizedJob
```

Normalizar:

- título;
- localização;
- URL;
- identificador externo;
- tipo;
- descrição;
- empresa;
- cidade;
- estado.

---

# 14. Fase 12 — Deduplicação

## Objetivo

Garantir que a mesma vaga não seja cadastrada várias vezes.

Identificador principal:

```text
source + externalId
```

Se não existir um ID confiável:

usar uma chave derivada de:

```text
source
+
title
+
location
+
url
```

com cautela.

Preferência:

```text
externalId
```

---

## 14.1 Upsert

Utilizar Prisma:

```text
upsert
```

para inserir ou atualizar.

Fluxo:

```text
vaga encontrada
       ↓
identificar externalId
       ↓
existe?
   /       \
 sim       não
 ↓          ↓
update     create
            ↓
        NOVA VAGA
```

---

# 15. Fase 13 — Detecção de nova vaga

## Regra principal

Uma vaga é nova quando:

```text
não existia anteriormente
```

e foi criada durante uma execução.

O worker deve contabilizar:

```text
jobsFound
newJobs
```

Exemplo:

```text
Busca retornou 12 vagas
11 já existiam
1 é nova
```

Resultado:

```text
jobsFound = 12
newJobs = 1
```

---

# 16. Fase 14 — Histórico de execução

Cada execução deve criar um:

```text
MonitoringExecution
```

Fluxo:

```text
RUNNING
   ↓
consulta fonte
   ↓
processamento
   ↓
persistência
   ↓
SUCCESS
```

Em erro:

```text
RUNNING
   ↓
ERROR
   ↓
FAILED
```

Registrar:

- horário inicial;
- horário final;
- quantidade encontrada;
- quantidade nova;
- erro;
- duração.

---

# 17. Fase 15 — Scheduler

## Objetivo

Executar os monitoramentos automaticamente.

Há duas possibilidades.

### Opção A — BullMQ delayed jobs

Cada busca ativa agenda sua próxima execução.

Fluxo:

```text
Search ACTIVE
     ↓
schedule job
     ↓
execute
     ↓
process
     ↓
calculate next execution
     ↓
schedule again
```

Essa será a abordagem preferencial.

### Opção B — Cron global

Um processo verifica periodicamente quais buscas precisam executar.

Exemplo:

```text
a cada 1 minuto
     ↓
buscar searches
where nextCheckAt <= now
     ↓
enqueue
```

Para o MVP, ambas funcionam. A escolha final deve considerar a quantidade esperada de monitoramentos.

---

# 18. Fase 16 — Controle da frequência

O usuário poderá configurar:

```text
5 minutos
10 minutos
15 minutos
30 minutos
1 hora
6 horas
12 horas
24 horas
```

No MVP, permitir somente frequências suportadas.

Nunca confiar cegamente em:

```text
frequencyMinutes
```

enviado pelo frontend.

O backend deve validar os limites.

---

# 19. Fase 17 — Notificações

## Objetivo

Notificar o usuário somente quando houver vaga nova.

Fluxo:

```text
nova vaga
   ↓
Notification
   ↓
Notification Queue
   ↓
Notification Worker
   ↓
Email / Push
```

---

## 19.1 Email

Tecnologias possíveis:

- Nodemailer
- SMTP
- Resend
- outro provider transacional

Criar uma abstração:

```ts
interface NotificationChannel {
  send(notification: NotificationPayload): Promise<void>;
}
```

Implementação:

```text
EmailNotificationChannel
```

---

## 19.2 Conteúdo do email

Exemplo:

```text
Nova vaga encontrada

Warehouse Associate

Richmond, CA

Fulfillment Center

Encontrada agora.

[Candidate-se agora]
```

Não enviar email em cada atualização da página.

Somente quando uma nova vaga for detectada.

---

# 20. Fase 18 — Preferências de notificação

Permitir ao usuário escolher:

```text
EMAIL
PUSH
```

e posteriormente:

```text
SMS
WEBHOOK
DISCORD
TELEGRAM
```

O backend deve validar os canais disponíveis.

---

# 21. Fase 19 — Notifications API

Endpoints:

```text
GET /api/notifications
GET /api/notifications/:id
PATCH /api/notifications/:id/read
```

Filtros:

```text
status
type
page
limit
```

---

# 22. Fase 20 — Dashboard API

## Objetivo

Criar endpoint específico para alimentar o dashboard.

Endpoint:

```http
GET /api/dashboard
```

Resposta conceitual:

```json
{
  "stats": {
    "newJobs": 3,
    "availableJobs": 12,
    "activeSearches": 2
  },
  "lastCheckAt": "...",
  "nextCheckAt": "...",
  "newJobs": [],
  "activeSearches": [],
  "recentActivity": []
}
```

Evitar que o frontend precise realizar várias chamadas para montar a tela inicial.

---

# 23. Fase 21 — Paginação e filtros

Implementar paginação em:

```text
jobs
searches
notifications
monitoring history
```

Usar:

```text
page
limit
```

ou cursor pagination quando houver necessidade de escala maior.

Limitar `limit` no backend.

Exemplo:

```text
default = 20
max = 100
```

---

# 24. Fase 22 — Segurança da API

Implementar:

- Helmet;
- CORS;
- rate limiting;
- validation;
- JWT;
- password hashing;
- ownership checks;
- sanitização;
- limites de payload;
- logs sem dados sensíveis.

---

## 22.1 Rate limiting

Proteger especialmente:

```text
/auth/login
/auth/register
```

e endpoints de criação/alteração.

---

## 22.2 CORS

Permitir somente o domínio do frontend em produção.

Exemplo:

```env
CORS_ORIGIN=https://app.seudominio.com
```

Durante desenvolvimento:

```text
http://localhost:5173
```

---

# 25. Fase 23 — Logs

## Objetivo

Permitir diagnosticar problemas do worker e da API.

Usar inicialmente o logger do NestJS.

Registrar:

```text
HTTP request
authentication failure
monitoring started
monitoring finished
new job detected
notification queued
notification sent
external source error
```

Nunca registrar:

- senha;
- JWT;
- secrets;
- tokens;
- credenciais SMTP.

---

# 26. Fase 24 — Health Checks

Criar:

```http
GET /api/health
```

Verificar:

```text
API
PostgreSQL
Redis
```

Resposta:

```json
{
  "status": "ok",
  "database": "up",
  "redis": "up"
}
```

Esse endpoint será utilizado pelo Docker e pelo servidor de produção.

---

# 27. Fase 25 — Testes unitários

Tecnologia:

```text
Jest
```

Testar principalmente regras de negócio.

Casos:

### Jobs

- criar vaga;
- atualizar vaga;
- detectar duplicada;
- detectar nova vaga.

### Searches

- criar busca;
- pausar;
- retomar;
- impedir acesso de outro usuário.

### Monitoring

- execução bem-sucedida;
- erro externo;
- retry;
- zero vagas;
- novas vagas.

### Notifications

- criar notificação;
- enviar;
- retry;
- falha.

---

# 28. Fase 26 — Testes de integração

Testar:

```text
NestJS
+
Prisma
+
PostgreSQL
```

Cenário:

```text
criar usuário
↓
criar search
↓
executar monitoramento
↓
persistir vaga
↓
detectar nova vaga
↓
criar notification
```

---

# 29. Fase 27 — Testes E2E

Testar a API como o frontend irá consumi-la.

Fluxo:

```text
POST /auth/register
POST /auth/login
GET /auth/me

POST /searches
GET /searches

POST /searches/:id/pause
POST /searches/:id/resume

GET /jobs
GET /jobs/:id

GET /notifications
GET /dashboard
```

Validar também:

- 401;
- 403;
- 404;
- 422/400;
- dados inválidos;
- ownership.

---

# 30. Fase 28 — Dockerização do backend

## Objetivo

Criar ambiente reproduzível.

Serviços:

```text
api
worker
postgres
redis
```

---

## 30.1 Dockerfile

Criar Dockerfile multi-stage.

Estrutura conceitual:

```text
base
 ↓
dependencies
 ↓
build
 ↓
production
```

A imagem final deve conter somente o necessário para produção.

---

# 31. Fase 29 — Docker Compose

Criar:

```text
docker-compose.yml
```

Serviços:

```yaml
services:
  api:
    ...

  worker:
    ...

  postgres:
    ...

  redis:
    ...
```

---

## 31.1 PostgreSQL

Persistir dados através de volume:

```text
postgres_data
```

---

## 31.2 Redis

Criar volume quando necessário.

---

## 31.3 API

A API deve depender de:

```text
postgres
redis
```

---

## 31.4 Worker

O worker deve usar a mesma imagem do backend, mas executar:

```bash
npm run start:worker
```

ou equivalente.

A ideia é evitar duplicar código.

---

# 32. Fase 30 — Separação API / Worker

Estrutura:

```text
NestJS API
    |
    +-- HTTP
    |
    +-- PostgreSQL
    |
    +-- Redis

Worker
    |
    +-- Redis
    |
    +-- PostgreSQL
    |
    +-- AmazonJobsAdapter
```

A API não executa scraping.

O worker não precisa expor uma porta HTTP pública.

Isso permite escalar independentemente:

```text
1 API
+
N workers
```

---

# 33. Fase 31 — Integração Frontend + Backend

## Objetivo

Substituir mocks do frontend pela API real.

Frontend:

```text
React
Vite
TypeScript
TailwindCSS
TanStack Query
```

Backend:

```text
NestJS
Prisma
PostgreSQL
Redis
BullMQ
```

---

# 34. Fase 32 — Contrato entre frontend e backend

Utilizar Swagger como fonte de documentação.

O frontend deverá consumir:

```text
/api/auth/*
/api/dashboard
/api/jobs/*
/api/searches/*
/api/notifications/*
/api/users/*
```

Manter DTOs e respostas documentados.

Se desejado posteriormente, gerar tipos TypeScript automaticamente a partir do OpenAPI.

---

# 35. Fase 33 — Implementar API Client no frontend

Criar:

```text
src/services/api.ts
```

Configurar:

```text
baseURL
authorization
timeout
interceptors
error handling
```

Exemplo:

```text
VITE_API_URL=http://localhost:3000/api
```

Produção:

```text
VITE_API_URL=https://api.seudominio.com/api
```

---

# 36. Fase 34 — Integrar autenticação

Frontend:

```text
login
   ↓
POST /auth/login
   ↓
token
   ↓
session
   ↓
GET /auth/me
```

Configurar proteção das rotas.

Fluxo:

```text
não autenticado
    ↓
/login

autenticado
    ↓
/dashboard
```

---

# 37. Fase 35 — Integrar Dashboard

Substituir mocks:

```text
mockDashboard()
```

por:

```text
useDashboard()
```

Consumindo:

```http
GET /api/dashboard
```

Exibir:

- novas vagas;
- vagas disponíveis;
- buscas ativas;
- última verificação;
- próxima verificação;
- atividade recente.

---

# 38. Fase 36 — Integrar Jobs

Frontend:

```text
useJobs()
useJob()
useNewJobs()
```

Backend:

```text
GET /api/jobs
GET /api/jobs/:id
```

Implementar:

- filtros;
- paginação;
- busca;
- status;
- detalhes;
- marcar como visualizada.

---

# 39. Fase 37 — Integrar Searches

Frontend:

```text
useSearches()
useSearch()
```

Backend:

```text
GET /api/searches
POST /api/searches
PATCH /api/searches/:id
DELETE /api/searches/:id
```

Integrar:

- criação;
- edição;
- pausa;
- retomada;
- exclusão;
- histórico.

---

# 40. Fase 38 — Integrar Notifications

Frontend:

```text
useNotifications()
```

Backend:

```text
GET /api/notifications
PATCH /api/notifications/:id/read
```

Mostrar:

- novas notificações;
- histórico;
- status;
- canal;
- horário.

---

# 41. Fase 39 — Atualização automática do frontend

Usar TanStack Query.

Exemplo:

```text
dashboard
    ↓
refetch periódico
    ↓
backend
    ↓
novos dados
    ↓
UI atualizada
```

A frequência do polling do frontend deve ser maior que a frequência necessária para o monitoramento do backend.

O navegador não deve ser responsável por descobrir vagas.

Futuramente, adicionar:

```text
SSE
```

ou:

```text
WebSocket
```

para atualização em tempo real.

---

# 42. Fase 40 — Integração completa do fluxo

Validar o fluxo real:

```text
Usuário
   ↓
Frontend
   ↓
Cria Search
   ↓
NestJS
   ↓
PostgreSQL
   ↓
Agenda monitoramento
   ↓
Redis/BullMQ
   ↓
Worker
   ↓
AmazonJobsAdapter
   ↓
Amazon
   ↓
Parser
   ↓
Normalizer
   ↓
Deduplicação
   ↓
PostgreSQL
   ↓
Nova vaga?
   |
   +---- NÃO → finaliza
   |
   +---- SIM
          ↓
      Notification
          ↓
      BullMQ
          ↓
   Notification Worker
          ↓
        Email
          ↓
      Usuário recebe
          ↓
      Frontend atualiza
```

Esse é o fluxo principal que deve ser validado antes de considerar o MVP concluído.

---

# 43. Fase 41 — Ambiente Docker completo

Estrutura final:

```text
jobwatch/
├── frontend/
│
├── backend/
│
├── docker/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Ou, se preferir manter frontend e backend em repositórios separados:

```text
jobwatch-frontend
jobwatch-backend
```

---

# 44. Docker Compose final

Serviços esperados:

```text
frontend
api
worker
postgres
redis
```

Fluxo:

```text
Browser
   ↓
Frontend
   ↓
API
   ↓
PostgreSQL

API
 ↓
Redis
 ↓
Worker
 ↓
External Job Source
```

---

# 45. Fase 42 — Variáveis de ambiente Docker

Criar `.env.example` documentando:

```env
# Application
NODE_ENV=development
PORT=3000

# PostgreSQL
POSTGRES_DB=jobwatch
POSTGRES_USER=jobwatch
POSTGRES_PASSWORD=change-me

DATABASE_URL=postgresql://jobwatch:change-me@postgres:5432/jobwatch

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Auth
JWT_SECRET=change-me
JWT_EXPIRES_IN=15m

# Frontend
CORS_ORIGIN=http://localhost:5173

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Em produção, secrets reais não devem ficar no Git.

---

# 46. Fase 43 — Inicialização do ambiente

Com Docker:

```bash
docker compose up -d
```

Executar migrations:

```bash
docker compose exec api npx prisma migrate deploy
```

Seed de desenvolvimento:

```bash
docker compose exec api npx prisma db seed
```

Visualizar logs:

```bash
docker compose logs -f api
```

Worker:

```bash
docker compose logs -f worker
```

---

# 47. Fase 44 — Prisma dentro do Docker

O container da API deve conseguir acessar:

```text
postgres:5432
```

e não:

```text
localhost:5432
```

Dentro do Docker, os serviços se comunicam pelo nome do serviço.

Portanto:

```env
DATABASE_URL=postgresql://jobwatch:password@postgres:5432/jobwatch
```

Redis:

```env
REDIS_HOST=redis
```

---

# 48. Fase 45 — Healthcheck dos containers

Configurar healthchecks para:

```text
postgres
redis
api
```

A API só deve iniciar corretamente quando suas dependências essenciais estiverem disponíveis.

O Compose deve usar:

```text
healthcheck
```

e dependências apropriadas.

---

# 49. Fase 46 — Desenvolvimento local

Fluxo recomendado:

```bash
docker compose up -d postgres redis
```

Depois:

```bash
npm run start:dev
```

Worker:

```bash
npm run start:worker
```

Frontend:

```bash
npm run dev
```

Isso permite desenvolver rapidamente sem precisar reconstruir os containers a cada alteração.

---

# 50. Fase 47 — Ambiente totalmente containerizado

Quando o projeto estiver estável:

```bash
docker compose up --build
```

Deve subir:

```text
PostgreSQL
Redis
API
Worker
Frontend
```

O sistema deve funcionar sem instalar Node.js ou PostgreSQL diretamente na máquina.

---

# 51. Fase 48 — Produção

Criar configuração separada:

```text
docker-compose.prod.yml
```

Diferenças:

- `NODE_ENV=production`;
- imagens otimizadas;
- sem source code desnecessário;
- secrets externos;
- logs apropriados;
- restart policies;
- volumes persistentes;
- healthchecks;
- HTTPS através de reverse proxy.

Arquitetura:

```text
Internet
   ↓
Reverse Proxy
   ↓
Frontend/API
   ↓
Docker Network
   ├── API
   ├── Worker
   ├── PostgreSQL
   └── Redis
```

---

# 52. Fase 49 — Reverse Proxy

Usar posteriormente:

```text
Nginx
```

ou:

```text
Traefik
```

Responsabilidades:

- HTTPS;
- roteamento;
- domínio;
- headers;
- compressão;
- proxy para API.

Exemplo:

```text
app.jobwatch.com
        ↓
frontend

api.jobwatch.com
        ↓
NestJS API
```

---

# 53. Fase 50 — Observabilidade

Depois do MVP funcionando:

Adicionar:

```text
Sentry
```

ou solução equivalente para erros.

Monitorar:

- erros da API;
- falhas do worker;
- tempo de processamento;
- falhas da fonte externa;
- notificações falhas;
- Redis;
- PostgreSQL.

Criar métricas futuras:

```text
monitoring.executions
monitoring.failures
jobs.discovered
jobs.new
notifications.sent
notifications.failed
```

---

# 54. Fase 51 — Tratamento de indisponibilidade da fonte

A fonte externa pode ficar:

- fora do ar;
- lenta;
- alterar HTML;
- bloquear requisições;
- mudar estrutura;
- retornar erro.

O sistema não deve marcar todas as vagas como novas ou desaparecer com vagas simplesmente porque uma execução falhou.

Regra:

```text
erro na fonte
    ↓
MonitoringExecution = FAILED
    ↓
não alterar artificialmente o estado das vagas
    ↓
retry
```

---

# 55. Fase 52 — Controle de vagas inativas

Uma vaga pode desaparecer da fonte.

Não assumir imediatamente:

```text
vaga desapareceu = vaga encerrada
```

Utilizar:

```text
lastSeenAt
```

e uma estratégia de expiração.

Exemplo:

```text
vaga não encontrada em 1 execução
→ permanece ativa

vaga não encontrada por várias execuções
→ pode ser marcada como INACTIVE
```

O número exato de execuções deve ser configurável.

---

# 56. Fase 53 — Idempotência

Os workers devem ser seguros para executar novamente.

Se o mesmo job for processado duas vezes:

```text
não criar duas vagas
não enviar duas notificações
```

Utilizar:

- unique constraints;
- upsert;
- idempotency keys;
- verificação de Notification existente.

Isso é fundamental porque filas podem reprocessar jobs.

---

# 57. Fase 54 — Concorrência

Se existirem:

```text
100 monitoramentos
```

não executar os 100 simultaneamente sem controle.

Configurar concorrência do worker.

Exemplo:

```text
concurrency = 5
```

O valor final deve ser definido de acordo com:

- CPU;
- RAM;
- limite da fonte;
- quantidade de usuários;
- tempo médio de execução.

---

# 58. Fase 55 — Retenção de histórico

O histórico de monitoramento pode crescer rapidamente.

Criar política:

```text
MonitoringExecution
```

retenção, por exemplo:

```text
30 / 60 / 90 dias
```

Jobs antigos também podem ser arquivados posteriormente.

Criar uma tarefa de limpeza:

```text
cleanup queue
```

---

# 59. Fase 56 — Teste de carga

Simular:

```text
10 usuários
50 buscas
100 buscas
500 buscas
```

Medir:

- API latency;
- uso de CPU;
- RAM;
- PostgreSQL;
- Redis;
- worker;
- tempo médio de scraping;
- quantidade de jobs por minuto.

O objetivo é descobrir o limite do VPS antes da produção.

---

# 60. Fase 57 — Documentação

Criar:

```text
README.md
```

Documentar:

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run start:dev
```

### Docker

```bash
docker compose up -d
```

### Prisma

```bash
npx prisma migrate dev
```

### Testes

```bash
npm run test
npm run test:e2e
```

### Swagger

```text
http://localhost:3000/api/docs
```

---

# 61. Fase 58 — Checklist de MVP

## Backend

- [ ] NestJS configurado
- [ ] TypeScript strict
- [ ] ESLint
- [ ] Prettier
- [ ] ConfigModule
- [ ] PostgreSQL
- [ ] Prisma
- [ ] migrations
- [ ] seed
- [ ] autenticação
- [ ] JWT
- [ ] Users
- [ ] Searches
- [ ] Jobs
- [ ] Monitoring
- [ ] MonitoringExecution
- [ ] Redis
- [ ] BullMQ
- [ ] Worker
- [ ] Source Adapter
- [ ] Parser
- [ ] Normalizer
- [ ] Deduplicação
- [ ] Notification
- [ ] Email
- [ ] Dashboard
- [ ] Healthcheck
- [ ] Swagger
- [ ] logs
- [ ] testes unitários
- [ ] testes de integração
- [ ] testes E2E

## Frontend

- [ ] Login
- [ ] Dashboard
- [ ] Jobs
- [ ] Job details
- [ ] Searches
- [ ] Create search
- [ ] Search details
- [ ] Notifications
- [ ] Settings
- [ ] TanStack Query
- [ ] API Client
- [ ] autenticação
- [ ] loading states
- [ ] error states
- [ ] empty states
- [ ] responsive
- [ ] integração REST

## Infraestrutura

- [ ] Dockerfile API
- [ ] Dockerfile Worker
- [ ] Dockerfile Frontend
- [ ] Docker Compose
- [ ] PostgreSQL container
- [ ] Redis container
- [ ] volumes
- [ ] networks
- [ ] healthchecks
- [ ] environment variables
- [ ] production compose
- [ ] reverse proxy
- [ ] HTTPS

---

# 62. Fase 59 — Ordem prática de desenvolvimento

A implementação não deve começar pelo scraper.

Seguir esta ordem:

```text
01. Setup NestJS
        ↓
02. Configuração
        ↓
03. PostgreSQL
        ↓
04. Prisma
        ↓
05. Models
        ↓
06. Migrations
        ↓
07. Auth
        ↓
08. Users
        ↓
09. Jobs
        ↓
10. Searches
        ↓
11. Dashboard
        ↓
12. Redis
        ↓
13. BullMQ
        ↓
14. Worker
        ↓
15. Source Adapter
        ↓
16. Parser
        ↓
17. Normalizer
        ↓
18. Deduplicação
        ↓
19. Monitoring
        ↓
20. Scheduler
        ↓
21. Notifications
        ↓
22. Email
        ↓
23. Testes
        ↓
24. Swagger
        ↓
25. Docker
        ↓
26. Integração Frontend
        ↓
27. E2E
        ↓
28. Produção
```

---

# 63. Fase 60 — Critério de conclusão

O MVP será considerado funcional quando o seguinte cenário funcionar do início ao fim:

```text
1. Usuário acessa o frontend

2. Usuário cria uma conta

3. Usuário faz login

4. Usuário cria o monitoramento:

   Amazon Warehouse — Richmond

   Keywords:
   - Warehouse Associate
   - Fulfillment Center
   - Delivery Station

   Locations:
   - Richmond
   - San Pablo
   - Pinole
   - Hercules
   - El Cerrito

5. Backend salva a configuração

6. Scheduler agenda a busca

7. Worker recebe o job através do BullMQ

8. Worker consulta a fonte

9. Parser transforma os resultados

10. Backend normaliza os dados

11. Sistema verifica duplicidade

12. Vagas novas são identificadas

13. Vagas são salvas no PostgreSQL

14. MonitoringExecution é registrada

15. Notification é criada

16. Notification Worker processa a notificação

17. Email é enviado

18. Frontend consulta o dashboard

19. Nova vaga aparece destacada

20. Usuário abre a vaga

21. Usuário acessa a candidatura

22. Usuário pode marcar a vaga como visualizada
```

---

# 64. Arquitetura final esperada

```text
                         INTERNET
                            │
                            ▼
                     ┌─────────────┐
                     │   Frontend  │
                     │ React/Vite  │
                     └──────┬──────┘
                            │
                         REST API
                            │
                            ▼
                     ┌─────────────┐
                     │   NestJS    │
                     │     API     │
                     └──────┬──────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌─────────────┐             ┌─────────────┐
       │ PostgreSQL  │             │    Redis    │
       │   Prisma    │             │   BullMQ    │
       └─────────────┘             └──────┬──────┘
                                          │
                                          ▼
                                  ┌─────────────┐
                                  │    Worker   │
                                  │  NestJS     │
                                  └──────┬──────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │ Job Source     │
                                │ Adapter        │
                                └───────┬────────┘
                                        │
                                        ▼
                                  External Jobs
                                        │
                                        ▼
                                  Parser/Adapter
                                        │
                                        ▼
                                  Job Detection
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                          ▼                           ▼
                    PostgreSQL                 Notification Queue
                                                      │
                                                      ▼
                                               Email / Push
```

---

# 65. Stack definitiva

## Backend

| Tecnologia | Responsabilidade |
|---|---|
| TypeScript | Linguagem |
| NestJS | Framework/API |
| Prisma ORM | ORM |
| PostgreSQL | Banco de dados |
| Redis | Cache/filas |
| BullMQ | Processamento assíncrono |
| JWT | Autenticação |
| Argon2/bcrypt | Hash de senha |
| class-validator | Validação |
| Swagger/OpenAPI | Documentação |
| Jest | Testes |
| Playwright | Automação da fonte, se necessária |

## Frontend

| Tecnologia | Responsabilidade |
|---|---|
| TypeScript | Linguagem |
| React | UI |
| Vite | Build/dev server |
| TailwindCSS | UI |
| TanStack Query | Server state |
| React Router | Rotas |
| Axios/fetch | HTTP |
| Lucide | Ícones |

## Infraestrutura

| Tecnologia | Responsabilidade |
|---|---|
| Docker | Containers |
| Docker Compose | Orquestração inicial |
| PostgreSQL volume | Persistência |
| Redis | Fila |
| Nginx/Traefik | Reverse proxy |
| VPS | Hospedagem |

---

# 66. Resultado esperado

Ao final, o JobWatch não será apenas uma página que consulta vagas.

Será um sistema distribuído com:

```text
Frontend
   +
REST API
   +
Authentication
   +
PostgreSQL
   +
Prisma
   +
Redis
   +
BullMQ
   +
Worker
   +
Job Source Adapter
   +
Deduplication
   +
Monitoring History
   +
Notification System
   +
Email
   +
Docker
```

A responsabilidade do navegador será somente apresentar e interagir com os dados.

A responsabilidade de monitorar vagas ficará no backend/worker.

Isso permite que o usuário feche o navegador, desligue o computador ou fique offline e, ainda assim, o monitoramento continue funcionando no servidor.

O projeto deverá ser desenvolvido de maneira incremental: cada fase precisa estar funcional e testada antes de iniciar a seguinte. O objetivo é evitar criar uma grande quantidade de código desacoplado e só descobrir problemas na integração final.
