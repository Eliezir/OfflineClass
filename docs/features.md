# OfflineClass — Inventário de Funcionalidades

Documento complementar ao `docs/architecture.md`. Aqui ficam **o que** o produto faz, no nível de UX/funcionalidade, agrupado por área. Serve como fonte para a criação dos issues do backlog no GitHub.

## Convenções

Cada item recebe uma das tags abaixo:

- **[CORE]** — essencial pro produto funcionar. MVP não pode sair sem isso. Ship primeiro.
- **[FEATURE]** — funcionalidade padrão planejada pro MVP, mas o produto consegue funcionar (degradado) sem. Ship em seguida.
- **[EXTRA]** — nice-to-have / polish / opcional. Pode escorregar pra fase 2 sem afetar a viabilidade do MVP.
- **[A DECIDIR]** — regra de negócio ainda pendente. Resolver durante review ou criação dos issues.

## Visão geral

OfflineClass é uma plataforma de prova colaborativa **LAN-only**. O app é um **Electron local** rodando na máquina do professor; dentro dele há um **servidor web** que atende os alunos via Wi-Fi da sala. Alunos conectam de **PCs** (desktops de laboratório, notebooks). Smartphones/tablets **não são suportados** intencionalmente — celulares podem cair pra dados móveis e burlar a garantia LAN-only que sustenta o anti-cheat básico. O desktop acumula: servidor LAN, ferramenta de autoria, e painel ao vivo da sessão. Sessões rodam em **grupos** (aluno individual = grupo de 1), com estado de resposta colaborativo em tempo real dentro de cada grupo. Sync opcional para cloud (VPS) faz backup das definições de prova e upload dos resultados — nunca é obrigatório em runtime.

---

## 1. Professor (desktop, offline-first)

### 1.1 Conta & autenticação
- **[CORE]** Criar conta local de professor (nome, email, senha)
- **[CORE]** Login com sessão persistente (sobrevive ao restart do app)
- **[CORE]** Logout
- **[CORE]** Multi-professor por instalação: o mesmo desktop suporta N contas
- **[CORE]** Hash de senha via bcrypt
- **[FEATURE]** Vinculação opcional com conta cloud via fluxo do indicador de sync (ver §4.1)

### 1.2 Autoria de prova
- **[CORE]** Criar prova (título, descrição)
- **[CORE]** Listar minhas provas
- **[CORE]** Editar metadados da prova
- **[FEATURE]** Soft-delete de prova (suporta sync com `deletedAt`)
- **[CORE]** Reordenar questões dentro de uma prova
- **[FEATURE]** **Form builder unificado:** canvas onde o professor adiciona blocos (questões + materiais auxiliares) em qualquer ordem — drag/drop pra reordenar, clique pra editar
- **[FEATURE]** **Blocos de material auxiliar** misturados inline com questões: PDF, imagem, vídeo, link externo visíveis pro aluno durante a prova (ver §1.2.1)
- **[EXTRA]** Exportar prova como arquivo JSON (sneakernet entre desktops sem cloud)
- **[EXTRA]** Importar prova de arquivo JSON
- **[EXTRA]** Duplicar prova como ponto de partida pra nova prova

### 1.2.1 Materiais auxiliares
- **[FEATURE]** Tipos suportados: **PDF**, **imagem** (jpg/png/webp), **vídeo** (mp4/webm), **URL externa** (link só — sem auto-embed; ver decisão abaixo)
- **[FEATURE]** Arquivos guardados **só localmente no desktop** (`app.getPath('userData')/materials/<provaId>/<fileId>`) e servidos pelo Hono LAN em rota estática. **Não sincronizam pra cloud.**
- **[FEATURE]** O JSON da prova sincronizado referencia materiais por `fileId` apenas — os arquivos em si não viajam. Num desktop novo, o professor precisa re-anexar os binários; as referências sobrevivem mas renderizam como "ausente — re-anexar" até que o arquivo esteja disponível
- **[FEATURE]** Aluno vê os materiais inline na UI da prova, na posição em que o professor colocou no form builder
- **[FEATURE]** **Limite de tamanho por arquivo enforced** (valor exato [A DECIDIR] — provavelmente ~50MB/arquivo, ~500MB/prova). Mesmo sem sincronizar, arquivos grandes degradam responsividade da LAN.
- **[FEATURE]** **Player de vídeo: só HTML5 nativo** (mp4/webm hospedado localmente). **Sem auto-embed de YouTube/Vimeo** — esses provedores exigem internet e contradizem o princípio offline-first.

### 1.3 Autoria de questões (via form builder)

**Pontuação & peso.** Cada bloco de questão tem um campo `points` (default 1). A nota total da sessão é a soma dos pontos das questões corretas. Não há mecanismo separado de "peso %" — pontos *são* o peso. Agregação é soma simples.

**Conjunto de tipos no MVP (travado):**

- **[CORE]** **MCQ (escolha única)** — N opções, exatamente uma correta
- **[FEATURE]** **MCQ (múltipla escolha)** — N opções, ≥1 correta; professor escolhe **política de crédito parcial por questão**: `all-or-nothing` (pontuação cheia só se acertar todas as corretas e não marcar nenhuma incorreta) ou `proporcional` ((corretas marcadas / total corretas) − (incorretas marcadas / total incorretas), mínimo 0)
- **[FEATURE]** **Verdadeiro/Falso** — caso especial de MCQ com 2 opções
- **[FEATURE]** **Resposta curta** — texto livre, correção por match exato (case-insensitive, trim de espaços; professor pode fornecer múltiplas respostas aceitas)
- **[CORE]** **Dissertativa (essay)** — texto livre, correção manual
- **[FEATURE]** **Código** — aluno escreve código em editor monospace (ex: CodeMirror); correção manual; professor pode especificar linguagem (hint pra syntax highlight)
- **[FEATURE]** **Ordenação** — professor fornece N itens na ordem correta; aluno arrasta pra reordenar
- **[FEATURE]** **Associação (matching)** — professor fornece duas colunas (esquerda + direita); aluno liga os pares

Form builder é **extensível por design** — tipos adicionais (matemática/LaTeX, upload de imagem pelo aluno, preencher lacuna) podem ser adicionados em fase 2 como novos kinds de bloco sem reescrever schema.

**Propriedades comuns de bloco:**
- **[CORE]** Título (markdown permitido)
- **[CORE]** Valor em pontos (default 1)
- **[FEATURE]** Dica opcional por questão (visível pro aluno durante a prova)
- **[FEATURE]** Ordem das opções pode ser **embaralhada por aluno** (toggle nos blocos família-MCQ)
- **[A DECIDIR]** Limite de tempo por questão, em adição ao timer de sessão (ver §1.4)?

### 1.4 Ciclo de vida da sessão
- **[CORE]** Iniciar sessão pra uma prova → estado `lobby`
- **[CORE]** Transição `lobby` → `running` (trava formação de grupos + abre fluxo de respostas)
- **[CORE]** Transição `running` → `ended` (não aceita mais respostas)
- **[FEATURE]** **Formulário de criação de sessão** com opções escolhidas pelo professor:
  - Modo de formação de grupos (livre / professor-designa / sorteio / desativado = modo individual)
  - **Duração** (timer da prova inteira, ex: 90 min) — countdown visível pros alunos; auto-transição pra `ended` ao zerar
  - **Embaralhar ordem das questões** (toggle) — cada aluno/grupo vê questões em ordem aleatória própria
  - **Embaralhar opções de MCQ** (toggle global) — opções das MCQs reordenadas por aluno
  - **Mostrar nota imediatamente ao aluno** (toggle) — se ON, na SPA o aluno vê a nota dele no momento que a sessão entra em `ended`; se OFF, só recebe a nota via email (§1.6) quando o professor decidir enviar
  - **[A DECIDIR]** Outras opções (permitir revisar respostas submetidas? permitir pular? exigir todas respondidas pra submeter?)
- **[CORE]** **Sessão única ativa por professor** — não pode iniciar nova sessão enquanto outra está em `lobby` ou `running`. Simplifica painel, ciclo dos Y.Docs, presença. Reabrir essa decisão se aparecer caso multi-turma real.
- **[EXTRA]** Pausar/retomar uma sessão em andamento

### 1.5 Painel ao vivo (duas visões, duas janelas)
- **[FEATURE]** **Vista Projetor** (pública, em uma **`BrowserWindow` Electron separada** que o professor pode arrastar pro monitor do projetor): alto contraste, tipografia grande, mostra
  - Título da sessão + tempo restante (countdown grande)
  - Roster dos grupos (só nomes + avatares, sem dados de resposta)
  - Número de submissões vs total de grupos
  - Nenhum dado pessoal de resposta — seguro pra projetar
- **[CORE]** **Vista Privada** (monitor próprio do professor): painel completo, mostra
  - Tudo da Projetor + lista de alunos conectados, progresso das respostas por grupo, quem está idle, etc.
- **[FEATURE]** As duas janelas leem o mesmo estado em memória da sessão (via IPC do Electron); a Privada emite comandos (start/end, etc.) que a Projetor reflete passivamente
- **[FEATURE]** Botão "Abrir projetor" no painel privado abre a segunda janela; fechá-la não encerra a sessão
- **[CORE]** Lista de alunos conectados com timestamp de último-visto (só na vista privada)
- **[CORE]** Status de submissão — quem enviou
- **[FEATURE]** Vista de grupos: roster de cada grupo + progresso das respostas (vista privada)
- **[FEATURE]** Leitura ao vivo do Y.Doc de cada grupo — professor vê respostas sendo preenchidas em tempo real (vista privada)
- **[FEATURE]** Awareness de quantos em cada grupo estão ativamente conectados

### 1.6 Correção & revisão
- **[CORE]** Auto-correção de MCQ (contra gabarito) — aplica política de crédito parcial se for multi-select
- **[CORE]** Correção manual de dissertativa (professor lê e atribui nota em `0..points`)
- **[FEATURE]** Correção manual de bloco de código (mesmo fluxo da dissertativa)
- **[CORE]** Pontuação total visível no diálogo de review
- **[CORE]** Review por aluno das respostas submetidas
- **[FEATURE]** Review por grupo (grupo submete um único conjunto de respostas; atribuição individual via `updatedBy`)
- **[FEATURE]** **Campo de comentário por questão** na UI de review — professor pode deixar nota em qualquer questão (auto-corrigida ou manual); o comentário aparece no email de resultado do aluno (e na nota imediata, se habilitada)
- **[FEATURE]** **Mostrar nota imediatamente ao aluno na SPA** — condicionada pelo toggle "Mostrar nota imediatamente" na criação da sessão (§1.4). Se habilitado: assim que a sessão entra em `ended`, a SPA do aluno renderiza a nota dele + breakdown por questão + comentários. Se desabilitado: SPA mostra só "Sessão encerrada — você receberá o resultado por email".
- **[FEATURE]** **Envio de resultados por email** — professor clica "Enviar"; o **cloud** (apps/cloud) cuida do envio efetivo via um provedor de email transacional (escolha [A DECIDIR] em §10 — pendente time)
- **[FEATURE]** Desktop faz POST pra `/api/sync/sessions/results/email` com a lista de tuplas (email, payload); cloud faz fila + retries
- **[FEATURE]** Payload do email por destinatário: nota total, breakdown por questão (enunciado, resposta do aluno, resposta correta, pontos atribuídos) e o comentário do professor por questão (se houver)
- **[FEATURE]** Funcionalidade de email exige desktop **vinculado ao cloud** (sem envio se `stay-local` está ON ou cloud inalcançável); UI deixa o botão cinza com tooltip explicando
- **[EXTRA]** **Exportar resultados como CSV / PDF / Excel** pros registros do professor (export local, não passa pela cloud)

---

## 2. Aluno (PC, web LAN)

**Dispositivo alvo: PC (desktop de laboratório / notebook pessoal) na Wi-Fi.** Smartphones/tablets explicitamente **não** suportados — alunos precisam usar um PC conectado à LAN da sala. Razão: um celular poderia desativar Wi-Fi e usar dados móveis pra burlar a garantia LAN-only (que é o anti-cheat baseline). A SPA do aluno é projetada pra browsers de desktop (mouse + teclado, viewport maior).

### 2.1 Descoberta & entrada
- **[CORE]** mDNS broadcast (`offlineclass._http._tcp.local`) — PCs com resolução mDNS conseguem acessar `https://offlineclass.local:8000`
- **[CORE]** Fallback: QR code na tela do professor mostra a URL completa (`https://<ip>:<porta>`); aluno digita no browser do PC
- **[CORE]** **Formulário de entrada (3 campos):** nome completo, matrícula, email. Todos obrigatórios. Matrícula é o identificador estável (correlação cross-session, casamento futuro com roster). Email habilita a funcionalidade de "enviar resultado por email" (§1.6) sem precisar sincronizar roster separado.
- **[CORE]** `POST /api/join` retorna um token de sessão efêmero (Bearer) usado nas chamadas HTTP/WS subsequentes
- **[FEATURE]** Validação de email: só formato no client; validação real acontece no envio (cloud)
- **[A DECIDIR]** Cert auto-assinado faz o browser mostrar aviso de segurança no primeiro acesso. Aceitar manual cada vez, ou distribuir um cert de CA (via QR ou pre-instalado nos PCs)? (Pra escopo de TCC, aceitar manual provavelmente serve.)

### 2.2 Saguão (pré-início)
- **[CORE]** Estado de espera enquanto o professor prepara a sessão
- **[EXTRA]** **Customizador de avatar (SVG generativo)** — aluno customiza features de rosto (cabelo, olhos, sobrancelhas, boca, tom de pele, óculos, barba, fundo) usando uma lib tipo [`react-nice-avatar`](https://github.com/dapi-labs/react-nice-avatar). SVG puro, sem upload de imagem, sem storage de binários — só o JSON de config (~200 bytes) persistido na linha do `students`
  - Renderizado de forma idêntica na SPA do aluno, painel do professor, vista projetor, e na awareness do Yjs
  - Botão "Aleatorizar" pra quem não quer mexer
- **[FEATURE]** Se grupos habilitados + formação = livre: navegar grupos disponíveis + criar/entrar/sair livremente
- **[FEATURE]** Se grupos habilitados + formação = professor-designa: ver "você está no grupo X" (sem escolha)
- **[FEATURE]** Se grupos habilitados + formação = sorteio: ver "aguardando sorteio" até o professor iniciar
- **[FEATURE]** Se grupos desabilitados (modo individual): sem UI de grupo, só esperar
- **[FEATURE]** Trocas livres de grupo só são permitidas antes do estado `running`
- **[CORE]** Heartbeat pra manter status "online"

### 2.3 Resolvendo a prova
- **[CORE]** **Layout: todas as questões em uma única página com scroll vertical** (sem paginação por questão). Aluno vê o todo, navega por scroll, e a UI mostra um indicador lateral (sticky) com progresso ("3/15 respondidas")
- **[CORE]** Responder MCQ (radio select)
- **[CORE]** Escrever dissertativa (textarea)
- **[CORE]** Submeter (final, não pode reabrir)
- **[FEATURE]** **Materiais auxiliares** (PDFs, vídeos, imagens, links de §1.2.1) renderizados inline nas posições onde o professor colocou no form builder
- **[FEATURE]** Se a sessão tem `scrambleQuestions`: cada aluno/grupo vê questões em ordem aleatória própria (seed pelo groupId, estável durante a sessão)
- **[FEATURE]** Se a questão tem `scrambleOptions`: as opções dessa MCQ são reordenadas por aluno
- **[FEATURE]** Em grupo de 2+: qualquer membro pode editar qualquer resposta; last write wins
- **[FEATURE]** Awareness: ver cursores ao vivo / seleção dos outros membros (estilo Tiptap pra dissertativa; indicador "Maria está na questão 3" pra MCQ)
- **[FEATURE]** Indicador visível de "quem tocou por último nesta resposta" (`updatedBy` do Yjs)
- **[FEATURE]** Countdown visível (se a sessão tem duração); fica vermelho nos últimos N minutos; auto-submit ao zerar
- **[CORE]** Filosofia anti-cheat: LAN-only + PC-only é a garantia principal. **Sem** fullscreen lock ou detecção de tab switch no MVP — fácil de burlar e dá falsa sensação de segurança. (Reabrir se feedback pedagógico exigir.)

### 2.4 Reconexão
- **[CORE]** Reconexão transparente do WS (retry com backoff)
- **[FEATURE]** Awareness do Yjs restaura presença na reconexão; updates CRDT perdidos são sincronizados via protocolo de delta do Yjs
- **[CORE]** Indicador visível pro usuário: "reconectando…" depois "online novamente"

---

## 3. Colaboração em grupo (Yjs)

### 3.1 Modos de formação
- **[FEATURE]** **Livre:** alunos criam/entram/saem de grupos no saguão até a sessão iniciar
- **[FEATURE]** **Professor-designa:** professor coloca os alunos manualmente em grupos antes de iniciar
- **[FEATURE]** **Sorteio automático:** professor define o tamanho do grupo; sistema divide ao iniciar
- **[FEATURE]** Professor escolhe o modo na criação da sessão
- **[FEATURE]** Composição do grupo trava na transição `lobby → running`
- **[FEATURE]** **Tamanho máximo do grupo configurável por sessão** (campo numérico no form de criação da sessão). Sem mínimo enforced — grupo de 1 é válido.
- **[FEATURE]** **Se formação = livre e o aluno está sem grupo:** o `lobby → running` da sessão fica **bloqueado** pra esse aluno até ele criar ou entrar em algum grupo (mesmo que seja grupo de 1 pessoa só). Professor vê na vista privada quem ainda não tem grupo. O start global pode ocorrer sem ele caso o professor force; nesse caso o aluno fica no estado "fora da sessão" até criar um grupo.

### 3.2 Colaboração em tempo real
- **[FEATURE]** Cada grupo tem um `Y.Doc` com o estado de resposta do grupo
- **[FEATURE]** `Y.Map<questionId, answer>` pra slots de MCQ (um valor por questão)
- **[FEATURE]** `Y.Text` pra dissertativas (edição colaborativa estilo Tiptap)
- **[FEATURE]** `Awareness` pra cursores, seleção, presença
- **[FEATURE]** Transporte: `y-websocket` sobre o WSS do desktop, num path tipo `/yjs/:groupId`
- **[FEATURE]** Coexiste com o canal de push WS existente (`/api/ws`) via master upgrade router
- **[FEATURE]** Server é só relay (snapshots + autenticação na conexão; não autoritativo sobre conteúdo do doc)

### 3.3 Persistência
- **[FEATURE]** Y.Doc serializado como `Uint8Array` e salvo como BLOB no SQLite periodicamente (a cada N updates ou X segundos)
- **[FEATURE]** Em caso de restart do desktop no meio da sessão, Y.Docs recarregam do snapshot
- **[FEATURE]** Na submissão do grupo, o server extrai respostas estruturadas do Y.Doc e grava em `group_answers` (fonte da verdade na hora de corrigir)

### 3.4 Submissão
- **[FEATURE]** Qualquer membro do grupo pode iniciar o submit
- **[FEATURE]** **Submit exige confirmação de todos os membros online do grupo.** Iniciador clica "Submeter" → aparece prompt nos outros membros online ("João pediu pra submeter — confirma?") → submissão final só vai quando **todos os online** clicam "confirmar". Membros offline no momento são ignorados (não bloqueiam). Se algum online recusar, o submit é cancelado e a edição continua.
- **[CORE]** Submit é irreversível (sem reabrir)
- **[FEATURE]** Todos os membros veem o estado "submetido" simultaneamente
- **[FEATURE]** UI mostra status do submit em andamento ("aguardando confirmação de Maria, Pedro…")

---

## 4. Sync (opcional, cloud)

**Modelo de UX (travado):** **não existe uma tela dedicada "Configurações → Sync"**. Sync aparece via dois controles mínimos na UI principal do professor:

1. **Toggle "stay local"** num menu pequeno de configurações (estado default em §4.6). Quando ON, sem nenhuma atividade de sync, sem notificações, sem chamadas pra cloud — totalmente invisível.
2. **Botão/notificação de sync** no header do app. Mostra estado atual ("sincronizado", "N pendentes", "sincronizando…", "erro: cloud inalcançável"). Clica pra disparar sync manual, ou clica num badge de notificação que aparece quando há mudanças pendentes.

### 4.1 Vinculação de conta
- **[FEATURE]** Na primeira vez que o professor clica no botão de sync sem estar vinculado, um modal pede credenciais cloud (email + senha) — vinculação ali mesmo, sem tela separada
- **[FEATURE]** Desktop faz POST pra cloud `/auth/login` → recebe token de longa duração
- **[FEATURE]** Token guardado localmente (SQLite, encriptado at-rest)
- **[FEATURE]** Estado de vinculação visível no menu de sync ("vinculado como X / desvincular")
- **[A DECIDIR]** Registro de conta cloud: modal in-app, ou só via web admin externa?

### 4.2 Push de definições (desktop → cloud)
- **[FEATURE]** Clicar no botão de sync = empurra todas as provas + questões alteradas desde o último sync com sucesso
- **[FEATURE]** Resolução LWW: server compara `updatedAt`, aceita só se o push for mais novo
- **[FEATURE]** Soft-deletes propagam (campo `deletedAt`)
- **[FEATURE]** UI de progresso inline com o botão: spinner + "sincronizando 3 de 12…"
- **[A DECIDIR]** Arquivos de material auxiliar (PDFs, vídeos) também são empurrados? (Decisão atual: **não** — ver §1.2.1. Reabrir aqui é YAGNI no momento.)

### 4.3 Pull de definições (cloud → desktop)
- **[FEATURE]** Pull acontece implicitamente no mesmo clique de sync (push primeiro, depois pull do que tem novo na cloud)
- **[FEATURE]** Cloud retorna todas as provas do professor vinculado modificadas desde o último pull
- **[FEATURE]** Local aplica LWW em cada linha
- **[A DECIDIR]** Primeiro sync em máquina nova: download completo da biblioteca — confirmar "isso vai baixar X MB" antes de começar?

### 4.4 Push de resultados (desktop → cloud)
- **[FEATURE]** Após `ended`, resultados entram na fila de pendentes
- **[FEATURE]** Próximo clique de sync empurra eles; ou se aparecer uma notificação ("resultados de sessão pendentes"), professor clica pra empurrar
- **[FEATURE]** Inclui: membership dos grupos, respostas do grupo, notas, atribuição via `updatedBy`
- **[FEATURE]** Mão única — cloud nunca modifica resultados
- **[A DECIDIR]** Empurrar nomes dos alunos junto com resultados, ou anonimizar? (Consideração de LGPD.)

### 4.5 Indicador de sync (header)
- **[FEATURE]** Estados: `local-only` (toggle off — nada é exibido), `synced` (checkmark), `N pending` (badge com número), `syncing` (spinner), `error` (ponto vermelho com tooltip de hover explicando)
- **[FEATURE]** Timestamp do último sync visível em hover/clique
- **[FEATURE]** Erros exibidos claramente ("cloud inalcançável", "auth expirou — re-vincular")

### 4.6 Toggle "stay local"
- **[FEATURE]** Configuração persistente (SQLite, por professor ou por instalação)
- **[FEATURE]** Quando ON: zero chamadas cloud, zero notificações, zero badge — UI de sync some
- **[FEATURE]** Voltar pra OFF reabilita o indicador de sync no header
- **[FEATURE]** **Estado default em primeira instalação: ON** (offline-first puro, opt-in pra sync). Professor ativa sync explicitamente quando decidir vincular conta cloud.

---

## 5. Descoberta & rede

- **[CORE]** mDNS publica `offlineclass._http._tcp.local` (via `bonjour-service`)
- **[CORE]** Registro A publicado sob o FQDN `offlineclass.local`
- **[CORE]** QR code na tela do professor com a URL completa (`https://host:porta`)
- **[CORE]** Cert auto-assinado de TLS gerado no primeiro boot; persistido em userData
- **[CORE]** HTTPS/WSS servido em `0.0.0.0:8000` (todas as interfaces)
- **[FEATURE]** Painel de debug de descoberta: mostra hostnames resolvidos, IPs, porta, fingerprint do cert
- **[A DECIDIR]** Porta configurável (caso 8000 esteja em uso)?
- **[A DECIDIR]** Handling multi-rede (desktop com Wi-Fi + Ethernet simultâneos) — qual IP vai no QR?

---

## 6. Backend cloud (`apps/cloud`)

### 6.1 Stack
- **[FEATURE]** Hono como HTTP server
- **[FEATURE]** Drizzle ORM + Postgres
- **[FEATURE]** Schemas Zod compartilhadas com o desktop via `packages/shared`
- **[FEATURE]** Auth baseada em JWT pro token de longa duração do desktop vinculado

### 6.2 Endpoints (conjunto inicial)
- `POST /auth/register` — cria conta cloud de professor
- `POST /auth/login` — troca email+senha por token de longa duração
- `POST /auth/revoke` — invalida um token (logout)
- `POST /api/sync/provas` — push de provas (idempotente, LWW no server)
- `GET  /api/sync/provas` — pull de todas as provas do professor autenticado
- `POST /api/sync/sessions/results` — push de resultados de sessão concluída
- `POST /api/sync/sessions/results/email` — solicita envio de emails de resultado
- `GET  /api/health` — liveness check
- **[A DECIDIR]** Endpoints de admin (listar usuários, ver estatísticas) — precisamos no MVP ou depois?

### 6.3 Deploy
- **[FEATURE]** Dockerfile + docker-compose (pra dev local com Postgres ao lado)
- **[FEATURE]** Migrations rodam ao iniciar o container (Drizzle)
- **[A DECIDIR]** Terminação TLS: atrás de nginx / caddy / Cloudflare, ou Hono direto?
- **[A DECIDIR]** Estratégia de backup pro Postgres (cron de pg_dump, snapshots gerenciados)?

---

## 7. Modelo de identidades

| Ator | Onde mora | Persistência | Como obtém |
|---|---|---|---|
| Professor local | SQLite do desktop | Persistente (bcrypt + session token) | Registro in-app |
| Professor cloud | Postgres do cloud | Persistente (vinculado ao local via token de longa duração) | Opcional, via fluxo in-app de vinculação |
| Aluno | Memória + linha efêmera no SQLite | Por sessão | `POST /api/join` com nome + matrícula + email |

- Sem conta cross-device de aluno
- Um professor local pode ou não estar vinculado a um professor cloud; quando vinculado, é 1:1
- Um professor cloud pode estar vinculado a múltiplos desktops (ex: notebook + PC da sala) — ambos empurram pro mesmo upstream

---

## 8. Empacotamento & distribuição

### 8.1 Desktop
- **[CORE]** Config do `electron-builder` pra `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux)
- **[CORE]** SQLite bundled, Drizzle migrations, geração de cert auto-assinado
- **[CORE]** Ícone do app (já em `assets/`)
- **[EXTRA]** Code signing pra Windows / notarização Apple (pula no TCC; nice-to-have pra rollout institucional)
- **[EXTRA]** Canal de auto-update

### 8.2 Cloud
- **[FEATURE]** Dockerfile + multi-stage build
- **[FEATURE]** docker-compose pra dev local (`apps/cloud` + Postgres)
- **[A DECIDIR]** Alvo de deploy: VPS com Docker puro? Coolify / Dokku / Caprover-style PaaS?

---

## 9. Qualidade / não-funcional

### 9.1 Confiabilidade
- **[CORE]** Lógica de reconnect do WS (backoff)
- **[FEATURE]** SQLite em modo WAL (leituras concorrentes durante escritas)
- **[FEATURE]** Snapshots periódicos do Y.Doc (recuperação de crash do desktop no meio da sessão)
- **[EXTRA]** Backup do SQLite local (export do arquivo do DB pra USB / cloud)

### 9.2 Internacionalização
- **[EXTRA]** Suporte a EN além do PT-BR (TCC é PT-BR; usuários são brasileiros — assumido PT-BR único no MVP)

### 9.3 Logging & auditoria
- **[FEATURE]** Logs estruturados (JSON) pra debug — pelo menos em modo dev
- **[EXTRA]** Log de auditoria das ações do professor (edição de prova, ciclo da sessão)

### 9.4 Privacidade / LGPD
- **[A DECIDIR]** Política de retenção de dados na cloud (purgar resultados depois de X meses)?
- **[EXTRA]** Tela de consentimento na primeira vinculação cloud

---

## 10. Decisões em aberto

Lista plana de todos os `[A DECIDIR]` acima, reagrupados por impacto. Use como agenda do review pass.

### Big impact (deferida, não bloqueia)

1. **Escolha de provedor de email** — SendGrid / Mailgun / Resend / Postmark / Amazon SES / SMTP institucional. Deferida pra decisão do time. Não bloqueia outro trabalho; o módulo de email do cloud é desenhado como interface pra trocar depois.

### Medium impact (polish de UX ou clarificação de escopo — resolver antes/durante criação dos issues)

2. **Limite de tempo por questão** — em adição ao timer da sessão inteira?
3. **Outras opções de criação de sessão** — permitir revisar respostas submetidas antes do submit? permitir pular? exigir todas respondidas?
4. **Registro de conta cloud** — modal in-app no fluxo de vinculação, ou só via admin externo?
5. **Valor exato dos limites de tamanho de material auxiliar** (por arquivo, por prova)
6. **Confirmação no pull** — primeiro sync em máquina nova confirma "X MB vão baixar"?
7. **Anonimizar nomes de alunos nos resultados cloud** (LGPD)?
8. **UX do cert auto-assinado** — aceitar aviso manual cada vez, ou distribuir cert de CA?

### Low impact (adiar até precisar)

9. Porta configurável (caso 8000 esteja em uso)
10. Handling multi-rede (Wi-Fi + Ethernet — qual IP vai no QR?)
11. Endpoints de admin na cloud (listar usuários, estatísticas) — MVP ou depois?
12. Terminação TLS da cloud (nginx/caddy/Cloudflare ou Hono direto)
13. Estratégia de backup do cloud (cron de pg_dump, snapshots gerenciados)
14. Alvo de deploy da cloud (Docker puro / Coolify / etc.)
15. Política de retenção LGPD
