<p align="center">
  <img src="assets/logo-horizontal.png" alt="OfflineClass — Avaliações sem internet, sincronizadas na sua rede local" width="600"/>
</p>

<p align="center">
  <strong>Plataforma de avaliações digitais para salas de aula sem internet.</strong><br/>
  Aplique provas, sincronize alunos e exporte resultados — tudo via rede local.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status"/>
  <img src="https://img.shields.io/badge/backend-FastAPI-009688" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
</p>

---

## Sobre o projeto

O **OfflineClass** resolve um problema recorrente em ambientes educacionais: a necessidade de aplicar avaliações digitais em salas de aula onde a conexão com a internet é instável, inexistente ou propositalmente desativada para garantir a integridade dos exames.

O foco do projeto está no estudo de **Sistemas Operacionais e Redes**, explorando como construir uma infraestrutura de comunicação robusta em uma rede local (LAN) isolada. O professor gerencia e aplica formulários a partir de sua máquina, enquanto os alunos se conectam e respondem por seus próprios dispositivos — sem que nenhum dado trafegue por gateways externos.

## Funcionalidades

- **Gestão de provas** — construtor de formulários com questões dissertativas e de múltipla escolha.
- **Controle de sessão** — painel do professor para iniciar a aplicação e definir o tempo máximo de resolução.
- **Descoberta automática** — sincronização entre aluno e professor na LAN sem configuração manual de IPs.
- **Interface do aluno** — ambiente leve de resposta, com timer sincronizado em tempo real com o servidor.
- **Relatórios locais** — exportação dos resultados em CSV ou JSON diretamente no computador do professor.
- **Materiais extras** *(futuro)* — compartilhamento de arquivos auxiliares (PDFs, imagens) via rede local.

## Stack tecnológica

| Camada         | Tecnologia                                                    |
| -------------- | ------------------------------------------------------------- |
| Backend        | Python · FastAPI (concorrência assíncrona) · SQLite           |
| Frontend       | React · Vite · Tailwind CSS                                   |
| Redes          | Service Discovery (mDNS / UDP Broadcast)                      |
| Distribuição   | PyInstaller (executável único `.exe`)                         |

A escolha das ferramentas prioriza eficiência no uso de recursos do sistema e simplicidade de distribuição.

## Arquitetura

```
┌──────────────────┐       LAN        ┌──────────────────┐
│  Professor (PC)  │ ───────────────► │   Aluno (Disp.)  │
│  FastAPI + React │   mDNS / HTTP    │   React (Vite)   │
│   SQLite local   │ ◄─────────────── │  Respostas/Timer │
└──────────────────┘                  └──────────────────┘
```

## Como começar

> Instruções detalhadas serão adicionadas conforme o projeto avança.

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- Rede Wi-Fi local (não precisa ter acesso à internet)

### Instalação (em breve)
```bash
git clone https://github.com/Eliezir/OfflineClass.git
cd OfflineClass
# instruções de setup do server e client
```

## Equipe

- **Eliezir Moreira**
- **Pedro Roberto**
- **Raphael Phillipe**

Projeto desenvolvido como trabalho acadêmico nas disciplinas de Sistemas Operacionais e Redes.

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  <sub>Feito com foco em ambientes educacionais reais — onde a internet nem sempre coopera.</sub>
</p>
