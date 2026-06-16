# Backend do Apresenta.AI

API HTTP em **TypeScript** (Hono + Prisma) para o motor de geração de apresentações com IA.

Arquitetura em camadas no estilo MVC — **Controller → BO → DAO → Models** — com injeção de
dependência manual via construtor. As regras de camadas são verificadas automaticamente pelo
`dependency-cruiser` (substituto do ArchUnit do antigo backend Java).

---

## 🛠️ Stack Tecnológica

- **Linguagem / Runtime:** TypeScript | Node.js 22 (executado direto via `tsx`)
- **Framework HTTP:** [Hono](https://hono.dev) (`@hono/node-server`)
- **Validação de DTOs:** Zod (`@hono/zod-validator`)
- **Persistência:** Prisma ORM sobre **SQLite** (migrations via `prisma migrate`)
- **Qualidade & Testes:** Vitest (cobertura via V8), ESLint, Prettier, dependency-cruiser
- **Gerenciador de pacotes:** pnpm (workspace na raiz do monorepo)

---

## 📋 Pré-requisitos

- **Node.js 22+**
- **pnpm** (`corepack enable` já disponibiliza a versão fixada em `packageManager`)

A instalação é feita pela raiz do monorepo (o backend é um pacote do workspace pnpm):

```bash
pnpm install
```

O `postinstall` roda `prisma generate` automaticamente.

---

## 🔐 Ambiente (.env)

Copie o exemplo dentro de `backend/` e ajuste se precisar:

```bash
cp .env.example .env
```

| Variável       | Padrão                             | Descrição                                           |
| -------------- | ---------------------------------- | --------------------------------------------------- |
| `NODE_ENV`     | `development`                      | Perfil: `development` \| `production` \| `test`     |
| `PORT`         | `8080`                             | Porta HTTP (mantida em 8080 para Electron/Docker)   |
| `DATABASE_URL` | `file:../database/apresenta-ia.db` | Conexão SQLite (caminho relativo à pasta `prisma/`) |

> O `.env` está no `.gitignore` — nunca comite credenciais.

---

## 💾 Banco de Dados & Migrations

- **Arquivo local (dev/prod):** `backend/database/apresenta-ia.db` (ignorado pelo Git).
- **Migrations:** `backend/prisma/migrations/` (geridas pelo `prisma migrate` — substituem o Flyway).
- **Schema:** `backend/prisma/schema.prisma` é a fonte das entidades (substitui `Models/Entity` do JPA).
- **Testes:** banco SQLite isolado em `backend/prisma/test.db`, recriado e migrado a cada execução.

```bash
# Criar/aplicar uma nova migration em desenvolvimento
pnpm migrate:dev --name <descricao>

# Aplicar migrations existentes (produção / CI / container)
pnpm migrate:deploy
```

> **Imutabilidade:** nunca edite uma migration já comitada — gere a próxima.

---

## 🚀 Comandos (dentro de `backend/`)

```bash
# Subir a API local com hot reload
pnpm dev

# Subir sem watch
pnpm start
```

A API fica em `http://localhost:8080`. Rotas sob o prefixo `/api` (ex.: `GET /api/exemplo`,
`GET /api/health`).

### Esteira de qualidade (rode antes de abrir PR)

```bash
pnpm format       # formata com Prettier
pnpm format:check # valida formatação (igual ao CI)
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm dc:check     # regras de camadas (Controller → BO → DAO)
pnpm test:coverage # Vitest com trava de 70% de cobertura
```

Cobertura: a trava de **70%** é configurada em `vitest.config.ts`. Modelos/VOs, entidades
(Prisma), o `erro-response` e os singletons de config são excluídos do cálculo (não têm lógica),
espelhando as exclusões do antigo Jacoco.

---

## 🧪 Abordagem TDD

Cada camada é construída com teste primeiro (`test/*.test.ts`):

- `exemplo.dao.test.ts` — DAO contra o banco de teste migrado.
- `exemplo.bo.test.ts` — regra de negócio com DAO falso injetado.
- `exemplo.controller.test.ts` — HTTP via `app.request()` do Hono (sem servidor de pé).
- `error-handler.test.ts` — contrato de erro (`ErroResponse`) e mapeamento de status.

O isolamento do banco usa `test/global-setup.ts` (recria + migra o `test.db` uma vez) e
`test/setup.ts` (limpa as tabelas entre os testes).

## Banco de desenvolvimento

Prepare o banco local aplicando as migrations e criando os tipos de provedor padrão:

```bash
pnpm db:setup
```

O comando `pnpm dev` também executa esse setup antes de iniciar a API. O seed é
idempotente e mantém disponíveis apenas os tipos suportados atualmente pelas strategies:
`OpenAI` e `Anthropic`.

---

## 🐳 Rodando com Docker

Sobe o backend em container sem precisar de Node/pnpm na máquina. O SQLite vive no volume
nomeado `backend-db`, então o banco persiste entre `up`/`down`.

```bash
# A partir da raiz do repositório
docker compose up -d --build   # constrói e sobe
docker compose logs -f backend # acompanha logs
docker compose down            # derruba mantendo o banco
docker compose down -v         # derruba e apaga o volume
```

O container aplica as migrations e o seed no start e serve em
`http://localhost:8080`. O `NODE_ENV` padrão é `production` (sobrescreva com
`NODE_ENV=development docker compose up`).

---

## 📂 Estrutura de Pastas

```
src/
  main.ts                  Ponto de entrada (sobe o servidor)
  app.ts                   Composition root: middlewares + DI da cadeia de camadas
  config/                  env (perfis), cors (libera o Electron), prisma (client)
  controllers/             Camada HTTP (Hono) — montada em /api/*
  bo/                      Regras de negócio (depende só do DAO)
  dao/                     Acesso a dados (envolve o PrismaClient)
  models/vo/               DTOs imutáveis (schema Zod + tipo inferido)
  exception/               Hierarquia de exceções + error-handler (≈ GlobalExceptionHandler)
prisma/
  schema.prisma            Entidades + datasource SQLite
  migrations/              Migrations versionadas
test/                      Suíte Vitest + setup do banco de teste
```
