# Apresentação — Sync Offline-First com PowerSync

> **Contexto:** Disciplinas de Sistemas Operacionais e Redes — IFAL  
> **Projeto:** OfflineClass — sistema de provas digitais em rede local (LAN) sem internet  
> **Tema desta apresentação:** implementação da sincronização opcional com a nuvem

---

## 1. O problema que estávamos resolvendo

O OfflineClass já funcionava: o professor sobe um servidor na sua máquina, os alunos entram pela rede local da sala, fazem a prova colaborativamente, tudo sem internet.

Mas surgiu uma limitação prática:

> "E se o professor quiser usar o mesmo conjunto de provas em salas diferentes? E se ele quiser acessar os resultados de um notebook diferente?"

O app vive isolado em cada máquina. Não há como compartilhar provas entre dois computadores do professor — ele teria que recriá-las manualmente.

A solução é **sincronização opcional com a nuvem**. A palavra-chave é *opcional*: o sistema tem que continuar funcionando 100% sem internet, e o sync é um recurso extra que o professor ativa quando quer.

---

## 2. Por que isso é difícil? O problema do banco de dados distribuído

Sincronizar dados entre dispositivos parece simples, mas esconde problemas clássicos de sistemas distribuídos:

**Problema 1 — Conflito de escrita concorrente**  
O professor edita a mesma prova no notebook e no desktop ao mesmo tempo. Qual versão vence?

**Problema 2 — Offline-first**  
O professor edita uma prova sem internet. Quando a internet voltar, como garantir que a mudança chega na nuvem sem perda?

**Problema 3 — Ordem das operações**  
Se o professor criou uma questão e depois a deletou, a nuvem tem que receber essas operações na mesma ordem, não ao contrário.

**Problema 4 — Consistência do cliente**  
Se o servidor rejeitar uma escrita (ex.: conflito), o cliente tem que reverter localmente — sem o usuário perceber inconsistência.

Resolver tudo isso manualmente levaria semanas. Foi aqui que decidimos usar o **PowerSync**.

---

## 3. O que é o PowerSync?

PowerSync é uma biblioteca de sincronização offline-first. Em vez de você escrever a lógica de fila, retry, conflito e replicação, ele faz isso.

O modelo mental é simples:

```
┌─────────────────────────────┐      ┌──────────────────────────┐
│  Desktop do professor        │      │  Nuvem (self-hosted)      │
│                              │      │                           │
│  ┌─────────────────┐        │      │  ┌──────────────────────┐ │
│  │  offlineclass.db │        │      │  │  Postgres            │ │
│  │  (SQLite local)  │        │      │  │  (fonte de verdade)  │ │
│  └─────────────────┘        │      │  └──────────────────────┘ │
│                              │      │           ▲               │
│  ┌─────────────────┐        │      │           │ CDC           │
│  │  powersync.db   │◄──────sync───►│  ┌──────────────────────┐ │
│  │  (SQLite gerenc.)│        │      │  │  PowerSync Service   │ │
│  │  + fila ps_crud │        │      │  └──────────────────────┘ │
│  └─────────────────┘        │      │           ▲               │
│                              │      │           │ uploadData()  │
└─────────────────────────────┘      │  ┌──────────────────────┐ │
                                      │  │  Backend Connector   │ │
                                      │  │  (Hono + Postgres)   │ │
                                      │  └──────────────────────┘ │
                                      └──────────────────────────┘
```

O PowerSync gerencia **dois caminhos** separados:

| Caminho | Direção | Descrição |
|---------|---------|-----------|
| **Write path (push)** | cliente → nuvem | Toda escrita local vai para uma fila interna (`ps_crud`). O SDK chama automaticamente `uploadData()` quando há conexão |
| **Read path (pull)** | nuvem → cliente | O PowerSync Service monitora o Postgres via CDC (*Change Data Capture*) e replica as mudanças para o SQLite local de todos os clientes autenticados |

A **consistência** é garantida por checkpoints: após o `uploadData()` o servidor confirma que recebeu. Se não confirmar, o SDK reenvia. Se o servidor rejeitar, o cliente reverte localmente.

---

## 4. Como o PowerSync funciona por baixo dos panos

### 4.1 O banco gerenciado (`ps_crud`)

Quando o SDK inicializa, ele cria um banco SQLite separado (`powersync.db`) com as mesmas tabelas dos seus dados, mais uma tabela interna chamada `ps_crud`.

Toda vez que você faz um `INSERT`, `UPDATE` ou `DELETE` neste banco, o SDK registra automaticamente na `ps_crud`:

```
ps_crud
┌────┬──────────┬──────────────┬──────────────────────────────────┐
│ id │ op       │ table        │ data                             │
├────┼──────────┼──────────────┼──────────────────────────────────┤
│  1 │ PUT      │ exams        │ { id, title, owner_id, ... }     │
│  2 │ PATCH    │ questions    │ { id, prompt, points }           │
│  3 │ DELETE   │ exams        │ { id: "uuid-da-prova" }          │
└────┴──────────┴──────────────┴──────────────────────────────────┘
```

### 4.2 O `uploadData()` — a nossa responsabilidade

O SDK chama `uploadData()` automaticamente quando detecta conexão. Nós implementamos essa função: ela lê o próximo lote da `ps_crud` e envia para o nosso backend connector via HTTP.

```typescript
// apps/desktop/src/main/sync/connector.ts
async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
  const transaction = await database.getNextCrudTransaction()
  // envia para POST /api/upload no connector
  await fetch(`${connectorUrl}/api/upload`, {
    method: 'POST',
    body: JSON.stringify({ batch: transaction.crud })
  })
  await transaction.complete() // confirma: remove da ps_crud
}
```

### 4.3 O backend connector — nossa porta de entrada no servidor

O connector é uma API Hono que:
1. Recebe o lote do `uploadData()`
2. Valida com Zod (os mesmos schemas do `packages/shared`)
3. Aplica no Postgres de forma **síncrona** — isso é obrigatório para o checkpoint funcionar

```typescript
// apps/sync/src/index.ts
app.post('/api/upload', async (c) => {
  // valida JWT → obtém owner_id
  // para cada entry no batch: INSERT/UPDATE/DELETE no Postgres
  return c.json({ ok: true, applied: batch.length })
})
```

### 4.4 Sync Streams — o que cada cliente recebe

Aqui entra a parte mais elegante do PowerSync. Quando o cliente conecta, ele declara quais "streams" quer receber. Em vez de receber *tudo* do banco (o que seria um problema de segurança e desempenho), os Sync Streams filtram os dados por queries SQL no servidor.

Nós configuramos assim:

```yaml
# apps/sync/powersync/sync-config.yaml
config:
  edition: 3   # Sync Streams (não Sync Rules legadas)

streams:
  exams:
    auto_subscribe: true
    query: >
      SELECT * FROM exams
      WHERE owner_id = auth.user_id()   # ← cada professor vê só suas provas

  questions:
    auto_subscribe: true
    query: >
      SELECT q.* FROM questions q
      JOIN exams e ON q.exam_id = e.id
      WHERE e.owner_id = auth.user_id() # ← scoping via JOIN
```

O `auth.user_id()` é o `sub` do JWT — é assim que o servidor sabe qual professor está conectado e filtra exatamente os dados dele.

Usamos **Sync Streams edition 3** (não as Sync Rules legadas) porque eles suportam `JOIN` — necessário para filtrar questões e respostas pelo dono da prova sem duplicar a coluna `owner_id` em toda tabela.

---

## 5. O desafio específico do OfflineClass — dois bancos SQLite

Aqui veio o nosso maior problema de design. O OfflineClass já tinha um banco SQLite funcionando (`offlineclass.db`) com toda a lógica de negócio: IPC handlers, Drizzle ORM, sessions de aluno, tudo.

O PowerSync exige seu próprio SQLite gerenciado (`powersync.db`). Como fazer os dois coexistirem?

Avaliamos três opções:

| Opção | Descrição | Decisão |
|-------|-----------|---------|
| **A** | PowerSync vira o banco local — substituir `offlineclass.db` | ❌ Risco alto: toda a camada de negócio teria que ser reescrita |
| **B** | Bridge isolado — dois bancos separados, módulo faz a ponte | ✅ **Escolhida** |
| **C** | Dois caminhos incrementais | ❌ Complexidade sem ganho |

### A solução: o Bridge (Opção B)

```
offlineclass.db          bridge.ts            powersync.db
(fonte de verdade)    (módulo isolado)       (fila ps_crud)
      │                     │                      │
      │──── push: diff ─────►│──── INSERT/UPDATE ──►│──► nuvem
      │                     │                      │
      │◄─── pull: upsert ───│◄─── SELECT ──────────│◄── nuvem
```

**Push (local → nuvem):**
1. Lê provas/questões do `offlineclass.db`
2. Compara com o que está no `powersync.db` (fingerprint por conteúdo)
3. Só escreve no `powersync.db` se algo mudou → evita escritas desnecessárias
4. A escrita no `powersync.db` cria entradas na `ps_crud` → PowerSync faz o resto

**Pull (nuvem → local):**
1. PowerSync replica dados do Postgres para o `powersync.db`
2. Bridge lê o `powersync.db` e faz upsert no `offlineclass.db`
3. A UI já usa o `offlineclass.db` → enxerga automaticamente os dados do 2º dispositivo

**Anti-loop:** o push sempre roda antes do pull. Após o push, o `powersync.db` já tem o estado local — o pull compara fingerprints e não escreve nada de volta. Sem loops.

---

## 6. Multi-dispositivo — o problema do `owner_id`

Ao implementar o pull, identificamos um problema sutil:

> O professor cria a conta cloud no **Dispositivo A**. O JWT gerado tem `sub = UUID-do-professor-A`.  
> O **Dispositivo B** faz login na mesma conta — e recebe um JWT com o mesmo `sub = UUID-do-professor-A`.  
> Mas o Dispositivo B tem seu próprio professor local com um **UUID diferente**.

Se o bridge simplesmente copiasse o `owner_id` do `powersync.db` para o `offlineclass.db`, a FK `exams.owner_id → teachers.id` quebraria no Dispositivo B (o professor com aquele UUID não existe lá).

A solução foi separar dois conceitos que antes eram tratados como um:

```
localTeacherId  = UUID do professor no SQLite local do dispositivo atual
                  → usado para FKs no offlineclass.db

cloudOwnerId    = sub do JWT = UUID do professor que registrou a conta
                  → usado como owner_id no powersync.db e no Postgres
                  → o mesmo em todos os dispositivos da mesma conta
```

O bridge agora recebe os dois IDs e usa cada um no lugar certo:

```typescript
// Push: lê local com localTeacherId, grava managed com cloudOwnerId
// Pull: lê managed com cloudOwnerId, grava local com localTeacherId
export async function runBridge(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<BridgeResult | null>
```

Num único dispositivo, os dois UUIDs são idênticos. Em dois dispositivos com a mesma conta, o bridge faz o remapeamento transparentemente.

---

## 7. A interface do usuário — design intencional

A sincronização é **opt-in**: o padrão é "stay local". O professor precisa vincular uma conta cloud e ativar explicitamente o sync.

Optamos por **Variante B** de UI: sync discreto, não invasivo.

```
┌─────────────────────────────────────────────┐
│  Configurações                               │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Sincronização Cloud                  │   │
│  │                                       │   │
│  │  ● Sincronizado  última vez: 14:32    │   │
│  │                                       │   │
│  │  [ Sincronizar agora ]  [ Desconectar]│   │
│  │                                       │   │
│  │  Sincronizar com a nuvem    [ ON ●──] │   │
│  └──────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

Na barra lateral, quando o sync está desativado ou com erro, aparece um badge de aviso discreto no ícone de Configurações — guia o professor sem interromper o fluxo.

---

## 8. Arquitetura final — mapa completo

```
┌──────────────────────────────────────────────────────────────────┐
│  Desktop do professor (Electron main process)                      │
│                                                                    │
│  ┌────────────────┐   IPC    ┌───────────────────────────────┐   │
│  │  Renderer      │◄────────►│  offlineclass.db              │   │
│  │  (React UI)    │          │  (better-sqlite3 + Drizzle)   │   │
│  └────────────────┘          │  fonte de verdade local        │   │
│                               └─────────────┬─────────────────┘   │
│                                             │ bridge.ts            │
│                                             ▼ (push antes, pull)  │
│                               ┌─────────────────────────────┐    │
│                               │  powersync.db               │    │
│                               │  (@powersync/node)           │    │
│                               │  + fila ps_crud              │    │
│                               └─────────────┬───────────────┘    │
└─────────────────────────────────────────────┼────────────────────┘
                                              │ uploadData() / JWT
                              ┌───────────────▼────────────────────┐
                              │  apps/sync (Docker Compose)         │
                              │                                      │
                              │  ┌──────────────┐  ┌────────────┐  │
                              │  │  Connector   │  │ PowerSync  │  │
                              │  │  Hono + Zod  │  │ Service    │  │
                              │  └──────┬───────┘  └─────┬──────┘  │
                              │         │ SQL             │ CDC     │
                              │         ▼                 ▼         │
                              │  ┌──────────────────────────────┐  │
                              │  │  Postgres (pg-db)             │  │
                              │  │  fonte de verdade na nuvem    │  │
                              │  └──────────────────────────────┘  │
                              └────────────────────────────────────┘
```

---

## 9. O que foi construído — inventário

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Schema Postgres | `apps/sync/src/schema.ts` | Espelha as tabelas SQLite sincronizáveis |
| Migrations | `apps/sync/src/migrations/0001_init.sql` | DDL inicial: tabelas + índices + publicação CDC |
| Connector | `apps/sync/src/index.ts` | Hono: `/api/auth/*`, `/api/upload`, `/health` |
| Auth | `apps/sync/src/auth.ts` | JWT HS256 (jose) + bcrypt — emite tokens PowerSync |
| Sync Streams | `apps/sync/powersync/sync-config.yaml` | Queries com JOIN, `auto_subscribe: true` por professor |
| Docker stack | `apps/sync/powersync/docker/` | pg-db + pg-storage + connector + powersync |
| Schema PowerSync | `apps/desktop/src/main/sync/schema.ts` | Define tabelas no `powersync.db` |
| Cliente PS | `apps/desktop/src/main/sync/client.ts` | `getOrCreatePowerSyncDb`, `connect`, `disconnect` |
| Connector client | `apps/desktop/src/main/sync/connector.ts` | `fetchCredentials` + `uploadData` |
| Bridge | `apps/desktop/src/main/sync/bridge.ts` | Push por diff + Pull server-autoritativo (5 entidades) |
| Sync store | `apps/desktop/src/main/sync/syncStore.ts` | Persiste credenciais cloud em `userData/` |
| IPC handlers | `apps/desktop/src/main/ipc/sync.ts` | `sync.getStatus`, `linkAccount`, `enable`, `trigger`... |
| UI — Settings | `modules/sync/components/sync-section.tsx` | Seção de sync nas configurações |
| UI — Dialog | `modules/sync/components/sync-link-dialog.tsx` | Modal de vincular conta |
| UI — Sidebar | `shared/layouts/sidebar.tsx` | Badge de aviso quando sync inativo |

**Entidades sincronizadas:** `exams` → `questions` → `exam_sessions` → `students` → `answers`

**Não sincronizado (por design):** `teachers`/`teacher_sessions` (auth local), estado ao vivo da sessão LAN, materiais binários.

---

## 10. O que fica de fora (e por quê)

| Item | Motivo de estar fora do escopo |
|------|-------------------------------|
| Sync obrigatório | Princípio central: offline-first. A sala de aula não depende de internet |
| Migração retroativa de dados antigos | Q-207 — decisão de produto ainda aberta |
| Soft-delete (`deletedAt`) | Resolvido sem isso: o bridge propaga hard deletes como DELETE no PowerSync |
| Recorte de PII dos alunos | Q-205 — nome/matrícula sobem ou não? Decisão pendente de política |
| Hospedagem na VPS | Q-206 — escolha de infraestrutura para o TCC |

---

## 11. Conceitos de Redes e SO aplicados

Este projeto aplicou diretamente o que foi estudado nas disciplinas:

| Conceito | Onde aparece |
|----------|-------------|
| **Comunicação cliente-servidor** | Desktop ↔ connector via HTTP REST; connector ↔ Postgres via TCP |
| **Protocolos de autenticação** | JWT HS256; Bearer token; bcrypt para senhas |
| **Fila de mensagens / persistência** | `ps_crud` é essencialmente uma fila FIFO persistida em SQLite |
| **CDC — Change Data Capture** | PowerSync Service monitora o WAL (Write-Ahead Log) do Postgres para detectar mudanças |
| **WAL do Postgres** | Configurado com `wal_level=logical` no Docker — permite replicação lógica |
| **Controle de concorrência** | Flag `_running` no bridge evita execuções paralelas; fingerprint-diff evita escritas desnecessárias |
| **Isolamento de processos** | Bridge é um módulo completamente isolado — não toca na lógica de negócio existente |
| **IPC (Inter-Process Communication)** | Electron main ↔ renderer via `ipcMain.handle` / `contextBridge` |
| **Self-hosting com Docker Compose** | 4 containers com healthchecks e dependências de startup declaradas |

---

## 12. Demo — fluxo ao vivo

1. `pnpm dev:sync` — sobe o stack Docker e abre o app
2. Criar uma prova no app (sem sync ativo)
3. Configurações → Vincular conta → URL `http://localhost:3001` → Registrar
4. Ativar "Sincronizar com a nuvem"
5. Clicar "Sincronizar agora"
6. Verificar no Postgres:

```bash
docker exec -it docker-pg-db-1 \
  psql -U offlineclass -d offlineclass \
  -c "SELECT id, title FROM exams;"
```

A prova aparece no Postgres — pronta para ser puxada por um segundo dispositivo.

---

*Eliezir Moreira · Pedro Roberto · Raphael Phillipe — IFAL, 2026*
