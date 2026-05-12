"""
OfflineClass — PoC

Servidor de formulário offline para validar a ideia base do projeto:
- FastAPI servindo a página do aluno (HTML) e a página do professor (HTML)
- Persistência local em SQLite (nome + resposta)
- Timer de 10 minutos iniciado junto com o servidor
- Aberto em 0.0.0.0 para ser acessível na rede local
- Presença em memória: alunos enviam heartbeat a cada 5s; professor vê
  quem está online consultando /conectados.
"""

import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse

DB_PATH = Path(__file__).parent / "respostas.db"
TIMER_DURATION = timedelta(minutes=10)
PRESENCA_TIMEOUT = timedelta(seconds=10)

server_started_at: datetime | None = None
# nome -> último heartbeat. Estado efêmero, vive só na execução.
conectados: dict[str, datetime] = {}


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS respostas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                resposta TEXT NOT NULL,
                criado_em TEXT NOT NULL
            )
            """
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    global server_started_at
    server_started_at = datetime.now()
    init_db()
    yield


app = FastAPI(title="OfflineClass — PoC", lifespan=lifespan)


PAGE_ALUNO = """\
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>OfflineClass — PoC</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 4rem auto; padding: 0 1rem; color: #1f2937; }
    h1 { margin-bottom: .25rem; }
    .timer { font-variant-numeric: tabular-nums; font-size: 2rem; color: #4f46e5; margin: 1rem 0 2rem; }
    .timer.encerrado { color: #dc2626; }
    label { display: block; margin-top: 1rem; font-weight: 600; }
    input, textarea { width: 100%; padding: .6rem; font-size: 1rem; border: 1px solid #d1d5db; border-radius: .375rem; box-sizing: border-box; }
    textarea { min-height: 6rem; resize: vertical; }
    button { margin-top: 1.25rem; padding: .7rem 1.2rem; background: #4f46e5; color: #fff; border: 0; border-radius: .375rem; font-size: 1rem; cursor: pointer; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    .ok { color: #16a34a; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>OfflineClass</h1>
  <p>Avaliação local — preencha e envie sua resposta.</p>

  <div id="timer" class="timer">--:--</div>

  <form id="form" method="post" action="/submit">
    <label for="nome">Nome</label>
    <input id="nome" name="nome" required />

    <label for="resposta">Resposta</label>
    <textarea id="resposta" name="resposta" required></textarea>

    <button type="submit" id="btn">Enviar</button>
  </form>

  <p id="msg" class="ok" hidden>Resposta enviada com sucesso.</p>

  <script>
    const timerEl = document.getElementById('timer');
    const btn = document.getElementById('btn');
    const form = document.getElementById('form');
    const msg = document.getElementById('msg');
    const nomeEl = document.getElementById('nome');

    async function atualizaTimer() {
      try {
        const r = await fetch('/timer');
        const data = await r.json();
        timerEl.textContent = data.restante_formatado;
        if (data.status === 'encerrado') {
          timerEl.classList.add('encerrado');
          btn.disabled = true;
        }
      } catch (_) {}
    }
    atualizaTimer();
    setInterval(atualizaTimer, 1000);

    let heartbeatAtivo = true;
    async function heartbeat() {
      if (!heartbeatAtivo) return;
      const nome = nomeEl.value.trim();
      if (!nome) return;
      try {
        await fetch('/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'nome=' + encodeURIComponent(nome),
        });
      } catch (_) {}
    }
    heartbeat();
    setInterval(heartbeat, 5000);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const r = await fetch('/submit', { method: 'POST', body: fd });
      if (r.ok) {
        heartbeatAtivo = false;
        form.reset();
        msg.hidden = false;
      }
    });
  </script>
</body>
</html>
"""


PAGE_PROFESSOR = """\
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>OfflineClass — Professor</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 3rem auto; padding: 0 1rem; color: #1f2937; }
    h1 { margin-bottom: .25rem; }
    .stats { display: flex; gap: 1rem; margin: 1.5rem 0; }
    .stat { flex: 1; padding: 1rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; }
    .stat .label { font-size: .8rem; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .stat .value { font-size: 2rem; font-weight: 700; color: #4f46e5; font-variant-numeric: tabular-nums; }
    .vazio { color: #9ca3af; font-style: italic; }
    ul { padding-left: 0; list-style: none; }
    li { padding: .5rem .75rem; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; }
    li .visto { color: #6b7280; font-size: .85rem; }
    .pulse { display: inline-block; width: .5rem; height: .5rem; border-radius: 50%; background: #16a34a; margin-right: .5rem; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  </style>
</head>
<body>
  <h1>Painel do professor</h1>
  <p>Alunos conectados em tempo real (atualiza a cada 2 segundos).</p>

  <div class="stats">
    <div class="stat">
      <div class="label">Conectados agora</div>
      <div class="value" id="count">0</div>
    </div>
    <div class="stat">
      <div class="label">Timer</div>
      <div class="value" id="timer">--:--</div>
    </div>
  </div>

  <h2>Online</h2>
  <ul id="lista"><li class="vazio">Ninguém conectado ainda.</li></ul>

  <script>
    function tempoRelativo(iso) {
      const segundos = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
      if (segundos < 2) return 'agora';
      return `há ${segundos}s`;
    }

    async function atualizar() {
      try {
        const [conectadosResp, timerResp] = await Promise.all([
          fetch('/conectados').then(r => r.json()),
          fetch('/timer').then(r => r.json()),
        ]);
        document.getElementById('count').textContent = conectadosResp.total;
        document.getElementById('timer').textContent = timerResp.restante_formatado;

        const lista = document.getElementById('lista');
        if (conectadosResp.alunos.length === 0) {
          lista.innerHTML = '<li class="vazio">Ninguém conectado ainda.</li>';
        } else {
          lista.innerHTML = conectadosResp.alunos
            .map(a => `<li><span><span class="pulse"></span>${a.nome}</span><span class="visto">${tempoRelativo(a.ultimo_heartbeat)}</span></li>`)
            .join('');
        }
      } catch (_) {}
    }
    atualizar();
    setInterval(atualizar, 2000);
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return PAGE_ALUNO


@app.get("/professor", response_class=HTMLResponse)
def professor() -> str:
    return PAGE_PROFESSOR


@app.post("/submit")
def submit(nome: str = Form(...), resposta: str = Form(...)) -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO respostas (nome, resposta, criado_em) VALUES (?, ?, ?)",
            (nome, resposta, datetime.now().isoformat(timespec="seconds")),
        )
    return {"status": "ok"}


@app.post("/heartbeat")
def heartbeat(nome: str = Form(...)) -> dict:
    conectados[nome.strip()] = datetime.now()
    return {"status": "ok"}


@app.get("/conectados")
def listar_conectados() -> dict:
    agora = datetime.now()
    ativos = {
        nome: visto
        for nome, visto in conectados.items()
        if agora - visto < PRESENCA_TIMEOUT
    }
    # Limpa entradas velhas pra não vazar memória ao longo de horas.
    for nome in list(conectados.keys()):
        if nome not in ativos:
            del conectados[nome]
    return {
        "total": len(ativos),
        "alunos": [
            {"nome": nome, "ultimo_heartbeat": visto.isoformat(timespec="seconds")}
            for nome, visto in sorted(ativos.items(), key=lambda kv: kv[0].lower())
        ],
    }


@app.get("/timer")
def timer() -> dict:
    assert server_started_at is not None
    restante = TIMER_DURATION - (datetime.now() - server_started_at)
    segundos = max(0, int(restante.total_seconds()))
    return {
        "status": "ativo" if segundos > 0 else "encerrado",
        "restante_segundos": segundos,
        "restante_formatado": f"{segundos // 60:02d}:{segundos % 60:02d}",
    }


@app.get("/respostas")
def listar_respostas() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, nome, resposta, criado_em FROM respostas ORDER BY id DESC"
        ).fetchall()
        return [dict(r) for r in rows]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
