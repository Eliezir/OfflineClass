# R&D — Real-time groups, student auto-discovery & HTTPS

> Scope: design + prototype for (A) Socket.IO with **multiple collaborative groups**,
> (B) **student auto-discovery** so PCs don't type the teacher's IP, and (C) the
> **HTTPS-over-mDNS** warning. Built on `feature/realtime-socketio` (Socket.IO transport)
> merged with the session UI branch. Companion to `docs/roadmap.md`.

---

## A. Multi-group Socket.IO

### Why
OfflineClass's premise (CLAUDE.md): *"sessions run in groups with real-time collaborative
answer state."* Today the model is flat — a session has students, each with their own
answers. Groups add a layer: students belong to a **group**, and a group is the unit of
real-time collaboration (teammates see each other's activity live).

### Model (additive, non-breaking)
- New table **`groups`** — `id, session_id, name, color, created_at`.
- **`students.group_id`** — nullable FK → `groups.id`. Null = ungrouped (current behavior).
- Existing per-student `answers` stay as-is. Groups are layered on top, so individual mode
  keeps working untouched.

### Socket.IO rooms
Each socket already joins `teacher:<sid>` / `student:<sid>` + `session:<sid>`. We add a
**group room** `group:<sid>:<gid>`. A student with a `group_id` joins it on connect; the
`Rooms` facade gains `toGroup(sessionId, groupId, event)`.

### Events (shared `WsServerEvent`)
- `connection.ack` now carries the resolved `groupId` (null if ungrouped) so the client
  knows its room.
- New `group.answer.update { groupId, questionId, value, byStudentId }` — broadcast to the
  group room whenever a member saves an answer, so teammates' UIs sync live.

### Evolution → fully shared answer state
This prototype broadcasts answers for **live visibility** while persistence stays per-student.
The next step toward true collaboration is a `group_answers(group_id, question_id, value,
updated_at)` table that becomes the source of truth when a session is group-mode; `saveAnswer`
writes there and grading reads the group's answer once per group. Documented here; not yet
implemented to avoid a destructive rewrite of the grading/review path.

### Verification
A headless `socket.io-client` smoke connects two students in group A and one in group B,
saves an answer as an A member, and asserts both A members receive `group.answer.update`
while the B member does not. (See `scripts/`.)

---

## B. Student auto-discovery (no IP typing)

### The constraint that shapes everything
**Browsers cannot do mDNS *service* discovery** — there's no web API to enumerate
`_offlineclass._tcp` and read its port. So a pure-browser student SPA can't "find" the
teacher automatically; *something* has to put a URL in front of the student. What the OS
*can* do (macOS natively, Windows w/ Bonjour, Linux w/ avahi) is resolve the mDNS
**hostname** `offlineclass.local` → the teacher's IP.

### Options
1. **mDNS hostname + memorable port** *(recommended, implemented)*. The server already
   publishes `offlineclass.local`. Students type **`offlineclass.local:<port>`** instead of a
   raw IP — stable, human-typable, survives the teacher changing networks (the IP changes,
   the name doesn't). The teacher lobby surfaces this string big, next to the QR. Port is
   shown because find-free-port may bump it.
2. **QR code** *(already present)*. Great for phones, weak for PCs (the ask) — kept as a
   secondary path.
3. **Fixed low port (80/443) → bare `offlineclass.local`**. Removes the port entirely, but
   binding <1024 needs elevated privileges and collides across dev worktrees. Rejected as a
   default; possible opt-in later.
4. **Native student helper** (Electron/Tauri) doing real mDNS service discovery + auto-open.
   Heaviest; out of scope. Noted as the only path to truly zero-touch on PCs.

### What we implement
- `DiscoveryStatus` gains a ready-to-display **`url`** and **`host`** (`offlineclass.local:port`),
  so the teacher UI shows "Alunos: acessem **offlineclass.local:<port>**" alongside the QR.
- mDNS publish kept; verified resolvable. The QR encodes the same URL.

---

## C. HTTPS over mDNS — the warning

### Diagnosis
The cert is **self-signed** (`tls.ts`), generated with a SAN that already includes
`offlineclass.local`, `localhost`, `127.0.0.1` and the LAN IP — so the hostname *matches*.
The warning is **not** a name mismatch; it's that the issuing CA isn't trusted. Over
`https://offlineclass.local:<port>` a student browser shows "Not secure / proceed anyway".
There is **no way** to make a self-signed cert trusted on student machines without installing
a CA on each — infeasible in a classroom.

### Options
1. **Serve student traffic over HTTP on the LAN** *(recommended, implemented as opt-in)*.
   A closed classroom LAN with no internet is a low threat model; plain HTTP removes the cert
   warning entirely and makes `offlineclass.local:<port>` "just work". WS → `ws://` (fine).
2. **Keep HTTPS, accept a one-time click-through.** Zero code, ongoing friction, looks scary
   to students.
3. **Trusted cert** — needs a real CA / internet. Violates offline-first. Rejected.

### What we implement
- New env **`OFFLINECLASS_TLS`** (`on` | `off`, default `on` to preserve current behavior).
  When `off`: the server skips the self-signed cert and serves **HTTP**; mDNS announces
  `_http._tcp`; `DiscoveryStatus.url` uses `http://`; the Electron cert-trust shim is a
  no-op. Recommended setting for classroom use is `off` (documented in `.env.example`).
- Default stays `on` so nothing breaks silently; flipping one env var gives the
  warning-free student experience.

---

## D. Seed data
`scripts/seed-session.mjs` (run under Electron-as-Node, like `db:studio`, to match the
better-sqlite3 ABI) seeds the runtime DB with: the existing teacher (or a demo one), a demo
exam with MCQ + essay questions, a **lobby** session, two **groups**, and a few students
split across them — so the Sessão screen, student-web, and the group broadcast can be
exercised live without clicking through creation UIs that don't exist yet.

---

## E. Integration seam with the session UI
The session branch's `modules/sessao/queries.ts` polls and notes *"the teacher WebSocket
(separate branch) replaces this with real-time pushes."* That branch is this one:
`shared/realtime/teacher-socket.ts` exposes `connectTeacherSocket({ url, token, sessionId })`.
The seam: the lobby/live screen calls `discovery.getStatus()` for the `url`,
`auth.getToken()` for the token, then subscribes; `session.lobby.update` /
`session.started/ended` events drive `queryClient.setQueryData` instead of polling. Wiring
that into the screen belongs to the Sessão stream and is intentionally left as the next step.

---

## Status
- [x] Groups schema + migration, group rooms, `group.answer.update`
- [x] `DiscoveryStatus.url`/`host`; mDNS hostname access
- [x] `OFFLINECLASS_TLS` HTTP mode (warning-free student access)
- [x] Seed script + headless group-isolation smoke
- [ ] Fully shared `group_answers` persistence (designed above)
- [ ] Wire `connectTeacherSocket` into the Sessão screen (Sessão stream)
- [ ] Student-web UI consuming `group.answer.update` (student stream)
