# `apps/sync` — PowerSync config + backend connector

Este app reúne dois componentes do sync opcional do OfflineClass:

1. **`powersync/`** — Scaffold da stack PowerSync self-hosted (CLI + Docker Compose):
   - `service.yaml` — config do PowerSync Service (Postgres source, Postgres storage, auth JWT)
   - `sync-config.yaml` — **Sync Streams** (`config: edition: 3`) com `auto_subscribe: true`
   - `docker/` — Docker Compose (pg-db, pg-storage, connector, powersync)

2. **`src/`** — Backend connector (Hono + Drizzle + Postgres):
   - `POST /api/auth/register` — cria conta cloud vinculando o professor local
   - `POST /api/auth/login` — autentica e retorna JWT para o PowerSync
   - `GET  /api/auth/token` — renova JWT (requer Bearer válido)
   - `POST /api/upload` — recebe lote CRUD do `uploadData()` do cliente PowerSync
   - `GET  /health` — liveness check

---

## Pré-requisitos

- Docker + Docker Compose
- Node.js 22+
- pnpm (workspace root)
- PowerSync CLI: `npm install -g powersync`

---

## Configuração inicial

```bash
# 1. Copie o template de variáveis de ambiente
cp apps/sync/powersync/docker/.env.example apps/sync/powersync/docker/.env

# 2. Edite apps/sync/powersync/docker/.env com suas senhas e segredos reais
#    (PS_JWT_SECRET deve ter pelo menos 32 caracteres)
```

---

## Subindo a stack local

```bash
# Via pnpm (a partir da raiz do monorepo):
pnpm --filter @offlineclass/sync docker:start

# Ou diretamente:
cd apps/sync/powersync
powersync docker start

# Ou docker compose diretamente:
cd apps/sync/powersync/docker
docker compose up -d
```

O connector roda migrações automaticamente ao iniciar (idempotente).

**Serviços expostos:**
| Serviço | Porta padrão | |
|---|---|---|
| Postgres source (pg-db) | 5432 | Dados do OfflineClass |
| Postgres storage (pg-storage) | 5433 | Bucket storage do PowerSync |
| Connector (Hono) | 3001 | `POST /api/upload`, `POST /api/auth/*` |
| PowerSync Service | 8080 | SDK dos clientes conecta aqui |

---

## Desenvolvimento local do connector (sem Docker)

```bash
# Defina as variáveis de ambiente manualmente:
export CONNECTOR_DATABASE_URL=postgresql://offlineclass:senha@localhost:5432/offlineclass
export PS_JWT_SECRET=seu_segredo_de_32_chars
export PS_SERVICE_URL=http://localhost:8080
export CONNECTOR_PORT=3001

# Rodar migrações:
pnpm --filter @offlineclass/sync migrate

# Rodar em modo watch:
pnpm --filter @offlineclass/sync dev
```

---

## Arquitetura de auth

O JWT emitido pelo connector usa:
- `sub` = `localTeacherId` (UUID do professor no SQLite local do desktop)
- `aud` = URL do PowerSync Service
- Assinado com HS256 usando `PS_JWT_SECRET` (mesmo segredo configurado em `service.yaml`)

As Sync Streams filtram por `auth.user_id()` (= `sub` = `owner_id` nas tabelas Postgres),
então cada professor só sincroniza seus próprios dados.

---

## Pendências em aberto

- **Q-202** — fluxo completo de vínculo conta cloud ↔ login local no desktop (UX)
- **Q-205** — recorte de PII de aluno nos resultados (nome/matrícula sobem ou não?)
- **Q-206** — VPS de hospedagem para o TCC
- **Q-207** — migração retroativa de dados locais ao vincular pela primeira vez
