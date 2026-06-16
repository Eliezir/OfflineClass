# Estratégias de provedores de IA

## Objetivo

O backend usa Strategy para isolar as diferenças entre APIs externas de IA. O restante
da aplicação escolhe uma estratégia pelo tipo do provedor e não precisa conhecer URLs,
headers ou formatos de resposta específicos.

## Conceitos de OO usados

- `IProvedorStrategy` é a interface comum das estratégias.
- `BaseProvedorStrategy` é a classe abstrata que concentra o envio HTTP e tratamento de erro.
- `OpenAIProvedorStrategy` e `AnthropicProvedorStrategy` herdam da classe base.
- `ProvedorStrategyFactory` encapsula a escolha da estratégia pelo tipo cadastrado.
- `ProvedorService` orquestra repository, decriptação e estratégia.
- `ProvedorRoutes` declara as rotas Hono.
- `ProvedorController` traduz a requisição HTTP e redireciona para o service.
- `ProvedorService` trata falhas inesperadas e dispara exceções da aplicação.

## Fluxo do chat

1. `POST /api/provedores/:id/chat` recebe `mensagem` e `modelo` opcional.
2. O service busca o provedor com seu tipo.
3. A API key é decriptada somente no backend.
4. A factory seleciona a estratégia.
5. A estratégia chama a API externa e devolve apenas o texto da resposta.

## Estratégias disponíveis

- Tipos normalizados como `OpenAI` ou `Open AI` usam `OpenAIProvedorStrategy`.
- Tipos que contenham `Claude` usam `AnthropicProvedorStrategy`.
- Tipos sem estratégia geram erro de validação.

## Adicionando um provedor

1. Crie uma classe que herda de `BaseProvedorStrategy`.
2. Defina a propriedade `tipo`.
3. Implemente `enviarMensagem`.
4. Registre uma instância no construtor padrão de `ProvedorStrategyFactory`.
5. Adicione testes para seleção e conversão da resposta.

## Segurança

- A API key nunca é devolvida pelos controllers.
- A chave é decriptada apenas imediatamente antes da chamada externa.
- URLs externas são fixas nas estratégias.
- Falhas externas são convertidas em `ExcecaoApp`.
