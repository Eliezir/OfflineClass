# OfflineClass — Documentação Técnica

> Guia de onboarding para desenvolvedores. Explica a arquitetura, stack, fluxos de dados e
> convenções do projeto. Leia antes de começar a contribuir.

---

## 1. Visão geral

OfflineClass é uma plataforma de **prova colaborativa offline-first**. Roda em rede local (LAN)
de sala de aula, sem dependência de internet. Dois atores:

| Ator | App | Distribuição |
|---|---|---|
| **Professor** | `apps/desktop` — Electron + React | `.exe` / `.dmg` / `.AppImage` |
| **Aluno** | `apps/student-web` — Electron + React (app) ou browser (SPA servida pelo professor) | Electron ou `https://<ip>:8000` |

O professor cria provas, abre sessões e acompanha os alunos ao vivo. Os alunos descobrem a sala
via mDNS, entram com nome/matrícula, respondem e submetem. Opcionalmente, o professor pode
sincronizar provas e resultados com uma cloud (PowerSync — futuro).

### Monorepo

```
OfflineClass/
├── apps/
│   ├── desktop/          # Electron — professor (UI + servidor LAN + SQLite)
│   ├── student-web/      # Electron — aluno (descoberta + cliente de prova)
│   └── landing/          # Vite + React — site institucional
├── packages/
│   └── shared/           # Zod schemas + tipos TypeScript (cross-app)
├── docs/
│   ├── architecture.md   # Design do sistema (target)
│   ├── features.md       # Inventário de funcionalidades (CORE/FEATURE/EXTRA)
│   ├── roadmap.md        # Plano de desenvolvimento ao vivo
│   └── technical.md      # Este documento
└── assets/               # Logos e banners OfflineClass
```

---

## 2. Stack tecnológica

### `apps/desktop` — professor

| Camada | Tecnologia |
|---|---|
| Shell | Electron 39 + electron-vite |
| UI | React 19, TanStack Router + Query + Form, Tailwind v4 |
| Componentes | shadcn/ui (radix-nova) + hand-rolled `shared/ui` |
| i18n | Lingui (pt-BR + en) |
| Ícones | lucide-react |
| Toasts | Sonner com ícones coloridos por tom |
| Tema | Claro/Escuro via CSS custom properties OKLch + localStorage |

| Camada | Tecnologia |
|---|---|
| Servidor LAN | Hono + @hono/node-server + @hono/node-ws (WebSocket) |
| Banco | Drizzle ORM + better-sqlite3 (síncrono) |
| TLS | selfsigned (certificado auto-assinado gerado no primeiro boot) |
| Descoberta | bonjour-service (mDNS — `offlineclass._https._tcp.local`) |
| QR Code | qrcode |
| Auth professor | bcrypt + session tokens (SQLite) |

### `apps/student-web` — aluno

| Camada | Tecnologia |
|---|---|
| Shell | Electron 39 + electron-vite |
| UI | React 19, react-router-dom v7 (HashRouter), Tailwind v4 |
| Componentes | shadcn/ui (radix-nova) — Indigo Pop |
| Estado | TanStack Query, React Context |
| Rede | fetch nativo, WebSocket |
| Descoberta | bonjour-service (mDNS no main process, IPC → renderer) |
| Toasts | Sonner |
| Perfil | localStorage (`offlineclass:student-profile`) |
| Tema | Claro/Escuro via `useTheme` + `.dark` no `<html>` |

### `packages/shared`

- Zod schemas validados em ambos os lados de cada fronteira
- Tipos puros: `SessionDetail`, `StudentExam`, `WsServerEvent`, `GroupPublic`, etc
- Nenhuma lógica de runtime — só schemas e tipos

---

## 3. Arquitetura de rede

```
┌─────────────────────────────────────────────────────┐
│                  Sala de aula (LAN)                  │
│                                                     │
│  ┌──────────────┐          ┌──────────────┐         │
│  │ Professor    │  HTTPS   │ Aluno A      │         │
│  │ (Electron)   │◄────────│ (Electron ou  │         │
│  │              │  WSS     │  navegador)   │         │
│  │ Hono :8000   │────────►│               │         │
│  └──────────────┘          └──────────────┘         │
│        │                          │                 │
│        │ mDNS                     │ mDNS            │
│        │ publica                  │ descobre        │
│        ▼                          ▼                 │
│  ┌──────────────────────────────────────────┐       │
│  │     offlineclass._https._tcp.local       │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Protocolos

| Protocolo | Rota | Autenticação |
|---|---|---|
| HTTPS | `https://<ip>:8000/api/*` | Bearer token (aluno) |
| WSS | `wss://<ip>:8000/api/ws` | Query param `token` |
| IPC (Electron) | `ipcMain.handle` / `contextBridge` | Implícita (mesmo processo) |

### Fluxo do aluno

```
Discover (mDNS) → Join (POST /api/join) → Waiting (WS) → Test (GET/POST /api/...) → Done/Ended
```

### Autenticação

| Ator | Onde | Como |
|---|---|---|
| Professor | SQLite do desktop | bcrypt + token de sessão |
| Aluno | Linha efêmera no SQLite | Token UUID gerado em `POST /api/join` |

---

## 4. Banco de dados (SQLite)

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `teachers` | Contas locais do professor |
| `teacher_sessions` | Sessões de login do professor |
| `exams` | Provas (título, descrição) |
| `questions` | Questões (MCQ, multi, truefalse, dissertativa, código) |
| `exam_sessions` | Sessões de prova (lobby → running → ended) |
| `students` | Alunos por sessão (matrícula, token, timestamps) |
| `answers` | Respostas dos alunos (por estudante, por questão) |
| `groups` | Grupos de alunos |
| `group_members` | Membros de cada grupo |
| `group_yjs_snapshots` | Snapshot binário do `Y.Doc` de cada grupo (BLOB, debounce 2 s) |

### Convenções

- **IDs**: ULID gerados no cliente (desktop), offline-generáveis
- **Timestamps**: `integer` com `mode: 'timestamp_ms'`, default `unixepoch() * 1000`
- **Soft delete**: `deletedAt` para `exams` e `questions`
- **Migrations**: Drizzle Kit, pasta `src/main/db/migrations/`

---

## 5. Estrutura dos apps

### `apps/desktop/src/`

```
main/
  index.ts              # app.whenReady() — boot
  db/
    client.ts            # better-sqlite3 + Drizzle
    schema.ts            # Todas as tabelas + relações
    migrations/          # SQL gerado pelo drizzle-kit
  auth/                  # bcrypt + tokens de sessão
  server/
    index.ts             # Hono — /api/* + /api/ws + serveStatic (student-web)
  sessions/
    store.ts             # CRUD de sessões, alunos, respostas
    groups.ts            # CRUD de grupos
    rooms.ts             # WebSocket rooms (teacher/student)
  discovery/
    mdns.ts              # bonjour-service publish
    ip.ts                # getLanIp()
    qr.ts                # QR code data URL
  tls.ts                 # Certificado auto-assinado
  ipc/                   # ipcMain.handle — handlers por domínio
  windows.ts             # Gerenciamento de BrowserWindows

renderer/src/
  app/                   # Providers + router config
  modules/
    auth/                # Login/cadastro
    provas/              # CRUD de provas
    questoes/            # Editor de questões
    sessao/              # Lobby + painel ao vivo + WS
    resultados/          # Correção e notas
    home/                # Dashboard inicial
    settings/            # Configurações (tema, notificações)
    onboarding/          # Fluxo de primeiro uso
  shared/
    ui/                  # Primitivos (Button, Card, Input, Dialog, Popover, etc)
    layouts/             # Sidebar, AppToaster, WindowControls
    hooks/               # useTheme, useDelayedLoading
    services/            # toast (Sonner), notification-sound
    styles/main.css      # Design tokens OKLch (Indigo Pop)
```

### `apps/student-web/src/`

```
main/index.ts            # Electron main — BrowserWindow + Bonjour mDNS + IPC
preload/index.ts         # contextBridge → window.api (discovery, server, window)
renderer/
  index.html             # Entry point
  src/
    main.tsx             # React root — ThemeProvider → QueryClient → Router
    index.css            # Indigo Pop tokens
    components/
      ui/                # Button, Card, Input, Dialog, Popover, Segmented
      AppLayout.tsx      # Shell — titlebar + Outlet + AppToaster
      WindowControls.tsx # Min/Max/Close (Windows/Linux frameless)
      AppToaster.tsx     # Sonner config
      StudentMenu.tsx    # Chip de perfil — canto inferior esquerdo
      SettingsDialog.tsx # Tema claro/escuro
    lib/
      api.ts             # createApi(baseUrl) — cliente HTTP configurável
      ws.ts              # connectStudentWs() — WebSocket
      router.tsx         # HashRouter — / → /join → /waiting → /test → /done → /ended
      serverContext.tsx  # Contexto da URL do professor
      session.ts         # Token (sessionStorage)
      studentProfile.ts  # Perfil (localStorage)
      toast.ts           # notify helper
      useTheme.ts        # Hook de tema
      ThemeProvider.tsx   # Provider
      platform.ts        # isElectron()
    routes/
      Discover.tsx       # mDNS scanning (3 estados: scanning/found/empty)
      Join.tsx           # Formulário nome/matrícula + polling 3s
      Waiting.tsx        # Lobby + grupos (groupMode: free)
      Test.tsx           # Prova com auto-save e countdown
      Done.tsx           # Prova enviada
      Ended.tsx          # Sessão encerrada pelo professor
```

---

## 6. Design system — Indigo Pop

### Tokens de cor (OKLch)

| Token | Valor (light) | Uso |
|---|---|---|
| `--background` | `oklch(0.995 0.002 255)` | Fundo da página |
| `--foreground` | `oklch(0.32 0.02 262)` | Texto principal |
| `--primary` | `oklch(0.58 0.19 270)` indigo | Botões, links |
| `--secondary` | `oklch(0.72 0.17 140)` lime | Badges, status |
| `--success` | `oklch(0.66 0.16 145)` | Toast sucesso, ícones |
| `--destructive` | `oklch(0.62 0.22 25)` | Erros, remover |
| `--warning` | `oklch(0.83 0.16 80)` | Avisos |
| `--border` | `oklch(0.905 0.008 255)` | Bordas |
| `--muted-foreground` | `oklch(0.52 0.018 262)` | Texto secundário |

### Tipografia

- **Display**: Nunito Variable, weight 800, tracking `-0.022em`
- **Body**: Nunito Variable, tracking `-0.01em`
- **Mono**: JetBrains Mono Variable

### Componentes

| Componente | Estilo |
|---|---|
| **Button** primary | `rounded-[14px]`, `shadow-[0_4px_0_var(--primary-dark)]`, `active:translate-y-[2px]` |
| **Button** ghost | `rounded-[14px]`, `hover:bg-muted` |
| **Card** | `rounded-[18px]`, `border border-border`, layered shadow com `--edge-soft` |
| **Input** | `rounded-[14px]`, `border-input-border`, `shadow-[--edge-soft]` |
| **Popover** | `rounded-2xl`, `bg-popover/85 backdrop-blur-xl` |
| **Dialog** | overlay `bg-black/50`, content `rounded-lg` |

---

## 7. IPC — Comunicação Electron

### Professor (`apps/desktop`)

O renderer não acessa o main diretamente. Toda comunicação passa por `window.api`:

```typescript
// Preload expõe:
window.api.invoke('window:minimize')       // IPC bridge tipado (Zod)
window.api.auth.login(input)               // Domain handlers (string channels)
window.api.sessions.create(input)
window.api.print()                         // Atalho para printToPDF
window.api.exportPdf()                     // Retorna base64 do PDF
```

### Aluno (`apps/student-web`)

```typescript
// Preload expõe:
window.api.discovery.start()               // Inicia mDNS
window.api.discovery.restart()             // Reinicia scan
window.api.discovery.onFound(callback)     // Evento de sala encontrada
window.api.server.setUrl(url)              // Persiste URL do professor
window.api.window.minimize()               // Controles de janela
window.api.window.maximizeToggle()
window.api.window.close()
```

---

## 8. WebSocket — eventos

### Professor → Servidor → Professor

| Evento | Payload | Quando |
|---|---|---|
| `session.lobby.update` | `{ students }` | Aluno entra/sai/submete |
| `student.left` | `{ student }` | Aluno sai da sala |
| `student.submitted` | `{ student }` | Aluno envia prova |
| `group.list` | `{ groups }` | Grupos são alterados |

> **Nota:** Yjs Doc updates e Awareness updates do monitor de grupo chegam ao renderer do professor via **IPC push** (`group.yjs.update` e `group.awareness.update`), não via este WebSocket.

### Servidor → Aluno

| Evento | Payload | Quando |
|---|---|---|
| `session.started` | `{ startedAt, durationMinutes }` | Professor inicia |
| `session.ended` | `{ endedAt }` | Professor encerra |
| `group.list` | `{ groups }` | Grupos atualizados |

---

## 9. API REST

### Endpoints do professor (Hono LAN server)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/health` | — | Liveness |
| `GET` | `/api/session/active` | — | Sessão ativa (pública) |
| `POST` | `/api/join` | — | Entrar na sessão → token |
| `GET` | `/api/session/me` | Bearer | Estado do aluno |
| `GET` | `/api/exam/current` | Bearer | Prova atual |
| `POST` | `/api/heartbeat` | Bearer | Keep-alive |
| `POST` | `/api/answers` | Bearer | Salvar resposta |
| `POST` | `/api/submit` | Bearer | Submeter prova |
| `POST` | `/api/leave` | Bearer | Sair da sessão |
| `GET` | `/api/groups` | Bearer | Listar grupos |
| `POST` | `/api/groups` | Bearer | Criar grupo |
| `POST` | `/api/groups/:id/join` | Bearer | Entrar no grupo |
| `POST` | `/api/groups/:id/leave` | Bearer | Sair do grupo |
| `GET` | `/api/ws` | Query token | WebSocket upgrade |
| `*` | — | — | Serve student-web SPA |

### IPC do professor (main ↔ renderer)

| Canal | Descrição |
|------|------|
| `auth.register/login/me/logout/getToken` | Autenticação |
| `exams.list/get/create/update/delete/duplicate` | CRUD de provas |
| `questions.add/update/delete/reorder` | CRUD de questões |
| `sessions.list/create/get/active/start/end` | Ciclo de sessão |
| `sessions.studentAnswers/gradeAnswer` | Correção |
| `sessions.broadcastLobby` | Broadcast manual do lobby |
| `sessions.createGroup/joinGroup/leaveGroup/deleteGroup/kickStudent` | Gerenciamento de grupos |
| `sessions.getGroupYjsSnapshot(groupId)` | Retorna `Uint8Array` com estado serializado do `Y.Doc` do grupo |
| `sessions.subscribeGroupYjs(groupId)` | Registra renderer como subscriber de push do Y.Doc; envia evento `group.yjs.update` a cada update |
| `sessions.unsubscribeGroupYjs(groupId)` | Remove subscription de Y.Doc |
| `sessions.onGroupYjsUpdate(handler)` | Escuta evento push `group.yjs.update` no renderer; retorna `unsubscribe` |
| `sessions.subscribeGroupAwareness(groupId)` | Registra renderer como subscriber de awareness; envia `group.awareness.update` a cada update de presença |
| `sessions.unsubscribeGroupAwareness(groupId)` | Remove subscription de awareness |
| `sessions.onGroupAwarenessUpdate(handler)` | Escuta evento push `group.awareness.update`; retorna `unsubscribe` |
| `discovery.getStatus` | IP, porta, QR |
| `window:minimize/maximize-toggle/close/is-maximized` | Controles de janela |
| `window:print` / `sessions.exportPdf` | Impressão/PDF |

---

## 10. Ciclo de vida da sessão

```
draft ──► lobby ──► running ──► ended
           │                      │
           │ alunos entram        │ alunos que não saíram
           │ (POST /api/join)     │ ganham leftAt = endedAt
           │                      │
           │ grupos formados      │ respostas extraídas
           │ (se groupMode ≠      │ (futuro: Y.Doc → answers)
           │  disabled)           │
```

- **Sessão única ativa por professor** — `createSession` filtra por `ownerId`
- **Bloqueio de dupla entrada** — mesma matrícula faz UPDATE (limpa `leftAt`, novo token)
- **Auto-leave ao encerrar** — `endSession` define `leftAt = endedAt` para todos os alunos ativos

---

## 11. Grupos — implementação atual

### Estados e Modos implementados

- `disabled` — cada aluno é um grupo de 1 (padrão).
- `free` — alunos criam, entram e saem de grupos livremente através da tela de lobby (`Waiting.tsx`).
- `teacher` — professor arrasta alunos e gerencia a alocação de grupos no painel do lobby do desktop (`LobbyPanel`).
- `shuffle` — o sistema divide os alunos aleatoriamente em grupos de tamanho máximo configurado ao iniciar a prova.
- Trava de grupos — a formação de grupos é travada no momento de transição `lobby → running`.

### Padronização do Lobby
- Toda a interface de gerenciamento de grupos no lobby (`LobbyPanel`) foi unificada para todos os modos de grupo (`free`, `shuffle`, `teacher`), exibindo a coluna de alunos sem grupo e a lista de grupos. 
- **Restrição de Ações:** O botão **"Novo Grupo"** e o banner informativo sobre controle pelo professor são ocultados nos modos `free` (onde a criação é descentralizada no aluno) e `shuffle` (criação automática), aparecendo de forma restrita apenas quando `session.groupMode === 'teacher'`.

### Monitoramento de Grupos em Tempo Real
- **Dashboard Ativo:** Na fase em curso (`running`), se a sessão de prova for em grupo, a listagem de progresso de alunos é dividida em cartões de grupos (`LiveDashboard`), permitindo ao professor clicar em **"Abrir Y.Doc (Tempo Real)"** para monitorar a colaboração.
- **IPC-only (sem WebSocket no professor):** O `GroupRealtimeMonitor` usa exclusivamente IPC para sincronização — `getGroupYjsSnapshot`, `subscribeGroupYjs`/`onGroupYjsUpdate` para o doc, e `subscribeGroupAwareness`/`onGroupAwarenessUpdate` para cursores e presença. Não há conexão WebSocket do lado do professor para o monitor.
- **TipTap Colaborativo (Modo Leitura):** Questões dissertativas e de código são exibidas em editores TipTap de leitura (`editable: false`) acoplados ao `Y.Doc` e `Awareness` local. Updates IPC disparam `Y.applyUpdate()` / `awarenessProtocol.applyAwarenessUpdate()` na instância local — TipTap e `CollaborationCursor` refletem automaticamente.
- **Respostas MCQ/Truefalse/Multi:** Exibidas a partir do observer `ydoc.getMap('answers').observe()`, que dispara `setAnswers()` React sempre que o Y.Map muda via IPC push.
- **Navegação:** O painel lateral esquerdo lista todos os integrantes do grupo com respectivo progresso e botão de ação rápida para detalhar o estudante.

### Colaboração em Tempo Real (Yjs)

A colaboração em grupo usa **duas camadas de transporte** separadas por papel:

#### Aluno → Servidor (WebSocket binário)

Alunos conectam a `/api/ws?role=student&token=...` e trocam frames binários com byte de cabeçalho:

| Byte `[0]` | Tipo | Conteúdo |
|---|---|---|
| `0` | Yjs Doc Update | Delta do `Y.Doc` do grupo (respostas MCQ/texto) |
| `1` | Awareness Update | Codificado por `y-protocols/awareness` (cursores, presença) |

O servidor aplica type `0` ao `yjsManager` (mantém um `Y.Doc` por grupo em memória) e faz broadcast de ambos os tipos para os demais membros do grupo via `rooms.broadcastYjsToGroup()`.

**Dupla gravação no `/api/answers`:** quando o aluno salva uma resposta MCQ/text via REST (`POST /api/answers`), o servidor também atualiza `yjsManager.getOrCreateDoc(groupId).getMap('answers').set(questionId, value)`. Isso garante que o monitor do professor veja a resposta mesmo se o caminho Yjs WS falhar.

#### Professor → Monitor de Grupo (IPC — sem WebSocket)

O monitor do professor (`GroupRealtimeMonitor`) é um componente React no renderer Electron que usa **exclusivamente IPC** para sincronizar o Y.Doc e a awareness:

```
1. getGroupYjsSnapshot(groupId)  → Uint8Array  → Y.applyUpdate(doc, snapshot)
2. subscribeGroupYjs(groupId)    → (sem retorno)
3. onGroupYjsUpdate(handler)     → desregistrar no cleanup
   handler: (gid, update) → Y.applyUpdate(doc, update, 'ipc-push')

4. subscribeGroupAwareness(groupId)
5. onGroupAwarenessUpdate(handler)
   handler: (gid, encoded) → awarenessProtocol.applyAwarenessUpdate(aware, encoded, 'ipc-push')
```

No main process:
- `sessions.subscribeGroupYjs` → `doc.on('update', onUpdate)` → `wc.send('group.yjs.update', groupId, update)`
- `sessions.subscribeGroupAwareness` → `rooms.subscribeAwarenessIpc(groupId, wc)` → `rooms.broadcastAwarenessIpc()` é chamado no `onMessage` do WS quando `type === 1` chega de qualquer aluno

> **Racional:** o renderer Electron (Chromium) e o main process (Node.js) compartilham memória via IPC; não há custo de rede. Essa abordagem é mais confiável que enviar frames binários do Node.js para o Chromium via loopback TCP, que sofria de inconsistências no handling de `Uint8Array` no `WSContext.send()` do Hono.

#### `yjsManager` — Singleton em memória

- Um `Y.Doc` por `groupId`, criado lazily em `getOrCreateDoc(db, groupId)`
- Se existe snapshot em `group_yjs_snapshots`, aplica-o. Senão, semeia do banco (`answers` table) usando `Y.XmlText` para essay/code e `Y.Map('answers')` para MCQ
- Debounce de 2 s para persistir snapshots em `group_yjs_snapshots` após cada update
- `syncAnswersFromYdoc()` sincroniza o Y.Map de volta para a tabela `answers` em cada save

### Tabelas

```sql
groups (id, session_id, name, created_at)
group_members (id, group_id, student_id, joined_at) UNIQUE(group_id, student_id)
group_yjs_snapshots (group_id, snapshot (BLOB), created_at, updated_at) UNIQUE(group_id)
```

### API e WebSocket

| Recurso | Tipo | Descrição |
|---|---|---|
| `GET /api/groups` | HTTP | Lista grupos com membros e estado de entrega. |
| `POST /api/groups` | HTTP | Cria grupo `{ name }`. |
| `POST /api/groups/:id/join` | HTTP | Aluno entra no grupo (removido de outros). Atualiza WS. |
| `POST /api/groups/:id/leave` | HTTP | Aluno sai do grupo (remove grupo se vazio). Atualiza WS. |
| `/api/ws` | WebSocket | Canal em tempo real para sincronização Yjs, awareness e eventos (lobby/submit). |


---

## 12. Log de auditoria

### Dados capturados por aluno

| Campo | Quando é preenchido |
|---|---|
| `joinedAt` | `POST /api/join` |
| `leftAt` | `POST /api/leave` ou `endSession()` |
| `answeredCount` | Query `COUNT(*)` de `answers` |
| `submittedAt` | `POST /api/submit` |
| `total / maxTotal` | Calculado na tela de resultados |

### Visualização

- **Card expansível** — avatar, nome, nota, chevron animado, audit log
- **Linha do tempo** — eventos ordenados (▶ iniciou, 👤 entrou, 🚪 saiu, 📨 enviou, ⏹ encerrou)
- **Toasts ao vivo** — professor recebe `student.left` e `student.submitted` via WebSocket

### Exportação

- **CSV** — `downloadCsv()` gera Blob com BOM UTF-8
- **PDF** — `window.api.exportPdf()` → `webContents.printToPDF()` → download

---

## 13. Comandos

```bash
# Raiz do monorepo
pnpm install                    # Instalar tudo
pnpm dev                        # Professor (Electron + HMR)
pnpm dev:web                    # Apenas renderer do professor (browser)
pnpm dev:landing                # Site institucional

# Student-web
pnpm --filter @offlineclass/student-web dev      # Dev com HMR
pnpm --filter @offlineclass/student-web build    # Produção

# Desktop
pnpm --filter @offlineclass/desktop build        # Produção
pnpm --filter @offlineclass/desktop db:studio    # Drizzle Studio
pnpm --filter @offlineclass/desktop db:generate  # Gerar migration
```

---

## 14. Build e distribuição

### Professor

```bash
pnpm --filter @offlineclass/desktop build:win    # .exe
pnpm --filter @offlineclass/desktop build:mac    # .dmg
pnpm --filter @offlineclass/desktop build:linux  # .AppImage
```

- `electron-builder.yml` — config de empacotamento
- `resources/icon.png` — ícone 512px

### Aluno

```bash
pnpm --filter @offlineclass/student-web build:win
```

- `electron-builder.yml` em `apps/student-web/`
- `resources/icon.png` — compartilhado com o professor

---

## 15. Roadmap resumido

| Status | Funcionalidade |
|---|---|
| ✅ | CRUD de provas e questões |
| ✅ | Sessões (lobby → running → ended) |
| ✅ | App aluno Electron (discovery, join, test, submit) |
| ✅ | Log de auditoria (timeline, per-student, CSV/PDF) |
| ✅ | Grupos — modo livre |
| ✅ | Toasts ao vivo (leave, submit) |
| ✅ | Tema Indigo Pop (claro/escuro) |
| ✅ | Perfil do aluno (localStorage) |
| ✅ | Grupos — teacher-designa, shuffle |
| ✅ | Colaboração Yjs (tempo real) |
| ⏳ | Cloud sync (PowerSync) |
| ⏳ | Envio de resultados por email |
| ⏳ | Materiais auxiliares (PDF, vídeo) |
