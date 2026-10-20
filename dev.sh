#!/usr/bin/env bash
#
# HomeTracker — development loop.
#
#   ./dev.sh              # dev Postgres + API (reload) + Vite, in one terminal
#   ./dev.sh --no-web     # backend only
#   ./dev.sh --no-api     # frontend only (still starts Postgres)
#   ./dev.sh --reset      # drop and re-apply the schema on the DEV database
#
# Ctrl-C stops the API and Vite. The Postgres container is left running so the
# next start is instant; stop it with:
#   docker compose -f api/docker-compose.yml down
#
# This is the fast loop. It does not touch the deployment stack, the root .env,
# or any image build. Use ./setup.sh when you need to prove the packaged stack.

set -euo pipefail
set -m   # give each background server its own process group, so cleanup is exact

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

API_DIR="$REPO_ROOT/api"
WEB_DIR="$REPO_ROOT/frontend/hometracker"
COMPOSE_DEV=(docker compose -f "$API_DIR/docker-compose.yml")
LOG_DIR="$REPO_ROOT/.dev-logs"
LOG_API="$LOG_DIR/api.log"
LOG_WEB="$LOG_DIR/web.log"

VENV="$REPO_ROOT/.venv"
API_PORT="${API_PORT:-8000}"

START_API=1
START_WEB=1
RESET_DB=0

API_PID=""
WEB_PID=""
TAIL_PID=""

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
HomeTracker — development loop.

  ./dev.sh              # dev Postgres + API (reload) + Vite, in one terminal
  ./dev.sh --no-web     # backend only
  ./dev.sh --no-api     # frontend only (still starts Postgres)
  ./dev.sh --reset      # drop and re-apply the schema on the DEV database

Ctrl-C stops the API and Vite. The Postgres container is left running so the
next start is instant; stop it with:
  docker compose -f api/docker-compose.yml down

This is the fast loop. It does not touch the deployment stack, the root .env,
or any image build. Use ./setup.sh when you need to prove the packaged stack.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-api) START_API=0; shift ;;
    --no-web) START_WEB=0; shift ;;
    --reset)  RESET_DB=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

terminate() { # pid, signal — kill the process group, fall back to the pid
  [[ -z "$1" ]] && return 0
  kill -"$2" -- "-$1" 2>/dev/null || kill -"$2" "$1" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM EXIT
  printf '\n'
  info "Stopping dev servers"
  for pid in "$API_PID" "$WEB_PID" "$TAIL_PID"; do
    terminate "$pid" TERM
  done
  # Wait up to 5s for a graceful exit, then stop asking.
  for _ in $(seq 1 20); do
    alive=0
    for pid in "$API_PID" "$WEB_PID" "$TAIL_PID"; do
      [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && alive=1
    done
    [[ $alive -eq 0 ]] && break
    sleep 0.25
  done
  for pid in "$API_PID" "$WEB_PID" "$TAIL_PID"; do
    [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && terminate "$pid" KILL
  done
  info "Postgres left running (docker compose -f api/docker-compose.yml down)"
}
# SIGTERM is the reliable stop signal: a non-interactive shell starts an async
# command (`./dev.sh &`) with SIGINT ignored, and bash cannot trap a signal that
# was ignored on entry. Foreground Ctrl-C is unaffected.
on_signal() { cleanup; exit 0; }
trap cleanup EXIT
trap on_signal INT TERM

# ---------------------------------------------------------------- preflight ---

command -v docker >/dev/null 2>&1 || die "docker is not installed"
docker info >/dev/null 2>&1 || die "cannot reach the Docker daemon"
[[ -f "$API_DIR/docker-compose.yml" ]] || die "api/docker-compose.yml is missing"

if [[ $START_API -eq 1 ]]; then
  command -v python3 >/dev/null 2>&1 || die "python3 is not installed"

  if [[ ! -x "$VENV/bin/python" ]]; then
    info "Creating .venv and installing api requirements (first run only)"
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --upgrade pip
    "$VENV/bin/pip" install --quiet -r "$API_DIR/requirements.txt"
  fi
  PY="$VENV/bin/python"

  if [[ ! -f "$API_DIR/.env" ]]; then
    [[ -f "$API_DIR/.env.example" ]] || die "api/.env is missing and there is no api/.env.example to copy"
    cp "$API_DIR/.env.example" "$API_DIR/.env"
    chmod 600 "$API_DIR/.env"
    warn "Created api/.env from the example — check that its DB credentials match api/docker-compose.yml"
  fi

  port_busy() { [[ -n "$(ss -ltnH "sport = :$1" 2>/dev/null)" ]]; }
  port_busy "$API_PORT" && die "port $API_PORT is already in use (something else is serving the API?)"
fi

if [[ $START_WEB -eq 1 ]]; then
  command -v npm >/dev/null 2>&1 || die "npm is not installed"
  [[ -d "$WEB_DIR" ]] || die "frontend/hometracker is missing"
  if [[ ! -d "$WEB_DIR/node_modules" ]]; then
    info "Installing frontend dependencies (first run only)"
    ( cd "$WEB_DIR" && npm install --silent )
  fi
fi

# ----------------------------------------------------------------- database ---

info "Starting the dev Postgres"
"${COMPOSE_DEV[@]}" up -d >/dev/null

info "Waiting for Postgres to accept connections"
for _ in $(seq 1 40); do
  if "${COMPOSE_DEV[@]}" exec -T db pg_isready >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
"${COMPOSE_DEV[@]}" exec -T db pg_isready >/dev/null 2>&1 \
  || die "Postgres did not become ready; check 'docker compose -f api/docker-compose.yml logs db'"

if [[ $START_API -eq 1 ]]; then
  table_count="$("${COMPOSE_DEV[@]}" exec -T db psql -U andrish -d pantry_db -tAc \
    "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null | tr -d '[:space:]')" || table_count=""

  if [[ $RESET_DB -eq 1 ]]; then
    warn "--reset: dropping and recreating the public schema on the DEV database"
    ( cd "$API_DIR" && "$PY" init_db.py --reset )
  elif [[ -z "$table_count" || "$table_count" == "0" ]]; then
    info "Empty database — applying schema.sql"
    ( cd "$API_DIR" && "$PY" init_db.py )
  else
    info "Schema present ($table_count tables) — skipping init (use --reset to rebuild)"
  fi
fi

# ------------------------------------------------------------------ servers ---

mkdir -p "$LOG_DIR"
: >"$LOG_API"
: >"$LOG_WEB"

if [[ $START_API -eq 1 ]]; then
  info "Starting uvicorn with reload"
  ( cd "$API_DIR" && exec "$PY" -m uvicorn server:app --reload --port "$API_PORT" ) \
    >"$LOG_API" 2>&1 &
  API_PID=$!
fi

if [[ $START_WEB -eq 1 ]]; then
  info "Starting Vite"
  ( cd "$WEB_DIR" && exec npm run dev ) >"$LOG_WEB" 2>&1 &
  WEB_PID=$!
fi

sleep 4

# Fail loudly if a server exited during startup instead of tailing a dead log.
if [[ -n "$API_PID" ]] && ! kill -0 "$API_PID" 2>/dev/null; then
  printf '\n'
  sed -n '1,40p' "$LOG_API" >&2
  die "the API exited during startup (log: $LOG_API)"
fi
if [[ -n "$WEB_PID" ]] && ! kill -0 "$WEB_PID" 2>/dev/null; then
  printf '\n'
  sed -n '1,40p' "$LOG_WEB" >&2
  die "Vite exited during startup (log: $LOG_WEB)"
fi

cat <<EOF

Dev servers running — Ctrl-C stops them.

  API      http://localhost:${API_PORT}        (docs at /docs)
  Web      https://localhost:5173             (HTTPS via mkcert, required for push)
  Logs     ${LOG_DIR}/api.log, ${LOG_DIR}/web.log

Postgres   ${COMPOSE_DEV[*]} (container stays up after Ctrl-C)

EOF

# Interleave both live logs, but from a background child: a foreground external
# command would block bash from ever running the signal trap.
tail -n +1 -f "$LOG_API" "$LOG_WEB" 2>/dev/null &
TAIL_PID=$!

# `wait -n` is a builtin, so SIGINT/SIGTERM interrupt it and the trap runs.
while :; do
  wait -n 2>/dev/null || true
  if [[ -n "$API_PID" ]] && ! kill -0 "$API_PID" 2>/dev/null; then
    warn "The API exited — see $LOG_API"
    exit 1
  fi
  if [[ -n "$WEB_PID" ]] && ! kill -0 "$WEB_PID" 2>/dev/null; then
    warn "Vite exited — see $LOG_WEB"
    exit 1
  fi
  if [[ -n "$TAIL_PID" ]] && ! kill -0 "$TAIL_PID" 2>/dev/null; then
    warn "Log tailer exited"
    exit 1
  fi
done
