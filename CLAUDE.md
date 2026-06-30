# CLAUDE.md — Guide for Claude agents in this repository

> This file orients any Claude agent (or human) opening this repo. Read it before anything else.
> The product docs live in `docs/architecture.md` (system design) and `docs/features.md`
> (feature inventory). **The live plan — current status + parallel workstreams (read this
> before starting work) — is `docs/roadmap.md`.** Local-only working notes (gitignored, not
> shared across sessions) live in `.context/`.

---

## 1. The project

**OfflineClass** is a desktop app (Electron + React) for running **collaborative digital
exams in classrooms with no internet**. The teacher's desktop runs a LAN server that
student PCs join over Wi-Fi; sessions run in groups with real-time collaborative answer
state. Optional cloud sync (a VPS) backs up exam definitions and uploads results — never
required at runtime. Offline-first is the core constraint.

College project for the **Operating Systems & Networks** courses.

> **Origin note.** The frontend shell was cloned from the maintainer's other project,
> `apresenta.ai` (an Electron + React app) and adapted section by section. Refactor roadmap
> **theme → splash → onboarding → home → settings → landing** is **done** — those are now
> OfflineClass (Indigo Pop theme, Nunito, rebranded copy/assets) with the apresenta
> AI-provider screens, provider IPC, and presentation copy removed. The old `apps/cloud`
> clone (the apresenta OOP Hono+Prisma+SQLite backend) has been **deleted** — the runtime
> backend is now in-process inside the Electron main (`apps/desktop/src/main`). The optional
> cloud-sync tier is **planned via PowerSync** and is **not yet in the repo**.

---

## 2. Stack

| Layer | Technologies |
|---|---|
| Desktop (`apps/desktop`) | Electron 39, React 19, TanStack Router + Query + Form, Tailwind v4, hand-rolled `shared/ui` primitives (on radix-ui), Lingui i18n, Zod v4 |
| Backend (LAN runtime) | In-process inside the Electron main (`apps/desktop/src/main`): Hono LAN server + Drizzle + better-sqlite3, talks to the renderer over IPC |
| Landing (`apps/landing`) | Vite + React, MagicUI components |
| Build | electron-vite, electron-builder, tsx, pnpm workspaces |

> The runtime backend is **offline-first and in-process**: a Hono LAN server with Drizzle +
> better-sqlite3 living inside the Electron main process (`apps/desktop/src/main`), reached
> from the renderer over IPC. There is **no separate backend app** — the old `apps/cloud`
> clone was removed. The optional **cloud-sync tier (PowerSync)** is planned and not yet in
> the repo; see `docs/architecture.md` for the target design.

Repo layout (pnpm workspace):
```
/apps/desktop     Electron + React (renderer at src/renderer/src); LAN backend in src/main
/apps/landing     Marketing site (Vite + React)                    ← cloned landing
/packages/shared  Zod schemas / types shared across apps
/assets           OfflineClass logos/banners
/docs             architecture.md, features.md (product design)
/.context         Working notes shared across agents (clone-plan.md)
```

---

## 3. Collaboration rule — IMPORTANT

**Every new screen or component requires a design proposal approved by the user BEFORE any UI code is written.**

Mandatory flow for each new screen/component:

1. **Proposal first.** Present the proposed design — structured description (layout,
   hierarchy, states, copy) and/or a textual wireframe and/or a static HTML mockup. When it
   makes sense, offer **at least 2 variants** with clear tradeoffs.
2. **The user votes / requests adjustments.** Iterate until "approved".
3. **Only then implement.** No new screen/component `.tsx` file is written before approval.

This also applies to meaningful variations of existing components. Internal refactors that
don't change the visual result don't need a vote.

---

## 4. Common commands

At the repo root (pnpm workspace):

```bash
pnpm install                # install everything (all apps)
pnpm dev                    # run the Electron desktop app with HMR (LAN backend runs in-process)
pnpm dev:web                # run the renderer only in the browser (no Electron)
pnpm dev:landing            # run the landing site
pnpm build                  # typecheck + desktop build
```

The LAN backend has no separate process or command — it boots inside the Electron main when
you run `pnpm dev`. DB tooling lives in `apps/desktop` (`pnpm --filter ./apps/desktop db:studio`).

### Cloud sync (optional — requires Docker)

**First-time setup:**
```bash
cp apps/sync/powersync/docker/.env.example apps/sync/powersync/docker/.env
# edit .env: change passwords and set PS_JWT_SECRET (min 32 chars)
```

```bash
pnpm dev:sync       # start Docker stack (PowerSync + Postgres + connector) then open the desktop
pnpm sync:start     # start the Docker stack only (background, no desktop)
pnpm sync:stop      # stop containers (preserves volumes / Postgres data)
pnpm sync:restart   # restart all containers in the stack (no rebuild)
pnpm sync:rebuild   # rebuild connector image and restart (use after changing apps/sync/src/)
pnpm sync:reset     # stop + DELETE volumes (full clean reset — Postgres data is lost)
pnpm sync:logs      # tail logs from all containers in real time
pnpm sync:status    # show container health/status
```

Ports exposed by the Docker stack:

| Service | Port | Description |
|---|---|---|
| Postgres source (`pg-db`) | 5432 | Syncable OfflineClass data |
| Postgres storage (`pg-storage`) | 5433 | PowerSync internal bucket storage |
| Connector (Hono) | 3001 | `/api/auth/*`, `/api/upload`, `/health` |
| PowerSync Service | 8080 | Desktop SDK connects here |

Postgres migrations run automatically when the connector starts (idempotent).

---

## 5. Code hygiene (applies to all apps)

- **Keep files small.** Split a file when it grows large or handles more than one clear
  responsibility. A screen of three obvious sections is three components, not one 600-line file.
- **No duplication across modules.** Find and reuse before writing something that looks
  familiar. Extract to a shared location when a second caller appears — not before.
  - Desktop shared UI → `apps/desktop/src/renderer/src/shared/ui` (primitives) or
    `shared/components` (composed). Shared logic → `shared/hooks` / `shared/utils`.
  - LAN backend logic → the modules under `apps/desktop/src/main` (`sessions/`, `db/`, `ipc/`).
  - Cross-app types/schemas → `packages/shared`.

---

## 6. Branch and PR conventions

- **Branch names use a type prefix**, kebab-case after the slash: `feature/…`, `fix/…`,
  `chore/…`, `refactor/…`, `docs/…`, `test/…`.
- **One PR = one clear goal.** Keep PRs small *and* coherent.
- **Main stays working.** A half-built screen behind a hidden route or flag is fine; a
  broken screen on the home page is not.
- **Title mirrors the branch type:** `feat: …`, `fix: …`, `chore: …`, etc.
- **Definition of Done per PR:** feature reachable via its route, uses design tokens (no
  hardcoded colors), works in light and dark mode, typecheck passes, no unrelated diffs.
- **Never add Claude (or any AI) as a co-author** on commits or PRs. No `Co-Authored-By`
  trailer, no "Generated with Claude Code" footer, no mention of the assistant.

---

## 7. Frontend conventions (`apps/desktop`)

- **Routes** are file-based via TanStack Router in `src/renderer/src/routes` (`tsr generate`).
  Keep routes thin; delegate logic, HTTP, and complex components to the matching module.
- **Module pattern:** `src/renderer/src/modules/<domain>/{api,queries,schemas,components}`.
  `api.ts` centralizes data access; `queries.ts` holds stable query keys + queries/mutations;
  `schemas.ts` holds Zod schemas (`z.infer` for types).
- **Design tokens** in `src/renderer/src/shared/styles/main.css` (OKLch variables) — **never**
  hardcode colors. Use `bg-card`, `text-muted-foreground`, `border-border`, etc.
- **Dark theme** via Tailwind v4 `@custom-variant dark`; toggle the `.dark` class on `<html>`
  (owned by the `ThemeProvider`). Every interface must work in light and dark.
- **Server state** via TanStack Query; **forms** via TanStack Form; validate with Zod.
- **Reuse `shared/ui` primitives first** (Button, Card, Input, Dialog, Popover, Tooltip…).
  Icons from `lucide-react` (`size-4`). Radii: controls `rounded-[10px]`, cards `rounded-2xl`.
- See `apps/desktop/docs/frontend-guide.md` for the full screen/form checklist.

---

## 8. Backend conventions (LAN runtime, `apps/desktop/src/main`)

The backend is **offline-first and in-process** — it boots inside the Electron main process;
there is no separate server app or deploy.

- **DB:** Drizzle over better-sqlite3. Schema in `db/schema.ts`; migrations applied on startup.
  Synchronous queries (better-sqlite3) — no `await` on DB calls.
- **Data access:** plain functions grouped by domain under `sessions/` (e.g. `store.ts`),
  owner-scoped (`ownerId`) for every teacher-facing read/write. No ORM layering/DI framework.
- **Renderer ↔ main:** IPC handlers in `ipc/` (`ipcMain.handle('domain.action', …)`), exposed
  to the renderer via the typed `window.api.*` bridge in `src/preload`. The renderer never
  hits HTTP for teacher actions — only the in-process LAN HTTP/WS server serves students.
- **LAN server:** a Hono server (`startServer(...)`) for the student SPA + Socket.IO/WS,
  started during `bootstrap()` in `main/index.ts`.
- **Shared types/schemas:** Zod schemas in `packages/shared`, imported by both main and renderer.

> The optional **cloud-sync tier is planned via PowerSync** and not yet in the repo. When it
> lands it will be a thin sync/connector service (auth tokens + write upload), not a port of
> the old `apps/cloud` clone. See `docs/architecture.md` for the target design.

---

## 9. Team

Eliezir Moreira, Pedro Roberto, Raphael Phillipe.
