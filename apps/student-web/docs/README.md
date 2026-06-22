# OfflineClass — App Aluno (student-web)

Aplicativo Electron para o aluno participar de provas colaborativas na rede local.
Conecta-se ao servidor LAN do professor via mDNS e HTTPS.

## Stack

| Camada | Tecnologia |
|---|---|
| Desktop | Electron 39 + electron-vite |
| UI | React 19, react-router-dom v7 (HashRouter), Tailwind v4 |
| Componentes | shadcn/ui (radix-nova), Indigo Pop design tokens |
| Estado | TanStack Query, React Context |
| Rede | Bonjour (mDNS), fetch nativo, WebSocket |
| Notificações | Sonner (toast) |
| Tema | Claro/Escuro (localStorage + `.dark` no `<html>`) |

## Estrutura

```
apps/student-web/
├── electron.vite.config.ts    # Build (main + preload + renderer)
├── electron-builder.yml        # Empacotamento Windows/Mac/Linux
├── resources/icon.png
├── docs/                       # Documentação
└── src/
    ├── main/index.ts           # Electron main: BrowserWindow + mDNS + IPC
    ├── preload/
    │   ├── index.ts            # contextBridge → window.api
    │   └── index.d.ts          # Tipos TypeScript
    └── renderer/
        ├── index.html          # Entry HTML
        ├── public/             # favicon, ícones
        └── src/
            ├── main.tsx        # Raiz React (ThemeProvider → QueryClient → Router)
            ├── index.css       # Indigo Pop tokens (Nunito, OKLch, sombras)
            ├── components/
            │   ├── ui/         # Primitivos shadcn (Button, Card, Input, Dialog, Popover, Segmented)
            │   ├── AppLayout.tsx       # Shell: titlebar + conteúdo + toaster
            │   ├── WindowControls.tsx  # Min/Max/Close (Windows/Linux frameless)
            │   ├── AppToaster.tsx      # Sonner config (ícones coloridos)
            │   ├── StudentMenu.tsx     # Chip de perfil (canto inferior esquerdo)
            │   └── SettingsDialog.tsx  # Configurações (tema claro/escuro)
            ├── lib/
            │   ├── api.ts             # createApi(baseUrl) — cliente HTTP
            │   ├── ws.ts              # connectStudentWs() — WebSocket
            │   ├── router.tsx         # HashRouter com AppLayout wrapper
            │   ├── serverContext.tsx  # Contexto da URL do professor
            │   ├── session.ts         # Token em sessionStorage
            │   ├── studentProfile.ts  # Perfil em localStorage
            │   ├── toast.ts           # Helper notify.success/error/info
            │   ├── useTheme.ts        # Hook de tema
            │   ├── ThemeProvider.tsx   # Provider de tema
            │   ├── platform.ts        # Detecção Electron vs browser
            │   ├── queryClient.ts     # Config TanStack Query
            │   └── utils.ts           # cn() helper
            └── routes/
                ├── Discover.tsx  # mDNS scanning + descoberta de salas
                ├── Join.tsx      # Entrada na prova (nome + matrícula)
                ├── Waiting.tsx   # Lobby (aguardando professor iniciar)
                ├── Test.tsx      # Respondendo a prova
                ├── Done.tsx      # Prova enviada
                └── Ended.tsx     # Sessão encerrada pelo professor
```

## Fluxo do aluno

```
┌──────────┐    mDNS     ┌──────────┐   POST /api/join   ┌──────────┐
│ Discover │───────────→│   Join   │──────────────────→│ Waiting  │
│ (scan)   │  encontra  │ (entrar) │    recebe token   │ (lobby)  │
└──────────┘   sala     └──────────┘                    └──────────┘
                                                              │
                                              session.started │
                                                              ▼
┌──────────┐   POST        ┌──────────┐   session.ended   ┌──────────┐
│  Done    │←──────────────│  Test    │──────────────────→│  Ended   │
│(enviado) │  /api/submit  │(prova)   │  professor encerra│(fechada) │
└──────────┘               └──────────┘                   └──────────┘
```

### Discover — descoberta mDNS

- Main process escuta `offlineclass._http._tcp.local` via Bonjour
- Resultados enviados ao renderer via IPC (`discovery:found`)
- 3 estados: **scanning** (spinner), **found** (card verde com sala), **empty** (após 8s — checklist + reload)
- Botão "Verificar novamente" reinicia o scan
- StudentMenu fixo no canto inferior esquerdo

### StudentMenu — perfil do aluno

- Armazena nome + matrícula em localStorage (`offlineclass:student-profile`)
- Exibe iniciais num círculo indigo (idêntico ao sidebar-user do professor)
- Popover com: Editar perfil, Configurações (tema), Remover cadastro, Sair do app
- Se cadastrado, o Join preenche automaticamente os dados
- "Remover cadastro" limpa localStorage + sessionStorage

### Join — entrada na prova

- Mostra nome da prova e status da sessão
- Formulário: Nome + Matrícula (preenchido se perfil cadastrado)
- Botão **Entrar na sala** → `POST /api/join` → token → waiting/test
- Botão **Atualizar** → recarrega status da sessão
- Botão **Voltar** → retorna ao Discover

### Waiting — lobby

- WebSocket conectado ao servidor do professor (`/api/ws`)
- Heartbeat a cada 10s
- Exibe nome, matrícula, status da conexão
- Auto-avança para `/test` quando o professor inicia a sessão
- Se professor encerrar → toast + navega para `/ended`
- Botão "Sair da sala" para desconectar

### Test — respondendo a prova

- Layout scroll com todas as questões visíveis
- Header sticky com nome, progresso (N/M respondidas), countdown
- Auto-save com debounce de 500ms por questão
- Suporte a MCQ (radio) e Dissertativa (textarea)
- Dialog de confirmação ao enviar (com aviso se questões pendentes)
- Footer fixo com botão "Enviar prova"
- Auto-submit quando o timer zera
- Se professor encerrar → toast + navega para `/ended`

### Done — prova enviada

- Ícone verde CheckCircle
- Mensagem de confirmação com nome do aluno
- Botão "Voltar ao início" (limpa token)

### Ended — sessão encerrada

- Ícone cinza WifiOff (conexão perdida)
- "O professor encerrou a sessão. A prova não está mais disponível."
- Botão "Voltar ao início"

## IPC channels (main ↔ renderer)

| Canal | Direção | Descrição |
|---|---|---|
| `discovery:start` | renderer → main | Inicia scan mDNS |
| `discovery:restart` | renderer → main | Reinicia scan mDNS |
| `discovery:found` | main → renderer | Sala encontrada `{url, name}` |
| `server:set-url` | renderer → main | Persiste URL do professor |
| `server:get-url` | renderer → main | Recupera URL persistida |
| `window:minimize` | renderer → main | Minimiza janela |
| `window:maximize-toggle` | renderer → main | Alterna maximizar |
| `window:close` | renderer → main | Fecha janela |
| `window:is-maximized` | renderer → main | Consulta estado |
| `window:maximize-changed` | main → renderer | Push de estado |

## Design

- **Tema:** Indigo Pop (idêntico ao app professor)
- **Fonte:** Nunito Variable (display + body)
- **Cores:** OKLch — `--primary` indigo (270), `--secondary` lime (140)
- **Botões:** 3D pressable (`shadow-[0_4px_0_var(--primary-dark)]`, `active:translate-y-[2px]`)
- **Cards:** `rounded-[18px]`, `border`, layered shadow com `--edge-soft`
- **Inputs:** `rounded-[14px]`, `shadow-[--edge-soft]`
- **Toasts:** Sonner com ícones coloridos por tom (success/primary/warning/destructive)

## Comandos

```bash
pnpm --filter @offlineclass/student-web dev     # Dev com HMR
pnpm --filter @offlineclass/student-web build   # Produção
pnpm --filter @offlineclass/student-web start   # Preview
```

## Certificados TLS

O app aceita certificados auto-assinados do professor via `app.commandLine.appendSwitch('ignore-certificate-errors')`. Seguro pois só conecta na LAN.
