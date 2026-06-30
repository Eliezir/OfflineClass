# Plano de implementação — sync com PowerSync

> Cada fase termina em um commit que compila (`pnpm build`). Base: [`scope.md`](./scope.md),
> [`powersync-design.md`](./powersync-design.md). **Fases marcadas com 🔒 estão bloqueadas**
> por perguntas em [`open-questions.md`](./open-questions.md) — não inicie sem fechar a
> pergunta indicada.
>
> Restrições sempre válidas: sem mudar regra de negócio, sem refatorar código alheio ao sync,
> sem suposição silenciosa (CLAUDE.md §3 / `scope.md`).

---

## Visão geral das fases

| Fase | Escopo | Entregável que compila | Bloqueio |
|------|--------|------------------------|----------|
| **0** | Fechar perguntas bloqueantes | `open-questions.md` com Q-201..Q-203 respondidas e movidas para `decisions.md` | — |
| **1** | Nuvem: Postgres + PowerSync Service | Docker Compose (Postgres origem + PowerSync + storage) subindo local; schema Postgres das entidades sincronizáveis migrado | 🔒 Q-204, Q-205, Q-206 |
| **2** | Cliente PowerSync no desktop | `@powersync/node` instalado; SQLite gerenciado inicializa; estratégia de convivência (A/B/C) implementada **sem tocar regra de negócio** | 🔒 Q-201 |
| **3** | Backend connector + auth | Endpoint que aplica `uploadData()` no Postgres (validação Zod via `packages/shared`); emissão de JWT de sync; vínculo de conta cloud | 🔒 Q-202, Q-203 |
| **4** | Push de provas | Editar prova local → aparece no Postgres; Sync Rules entregam de volta no pull | depende de 1–3 |
| **5** | Push de resultados | Sessão encerrada → resultados no Postgres (recorte de Q-205) | depende de 4 |
| **6** | Pull "versão mais recente" | 2º cliente vinculado vê provas e resultados na versão mais nova | depende de 4–5 |
| **7** | UX de sync | Toggle `stay local` (ON por padrão) + indicador de status no header (design-first, aprovado antes do `.tsx`) | depende de 3 |
| **8** | Docs finais | Esta pasta atualizada com o que foi feito/como; reconciliação dos docs de produto revisada | contínuo |

---

## Definition of Done por fase

### Fase 0 — Destravar
- [ ] Q-201, Q-202, Q-203 respondidas pelo desenvolvedor e movidas para `decisions.md`.
- [ ] DoD da branch (em `scope.md`) congelado com base nas respostas.

### Fase 1 — Nuvem
- [ ] `docker compose up` sobe Postgres + PowerSync Service + storage localmente.
- [ ] Schema Postgres das entidades sincronizáveis criado e migrado (espelha `inventory.md`).
- [ ] Sync Rules iniciais escopam dados por tenant (Q-202).

### Fase 2 — Cliente PowerSync
- [ ] `@powersync/node` (driver `better-sqlite3`) inicializa no main process.
- [ ] Convivência com `offlineclass.db` implementada conforme a opção escolhida em Q-201.
- [ ] `pnpm build` passa; **nenhuma** mudança em regra de negócio ou em código não-sync.

### Fase 3 — Connector + auth
- [ ] Endpoint de upload aplica writes no Postgres de forma **síncrona**; valida com Zod.
- [ ] Cliente obtém JWT e `connect()` ao Service com sucesso.
- [ ] Fluxo de vínculo de conta cloud funciona (Q-202).

### Fase 4 — Provas
- [ ] Criar/editar prova local resulta na linha correspondente no Postgres.
- [ ] Pull traz a prova de volta a um cliente limpo.

### Fase 5 — Resultados
- [ ] Encerrar sessão sobe `exam_sessions` + `students` + `answers`/`score` (recorte Q-205).

### Fase 6 — Versão mais recente
- [ ] Em um 2º cliente vinculado à mesma conta, provas e resultados aparecem atualizados.
- [ ] App offline acumula e reconcilia ao reconectar (comportamento nativo do PowerSync).

### Fase 7 — UX
- [ ] `stay local` ON por padrão; sync só após opt-in + vínculo.
- [ ] Indicador mostra `synced` / `N pending` / `syncing…` / `error`.
- [ ] Proposta de design aprovada antes de escrever os `.tsx` (CLAUDE.md §3).

### Fase 8 — Docs
- [ ] Esta pasta reflete o que foi implementado e como (decisões em `decisions.md`).
- [ ] `architecture.md` / `roadmap.md` consistentes com o resultado (seções de sync).

---

## Mandatório: documentação contínua

A cada fase concluída, atualizar: `decisions.md` (o que foi decidido), `powersync-design.md`
(ajustes de design reais) e este plano (marcar DoD). Documentar **o que** foi feito e **como**
é entregável obrigatório da branch (`scope.md`).
