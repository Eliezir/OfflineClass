#!/usr/bin/env bash
# Roda backend + frontends em paralelo. Cada bloco será descomentado conforme as apps existirem.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

pids=()
cleanup() {
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# (cd apps/server && uv run uvicorn offlineclass.app:create_app --factory --reload --port 8000) &
# pids+=($!)

# (cd apps/teacher-web && pnpm dev) &
# pids+=($!)

# (cd apps/student-web && pnpm dev) &
# pids+=($!)

wait
