# OfflineClass — Sync offline-first (PowerSync)

> **Entry point para agentes de IA e humanos.** Esta pasta documenta a branch
> `pedro/feature/offline-first`, cujo objetivo é dar ao professor **sync opcional com a
> nuvem** usando **PowerSync** como motor de sincronização entre o SQLite local e um
> Postgres na nuvem.
>
> **Branch:** `pedro/feature/offline-first`
> **Última auditoria do código:** 2026-06-30
> **Status:** fases 0–4, 6–7 implementadas. Fase 5 (validação ponta a ponta) e Fase 8 (docs) pendentes.
> **Docs de produto relacionados:** [`../architecture.md`](../architecture.md),
> [`../features.md`](../features.md), [`../roadmap.md`](../roadmap.md)

---

## Objetivo da branch (o que o professor poderá fazer ao final)

1. **Sincronizar provas** (definições + questões) do SQLite local para o Postgres na nuvem.
2. **Sincronizar resultados** das sessões (respostas + notas) para a nuvem.
3. **Buscar a versão mais recente** tanto das provas quanto dos resultados a partir da nuvem.

Tudo **opcional** e **offline-first**: o app funciona 100% sem internet; o sync é um extra
acionado pelo professor. Em runtime de sala (LAN), a nuvem **nunca** é requisito.

---

## Como navegar (cada arquivo tem uma responsabilidade única)

| Arquivo | Responsabilidade | Quando ler |
|---|---|---|
| [`inventory.md`](./inventory.md) | **Estado auditado** do repo hoje (só fatos verificados no código) | Antes de qualquer planejamento — é a base factual |
| [`scope.md`](./scope.md) | Escopo da branch (dentro/fora) + os 3 entregáveis + Definition of Done | Para saber o que entra e o que não entra |
| [`decisions.md`](./decisions.md) | Log de decisões (ADR) já tomadas | Para entender *por que* PowerSync e os limites acordados |
| [`powersync-design.md`](./powersync-design.md) | Arquitetura-alvo de sync com PowerSync (fluxos, fonte de verdade, connector, sync rules) | Antes de implementar qualquer peça de sync |
| [`open-questions.md`](./open-questions.md) | Pendências que **exigem decisão do desenvolvedor** | Antes de implementar — itens aqui bloqueiam fases |
| [`implementation-plan.md`](./implementation-plan.md) | Fases de implementação + DoD por fase | Para executar, fase a fase |

---

## Regras deste conjunto de docs (AI-first)

- **`inventory.md` é a única fonte de "o que existe".** Não duplicar inventário em outro
  arquivo; referenciar.
- **Nada vira decisão sem consenso explícito.** Itens não decididos vivem em
  `open-questions.md` marcados com `❓`, nunca espalhados como suposição no meio do texto.
- **Sem suposição silenciosa.** Se um agente precisar de um dado que não está auditado em
  `inventory.md`, ele pergunta ao desenvolvedor — não inventa.
- **Sem mudança de regra de negócio** e **sem refatoração de código não relacionado a sync**
  no escopo desta branch (ver `scope.md`).

### Legenda de status (usada em todos os arquivos)

| Símbolo | Significado |
|---|---|
| ✅ | Verificado no código ou confirmado pelo time |
| 🟡 | Parcialmente implementado |
| 📋 | Descrito em docs de produto, **não** no código |
| ❓ | A decidir — ver `open-questions.md` |

---

## Referências rápidas

```bash
pnpm dev                                # desktop do professor (LAN sobe in-process)
pnpm --filter ./apps/student-web dev    # app do aluno
pnpm db:studio                          # inspecionar o SQLite local
```

- PowerSync (docs oficiais): https://docs.powersync.com
- SDK Node/Electron: `@powersync/node` (driver `better-sqlite3`)
- Self-host: imagem `journeyapps/powersync-service` (Docker)
