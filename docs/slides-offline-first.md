# Offline-first — fonte para 2 slides

> Tópico secundário da apresentação do OfflineClass (disciplina de Redes).
> Objetivo: explicar o que é offline-first e como resolvemos a sincronização
> **a nível de rede**, citando o PowerSync como solução principal.

---

## Slide 1 — O que é offline-first (e por que importa aqui)

**A ideia**
Offline-first é uma estratégia de arquitetura em que o cliente trata a **rede como
opcional**, não como pré-requisito. O dado vive primeiro no dispositivo (SQLite local);
a sincronização com o servidor é um processo em segundo plano que acontece *quando há
conexão*.

**Por que no OfflineClass**
A sala de aula não tem internet — esse é o requisito central. O app funciona 100%
isolado em cada máquina. O sync com a nuvem é um **extra opt-in** para o professor levar
suas provas entre computadores; ele nunca pode ser exigido em tempo de prova.

**O problema de rede que isso cria**
Sincronizar dois bancos por uma rede instável é um problema clássico de
**sistemas distribuídos**:

- **Latência e quedas:** a conexão pode cair no meio de um envio.
- **Escrita concorrente:** o mesmo dado editado em dois dispositivos — qual vence?
- **Ordem e perda de pacotes:** as operações precisam chegar na ordem certa e sem furos.
- **Consistência eventual:** os nós convergem para o mesmo estado *depois* de sincronizar,
  não instantaneamente.

> Implementar fila, retry, detecção de conflito e replicação à mão levaria semanas.
> Por isso adotamos o **PowerSync**.

---

## Slide 2 — PowerSync a nível de rede

**O que é**
PowerSync é o motor de sincronização offline-first do projeto. Ele liga o **SQLite local**
de cada dispositivo a um **Postgres na nuvem**, mantendo dois canais de rede independentes:

| Canal | Direção | O que trafega na rede |
|---|---|---|
| **Upload (push)** | cliente → nuvem | Cada escrita local entra numa **fila FIFO persistente** (`ps_crud`). Quando há conexão, o SDK envia o lote via **HTTP POST** ao nosso backend |
| **Download (pull)** | nuvem → cliente | O servidor observa mudanças no Postgres via **CDC (Change Data Capture)** e as **transmite por streaming** para o SQLite de cada cliente autenticado |

**Conceitos de rede aplicados**

- **Cliente-servidor sobre HTTP/TCP:** o dispositivo fala com o connector por REST;
  o connector fala com o Postgres por TCP.
- **Fila persistente = tolerância a falha de rede:** se a conexão cair, a `ps_crud`
  guarda as operações e reenvia depois. Nada se perde.
- **Confirmação por checkpoint (ACK):** após o upload, o servidor confirma o recebimento.
  Sem confirmação, o SDK reenvia; se o servidor rejeitar, o cliente reverte localmente —
  é o mesmo princípio de *entrega confiável* do TCP, na camada de aplicação.
- **CDC + replicação por streaming:** o servidor lê o WAL (Write-Ahead Log) do Postgres e
  empurra só as mudanças (delta), em vez de o cliente ficar consultando (*polling*).
- **Autenticação na rede:** cada requisição leva um **JWT**; o servidor filtra por query
  SQL para que cada professor receba **apenas os seus dados** (isolamento + segurança).

**Resultado**
A rede deixa de ser um ponto único de falha: o uso em sala é totalmente local, e a
sincronização é um processo resiliente que converge sozinho assim que a internet volta.

---

*Eliezir Moreira · Pedro Roberto · Raphael Phillipe — IFAL, 2026*
