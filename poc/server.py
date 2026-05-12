"""
OfflineClass — PoC

Servidor de formulário offline para validar a ideia base do projeto:
- FastAPI servindo uma página HTML simples
- Persistência local em SQLite (nome + resposta)
- Timer de 10 minutos iniciado junto com o servidor
- Aberto em 0.0.0.0 para ser acessível na rede local
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

server_started_at: datetime | None = None


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


PAGE = """\
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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const r = await fetch('/submit', { method: 'POST', body: fd });
      if (r.ok) {
        form.reset();
        msg.hidden = false;
      }
    });
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return PAGE


@app.post("/submit")
def submit(nome: str = Form(...), resposta: str = Form(...)) -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO respostas (nome, resposta, criado_em) VALUES (?, ?, ?)",
            (nome, resposta, datetime.now().isoformat(timespec="seconds")),
        )
    return {"status": "ok"}


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
