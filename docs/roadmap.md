# OfflineClass — Roadmap & parallel workstreams

> **Live, committed source of truth** for what's done and what's next. Read this before
> starting work. Unlike `.context/*` (gitignored, local-only notes), this file is tracked
> so every session, worktree, and clone sees the same plan.
>
> Companion docs: `docs/architecture.md` (system design), `docs/features.md` (feature
> inventory). Design-first rule (CLAUDE.md §3) applies to every new screen/component.

---

## Where we are

The frontend was cloned from `apresenta.ai` and rebranded section by section; the offline
backend (POC) was grafted into the Electron main process. The teacher screens are now being
wired to that backend, one section at a time.

**Done**
- ✅ Rebrand: theme (Indigo Pop), splash, onboarding, home shell, settings, landing, logo
  (merged — PR #65).
- ✅ Integration foundation (stages 1a–1c, PR #68): `packages/shared` + `apps/student-web`
  in the workspace; POC backend running in-process (Hono LAN server, better-sqlite3 +
  Drizzle, sessions, mDNS/QR/TLS) with find-free-port; domain IPC
  (`window.api.{auth,exams,questions,sessions,discovery}`) exposed by one preload.
- ✅ **Provas** CRUD wired to `exams.*` (list/create/edit/delete).
- ✅ **Auth**: `/auth` split-panel login/cadastro, route gate on `_app`, sticky session,
  sidebar teacher chip with popover (Configurações + Sair).
- ✅ Tooling: `pnpm db:studio` against the runtime DB (Electron-as-Node).

**In review:** PR #68 (`feature/integration` → `main`).

---

## How to parallelize

Each remaining stream owns a **disjoint set of paths**, so multiple sessions can run at once
without conflicts. Rules:

1. **Branch off `main` once PR #68 is merged** — one PR per stream. (Until then, branch off
   `feature/integration`.) Branch names follow CLAUDE.md §6 (`feature/…`).
2. **Stay inside your stream's "Owns" paths.** Shared touch-points are already complete and
   should be treated as read-only: `packages/shared` (schemas), the preload bridge, the
   sidebar, the auth module.
3. `src/renderer/src/routeTree.gen.ts` is generated (gitignored) — never hand-edit; it
   regenerates on dev/build.
4. New screen/component → **design proposal + approval first** (CLAUDE.md §3).
5. Keep `main` working: half-built screens stay behind their route, reachable but clearly WIP.

### Streams

| Stream | Branch | Owns (paths under `apps/desktop/src/renderer/src`) | Backend IPC |
|---|---|---|---|
| Editor de questões | `feature/questoes` | `modules/provas/*` (prova detail/editor) + a prova-detail route | `questions.add/update/delete/reorder`, `exams.get` |
| Sessão (lobby + ao vivo) | `feature/sessao` | `modules/sessao`, `routes/_app/sessao.tsx` | `sessions.*` + teacher WebSocket |
| Resultados (correção) | `feature/resultados` | `modules/resultados`, `routes/_app/resultados.tsx` | `sessions.studentAnswers`, `sessions.gradeAnswer` |
| Reskin student-web | `feature/student-web` | `apps/student-web/*` (separate app) | — (its own HTTP/WS to the LAN server) |
| Home com dados reais | `feature/home-live` | `modules/home/*` | `exams.*` (+ `sessions.*` later) |

---

## Stream detail

### Editor de questões
Build the prova editor: open a prova, add/edit/reorder questions. Question kinds are a
discriminated union in `packages/shared` (`McqInput` with options, `EssayInput`). Drag-reorder
maps to `questions.reorder(examId, orderedIds)`.
**DoD:** create MCQ + essay questions on a prova, reorder them, `questionsCount` on the Provas
card reflects reality; persists across restarts.

### Sessão (lobby + ao vivo)
Create a session from a prova (`sessions.create`), show a lobby (join URL + QR from
`discovery.getStatus`, students joining live), start/end (`sessions.start/end`), and a live
dashboard of student progress over the teacher WebSocket (token from `auth.getToken`).
**DoD:** start a session, a student joins from `apps/student-web`, teacher sees them live,
end the session.
**Open decision (below):** WebSocket transport.

### Resultados (correção)
List finished sessions and review submitted answers (`sessions.studentAnswers`); grade essay
answers (`sessions.gradeAnswer`); show scores.
**DoD:** open a finished session, review per-student answers, grade an essay, see the score
update.

### Reskin student-web
Apply Indigo Pop to `apps/student-web` (join → waiting room → test → done). Independent of the
desktop renderer.
**DoD:** the four student states render in the Indigo Pop theme; flow works end-to-end against
a live session.

### Home com dados reais
Replace `modules/home/mock-data.ts` with real queries: recent provas via `useExamsQuery`
(reuse `modules/provas/queries`), live/recent sessions later.
**DoD:** home cards show real data; no mock import remains.

---

## Open decisions
- **WebSocket transport.** POC uses `@hono/node-ws`. An earlier ask was **Socket.IO**. Default:
  keep node-ws (working); swap to Socket.IO as a later, isolated change if still wanted. The
  Sessão stream should not block on this — build against the current transport.
- **Cloud sync** — implemented in phases 0–4, 6–7 (branch `pedro/feature/offline-first`).
  `apps/sync` (PowerSync self-hosted + Hono connector) and `apps/desktop/src/main/sync/`
  (bridge + PowerSync client) are in place. Phase 5 (end-to-end validation with the stack
  running) and Phase 8 (final docs) are the remaining items. Decisions: `docs/offline-first/decisions.md` (D-107..D-111). Open questions: Q-202 (cloud auth UX), Q-205 (PII), Q-206 (VPS), Q-207 (retroactive migration).
- **Exports** (CSV/JSON) and **packaging** (electron-builder + bundled migrations + TLS) come
  after the teacher screens are wired.

## Naming rule
The POC DB/IPC schema is **English** (`exams`, `questions`, `students`, `answers`); the UI copy
is **PT** (`provas`, `questões`). Keep DB/IPC identifiers as-is — UI strings stay PT. Don't
rename the schema (too invasive).
