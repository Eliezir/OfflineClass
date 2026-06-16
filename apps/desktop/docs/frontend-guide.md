# Guia de implementacao do frontend

Este documento descreve o padrao atual do frontend e as regras para criar novas paginas,
formularios e integracoes sem quebrar a consistencia do aplicativo.

## Stack e responsabilidades

- Electron separa `main`, `preload` e `renderer`.
- React 19 renderiza a interface em `src/renderer/src`.
- TanStack Router define rotas por arquivos em `src/renderer/src/routes`.
- TanStack Query gerencia todo estado remoto e cache.
- TanStack Form gerencia o estado de formularios.
- Zod valida entradas de formulario e respostas da API.
- Tailwind CSS v4 e componentes de `shared/ui` formam o design system.

O renderer nunca deve importar codigo do backend. A integracao acontece exclusivamente por HTTP
ou, quando necessario, por contratos IPC definidos em `src/shared/ipc`.

## Estrutura

```text
src/renderer/src/
  app/                 # Providers globais e configuracao do router
  config/              # Configuracoes compartilhadas, como QueryClient
  modules/<dominio>/   # Regras e componentes de uma funcionalidade
    api.ts              # Chamadas HTTP e tratamento de erros
    queries.ts          # Query keys, queries e mutations
    schemas.ts          # Schemas Zod e tipos inferidos
    components/         # Componentes especificos do dominio
  routes/               # Paginas e layouts; devem ser finos
  shared/
    components/         # Componentes reutilizaveis compostos
    hooks/              # Hooks independentes de dominio
    layouts/            # Shell, sidebar e controles de janela
    services/           # Clientes e servicos compartilhados
    stores/             # Apenas estado global do cliente
    ui/                 # Primitivos do design system
    utils/              # Funcoes puras reutilizaveis
```

Uma rota deve organizar a pagina e delegar regras, acesso HTTP e componentes complexos ao modulo
correspondente. Nao coloque chamadas `fetch` diretamente em rotas.

## Rotas e paginas

- Use `createFileRoute` e mantenha a convencao de rotas dentro de `_app` para paginas autenticadas
  ou pertencentes ao shell principal.
- Toda pagina do shell deve iniciar com:

```tsx
<main className="flex-1 overflow-y-auto px-6 py-6">
  <header className="mb-6">...</header>
  ...
</main>
```

- O titulo usa `font-display text-2xl font-bold tracking-tight`.
- A descricao usa `mt-1 text-sm text-muted-foreground`.
- Acoes primarias ficam alinhadas a direita do cabecalho em telas largas.
- Estados de carregamento, vazio e erro devem ocupar uma superficie clara e oferecer uma proxima
  acao quando aplicavel.
- Adicione a pagina na sidebar quando ela representar uma area principal do produto.

## Design

- Reutilize primeiro os componentes de `shared/ui`: `Button`, `Card`, `Input`, `Label`, `Dialog`,
  `Popover` e `Tooltip`.
- Nao use cores literais para UI comum. Use tokens como `bg-card`, `text-muted-foreground`,
  `border-border`, `text-destructive` e `bg-primary-soft`.
- Respeite os raios existentes: controles em `rounded-[10px]`, cards em `rounded-2xl`.
- Use icones de `lucide-react`, normalmente com `size-4`.
- Reserve `variant="ai"` e `var(--gradient-ai)` para acoes que realmente acionam IA.
- Interfaces devem funcionar nos temas claro e escuro.
- Prefira grids responsivos: uma coluna no mobile e expansao progressiva com `sm:` e `lg:`.
- Animacoes devem comunicar entrada, carregamento ou mudanca de estado, sem movimento decorativo
  excessivo.

## Estado

- Estado remoto pertence ao TanStack Query.
- Defina query keys estaveis no modulo, por exemplo `provedorKeys.list()`.
- Mutations devem invalidar as queries afetadas depois de sucesso.
- Estado local efemero, como visibilidade de senha ou filtros nao persistidos, pode usar `useState`.
- Nao copie resultados de Query para estado local.
- Stores globais so devem existir quando varias areas distantes compartilham estado do cliente.

## API

- Centralize chamadas HTTP no `api.ts` do modulo.
- Configure a origem com `VITE_API_URL`; o fallback local e `http://localhost:8080`.
- Sempre verifique `response.ok`.
- Valide respostas externas com Zod antes de entrega-las aos componentes.
- Converta o contrato de erro do backend em uma classe ou mensagem compreensivel para a UI.
- Nunca exiba, registre em log ou armazene em cache segredos enviados por formularios.
- Tipos do frontend representam o contrato HTTP publico, nao entidades internas do backend.

## Formularios e validacao

- Use TanStack Form para estado, submissao e metadados.
- Defina o schema Zod no modulo e derive o tipo com `z.infer`.
- Valide no cliente para feedback imediato, mas trate erros do backend como autoridade final.
- Exiba erro proximo ao campo e use `aria-invalid` e `aria-describedby`.
- Campos obrigatorios devem ter labels explicitos e texto de ajuda quando o formato nao for obvio.
- Campos relacionais devem carregar opcoes por endpoint e exibir um select; nao solicite IDs manuais.
- Desabilite a submissao durante a mutation e mostre um rotulo de progresso.
- Depois de sucesso, invalide o cache relevante e navegue para a pagina apropriada.
- API keys e senhas usam `type="password"` por padrao e nunca voltam na resposta da pagina.

## Checklist para novas funcionalidades

1. Criar schemas e tipos do contrato.
2. Criar funcoes HTTP e tratamento de erro.
3. Criar query/mutation e respectivas query keys.
4. Criar componentes especificos dentro do modulo.
5. Criar uma rota fina usando os componentes do modulo.
6. Cobrir carregamento, erro, vazio, sucesso e responsividade.
7. Adicionar navegacao quando necessario.
8. Rodar `pnpm lint`, `pnpm typecheck` e `pnpm build`.
