# Escopo da branch `pedro/feature/offline-first`

> Base factual: [`inventory.md`](./inventory.md). Decisões formais: [`decisions.md`](./decisions.md).
> Pendências que ainda travam itens: [`open-questions.md`](./open-questions.md).

---

## Os 3 entregáveis (objetivo de produto)

Ao final da branch, o **professor** consegue:

1. **Sincronizar provas na nuvem** — definições de provas + questões saem do SQLite local e
   chegam ao Postgres na nuvem.
2. **Sincronizar resultados na nuvem** — resultados das sessões (respostas + notas) sobem
   para a nuvem.
3. **Buscar a versão mais recente** — tanto das provas quanto dos resultados, a partir da
   nuvem (ex.: professor que usa dois PCs vê a versão mais nova nos dois).

Motor de sincronização: **PowerSync** (ver [`powersync-design.md`](./powersync-design.md) e D-101 em `decisions.md`).

---

## Dentro x Fora desta branch

| ✅ Dentro | ❌ Fora (por ora) | Notas |
|---|---|---|
| Sync de provas + questões (local ↔ nuvem) via PowerSync | Grupos colaborativos / Yjs / Tiptap | Workstream separado; não tocar |
| Sync de resultados de sessão (respostas + notas) | Janela projetor | Backlog |
| "Buscar versão mais recente" (read path do PowerSync) | Migração de `@hono/node-ws` para Socket.IO | Manter transporte LAN atual |
| Postgres na nuvem + serviço PowerSync (self-host) | Email de resultados | Pode ser branch futura |
| Connector de upload (backend que aplica writes no Postgres) | Export/import JSON (sneakernet) | Fora |
| Auth/vínculo de conta cloud (pré-requisito técnico do sync) | Empacotamento/distribuição final | Branch separada |
| Toggle "stay local" + indicador de status de sync no header | Materiais auxiliares (arquivos em disco) | Fora |
| Documentação de tudo o que for feito e como | Reskin do student-web | Outro stream |

> **Offline-first é invariante:** o sync é sempre opcional; o app roda 100% sem internet.
> Em runtime de sala (LAN), a nuvem nunca é requisito.

---

## Restrições inegociáveis (do pedido do desenvolvedor)

1. **Não modificar regra de negócio existente.** O fluxo LAN professor↔aluno, CRUD de
   provas, ciclo de sessão e correção permanecem como estão.
2. **Não refatorar código não relacionado a sync.** Mudanças se limitam a adicionar a
   camada de sync; nada de "refactor de passagem".
3. **Não fazer suposições sem perguntar.** Toda lacuna vira item em
   [`open-questions.md`](./open-questions.md) para o desenvolvedor decidir.
4. **Design-first (CLAUDE.md §3).** Qualquer tela/componente novo (ex.: tela de login
   cloud, indicador de sync) precisa de proposta de design aprovada antes do `.tsx`.

---

## Definition of Done da branch

> ⚠️ A lista abaixo depende de decisões ainda abertas (ver `open-questions.md`,
> especialmente o modelo de integração PowerSync ↔ DB atual e auth cloud). Será congelada
> quando essas decisões fecharem. Critérios por fase ficam em `implementation-plan.md`.

- [ ] Professor consegue subir uma prova (com questões) para a nuvem e ela aparece no Postgres.
- [ ] Professor consegue subir os resultados de uma sessão encerrada para a nuvem.
- [ ] Em um segundo cliente vinculado à mesma conta cloud, provas e resultados aparecem na
      versão mais recente (pull).
- [ ] Tudo funciona com o app **offline**: sync acumula e reconcilia quando a internet volta.
- [ ] `stay local` ON por padrão; sync só acontece após o professor optar e vincular conta.
- [ ] Documentação completa do que foi feito e como (esta pasta + reconciliação dos docs de produto).
- [ ] `pnpm build` (typecheck) passa; sem diffs não relacionados a sync.
