<p align="center">
  <img src="assets/logo-horizontal.png" alt="OfflineClass" width="600"/>
</p>

<p align="center">
  <strong>Plataforma de avaliações digitais para salas sem internet.</strong><br/>
  Professor aplica a prova, alunos conectam pela LAN do switch e respondem do celular ou notebook — nenhum dado sai da rede local.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status"/>
  <img src="https://img.shields.io/badge/desktop-Electron%20%2B%20electron--vite-47848F" alt="Electron"/>
  <img src="https://img.shields.io/badge/server-Hono%20%2B%20node--ws-FF6B35" alt="Hono"/>
  <img src="https://img.shields.io/badge/db-SQLite%20%2B%20Drizzle-003B57" alt="SQLite"/>
  <img src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite%208-61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
</p>

---

## Sobre

O **OfflineClass** resolve um problema corriqueiro em laboratórios de informática: aplicar provas digitais quando a internet é instável ou foi desligada de propósito para garantir a integridade do exame.

O PC do professor roda o app desktop, que sobe um servidor local HTTPS na LAN. Os dispositivos dos alunos (celular ou notebook) se conectam pelo switch da sala, lêem a prova do mesmo servidor, respondem, e o professor acompanha tudo em tempo real e corrige no fim.

Projeto acadêmico do **Laboratório de Sistemas Operacionais e Redes (LSOR)** — IFAL Maceió, 2026.1.

## Equipe

- **Eliezir Moreira**
- **Pedro Roberto**
- **Raphael Phillipe**

## Por que offline

Cenário-alvo no IFAL: cada laboratório tem switch dedicado ligando os PCs por Ethernet. Antes da prova começar, o professor **desconecta o uplink do switch** da rede da escola — a LAN da sala continua viva (DHCP, mDNS, multicast), mas não há rota para internet. Resultado:

- Aluno não consegue pesquisar resposta no Google.
- Servidor não depende de nuvem para autenticar.
- Toda a superfície de risco fica contida no L2 da sala.

Por design, o app **não tem dependência de internet** em nenhum momento: certificado TLS é gerado localmente, descoberta usa mDNS multicast, todos os arquivos JS são servidos pelo próprio Electron.

## Stack tecnológica

| Camada                    | Tecnologia                                                                | Por quê                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Desktop (professor)**   | Electron 39 + `electron-vite`                                             | Janela nativa cross-platform com HMR no main e no renderer. Bundling cuidando da separação main / preload / renderer.    |
| **Servidor HTTP (LAN)**   | [Hono](https://hono.dev/) + `@hono/node-server`                           | Roteador TS-first leve. `app.fetch` desacoplado do runtime — fácil de testar fora do Electron se precisar.               |
| **WebSocket**             | `@hono/node-ws`                                                           | Upgrade no mesmo socket TCP do Hono — uma porta, dois protocolos.                                                        |
| **TLS**                   | `selfsigned` + `node:https`                                               | Cert RSA-2048/SHA-256 self-signed gerado no boot, SAN cobrindo `offlineclass.local` + LAN IP + loopback.                 |
| **Persistência**          | `better-sqlite3` + [Drizzle ORM](https://orm.drizzle.team/) + Drizzle Kit | SQLite síncrono dentro do processo principal. Migrações geradas via Drizzle Kit, aplicadas no `app.whenReady`.           |
| **Descoberta mDNS**       | `bonjour-service`                                                         | Publica `offlineclass._https._tcp.local` + A record para `offlineclass.local`. Aluno não precisa decorar IP.             |
| **QR code**               | `qrcode`                                                                  | Encode da URL da sala (`https://<lan-ip>:8000/`) como data-URL no QR exibido no lobby.                                   |
| **Auth professor**        | `bcryptjs` + sessão persistida em arquivo                                 | Multi-professor por máquina, senha hash de 12 rounds. Token de sessão fica em `userData/active-session.json`.            |
| **Schemas compartilhados**| [Zod](https://zod.dev) + workspace `@offlineclass/shared`                 | Mesma definição valida o payload IPC (lado professor) e HTTP/WS (lado aluno). Tipos derivados via `z.infer`.             |
| **UI (ambos)**            | React 19 + Tailwind v4 + shadcn (preset Radix Nova)                       | shadcn `init` por app (desktop e student-web), sem `packages/ui` compartilhado por enquanto.                             |
| **Routing**               | `react-router-dom`                                                        | Hash router no Electron (file://), browser router no student-web (servido pelo Hono em HTTPS).                           |
| **Data fetching**         | TanStack Query                                                            | Cache reativo sobre IPC (desktop) e HTTP (student-web). Eventos WS atualizam o cache via `setQueryData`.                 |
| **Distribuição**          | `electron-builder`                                                        | Empacotamento cross-platform `.exe` / `.dmg` / `.AppImage`. (Configuração final pendente — ver roadmap.)                 |

## Arquitetura

Duas superfícies, dois canais — pensadas para que um aluno na LAN não consiga sequer enumerar os endpoints do professor.

```
┌─────────────── PC do professor (Electron) ─────────────────┐
│                                                             │
│  ┌─────────────┐    IPC contextBridge   ┌────────────────┐  │
│  │ Renderer    │ ──────────────────────►│ Main process   │  │
│  │ (React)     │ ◄──────────────────────│  • SQLite      │  │
│  └─────────────┘                        │  • Drizzle ORM │  │
│         ▲                               │  • bcrypt      │  │
│         │ window.api.sessions.start(…)  │  • mDNS pub    │  │
│         │                               │  • Self-signed │  │
│         │ WSS loopback                  │    TLS         │  │
│         └─── ws://127.0.0.1:8000 ────►  │                │  │
│                                         └──────┬─────────┘  │
│                                                │ TLS         │
└────────────────────────────────────────────────┼────────────┘
                                                 │
                          ▼ 0.0.0.0:8000 (HTTPS + WSS)
                ┌────────────────────────────────────┐
                │           LAN (switch)             │
                └────┬────────────┬────────────┬────┘
                     ▼            ▼            ▼
                  Aluno A      Aluno B      Aluno C
                  https://offlineclass.local:8000/  (SPA student-web)
```

**Pontos de design importantes:**

- **IPC (professor) e HTTPS/WSS (aluno) compartilham o mesmo SQLite no main process**, mas as duas superfícies são fisicamente distintas. Um aluno no celular não consegue chamar `auth.login` ou `sessions.create` — esses endpoints só existem como `ipcMain.handle`, nunca virou rota HTTP.
- **Hono serve duas coisas no mesmo socket**: API (`/api/*`) e o bundle estático do student-web (`apps/student-web/dist`). Mesmo origin para o SPA do aluno → sem CORS, sem confusão de porta.
- **TLS self-signed gerado no boot**: SAN inclui `offlineclass.local`, `localhost`, `127.0.0.1` e o LAN IP atual. Persiste em `userData/tls/` entre reboots; regenera se a interface de rede muda. Aluno passa pela tela "Conexão não privada" uma vez por dispositivo.
- **mDNS via `bonjour-service`**: publica `offlineclass._https._tcp.local` + A record para `offlineclass.local` apontando para o LAN IP atual.

Diagramas detalhados de cada estágio em [`docs/stages/`](./docs/stages/).

## Como rodar

### Pré-requisitos

- Node.js **22+** (usa `fetch` e `WebSocket` nativos)
- pnpm **9+**
- macOS, Linux ou Windows com **mDNS responder** (Bonjour no Windows, avahi-daemon no Linux — macOS vem built-in)

### Setup

```bash
git clone https://github.com/Eliezir/OfflineClass.git
cd OfflineClass
pnpm install
```

Isso já roda `electron-builder install-app-deps` no postinstall — `better-sqlite3` é rebuildado contra o ABI do Electron.

### Desenvolvimento

```bash
# 1. Build do SPA do aluno (Hono serve a partir do dist; sem esse passo a página /
#    devolve 503 com instrução amigável)
pnpm --filter @offlineclass/student-web build

# 2. Sobe o app desktop com HMR
pnpm dev
```

Na primeira execução:

1. SQLite criado em `~/Library/Application Support/@offlineclass/desktop/offlineclass.db` (macOS; `%APPDATA%/@offlineclass/desktop/` no Windows; `~/.config/@offlineclass/desktop/` no Linux)
2. Migrações Drizzle aplicadas (`0000_init.sql`, `0001_add_score_to_answers.sql`)
3. Certificado self-signed gerado em `userData/tls/`
4. Servidor sobe em `https://0.0.0.0:8000`
5. `offlineclass._https._tcp.local` é anunciado via mDNS
6. Janela do Electron abre na tela de login

### Build de produção

```bash
pnpm build
```

Roda typecheck + bundle em todos os workspaces. O empacotamento final via electron-builder ainda não está configurado (ver [Roadmap](#roadmap)).

## Cenário de uso

1. **Professor cadastra a conta** (`/register`) ou faz login. Sessão fica salva em disco, próxima abertura entra direto no `/`.
2. **Cria uma prova** em `/exams`: título, descrição, questões MCQ e dissertativas. Reordenação por setas, validação por zod, auto-save por questão.
3. **Abre uma sessão** em `/sessions/new`: escolhe a prova, define duração, opcionalmente permite entrada atrasada. Vai para `/sessions/:id` (lobby).
4. **Lobby**: mostra QR + URL pela LAN (`https://offlineclass.local:8000/`) + lista de alunos conectados em tempo real via WS.
5. **Alunos escaneiam o QR** ou digitam a URL no navegador. Aceitam o aviso do certificado autoassinado (uma vez por dispositivo). Entram com nome e matrícula.
6. **Professor clica "Iniciar prova"**: alunos navegam automaticamente para a tela de prova; cronômetro começa.
7. **Durante a prova**: o dashboard mostra grade ao vivo de cada aluno — status (lobby/respondendo/enviou/inativo), progresso (`X/N` respondidas), tempo desde o último heartbeat, contadores agregados no topo.
8. **Aluno envia** (ou cronômetro chega a 0 e envia automaticamente). Card do aluno fica verde.
9. **Professor revisa**: clica em qualquer aluno com nota enviada → dialog mostra cada questão, opção marcada, alternativa correta, e input de nota para dissertativas. MCQ é auto-corrigido; dissertativa é nota manual 0–10.
10. **Encerra a sessão**. Atividade fica salva na seção "Atividades aplicadas" da Home — clicar dali abre o mesmo lobby em modo histórico, todos os alunos clicáveis para revisão.

## Como o aluno conecta

Três caminhos, em ordem de preferência:

| Método              | Suporte                                       | Como                                                                                       |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **QR code**         | Todos                                         | Aluno aponta a câmera para o QR no lobby do professor.                                     |
| **URL mDNS**        | macOS, iOS, Linux com avahi, Windows 10+      | Digita `https://offlineclass.local:8000/` no navegador.                                    |
| **URL IP**          | Todos (incluindo Android Chrome)              | Digita `https://<lan-ip>:8000/` (mostrado no card do professor).                           |

**Caveat Android:** Chrome do Android historicamente não resolve `.local` — alunos com Android precisam usar o IP direto ou o QR.

**Caveat WiFi de prédio:** se o switch da sala estiver em rede com *client isolation* habilitado, multicast (e portanto mDNS) é bloqueado — só IP direto funciona. No cenário de switch dedicado do IFAL isso não acontece.

## Estrutura do monorepo

```
OfflineClass/
├── apps/
│   ├── desktop/                 # Electron — janela do professor
│   │   ├── electron.vite.config.ts
│   │   ├── src/
│   │   │   ├── main/            # Processo principal Node.js
│   │   │   │   ├── auth/        # bcrypt + sessões
│   │   │   │   ├── db/          # Drizzle schema + cliente + migrações
│   │   │   │   ├── discovery/   # IP detection, mDNS, QR
│   │   │   │   ├── ipc/         # Handlers ipcMain.handle por domínio
│   │   │   │   ├── server/      # Hono + node-ws (HTTPS + WSS)
│   │   │   │   ├── sessions/    # Store + Rooms (WS subscription registry)
│   │   │   │   ├── tls.ts       # Geração + cache do cert self-signed
│   │   │   │   └── index.ts     # Orquestrador whenReady
│   │   │   ├── preload/         # Bridge tipado window.api
│   │   │   └── renderer/        # SPA React do professor (HashRouter)
│   │   │       └── src/
│   │   │           ├── routes/  # Login, Register, Home, exams/*, sessions/*
│   │   │           ├── lib/     # api, auth, queryClient, router, ws, utils
│   │   │           └── components/ui/  # shadcn primitives
│   │   └── drizzle.config.ts
│   │
│   └── student-web/             # SPA React do aluno (BrowserRouter)
│       └── src/
│           ├── routes/          # Join, Waiting, Test, Done
│           ├── lib/             # api, queryClient, router, session, ws
│           └── components/ui/   # shadcn primitives
│
├── packages/
│   └── shared/                  # Zod schemas usados nos dois lados
│       └── src/schemas.ts
│
├── scripts/
│   └── mock-student.ts          # Harness para simular aluno via CLI
│
├── docs/
│   ├── architecture.md          # Decisões e racionais
│   └── stages/                  # Diagramas Mermaid por estágio
│       ├── 0-foundation.md
│       ├── 1-teacher-auth.md
│       ├── 2-form-builder.md
│       ├── 3-lobby.md
│       ├── 4-live-dashboard.md
│       └── 6-student-flow.md
│
├── package.json                 # Scripts agregados do workspace
└── pnpm-workspace.yaml
```

## Construído em estágios

Cada commit deixa o repositório buildável; a sequência abaixo é o caminho que a banca pode percorrer via `git checkout` para entender a evolução.

| Stage | O que aterrissou                                                                                 | Doc                                              |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **0** | SQLite + Drizzle, Hono + node-ws, bonjour-service mDNS, QR, IPC tipado, renderer com Router + Query. | [`0-foundation.md`](./docs/stages/0-foundation.md) |
| **1** | Multi-professor auth com bcrypt + sessão persistida; rotas `/login`, `/register`, `/`.            | [`1-teacher-auth.md`](./docs/stages/1-teacher-auth.md) |
| **2** | Form builder de provas (MCQ + dissertativa) com reorder e duplicar.                              | [`2-form-builder.md`](./docs/stages/2-form-builder.md) |
| **3** | Lobby com criação de sessão, QR ao vivo, lista de alunos via WS, eventos `session.lobby.update`. | [`3-lobby.md`](./docs/stages/3-lobby.md) |
| **6** | SPA do aluno (Join → Waiting → Test → Done), Hono servindo o bundle, heartbeat + auto-submit.    | [`6-student-flow.md`](./docs/stages/6-student-flow.md) |
| **4** | Live dashboard com pills de status, idle detection (`lastSeenAt > 15s`), countdown ao vivo.       | [`4-live-dashboard.md`](./docs/stages/4-live-dashboard.md) |
| **HTTPS** | Migração para TLS self-signed no boot, WSS no mesmo socket, mDNS como `_https._tcp`.          | _(inline neste README)_                          |
| **Atividades + Notas** | Listagem de sessões na Home, dialog de revisão com correção manual de dissertativas. | _(inline neste README)_                          |

(Stage 6 veio antes do 4 porque o dashboard é difícil de testar sem um aluno real — registro em `docs/stages/6-student-flow.md`.)

## Roadmap

- **Stage 5 — Exports**: CSV/JSON das respostas em `~/Documents/OfflineClass/exports/`.
- **Stage 7 — Empacotamento**: configurar `electron-builder` para `.dmg`, `.exe` e `.AppImage`; ajustar o path do `apps/student-web/dist` para o layout do asar.
- **Enforcement de tempo no servidor**: hoje o cronômetro é só client-side. Adicionar um interval no main que encerra sessões `running` com `startedAt + durationMinutes` no passado.
- **Heartbeat com debounce server-side**: 30 alunos = 30 broadcasts/s no pico; basta debounce de 5s por aluno.
- **Drag-and-drop reorder** no editor (hoje é setas up/down) com `@dnd-kit/sortable`.
- **Tipos mais ricos de questão** (true/false, ordering) — o discriminator zod facilita.

## Comandos úteis para testar

```bash
# Simular um aluno (POST /api/join + WS + heartbeat + answers + submit)
pnpm mock-student --name "Bot A" --matricula "A001" --answer-every 4 --submit-after 30

# Múltiplos paralelos
pnpm mock-student --name "Bot A" --matricula "A001" &
pnpm mock-student --name "Bot B" --matricula "A002" &

# Verificar mDNS (macOS)
dns-sd -G v4 offlineclass.local
dns-sd -B _https._tcp

# Inspecionar a DB
sqlite3 ~/Library/Application\ Support/@offlineclass/desktop/offlineclass.db ".schema"

# Inspecionar o certificado
openssl x509 -in ~/Library/Application\ Support/@offlineclass/desktop/tls/cert.pem -text -noout
```

## Licença

MIT — ver [LICENSE](./LICENSE).

---

<p align="center">
  <sub>Feito com foco em ambientes educacionais reais — onde a internet nem sempre coopera.</sub>
</p>
