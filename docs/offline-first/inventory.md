# Inventário auditado — estado real do repo

> **Fonte:** leitura direta de `package.json`, `apps/*/src`, `packages/shared` e do schema
> SQLite. **Auditoria: 2026-06-29.** Só entram aqui fatos verificados no código — nada de
> intenção de produto (essas ficam em `../architecture.md`). Esta é a base factual; os
> demais docs referenciam este arquivo em vez de duplicá-lo.

---

## Monorepo — apps presentes hoje

| App | Caminho | Função | Status |
|-----|---------|--------|--------|
| Desktop (professor) | `apps/desktop` | Electron + UI do professor + backend LAN in-process | ✅ Ativo |
| Student | `apps/student-web` | Electron do aluno (discovery + prova) | ✅ Ativo nesta branch |
| Landing | `apps/landing` | Site de marketing | ✅ Ativo (fora do escopo LAN/sync) |
| Shared | `packages/shared` | Schemas Zod + tipos de wire | ✅ Ativo |
| Cloud | `apps/cloud` | — | ❌ **Não existe** (clone antigo removido) |

---

## Stack instalada e em uso — `apps/desktop`

| Camada | Tecnologia | Versão (package.json) | Uso |
|--------|------------|----------------------|-----|
| Runtime desktop | Electron | ^39.2.6 | ✅ |
| Build | electron-vite | 6.0.0-beta.1 | ✅ |
| UI | React | ^19.2.1 | ✅ |
| Roteamento | TanStack Router | ^1.170.8 | ✅ |
| Estado servidor (UI) | TanStack Query | ^5.100.10 | ✅ |
| Formulários | TanStack Form | ^1.32.0 | ✅ |
| Estilo | Tailwind CSS | ^4.3.0 | ✅ |
| Componentes | radix-ui (hand-rolled em `shared/ui`) | ^1.4.3 | ✅ |
| i18n | Lingui | ^6.3.0 | ✅ |
| Validação | Zod | ^4.4.3 | ✅ |
| HTTP LAN | Hono + `@hono/node-server` | ^4.12.21 | ✅ |
| WebSocket LAN | `@hono/node-ws` | ^1.3.1 | ✅ (não Socket.IO) |
| DB local | better-sqlite3 + Drizzle ORM | ^12.10 / ^0.45.2 | ✅ |
| Auth professor | bcryptjs | ^3.0.3 | ✅ |
| Descoberta | bonjour-service + qrcode | ^1.3.0 / ^1.5.4 | ✅ |
| TLS LAN | selfsigned | ^5.5.0 | ✅ |
| Empacotamento | electron-builder | ^26.0.12 | 🟡 Config existe; distribuição não validada |

> **Nenhuma dependência de sync cloud instalada hoje.** Não há `@powersync/*`, nem cliente
> Postgres, nem qualquer worker de sync no repo.

---

## Banco de dados local (SQLite) — fonte de verdade hoje

Arquivo: `userData/offlineclass.db` (better-sqlite3, WAL, `foreign_keys = ON`).
Schema em `apps/desktop/src/main/db/schema.ts`.

| Tabela | Colunas relevantes |
|--------|--------------------|
| `teachers` | `id`, `email`, `name`, `passwordHash`, `createdAt` |
| `teacher_sessions` | `id`, `teacherId`, `token`, `createdAt`, `expiresAt` |
| `exams` | `id`, `ownerId`, `title`, `description`, `subject`, `gradeLevel`, `icon`, `createdAt`, `updatedAt` |
| `questions` | `id`, `examId`, `position`, `kind` (`mcq`/`multi`/`truefalse`/`essay`/`code`), `prompt`, `points`, `optionsJson`, `image`, `answerBool`, `language`, `starterCode` |
| `exam_sessions` | `id`, `examId`, `ownerId`, `status` (`lobby`/`running`/`ended`), `durationMinutes`, `allowLateJoin`, `startedAt`, `endedAt`, `createdAt` |
| `students` | `id`, `sessionId`, `name`, `matricula`, `token`, `joinedAt`, `lastSeenAt`, `submittedAt`, `leftAt` |
| `answers` | `id`, `studentId`, `questionId`, `value`, `score`, `updatedAt` |

### Fatos relevantes para o sync (verificados)

- **IDs:** gerados com `randomUUID()` (UUID v4) via `node:crypto` (ver `ipc/exams.ts`,
  `ipc/questions.ts`, `sessions/store.ts`). **Não** são ULID nem time-ordered. UUID v4 é
  client-generable e serve para sync (o PowerSync recomenda UUID para IDs de cliente).
- **`updatedAt`:** existe em `exams` e `answers`. **Não** existe em `exam_sessions`,
  `questions`, `students`.
- **Soft-delete:** **não** existe. Nenhuma tabela tem `deletedAt`. `exams.delete` faz
  **hard delete** (`db.delete(...)`), com cascade para `questions`.
- **`syncedAt` / fila de sync:** **não** existem. Sem `sync_outbox`, sem `cloud_link`.
- **Não presentes no schema:** `groups`, `group_members`, `group_answers`, `materials`,
  snapshots Yjs. (Fora do escopo desta branch — ver `scope.md`.)

### Migrations

- Drizzle migrator aplicado no boot (`db/migrate.ts` → `runMigrations`), em
  `app.whenReady` antes de abrir janelas. Pasta `src/main/db/migrations/`.

---

## Superfície IPC do professor (handlers confirmados)

- `auth.*` — login, registro, sessão, perfil
- `exams.*` — `list`, `get`, `create`, `update`, `delete`, `duplicate`
- `questions.*` — add/update/delete/reorder
- `sessions.*` — ciclo de sessão, respostas, correção, export PDF
- `discovery.getStatus` — IP, porta, mDNS, QR

> O alias `@shared/*` no desktop resolve para `apps/desktop/src/shared/*` (interno), **não**
> para `packages/shared`. O import cross-package é `@offlineclass/shared`.

---

## Endpoints HTTP LAN (servidor Hono — `server/index.ts`)

| Rota | Função |
|------|--------|
| `GET /api/health` | Liveness |
| `GET /api/session/active` | Sessão ativa pública |
| `POST /api/join` | Entrada do aluno |
| `GET /api/exam/current` | Prova da sessão |
| `GET /api/session/me` | Estado do aluno |
| `POST /api/heartbeat` | Presença |
| `POST /api/answers` | Salvar resposta |
| `POST /api/submit` | Submissão |
| `POST /api/leave` | Saída |
| `GET /api/ws` | WebSocket (via `@hono/node-ws`) |

---

## `apps/student-web` (aluno — Electron nesta branch)

| Camada | Tecnologia | Uso |
|--------|------------|-----|
| Runtime | Electron ^39.2.6 | ✅ (não é SPA pura no browser) |
| UI | React ^19.2.6 | ✅ |
| Roteamento | react-router-dom ^7.15.1 | ✅ |
| Estado | TanStack Query ^5.100.11 | ✅ |
| Estilo | Tailwind v4 + radix-ui | ✅ |
| Discovery | bonjour-service no **main process** | ✅ |
| Cert self-signed | handler `certificate-error` + `ignore-certificate-errors` | ✅ |

Rotas do aluno: `Discover` → `Join` → `Waiting` → `Test` → `Done` / `Ended`.

> O cliente do aluno **não participa do sync cloud** — ele só fala com o servidor LAN do
> professor. O sync é exclusivamente professor ↔ nuvem.

---

## `packages/shared`

| Conteúdo | Status |
|----------|--------|
| Schemas Zod (auth, exams, questions, session, join, answers, eventos WS) | ✅ |
| Helper ULID (`ids.ts`) | ❌ Não existe (IDs são UUID v4 via `node:crypto`) |
| Schemas de sync (DTOs de push/pull) | ❌ Não existe |
