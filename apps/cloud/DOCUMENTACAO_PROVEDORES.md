# Documentação completa da funcionalidade de provedores

Este documento explica, em linguagem simples, tudo que foi implementado para permitir
cadastrar, listar e utilizar provedores de inteligência artificial no Apresenta.AI.

Ele também explica os erros encontrados durante o desenvolvimento, por que aconteceram
e como evitar que aconteçam novamente.

## 1. Visão geral

Um **provedor** representa uma conta de um serviço externo de inteligência artificial.

Exemplos:

- uma conta da OpenAI;
- uma conta da Anthropic;
- uma futura conta de outro serviço de IA.

Cada provedor cadastrado possui:

- um nome definido pelo usuário, como `OpenAI principal`;
- um tipo, como `OpenAI` ou `Anthropic`;
- uma API key;
- uma data de criação.

A API key precisa ser utilizada posteriormente para chamar a API externa. Por isso, ela
é criptografada antes de ser salva no banco.

## 2. Tecnologias utilizadas

### Backend

- TypeScript;
- Hono para rotas HTTP;
- Prisma para acesso ao banco;
- SQLite como banco de dados;
- Zod para validação;
- Vitest para testes;
- orientação a objetos;
- Strategy Design Pattern para diferentes APIs de IA.

### Frontend

- Electron;
- React;
- TanStack Router;
- TanStack Query;
- TanStack Form;
- Zod;
- Tailwind CSS.

## 3. Arquitetura do backend

O backend foi dividido em camadas. Cada camada possui uma responsabilidade específica.

```text
Requisição HTTP
    ↓
Routes
    ↓
Controller
    ↓
Service
    ↓
DTO
    ↓
Repository
    ↓
Prisma
    ↓
SQLite
```

### Routes

Arquivo principal:

```text
backend/src/routes/ProvedorRoutes.ts
```

A classe `ProvedorRoutes` declara as rotas Hono e encaminha cada requisição para o
controller.

Rotas disponíveis:

| Método | Rota | Responsabilidade |
| --- | --- | --- |
| `GET` | `/api/provedores` | Lista os provedores |
| `POST` | `/api/provedores` | Cria um provedor |
| `GET` | `/api/provedores/tipos` | Lista os tipos disponíveis |
| `POST` | `/api/provedores/:id/chat` | Envia uma mensagem usando o provedor |

As rotas não possuem regras de negócio. Elas apenas conectam URLs aos métodos do
controller.

### Controller

Arquivo:

```text
backend/src/controllers/ProvedorController.ts
```

O controller:

- lê parâmetros e o corpo da requisição;
- chama o service;
- define o status HTTP;
- remove dados secretos antes de responder.

Por exemplo, ao criar ou listar um provedor, o controller nunca devolve:

- `apiKeyEncrypted`;
- `apiKeyIv`;
- `apiKeyAuthTag`;
- a API key original.

O frontend recebe apenas informações públicas:

```json
{
  "id": 1,
  "nome": "OpenAI principal",
  "tipoProvedorId": 1,
  "createdAt": "2026-06-12T20:00:00.000Z"
}
```

### Request

Arquivo:

```text
backend/src/requests/ProvedorRequest.ts
```

O `ProvedorRequestSchema` representa e valida os dados recebidos do frontend.

Ele exige:

- `nome` entre 3 e 80 caracteres;
- `apiKey` entre 8 e 255 caracteres e sem espaços;
- `tipoProvedorId` inteiro e positivo.

No Express ou Hono, o corpo recebido não se transforma automaticamente em uma instância
de classe. Ele chega como um objeto JavaScript comum.

Por isso, o service recebe o corpo como `unknown` e executa:

```ts
const request = ProvedorRequestSchema.parse(body)
```

Essa chamada valida os dados e devolve um objeto com o formato correto.

### Service

Arquivo:

```text
backend/src/services/ProvedorService.ts
```

O service concentra as regras de negócio.

Na criação, ele:

1. valida o corpo com `ProvedorRequestSchema`;
2. verifica se o tipo informado existe;
3. criptografa a API key;
4. cria um `ProvedorDTO`;
5. envia o DTO para o repository.

Todos os métodos públicos do service utilizam `try/catch`.

Erros esperados, como erro de validação ou recurso não encontrado, são preservados.
Erros inesperados são transformados em `ExcecaoApp` com uma mensagem que informa qual
operação falhou.

### DTO

Arquivo:

```text
backend/src/dto/ProvedorDTO.ts
```

O DTO representa os dados que podem ser enviados para persistência.

Ele não recebe a API key original. Ele recebe apenas:

- nome;
- ID do tipo;
- conteúdo criptografado;
- IV da criptografia;
- tag de autenticação.

O método `toJson()` devolve um objeto plano compatível com o Prisma:

```ts
{
  nome,
  apiKeyEncrypted,
  apiKeyIv,
  apiKeyAuthTag,
  tipoProvedorId
}
```

Essa tipagem é importante. Retornar apenas `object` não é suficiente, pois o TypeScript
não consegue garantir que o objeto possui os campos exigidos pelo Prisma.

### Repository

Arquivo:

```text
backend/src/repositories/ProvedorRepository.ts
```

O repository é a única camada que acessa diretamente o Prisma.

Exemplos:

```ts
this.prisma.provedor.create({ data: dto.toJson() })
this.prisma.provedor.findMany()
this.prisma.provedor.findMany({ where: { tipoProvedorId } })
```

O campo `data` do Prisma precisa receber um objeto compatível com o model definido em
`schema.prisma`. Ele não recebe uma classe DTO diretamente. Por isso é utilizado
`dto.toJson()`.

O repository também possui métodos de edição e exclusão. Atualmente eles existem na
camada de persistência, mas ainda não foram expostos por rotas HTTP.

## 4. Fluxo completo de criação

O frontend envia:

```http
POST /api/provedores
Content-Type: application/json
```

```json
{
  "nome": "OpenAI principal",
  "apiKey": "sk-chave-secreta",
  "tipoProvedorId": 1
}
```

O fluxo executado é:

1. `ProvedorRoutes` recebe a chamada.
2. `ProvedorController.criar()` lê o JSON.
3. `ProvedorService.criaProvedor()` valida o corpo.
4. O service confirma que `tipoProvedorId` existe.
5. O service criptografa a API key.
6. O service monta o `ProvedorDTO`.
7. O repository chama `dto.toJson()`.
8. O Prisma salva o provedor.
9. O controller remove todos os campos secretos.
10. O backend responde com status `201`.

## 5. Banco de dados e Prisma

Schema:

```text
backend/prisma/schema.prisma
```

### TipoProvedor

Representa um tipo suportado:

```prisma
model TipoProvedor {
  id         Int        @id @default(autoincrement())
  nome       String     @unique
  provedores Provedor[]
}
```

O nome é único para impedir tipos duplicados.

### Provedor

Representa uma conta cadastrada:

```prisma
model Provedor {
  id              Int          @id @default(autoincrement())
  nome            String
  apiKeyEncrypted String
  apiKeyIv        String
  apiKeyAuthTag   String
  createdAt       DateTime     @default(now())
  tipoProvedorId  Int
  provedor        TipoProvedor @relation(fields: [tipoProvedorId], references: [id])
}
```

### Migrations

As migrations ficam em:

```text
backend/prisma/migrations
```

Elas são responsáveis por:

- criar as tabelas;
- substituir o antigo campo de API key em texto puro pelos campos criptografados;
- criar os tipos iniciais;
- impedir nomes de tipos duplicados.

Nunca basta alterar apenas `schema.prisma`. A migration também precisa ser aplicada ao
banco utilizado pela aplicação.

## 6. Seed dos tipos padrão

Arquivo:

```text
backend/prisma/seed.ts
```

O seed cria os tipos atualmente suportados:

- `OpenAI`;
- `Anthropic`.

O seed utiliza `upsert`. Isso significa:

- se o tipo não existe, ele é criado;
- se já existe, nada é duplicado.

Para preparar o banco:

```bash
cd backend
pnpm db:setup
```

Esse comando:

1. gera o Prisma Client;
2. aplica todas as migrations;
3. executa o seed.

O comando `pnpm dev` também executa essas etapas antes de iniciar o backend.

## 7. Criptografia da API key

Arquivo:

```text
backend/src/config/crypto.ts
```

### Por que não usar bcrypt?

O bcrypt gera um hash irreversível.

Hash é adequado para senhas porque não é necessário recuperar a senha original.

Neste projeto, a API key precisa ser recuperada para chamar OpenAI ou Anthropic.
Portanto, bcrypt não atende essa necessidade.

Foi utilizada criptografia reversível com `AES-256-GCM`.

### Dados salvos

O banco salva:

- `apiKeyEncrypted`: conteúdo criptografado;
- `apiKeyIv`: valor aleatório usado na criptografia;
- `apiKeyAuthTag`: valor que permite verificar se o conteúdo foi alterado.

### Chave mestra

A criptografia depende da variável:

```text
API_KEY_ENCRYPTION_KEY_BASE64
```

Ela deve conter uma chave Base64 que decodifique para exatamente 32 bytes.

Para gerar uma nova chave:

```bash
openssl rand -base64 32
```

Depois, adicione o resultado ao arquivo local `backend/.env`:

```dotenv
API_KEY_ENCRYPTION_KEY_BASE64="valor-gerado"
```

Regras importantes:

- não publique essa chave;
- não envie essa chave ao frontend;
- não salve essa chave no banco;
- não altere a chave depois de salvar provedores;
- mantenha backup seguro da chave em produção.

Se a chave for alterada ou perdida, as API keys já salvas não poderão mais ser
descriptografadas.

## 8. Strategy Design Pattern

Arquivos:

```text
backend/src/strategies/IProvedorStrategy.ts
backend/src/strategies/BaseProvedorStrategy.ts
backend/src/strategies/OpenAIProvedorStrategy.ts
backend/src/strategies/AnthropicProvedorStrategy.ts
backend/src/strategies/ProvedorStrategyFactory.ts
```

O Strategy Pattern permite que cada API externa tenha sua própria implementação.

### Interface

`IProvedorStrategy` define o comportamento comum que todas as estratégias precisam
oferecer.

### Herança

`BaseProvedorStrategy` concentra o código HTTP compartilhado.

As estratégias concretas herdam dessa classe:

- `OpenAIProvedorStrategy`;
- `AnthropicProvedorStrategy`.

### Factory

`ProvedorStrategyFactory` escolhe a estratégia com base no tipo do provedor.

Exemplos:

- `OpenAI` seleciona `OpenAIProvedorStrategy`;
- `Anthropic` ou um tipo contendo `Claude` seleciona `AnthropicProvedorStrategy`;
- um tipo não suportado gera erro de validação.

### Fluxo de chat

```http
POST /api/provedores/:id/chat
```

```json
{
  "mensagem": "Explique orientação a objetos",
  "modelo": "modelo-opcional"
}
```

O backend:

1. valida o ID;
2. busca o provedor e seu tipo;
3. descriptografa a API key;
4. seleciona a estratégia;
5. chama a API externa;
6. devolve somente a resposta em texto.

## 9. Tratamento de erros

Arquivo:

```text
backend/src/exception/error-handler.ts
```

O Hono utiliza um tratamento global de erros.

| Erro | Status |
| --- | --- |
| Dados inválidos do Zod | `400` |
| `ExcecaoValidacao` | `400` |
| `ExcecaoNaoEncontrado` | `404` |
| `ExcecaoApp` | `500` |
| Erro inesperado | `500` |

Formato aproximado:

```json
{
  "status": 400,
  "erro": "Erro de validação",
  "mensagens": ["Tipo de provedor não encontrado"]
}
```

## 10. Frontend de provedores

Módulo:

```text
frontend/src/renderer/src/modules/provedores
```

Rotas:

```text
frontend/src/renderer/src/routes/_app/provedores.tsx
frontend/src/renderer/src/routes/_app/provedores_.novo.tsx
```

### Listagem

A página de listagem:

- chama `GET /api/provedores`;
- exibe carregamento;
- exibe mensagem amigável quando não existem provedores;
- exibe erros de conexão;
- mostra os provedores sem revelar API keys.

### Cadastro

O formulário:

- carrega os tipos por `GET /api/provedores/tipos`;
- permite selecionar o tipo;
- valida nome, API key e tipo;
- oculta a API key por padrão;
- envia o cadastro;
- volta para a listagem após sucesso.

### API do frontend

Arquivo:

```text
frontend/src/renderer/src/modules/provedores/api.ts
```

Esse arquivo:

- centraliza chamadas HTTP;
- possui timeout de 10 segundos;
- informa quando o backend não está disponível;
- exige respostas JSON válidas;
- valida respostas com Zod.

Em desenvolvimento, `/api` utiliza o proxy do Vite para:

```text
http://localhost:8080
```

No Electron empacotado, o frontend chama diretamente:

```text
http://localhost:8080
```

### TanStack Query

Arquivo:

```text
frontend/src/renderer/src/modules/provedores/queries.ts
```

O TanStack Query gerencia:

- cache da lista;
- cache dos tipos;
- estado de carregamento;
- estado de erro;
- atualização da lista após criar um provedor.

Depois de uma criação bem-sucedida, a query da lista é invalidada para forçar uma nova
busca.

### Validação das respostas

Arquivo:

```text
frontend/src/renderer/src/modules/provedores/schemas.ts
```

As listagens devem sempre retornar arrays.

Lista vazia correta:

```json
[]
```

Resposta incorreta:

```json
null
```

O frontend mantém o contrato estrito. Se o backend devolver `null`, HTML ou um corpo
inválido, será exibido um erro em vez de esconder o problema.

## 11. Erros encontrados e suas causas

### `createMock.mockResolvedValue is not a function`

Esse erro acontece quando `createMock` não é uma função mock do Vitest.

Exemplo correto:

```ts
const createMock = vi.fn()
createMock.mockResolvedValue(provedor)
```

Também é possível mockar o Prisma:

```ts
const prismaMock = {
  provedor: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}
```

Para listagem:

```ts
prismaMock.provedor.findMany.mockResolvedValue([provedor])
```

O método correto é `mockResolvedValue`, não `mockedResolvedValue`.

### Busca por tipo retornava tudo

O mock de `findMany` apenas devolve o valor configurado. Ele não executa automaticamente
o filtro do Prisma.

O teste correto precisa validar que o repository enviou o `where`:

```ts
expect(prismaMock.provedor.findMany).toHaveBeenCalledWith({
  where: { tipoProvedorId: 1 }
})
```

Testes de integração com SQLite podem confirmar que o filtro realmente funciona no banco.

### `Type object is not assignable to type ... ProvedorCreateInput`

Esse erro ocorreu porque `toJson()` estava tipado apenas como `object`.

O Prisma exige conhecer os campos exatos recebidos em `data`.

A solução foi criar o tipo `ProvedorPersistencia` e fazer `toJson()` retornar esse tipo.

### `expected array, received null`

O frontend esperava um array, mas recebeu `null`.

Uma causa possível era o parser antigo transformar silenciosamente uma resposta não JSON
em `null`.

A solução foi:

- exigir resposta JSON válida;
- manter arrays como contrato obrigatório;
- garantir que o backend retorne `[]` quando não houver dados;
- exibir erro claro quando o backend estiver indisponível.

### `The table main.TipoProvedor does not exist`

O banco utilizado pela aplicação não tinha recebido as migrations.

A solução foi:

- aplicar as migrations;
- criar um seed idempotente;
- adicionar `pnpm db:setup`;
- executar setup automaticamente antes de `pnpm dev`;
- executar migrations e seed no Docker.

### `Missing API_KEY_ENCRYPTION_KEY_BASE64 environment variable`

O backend tentou criptografar a API key sem possuir a chave mestra.

A solução foi gerar uma chave segura e configurá-la no `backend/.env`.

Depois de modificar `.env`, o backend precisa ser reiniciado.

### `Failed to fetch`

Esse erro significa que o frontend não conseguiu alcançar o backend.

Verifique:

1. se o backend está em execução;
2. se está ouvindo na porta `8080`;
3. se migrations e seed foram executados;
4. se o frontend foi reiniciado após mudanças;
5. se a CSP e o proxy continuam configurados.

## 12. Como executar localmente

### Preparar o backend

```bash
cd backend
pnpm db:setup
```

Confirme que `backend/.env` contém:

```dotenv
NODE_ENV=development
PORT=8080
DATABASE_URL="file:../database/apresenta-ia.db"
API_KEY_ENCRYPTION_KEY_BASE64="sua-chave-base64-de-32-bytes"
```

### Iniciar o backend

```bash
cd backend
pnpm dev
```

O backend deve ficar disponível em:

```text
http://localhost:8080
```

### Iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

## 13. Como executar com Docker

O Docker Compose exige que a chave de criptografia seja informada.

Exemplo:

```bash
export API_KEY_ENCRYPTION_KEY_BASE64="$(openssl rand -base64 32)"
docker compose up -d --build
```

Em um ambiente real, mantenha essa chave em um gerenciador de segredos e reutilize
sempre a mesma chave.

O container:

1. gera o Prisma Client;
2. aplica migrations;
3. executa o seed;
4. inicia o backend.

## 14. Testes

Os testes cobrem:

- criação de provedor;
- criptografia da API key;
- não exposição dos campos secretos;
- listagem;
- listagem vazia;
- listagem de tipos;
- filtro por tipo;
- edição e exclusão no repository;
- tipo inexistente;
- ID inválido;
- falha inesperada do repository;
- escolha da Strategy;
- fluxo de chat no service.

Comandos úteis:

```bash
cd backend
pnpm test
pnpm typecheck
pnpm lint
pnpm dc:check
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

## 15. Como adicionar um novo tipo de provedor

Exemplo: adicionar `Google Gemini`.

1. Crie uma strategy que herde de `BaseProvedorStrategy`.
2. Implemente a chamada para a API externa.
3. Registre a strategy em `ProvedorStrategyFactory`.
4. Adicione o tipo ao array do seed.
5. Execute `pnpm db:setup`.
6. Crie testes para a nova strategy.

Não adicione apenas um registro ao banco sem criar a strategy correspondente. Nesse caso,
o usuário conseguiria cadastrar o tipo, mas não conseguiria utilizá-lo no chat.

## 16. Responsabilidades de segurança

- API keys nunca devem aparecer em respostas HTTP.
- API keys nunca devem ser registradas em logs.
- O frontend não deve guardar API keys depois do envio.
- A chave mestra deve existir somente no backend.
- O `.env` não deve ser versionado.
- Produção deve utilizar um gerenciador de segredos.
- A chave mestra precisa de backup seguro.
- Troca de chave exige um processo planejado de recriptografia.
- HTTPS deve ser utilizado quando o backend não estiver restrito à máquina local.

## 17. Estado atual e próximos passos

Atualmente estão disponíveis:

- cadastro de provedor;
- listagem de provedores;
- listagem de tipos;
- seed de tipos padrão;
- criptografia reversível de API keys;
- strategies para OpenAI e Anthropic;
- endpoint backend para chat;
- métodos de repository para editar e excluir.

Ainda não existem rotas HTTP e telas para:

- editar provedores;
- excluir provedores;
- utilizar o chat no frontend;
- rotacionar a chave mestra;
- atualizar somente a API key de um provedor.

Essas funcionalidades podem ser adicionadas mantendo a mesma separação:

```text
Route → Controller → Service → DTO → Repository → Prisma
```
