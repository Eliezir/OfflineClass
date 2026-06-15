# CLAUDE.md — Guide for Claude agents in this repository

> This file orients any Claude agent (or human) opening this repo. Read it before anything else.
> The product docs live in `docs/architecture.md` (system design) and `docs/features.md`
> (feature inventory). The current clone/refactor plan lives in `.context/clone-plan.md`.

---

## 1. The project

**OfflineClass** is a desktop app (Electron + React) for running **collaborative digital
exams in classrooms with no internet**. The teacher's desktop runs a LAN server that
student PCs join over Wi-Fi; sessions run in groups with real-time collaborative answer
state. Optional cloud sync (a VPS) backs up exam definitions and uploads results — never
required at runtime. Offline-first is the core constraint.

College project for the **Operating Systems & Networks** courses.

> **Origin note.** The frontend shell was cloned from the maintainer's other project,
> `apresenta.ai` (an Electron + React app), and is being adapted section by section. Expect
> leftover `apresenta.ai` branding, copy, and AI-provider domain code until each refactor
> lands. Active refactor roadmap: **theme → splash → onboarding → home → settings →
> landing → backend.** Anything still mentioning "apresenta", "provedores" (AI providers),
> Claude/Anthropic generation, or presentations is clone residue, not the target product.

---

## 2. Stack

| Layer | Technologies |
|---|---|
| Desktop (`apps/desktop`) | Electron 39, React 19, TanStack Router + Query + Form, Tailwind v4, hand-rolled `shared/ui` primitives (on radix-ui), Lingui i18n, Zod v4 |
| Cloud/Backend (`apps/cloud`) | TypeScript, Node 22, Hono, Prisma + SQLite, Zod, layered OOP (Controller→BO→DAO) |
| Landing (`apps/landing`) | Vite + React, MagicUI components |
| Build | electron-vite, electron-builder, tsx, pnpm workspaces |

> The cloned backend is the OOP Hono+Prisma+SQLite API from `apresenta.ai`. The **target**
> backend (see `docs/architecture.md`) is offline-first: an in-process Hono LAN server with
> Drizzle + better-sqlite3 inside the Electron main process, plus Socket.IO/Yjs for live
> collaboration. The backend refactor reconciles the two — until then, `apps/cloud` runs as
> a separate process the desktop spawns/attaches to over HTTP on :8080.

Repo layout (pnpm workspace):
```
/apps/desktop     Electron + React (renderer at src/renderer/src)  ← cloned frontend
/apps/cloud       TypeScript API (Hono + Prisma + SQLite)          ← cloned backend
/apps/landing     Marketing site (Vite + React)                    ← cloned landing
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
pnpm dev                    # run the Electron desktop app with HMR (spawns/attaches the backend)
pnpm dev:web                # run the renderer only in the browser (no Electron)
pnpm dev:backend            # start the cloud/backend API (hot reload) at http://localhost:8080
pnpm dev:landing            # run the landing site
pnpm build                  # typecheck + desktop build
pnpm build:backend          # prisma generate + backend typecheck
pnpm test:backend           # backend tests (Vitest)
```

Backend (inside `apps/cloud`): `pnpm dev`, `pnpm test:coverage` (70% gate), `pnpm lint`,
`pnpm dc:check` (layering rules), `pnpm migrate:dev --name x`.

Docker (root): `docker compose up --build` (see `docker-compose.yml`).

---

## 5. Code hygiene (applies to all apps)

- **Keep files small.** Split a file when it grows large or handles more than one clear
  responsibility. A screen of three obvious sections is three components, not one 600-line file.
- **No duplication across modules.** Find and reuse before writing something that looks
  familiar. Extract to a shared location when a second caller appears — not before.
  - Desktop shared UI → `apps/desktop/src/renderer/src/shared/ui` (primitives) or
    `shared/components` (composed). Shared logic → `shared/hooks` / `shared/utils`.
  - Backend shared logic → an existing `BO`/util, or a new one under the right layer.

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

## 8. Backend conventions (`apps/cloud`)

The cloned backend is a layered TypeScript API (Hono + Prisma), built **TDD-first**.

- **Layers:** `Controller` (`src/controllers/`, Hono routers) → `BO` (`src/bo/`) →
  `DAO` (`src/dao/`, wraps `PrismaClient`) → Prisma models. Immutable DTOs are Zod schemas.
- **DI is manual** in `src/app.ts` (composition root). No framework magic.
- **Layering is enforced** by `dependency-cruiser` (`pnpm dc:check`).
- **Errors:** throw `ExcecaoNaoEncontrado` / `ExcecaoValidacao` / `ExcecaoApp`
  (`src/exception/`); `error-handler.ts` maps them (plus Zod errors) to `ErroResponse`.
- **Persistence:** Prisma over SQLite (`prisma/schema.prisma`, migrations in
  `prisma/migrations/`). Secrets are encrypted before storage.
- **Endpoints live under `/api`** (`/api/health`, …). Server on port **8080**.
- **Tests:** Vitest, controllers tested in-process via Hono `app.request()`. 70% coverage gate.

> When the backend refactor begins, reconcile this OOP/Prisma shape with the offline-first
> target in `docs/architecture.md` (Drizzle + better-sqlite3 in-process, Socket.IO/Yjs).

---

## 9. Team

Eliezir Moreira, Pedro Roberto, Raphael Phillipe.
