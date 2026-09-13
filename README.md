# JobWatch

SaaS de monitoramento automático de vagas de emprego (foco inicial: Amazon, região de Richmond, CA).

## Arquitetura

```
frontend/   React + Vite + TypeScript + TailwindCSS (SPA)
backend/    NestJS + Prisma + PostgreSQL + Redis + BullMQ (API + Worker)
```

A API HTTP nunca executa scraping. Toda consulta à fonte de vagas roda no `worker`,
que consome filas do Redis/BullMQ. Ver `backend/src/monitoring/adapters/amazon-jobs.adapter.ts`
para detalhes e limitações da integração com a Amazon.

## Rodando com Docker (recomendado)

```bash
cp .env.example .env    # ajuste os valores, principalmente JWT_SECRET e POSTGRES_PASSWORD
docker compose up -d --build
```

Isso sobe `postgres`, `redis`, `api` (porta 3000) e `worker`. As migrations e o seed
ainda precisam ser rodados manualmente na primeira vez:

```bash
docker compose exec api npx prisma migrate deploy
```

Para popular dados de exemplo (usuário `dev@jobwatch.com` / senha `password123`),
rode o seed a partir do host, apontando para o Postgres exposto em `localhost:5432`
(veja `backend/prisma/seed.ts`):

```bash
cd backend
npm install
npx prisma db seed
```

Documentação interativa da API: http://localhost:3000/api/docs

Health check: http://localhost:3000/api/health

## Desenvolvimento local (sem Docker para API/Worker)

```bash
docker compose up -d postgres redis

cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

npm run start:dev        # API em http://localhost:3000
npm run start:worker:dev # Worker (monitoring + notifications), em outro terminal
```

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Testes (backend)

```bash
cd backend
npm test                                            # testes unitários (Jest)
npm run test:e2e                                    # testes de integração + E2E (precisam de Postgres/Redis rodando)
npm run lint
```

Os testes de integração/E2E usam um banco de dados separado (`jobwatch_test`) e o
DB 1 do Redis (`REDIS_DB=1` em `backend/.env.test`), para nunca colidir com dados
de desenvolvimento ou com o worker "de verdade" rodando ao lado:

```bash
docker exec jobwatch-postgres psql -U jobwatch -d postgres -c "CREATE DATABASE jobwatch_test OWNER jobwatch;"
cd backend
DATABASE_URL="postgresql://jobwatch:jobwatch@localhost:5432/jobwatch_test?schema=public" npx prisma migrate deploy
```

## Produção

Um segundo arquivo de compose adiciona o frontend (build estático servido via
Nginx) e um reverse proxy na frente de tudo, e remove a exposição pública direta
de Postgres/Redis/API:

```bash
cp .env.example .env    # defina POSTGRES_PASSWORD, JWT_SECRET e demais segredos reais
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec api npx prisma migrate deploy
```

Isso sobe:

```
Internet
   │
   ▼
nginx do host (Ubuntu, portas 80/443)   ← em VPS compartilhado
   │
   ▼
jobwatch-proxy (Nginx no Docker, PROXY_HTTP_PORT=18083 em 127.0.0.1)
   ├── /        → jobwatch-frontend (SPA estático)
   └── /api/*   → jobwatch-api
                     │
                     ▼
              postgres + redis (somente na rede interna do Docker)
                     ▲
                     │
              jobwatch-worker (monitoring + notifications)
```

Em VPS que já tem nginx na 80/443 (o erro típico é `502 Bad Gateway
nginx/1.24.0 (Ubuntu)`), **não** mapeie o proxy Docker nessas portas. O
`docker-compose.prod.yml` já publica o proxy em `127.0.0.1:18083` por padrão
(`PROXY_HTTP_PORT`), alinhado ao site `jobwatch.maselcorp.com.br`. Aponte o
nginx do host para essa porta — veja `deploy/nginx/host-jobwatch.conf.example`.

Portas do compose de desenvolvimento (`API_HOST_PORT`, `POSTGRES_HOST_PORT`,
`REDIS_HOST_PORT`, `EXTRACTOR_HOST_PORT`) também são ajustáveis no `.env` se
algum outro app no mesmo servidor já usar 3000/5432/6379/8100.

Frontend e API ficam no mesmo domínio/porta (via proxy), então não há CORS em
produção. `deploy/nginx/nginx.conf` já sobe em HTTP puro (suficiente atrás de um
VPN/firewall ou para testar "modo produção" localmente); o bloco HTTPS comentado
no mesmo arquivo explica como habilitar TLS quando houver um domínio real
(Let's Encrypt/certbot, certificado em `deploy/nginx/certs/`).

## Observabilidade

Toda requisição HTTP é logada (`method path status +duration`) via
`LoggingInterceptor`. Não há um APM (Sentry ou equivalente) integrado — o roadmap
trata isso como um passo posterior ao MVP, e exigiria uma conta/DSN real para
validar de verdade. O ponto de integração natural é o `HttpExceptionFilter`
(`backend/src/common/filters/http-exception.filter.ts`), que já centraliza todo
erro não tratado.

## Notas sobre a fonte de vagas

O adapter padrão (`JOB_SOURCE=amazon`) consulta o endpoint JSON público que o próprio
site amazon.jobs usa (`amazon.jobs/en/search.json`), sem chave ou autenticação.

As vagas horistas de armazém (`Warehouse Associate`) ficam hospedadas em
`hiring.amazon.com`, que fica atrás de proteção anti-bot (CloudFront/WAF) e bloqueia
requisições simples — este projeto não tenta contornar essa proteção. Por isso o
adapter Amazon retorna majoritariamente vagas corporativas/operacionais do
amazon.jobs (algumas realmente são de armazém/fulfillment, mas nem todas).

Para desenvolvimento/testes sem depender da rede, use `JOB_SOURCE=mock`, que usa um
adapter determinístico (`backend/src/monitoring/adapters/mock-jobs.adapter.ts`).

A arquitetura (`JobSourceAdapter`) permite plugar outra fonte no futuro sem alterar
o resto do sistema.
