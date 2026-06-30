# Perguntas abertas — exigem decisão do desenvolvedor

> **Regra (CLAUDE.md §3 + pedido do dev):** nenhum item aqui pode ser implementado ou virar
> "decisão" sem resposta explícita do desenvolvedor. Ao responder, mova a decisão para
> [`decisions.md`](./decisions.md) com um ID `D-1xx` e remova/risque o item aqui.
>
> Ordenadas por impacto. **Q-201 destrava quase tudo.**
>
> **2026-06-30:** Fases 0–4, 6–7 implementadas. Questões abertas remanescentes abaixo.

---

## ~~Q-201 — Como o cliente PowerSync convive com o `better-sqlite3` atual?~~ ✅ Resolvido → D-107

~~Opção B (bridge): `offlineclass.db` continua como fonte de verdade local; bridge isolado espelha entidades sincronizáveis para o DB gerenciado do PowerSync por reconciliação-diff.~~

---

## Q-202 — Auth cloud: como se relaciona com o login local atual?

Hoje: login local com bcrypt + token de sessão (`teachers`/`teacher_sessions`). PowerSync
exige um **JWT** emitido pelo backend para o cliente conectar.

- Conta cloud é **separada** da local e o professor "vincula" (login cloud in-app)?
- Ou o login local **vira** conta cloud quando o sync é ligado?
- Registro de conta cloud: in-app ou provisionado por um admin externo?
- A chave de tenant das Sync Rules é o `ownerId` local ou um `cloudUserId`?

---

## ~~Q-203 — Stack do backend connector~~ ✅ Resolvido → D-108

~~Hono + Drizzle + `pg` em `apps/sync/connector`.~~

---

## ~~Q-204 — Soft-delete entra nesta branch?~~ ✅ Resolvido → D-109

~~Desnecessário: bridge por reconciliação-diff propaga hard deletes como DELETE no DB gerenciado do PowerSync. Sem coluna `deletedAt`, sem mudança de schema.~~

---

## Q-205 — Recorte dos dados de resultado (PII de aluno)

Resultados incluem `students` (nome, matrícula) e `answers`. Sobe tudo para a nuvem?

- Subir nome + matrícula + respostas + notas, **OU**
- Anonimizar/limitar (ex.: só notas agregadas)?

Relevante para LGPD e para o desenho do schema Postgres.

---

## Q-206 — Deploy do PowerSync Service + Postgres no contexto do TCC

- VPS self-hosted com Docker Compose (Postgres origem + PowerSync + storage de buckets)?
- Ou Docker local apenas para demonstração?
- Quem hospeda / quem mantém durante a defesa?

---

## Q-207 — Migração de dados existentes

Provas/sessões já criadas localmente (UUID v4) devem ser **enviadas retroativamente** ao
ligar o sync pela primeira vez, ou o sync vale só para dados **novos** a partir do vínculo?

---

## Itens resolvidos (movidos para decisions.md)

| Pergunta antiga | Resolvida por |
|-----------------|---------------|
| Manual LWW vs PowerSync? | **D-101** — PowerSync |
| IDs: migrar para ULID? | **D-101/ID** — não; já são UUID v4 client-generable |
| Cliente do aluno é browser ou Electron? | Fora do escopo de sync (o aluno não sincroniza); decidir no stream do student-web, não aqui |
| Q-201 — Convivência PowerSync ↔ DB local | **D-107** — Opção B (bridge isolado) |
| Q-203 — Stack do backend connector | **D-108** — Hono + Drizzle + `pg` em `apps/sync/connector` |
| Q-204 — Soft-delete nesta branch? | **D-109** — Desnecessário; bridge propaga hard deletes como DELETE |
