# Log de decisões — sync offline-first

> Cada linha é uma decisão **com consenso explícito**. Itens não decididos **não** entram
> aqui — vivem em [`open-questions.md`](./open-questions.md). Base factual em
> [`inventory.md`](./inventory.md).
>
> Convenção de IDs: `D-1xx` para esta branch (sync). Decisões anteriores de escopo LAN/aluno
> que seguem válidas estão resumidas no fim.

---

## Decisões desta branch

| ID | Data | Tópico | Decisão | Alternativas descartadas | Participantes |
|----|------|--------|---------|--------------------------|---------------|
| D-101 | 2026-06-29 | Motor de sync | **PowerSync** é o motor principal de sincronização entre o SQLite local do professor e o Postgres na nuvem | LWW manual (Hono + Postgres + `sync_outbox`); sneakernet | Pedro |
| D-102 | 2026-06-29 | O que sincroniza | Provas (+ questões), resultados de sessão (respostas + notas), e leitura da versão mais recente de ambos | Só provas; só resultados | Pedro |
| D-103 | 2026-06-29 | Fonte de verdade de escrita | Postgres é a fonte de verdade no modelo PowerSync; o SQLite local é réplica gerenciada + fila de upload | — | (decorre de D-101; convivência resolvida por D-107) |
| D-104 | 2026-06-29 | Offline-first | Sync é sempre **opcional**; app roda 100% sem internet; `stay local` ON por padrão | Sync obrigatório | Pedro |
| D-105 | 2026-06-29 | Não-objetivos | Sem grupos/Yjs, sem migração para Socket.IO, sem janela projetor, sem email de resultados, sem export sneakernet nesta branch | Incluir esses itens | Pedro |
| D-106 | 2026-06-29 | Restrições de implementação | Sem mudar regra de negócio; sem refatorar código alheio ao sync; sem suposições silenciosas | — | Pedro |
| D-107 | 2026-06-30 | Convivência PowerSync ↔ DB local (Q-201) | **Opção B (bridge):** `offlineclass.db` continua como fonte de verdade local; um módulo bridge isolado (`apps/desktop/src/main/sync/bridge.ts`) espelha `exams`/`questions` (e depois `exam_sessions`/`students`/`answers`) para o SQLite gerenciado do PowerSync por reconciliação-diff. Nenhuma regra de negócio existente muda. | A (PowerSync vira o DB local — risco alto em regra de negócio); C (dois caminhos — complexidade sem ganho claro) | Pedro |
| D-108 | 2026-06-30 | Stack do backend connector (Q-203) | **Hono + Drizzle + `pg`** em `apps/sync/connector` — mesma stack já usada no LAN; TypeScript; self-hosted. | Supabase/Neon gerenciado; Edge functions | Pedro |
| D-109 | 2026-06-30 | Soft-delete (Q-204) | **Desnecessário nesta branch.** O bridge por reconciliação-diff propaga hard deletes como operações DELETE no DB gerenciado do PowerSync, sem necessidade de coluna `deletedAt`. Nenhum schema muda. | Adicionar `deletedAt` em `exams`/`questions` | Pedro |
| D-110 | 2026-06-30 | Sistema de sync parcial | **Sync Streams (`config: edition: 3`)** em vez de Sync Rules (legacy). Sync Streams suportam JOIN (necessário para escopar `questions`/`answers` via `exams.owner_id`), on-demand syncing, e são o sistema recomendado pelo PowerSync para projetos novos. Todos os streams usam `auto_subscribe: true` para manter o comportamento offline-first "sync everything upfront". | Sync Rules (legacy) | Pedro |
| D-111 | 2026-06-30 | Novo app de configuração e connector | **`apps/sync`** — app dedicado que reúne: (a) scaffold do PowerSync CLI self-hosted (`powersync/` com `service.yaml`, `sync-config.yaml`, `docker/`); (b) backend connector Hono (`connector/`) que recebe `uploadData()`, valida com Zod de `packages/shared` e aplica no Postgres. Adicionado ao workspace pnpm. | Embutir connector no desktop main; recriar `apps/cloud` | Pedro |

---

## Decisões anteriores que permanecem válidas

| ID | Tópico | Decisão | Continua valendo porque |
|----|--------|---------|--------------------------|
| D-001 | Escopo geral | LAN hardening + cloud sync opcional | Alinha com os 3 entregáveis desta branch |
| D-003 | Transporte real-time LAN | Manter `@hono/node-ws` | Sync não toca o transporte LAN |

---

## Decisões explicitamente revogadas

> Registradas para evitar que voltem por engano. **Não** representam o estado atual.

| ID revogado | O que dizia | Por que caiu |
|-------------|-------------|--------------|
| (LWW manual) | Sync via Hono + Postgres + `sync_outbox` + resolução LWW por `updatedAt`, recriando `apps/cloud` | Substituída por **D-101 (PowerSync)**. PowerSync já fornece fila de upload (`ps_crud`), replicação e checkpoint de consistência — não recriar isso à mão. |
| (ULID) | Migrar IDs para ULID em `packages/shared/ids.ts` | Desnecessário: os IDs já são UUID v4 client-generable (ver `inventory.md`), compatível com PowerSync |

---

## Como evoluir este arquivo

- Nova decisão → **só** após consenso explícito do desenvolvedor; adicione uma linha com ID,
  data, alternativas descartadas e participantes.
- Mudou de ideia? Mova a linha antiga para "revogadas" com a justificativa. Não apague o
  rastro de uma decisão que esteve em vigor.
- Dúvida ainda aberta? Não escreva aqui — registre em [`open-questions.md`](./open-questions.md).
