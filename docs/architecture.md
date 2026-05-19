# Arquitetura — OfflineClass

Documento de referência da stack e estrutura do monorepo após a decisão de adotar **Electron + TypeScript** como stack principal. Substitui o plano anterior baseado em Python + FastAPI + PyWebView.

> **Status:** rascunho de design. Algumas decisões ainda em aberto — ver [Decisões pendentes](#decisões-pendentes).

---

## 1. Contexto

O OfflineClass é um aplicativo desktop instalável no PC do professor. Ele:

- Roda um servidor HTTP local exposto na LAN para que os dispositivos dos alunos respondam à prova pelo navegador.
- Sincroniza presença, timer e respostas em tempo real entre os alunos e o professor.
- Persiste tudo localmente em SQLite — nenhum dado trafega para a internet.
- É distribuído como um instalador único por sistema operacional.

Disciplina: **Laboratório de Sistemas Operacionais e Redes (LSOR)** — IFAL Maceió, 2026.1.

---

## 2. A mudança arquitetural chave: IPC + HTTP

No plano original (Python + FastAPI), a separação entre superfície do professor e superfície do aluno seria feita por **dois listeners HTTP** dentro do mesmo processo (loopback para o professor, LAN para o aluno), com middleware impedindo vazamento.

Em Electron a separação fica **física** e mais forte:

- **Endpoints do professor** existem **apenas** como handlers IPC (Inter-Process Communication) entre o renderer (React) e o main process (Node). Um aluno na LAN literalmente não consegue chamá-los — eles não existem na superfície HTTP.
- **Endpoints do aluno** rodam num servidor HTTP separado (Hono) dentro do main process, exposto em `0.0.0.0`.

Resultado: a fronteira de segurança deixa de depender de middleware e passa a ser a separação nativa entre canais (IPC vs socket TCP) do próprio Electron.

### Diagrama

```
┌──────────── Electron Process (PC do Professor) ──────────────┐
│                                                                │
│  ┌────────────────┐      IPC       ┌──────────────────────┐   │
│  │ Renderer       │ ◄────────────► │ Main Process         │   │
│  │ (React do      │ contextBridge  │  - Node runtime      │   │
│  │  professor)    │                │  - SQLite (Drizzle)  │   │
│  └────────────────┘                │  - Auth (bcrypt)     │   │
│                                    │  - mDNS publisher    │   │
│                                    └──────────┬───────────┘   │
│                                               │ HTTP (Hono)    │
└───────────────────────────────────────────────┼───────────────┘
                                                │
                                                ▼ 0.0.0.0:80
                       ┌────────────────────────────────────┐
                       │  LAN (switch ou WiFi)              │
                       └────┬──────────────┬───────────┬───┘
                            ▼              ▼           ▼
                       Aluno A         Aluno B      Aluno C
                       (browser)       (browser)    (...)
```

---

## 3. Stack tecnológica

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| **Desktop shell** | Electron 33+ | Padrão de fato; Chromium embutido garante UI consistente entre OSs |
| **Build do Electron** | `electron-vite` | Tooling oficial — Vite no renderer + esbuild no main, com hot reload nos dois |
| **HTTP backend (aluno)** | **Hono** | Mais rápido e melhor TS DX que Express/Fastify; ideal para uma dezena de endpoints |
| **DB driver** | **better-sqlite3** | Síncrono, rápido, padrão para apps desktop em Node |
| **ORM / query layer** | **Drizzle** | Type-safe, sintaxe SQL-like (não esconde tudo como Prisma), bundle pequeno |
| **Migrations** | Drizzle Kit | Acompanha o Drizzle |
| **Descoberta mDNS** | **bonjour-service** | Pure JS, sem bindings nativos (evita rebuild por OS) |
| **QR code** | **qrcode** | Geração SVG; usada amplamente no npm |
| **Hash de senha** | **bcryptjs** | Pure JS, sem rebuild; suficiente para a carga de uma turma |
| **Validação de dados** | **zod** | Schemas TS-first compartilháveis entre IPC, HTTP e Drizzle |
| **Renderer (UI professor)** | React 19 + Vite 8 + TS 6 | Estabelece a stack do frontend |
| **Componentes** | Tailwind + shadcn (per-app) | Sem `packages/ui` compartilhado por enquanto — adicionar só quando a duplicação doer |
| **Routing (renderer)** | react-router-dom | Decisão estabelecida — TanStack Router foi descartado |
| **State de servidor** | **TanStack Query** | Camada de cache reativa sobre as chamadas IPC e HTTP |
| **Packaging** | **electron-builder** | Geração cross-platform de `.exe`, `.dmg`, `.AppImage` |

---

## 4. Estrutura do monorepo

```
OfflineClass/
├── apps/
│   ├── desktop/                      # Electron: main + renderer do professor
│   │   ├── electron/                 # MAIN PROCESS (Node)
│   │   │   ├── main.ts               # Entry: createWindow + HTTP + mDNS
│   │   │   ├── preload.ts            # contextBridge → expõe API IPC ao renderer
│   │   │   ├── ipc/                  # Handlers do professor (login, CRUD prova, exports)
│   │   │   ├── server/               # Hono — endpoints do aluno (join, submit, heartbeat)
│   │   │   ├── db/                   # Drizzle: schema, client, migrations
│   │   │   ├── discovery/            # mDNS + detecção de IP + QR
│   │   │   ├── auth/                 # bcrypt + sessions
│   │   │   └── core/                 # paths (%APPDATA% etc.), config
│   │   ├── src/                      # RENDERER (React do professor)
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes/               # login, register, home, tests, students
│   │   │   └── lib/api.ts            # Wrappers tipados sobre IPC
│   │   ├── index.html
│   │   ├── electron.vite.config.ts
│   │   ├── electron-builder.yml
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── student-web/                  # SPA Vite servida pelos endpoints HTTP do main
│       ├── src/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/                         # Vazio inicialmente; tipos compartilhados podem morar aqui
├── design/                           # Arquivos .pen, mockups
├── docs/
│   └── architecture.md               # Este documento
├── README.md
├── package.json                      # Workspace root
└── pnpm-workspace.yaml
```

### Por que `main` e `renderer` juntos em `apps/desktop/`?

São tightly coupled: o renderer **é** o conteúdo da janela do main. O `electron-vite` orquestra os dois numa mesma config. Separar adicionaria complexidade de build sem ganho real.

### Por que `student-web` separado?

É um artefato de deployment completamente diferente — empacotado e servido por HTTP para dispositivos externos (celulares, notebooks dos alunos). Tem ciclo de vida e superfície de ataque distintos. Manter num app próprio reforça a fronteira de segurança.

---

## 5. Decisões já tomadas

Decisões herdadas das discussões anteriores que continuam válidas nesta stack:

- **Multi-teacher auth** — várias contas de professor podem coexistir numa mesma instalação (`teachers` table no SQLite com bcrypt).
- **Dois SPAs separados** (`desktop/src` para professor, `student-web` para aluno) — fronteira de segurança, bundle do aluno auditável.
- **TanStack Query** para data fetching, **sem** TanStack Router, **sem** TanStack Form.
- **Sem `packages/ui` compartilhado** por enquanto. Per-app shadcn init até duplicação real começar a incomodar.
- **Workflow**: scaffold cada peça com a ferramenta oficial (`electron-vite`, `create-vite`, `shadcn init`) e commitar a saída crua antes de customizar.
- **Persistência**: SQLite em diretório user-data do OS (`%APPDATA%/OfflineClass/` no Windows, equivalentes em macOS/Linux — Electron expõe via `app.getPath('userData')`).
- **Heartbeat HTTP a cada 5s** + endpoint `/conectados` no lado do aluno — padrão validado no POC Python.
- **Descoberta**: mDNS (`offlineclass.local`) + QR code apontando para `http://IP_LAN/` como fallback. Validado no POC.

---

## 6. Decisões pendentes

Pontos em aberto, com recomendação:

### 6.1 Alvos de distribuição

- (a) Só Windows (foco no cenário IFAL)
- (b) Windows + macOS (cobre o time de dev)
- **(c) Windows + macOS + Linux (recomendado)** — `electron-builder` faz os três num comando, custo zero adicional

### 6.2 ORM: Drizzle ou raw better-sqlite3?

- **Drizzle (recomendado)** — tipos do schema se propagam para IPC e frontend automaticamente; migrations rastreáveis
- Raw better-sqlite3 — SQL na mão é mais explícito para defender conceitos de banco na banca, mas dá mais retrabalho de manutenção

### 6.3 Porta HTTP em dev vs prod

- Dev: `:8000` (não exige `sudo`)
- Prod: `:80` (URL final `http://offlineclass.local/` sem porta; o instalador elevará privilégios uma vez)
- Controlado por variável de ambiente `OFFLINECLASS_PORT`

### 6.4 Quando atualizar o README

- (a) Junto com o primeiro commit de scaffold do Electron
- (b) Como commit separado de `docs:`

---

## 7. Phase 2 — ainda não scaffolded

Trabalho que vem **depois** do scaffold inicial estar funcionando:

- Schema Drizzle: `teachers`, `exams`, `questions`, `sessions`, `answers`, `students` (efêmero ou persistente?)
- Auth multi-teacher (registro + login + sessões IPC)
- Rotas reais do professor: home, login, register, tests, students
- Fluxo do aluno: join → take exam → submit → done
- Exports CSV/JSON dos resultados em `~/Documents/OfflineClass/exports/`
- mDNS registrado no startup do Electron
- Configuração do `electron-builder` por OS (ícone, identifier, publisher)

---

## 8. Trade-offs honestos

Pontos onde escolhemos um custo conscientemente:

- **Bundle de ~80–200MB** vs. ~30MB do PyInstaller. Aceito em troca de packaging cross-platform maduro e UI consistente.
- **RAM idle ~150MB+** vs. ~30MB do Python. Aceito porque o público-alvo (PC de professor) tem RAM de sobra.
- **Mais abstração escondida** atrás de `bonjour-service` e `dgram` que do `zeroconf` Python explícito. Reduz peso "didático" para a banca de LSOR — vamos compensar mantendo código de descoberta legível e bem comentado.
- **Perde a familiaridade Python** que o time já tinha no POC. Ganha unificação TS end-to-end (mesma linguagem no main, renderer e student-web).
