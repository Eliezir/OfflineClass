# `apps/sync` — PowerSync config + backend connector

Stack de sincronização cloud opcional do OfflineClass. Reúne:

1. **`powersync/`** — Scaffold PowerSync self-hosted (Docker Compose):
   - `service.yaml` — PowerSync Service config (Postgres source, Postgres storage, JWT auth)
   - `sync-config.yaml` — **Sync Streams** (`edition: 3`, `auto_subscribe: true`)
   - `docker/` — Docker Compose com 4 serviços: `pg-db`, `pg-storage`, `connector`, `powersync`

2. **`src/`** — Backend connector (Hono + Drizzle + Postgres):
   - `POST /api/auth/register` — cria conta cloud vinculando o professor local
   - `POST /api/auth/login` — autentica e retorna JWT para o cliente PowerSync
   - `GET  /api/auth/token` — renova JWT (requer Bearer válido)
   - `POST /api/upload` — recebe lote CRUD do `uploadData()` do SDK PowerSync
   - `GET  /health` — liveness check

---

## Pré-requisitos

- Docker e Docker Compose v2 (`docker compose` — sem hífen)
- Node.js 22+ (via nvm ou similar)
- pnpm (workspace root)

---

## Configuração inicial (primeira vez)

```bash
# A partir da raiz do monorepo:
cp apps/sync/powersync/docker/.env.example apps/sync/powersync/docker/.env
```

Edite `apps/sync/powersync/docker/.env` e troque todos os valores `change_me_*`:

```dotenv
PS_PG_DB_PASSWORD=uma_senha_forte
PS_PG_STORAGE_PASSWORD=outra_senha_forte
PS_JWT_SECRET=string_aleatoria_com_pelo_menos_32_chars
```

> **Importante:** `PS_JWT_SECRET` deve ter no mínimo 32 caracteres e ser igual em
> `service.yaml` (onde o PowerSync Service valida os JWTs) e no connector (onde os JWTs
> são assinados). A variável é lida via `env_file` — nada precisa ser editado no YAML.

---

## Rodando (a partir da raiz do monorepo)

### Opção A — Desktop + sync juntos (recomendado para desenvolvimento)

```bash
pnpm dev:sync
```

Sobe o stack Docker em background e abre o app Electron com HMR.

### Opção B — Só o stack Docker

```bash
pnpm sync:start     # sobe em background
pnpm sync:logs      # acompanha os logs em tempo real
```

### Parar / reiniciar / resetar

```bash
pnpm sync:stop      # para os containers (dados preservados nos volumes)
pnpm sync:restart   # reinicia todos os containers
pnpm sync:reset     # para + apaga os volumes (APAGA dados do Postgres — reset total)
```

---

## Serviços e portas

| Serviço | Porta padrão | Descrição |
|---|---|---|
| `pg-db` | 5432 | Postgres source — dados sincronizáveis do OfflineClass |
| `pg-storage` | 5433 | Postgres storage — bucket interno do PowerSync |
| `connector` | 3001 | API Hono — `/api/auth/*`, `/api/upload`, `/health` |
| `powersync` | 8080 | PowerSync Service — SDK do desktop conecta aqui |

As portas podem ser alteradas no `.env` (`PS_PG_DB_PORT`, `PS_PG_STORAGE_PORT`,
`CONNECTOR_PORT`, `POWERSYNC_PORT`).

---

## Verificando a saúde do stack

```bash
docker compose -f apps/sync/powersync/docker/docker-compose.yaml \
  --project-directory apps/sync/powersync/docker ps

# Connector ok?
curl http://localhost:3001/health
# → {"ok":true,"service":"offlineclass-sync-connector"}

# Tabelas no Postgres?
docker exec -it docker-pg-db-1 \
  psql -U offlineclass -d offlineclass -c "\dt"
```

---

## Migrations

As migrations rodam **automaticamente** quando o container `connector` sobe (idempotente).
Não é necessário rodá-las manualmente.

Para rodar fora do Docker (ex.: apontar para um Postgres externo):

```bash
CONNECTOR_DATABASE_URL="postgresql://offlineclass:senha@localhost:5432/offlineclass" \
PS_JWT_SECRET="seu_segredo" \
  pnpm --filter @offlineclass/sync migrate
```

---

## Fluxo de uso no app

1. Suba o stack: `pnpm dev:sync`
2. No app desktop → **Configurações → Sincronização Cloud**
3. Clique em "Vincular conta" → preencha:
   - **URL do connector:** `http://localhost:3001`
   - **E-mail e senha** → clique em Registrar (primeira vez) ou Login
4. Ative o toggle **"Sincronizar com a nuvem"**
5. Clique em **"Sincronizar agora"** para iniciar um ciclo push/pull

---

## Desenvolvimento local do connector (sem Docker para o connector)

```bash
# Suba só os Postgres (sem o connector e o powersync):
docker compose -f apps/sync/powersync/docker/docker-compose.yaml \
  --project-directory apps/sync/powersync/docker \
  up -d pg-db pg-storage

# Variáveis de ambiente:
export CONNECTOR_DATABASE_URL="postgresql://offlineclass:senha@localhost:5432/offlineclass"
export PS_JWT_SECRET="seu_segredo_de_32_chars"
export PS_SERVICE_URL="http://localhost:8080"
export CONNECTOR_PORT=3001

# Rodar em modo watch:
pnpm --filter @offlineclass/sync dev
```

---

## Arquitetura de auth

- JWT assinado com HS256 usando `PS_JWT_SECRET`
- `sub` = `cloudOwnerId` — UUID do professor que registrou a conta cloud (estável entre dispositivos)
- `aud` = URL do PowerSync Service
- Sync Streams filtram por `auth.user_id()` (= `sub` = `owner_id` nas tabelas Postgres)
  → cada professor só sincroniza seus próprios dados

---

## Questões abertas

- **Q-202** — fluxo completo de vínculo conta cloud ↔ login local (UX, multi-device)
- **Q-205** — recorte de PII de aluno (nome/matrícula sobem para a nuvem?)
- **Q-206** — VPS de hospedagem para o TCC
- **Q-207** — migração retroativa de dados locais ao vincular pela primeira vez
