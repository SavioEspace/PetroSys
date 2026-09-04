#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

info() { printf "\n\033[1;36m%s\033[0m\n" "$1"; }
ok()   { printf "\033[1;32m✅ %s\033[0m\n" "$1"; }
fail() { printf "\033[1;31m❌ %s\033[0m\n" "$1" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker não encontrado."
command -v npm >/dev/null 2>&1 || fail "npm não encontrado."
docker info >/dev/null 2>&1 || fail "Docker Desktop não está iniciado."

[ -f "$ROOT_DIR/.env" ] || fail ".env da raiz não encontrado. Execute ./setup.sh primeiro."
[ -f "$BACKEND_DIR/.env" ] || fail "backend/.env não encontrado. Execute ./setup.sh primeiro."
[ -f "$FRONTEND_DIR/.env" ] || fail "frontend/.env não encontrado. Execute ./setup.sh primeiro."

cleanup() {
  printf "\n"
  info "Encerrando frontend e backend..."
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  ok "Processos encerrados. O PostgreSQL permanece no Docker."
}
trap cleanup EXIT INT TERM

info "🚀 Iniciando PetroSys..."

cd "$ROOT_DIR"
docker compose up -d db

DB_READY=0
for _ in $(seq 1 20); do
  if docker compose exec -T db pg_isready -U petrosys -d petrosys >/dev/null 2>&1; then
    DB_READY=1
    break
  fi
  sleep 1
done
[ "$DB_READY" -eq 1 ] || fail "PostgreSQL não ficou disponível."
ok "PostgreSQL"

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    fail "A porta 3000 já está em uso. Feche o backend antigo e tente novamente."
  fi
  if lsof -iTCP:5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    fail "A porta 5173 já está em uso. Feche o frontend antigo e tente novamente."
  fi
fi

info "⚙️  Iniciando backend..."
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

API_READY=0
for _ in $(seq 1 30); do
  if command -v curl >/dev/null 2>&1; then
    if curl -s -o /dev/null --max-time 1 http://localhost:3000/api/v1/auth/me; then
      API_READY=1
      break
    fi
  else
    sleep 5
    API_READY=1
    break
  fi
  sleep 1
done

[ "$API_READY" -eq 1 ] || fail "Backend não respondeu na porta 3000."
ok "Backend em http://localhost:3000"

info "🖥️  Iniciando frontend..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

sleep 2
ok "Frontend em http://localhost:5173"

cat <<'EOF'

============================================================
🌐 PetroSys está rodando!

Abra no navegador:

    http://localhost:5173

Gestor:
    E-mail: gestor@petrosys.local
    Senha:  PetroSys@2026

Para encerrar frontend e backend:
    pressione Ctrl+C neste terminal.
============================================================

EOF

wait "$BACKEND_PID" "$FRONTEND_PID"
