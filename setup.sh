#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="PetroSys"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

info()  { printf "\n\033[1;36m%s\033[0m\n" "$1"; }
ok()    { printf "\033[1;32m✅ %s\033[0m\n" "$1"; }
warn()  { printf "\033[1;33m⚠️  %s\033[0m\n" "$1"; }
fail()  { printf "\033[1;31m❌ %s\033[0m\n" "$1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "Git não encontrado."
command -v node >/dev/null 2>&1 || fail "Node.js não encontrado."
command -v npm >/dev/null 2>&1 || fail "npm não encontrado."
command -v docker >/dev/null 2>&1 || fail "Docker não encontrado."

docker info >/dev/null 2>&1 || fail "Docker Desktop não está iniciado. Abra o Docker Desktop e execute ./setup.sh novamente."
docker compose version >/dev/null 2>&1 || fail "Docker Compose não está disponível."

[ -f "$ROOT_DIR/docker-compose.yml" ] || fail "docker-compose.yml não encontrado na raiz do projeto."
[ -f "$BACKEND_DIR/package.json" ] || fail "backend/package.json não encontrado."
[ -f "$FRONTEND_DIR/package.json" ] || fail "frontend/package.json não encontrado."

info "🚀 Preparando $PROJECT_NAME..."

if [ ! -f "$ROOT_DIR/.env" ]; then
  cat > "$ROOT_DIR/.env" <<'EOF'
POSTGRES_DB=petrosys
POSTGRES_USER=petrosys
POSTGRES_PASSWORD=petrosys_dev_2026
POSTGRES_PORT=5432
EOF
  ok ".env da raiz criado"
else
  ok ".env da raiz já existe — mantido"
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  cat > "$BACKEND_DIR/.env" <<EOF
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://petrosys:petrosys_dev_2026@localhost:5432/petrosys?schema=public
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
AUTH_COOKIE_NAME=petrosys_auth
EOF
  ok "backend/.env criado"
else
  ok "backend/.env já existe — mantido"
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
  cat > "$FRONTEND_DIR/.env" <<'EOF'
VITE_API_URL=http://localhost:3000/api/v1
EOF
  ok "frontend/.env criado"
else
  ok "frontend/.env já existe — mantido"
fi

install_node_deps() {
  local dir="$1"
  local label="$2"
  info "📦 Instalando dependências do $label..."
  cd "$dir"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  ok "Dependências do $label instaladas"
}

install_node_deps "$BACKEND_DIR" "backend"
install_node_deps "$FRONTEND_DIR" "frontend"

info "🐘 Iniciando PostgreSQL..."
cd "$ROOT_DIR"
docker compose up -d db

printf "Aguardando o banco ficar pronto"
DB_READY=0
for _ in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U petrosys -d petrosys >/dev/null 2>&1; then
    DB_READY=1
    break
  fi
  printf "."
  sleep 2
done
printf "\n"

[ "$DB_READY" -eq 1 ] || fail "PostgreSQL não ficou disponível a tempo. Rode 'docker compose ps' para verificar."
ok "PostgreSQL pronto"

info "🧩 Preparando o banco da aplicação..."
cd "$BACKEND_DIR"
npx prisma generate
ok "Prisma Client gerado"

npx prisma migrate deploy
ok "Migrations aplicadas"

npx prisma db seed
ok "Seed executado"

info "🔎 Verificando credencial demonstrativa do Gestor..."
cd "$ROOT_DIR"

GESTOR_FOUND="$(
  docker compose exec -T db psql -U petrosys -d petrosys -tAc \
  "SELECT COUNT(*) FROM usuarios WHERE email='gestor@petrosys.local' AND ativo=true;" \
  2>/dev/null | tr -d '[:space:]' || true
)"

if [ "$GESTOR_FOUND" = "1" ]; then
  ok "Usuário Gestor encontrado no banco"
else
  warn "O seed terminou, mas não consegui confirmar o usuário gestor@petrosys.local."
  warn "Se o login falhar, verifique o seed e o banco configurado em backend/.env."
fi

cat <<'EOF'

============================================================
🎉 PetroSys configurado!

Agora execute:

    ./start.sh

Depois abra:

    http://localhost:5173

Credenciais de Gestor:

    E-mail: gestor@petrosys.local
    Senha:  PetroSys@2026
============================================================

EOF
