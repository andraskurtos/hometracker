#!/usr/bin/env bash
#
# HomeTracker — one-shot deployment for a LAN host.
#
#   ./setup.sh                      # create .env if missing, build, start, init schema
#   ./setup.sh --gemini-key KEY     # same, with the LLM key supplied non-interactively
#   ./setup.sh --force              # regenerate JWT/VAPID secrets (keeps DB password)
#   ./setup.sh --reset-db           # destroy the Postgres volume and rebuild the schema
#
# Safe to re-run: existing .env values are preserved, the schema init is
# idempotent, and containers are only recreated when their config changed.
#
# Secrets are generated here and written to .env with mode 600. This script
# never prints them.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/.env"
ENV_EXAMPLE="$REPO_ROOT/.env.example"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$REPO_ROOT")}"

FORCE=0
RESET_DB=0
ASSUME_YES=0
GEMINI_KEY_ARG=""
WEB_PORT_ARG=""

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  cat <<'EOF'

Options:
  --gemini-key KEY   Gemini API key for receipt parsing. If omitted on an
                     interactive run, you are prompted (skippable); with --yes
                     nothing is asked and receipt parsing stays unconfigured.
  --web-port N       Port the HomeTracker UI is published on (default: 80)
  --force            Regenerate JWT and VAPID secrets
  --reset-db         Drop the Postgres volume and re-apply the schema (destructive)
  --yes              Assume yes for destructive confirmations
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --gemini-key) GEMINI_KEY_ARG="${2:-}"; shift 2 ;;
    --web-port)   WEB_PORT_ARG="${2:-}";   shift 2 ;;
    --force)      FORCE=1; shift ;;
    --reset-db)   RESET_DB=1; shift ;;
    --yes|-y)     ASSUME_YES=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            die "Unknown option: $1 (try --help)" ;;
  esac
done

# ---------------------------------------------------------------- preflight ---

info "Checking prerequisites"
command -v docker >/dev/null 2>&1 || die "docker is not installed"
docker compose version >/dev/null 2>&1 || die "docker compose (v2) is not available"
docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon — is it running, and is $USER in the docker group?"
[[ -f "$ENV_EXAMPLE" ]] || die ".env.example is missing; run this from the repository root"

have_python=0
command -v python3 >/dev/null 2>&1 && have_python=1

gen_hex() { # bytes -> lowercase hex
  if [[ $have_python -eq 1 ]]; then
    python3 -c 'import secrets,sys; print(secrets.token_hex(int(sys.argv[1])))' "$1"
  else
    openssl rand -hex "$1"
  fi
}

gen_token() { # bytes -> url-safe token
  if [[ $have_python -eq 1 ]]; then
    python3 -c 'import secrets,sys; print(secrets.token_urlsafe(int(sys.argv[1])))' "$1"
  else
    openssl rand -base64 64 | tr -d '\n=+/' | cut -c1-64
  fi
}

env_get() { # read KEY from an existing .env without dumping the file
  [[ -f "$ENV_FILE" ]] || return 0
  sed -n "s/^[[:space:]]*$1=//p" "$ENV_FILE" | tail -n 1 | sed 's/[[:space:]]\{1,\}#.*$//'
}

is_placeholder() { # empty or the template's dummy value
  [[ -z "$1" || "$1" == "change_me" ]]
}

volume_exists() {
  docker volume ls \
    --filter "label=com.docker.compose.project=${PROJECT_NAME}" \
    --format '{{.Name}}' 2>/dev/null | grep -qx "${PROJECT_NAME}_pgdata"
}

port_in_use() {
  [[ -n "$(ss -ltnH "sport = :$1" 2>/dev/null)" ]]
}

# ------------------------------------------------------------ destructive ops --

if [[ $RESET_DB -eq 1 ]]; then
  if volume_exists; then
    warn "This will delete the Postgres volume '${PROJECT_NAME}_pgdata' and ALL HomeTracker data."
    if [[ $ASSUME_YES -ne 1 ]]; then
      [[ -t 0 ]] || die "refusing to destroy data without a terminal; pass --yes to confirm"
      read -r -p "Type 'destroy' to continue: " reply
      [[ "$reply" == "destroy" ]] || die "aborted"
    fi
    info "Removing containers and the Postgres volume"
    docker compose down -v --remove-orphans
  else
    info "No Postgres volume found — nothing to reset"
  fi
fi

# Interactively read the Gemini key. Prompts go to stderr, the key to stdout,
# so `key="$(ask_gemini_key)"` captures only the secret. Input is not echoed.
ask_gemini_key() {
  local input
  {
    printf '\n'
    printf '  Receipt parsing needs a Gemini API key.\n'
    printf '  Get one at https://aistudio.google.com/apikey\n'
    printf '  Paste it here (input hidden), or press Enter to skip: '
  } >&2
  if ! IFS= read -rs input; then
    input=""
  fi
  printf '\n' >&2
  input="$(printf '%s' "$input" | tr -d '[:space:]')"
  input="${input#\"}"; input="${input%\"}"
  input="${input#\'}"; input="${input%\'}"
  printf '%s' "$input"
}

# ------------------------------------------------------------------- values ---

info "Resolving configuration"

db_name="${DB_NAME:-$(env_get DB_NAME)}";      db_name="${db_name:-pantry_db}"
db_user="${DB_USER:-$(env_get DB_USER)}";      db_user="${db_user:-$USER}"
llm_model="${LLM_MODEL:-$(env_get LLM_MODEL)}"; llm_model="${llm_model:-gemini/gemini-2.5-flash}"
web_port="${WEB_PORT_ARG:-${WEB_PORT:-$(env_get WEB_PORT)}}"; web_port="${web_port:-80}"
vapid_subject="${VAPID_SUBJECT:-$(env_get VAPID_SUBJECT)}"; vapid_subject="${vapid_subject:-mailto:admin@example.com}"

existing_db_pass="$(env_get DB_PASSWORD)"
existing_jwt="$(env_get JWT_KEY)"
existing_vapid_priv="$(env_get VAPID_PRIVATE_KEY)"
existing_vapid_pub="$(env_get VAPID_PUBLIC_KEY)"

# The Postgres password is baked into the data directory on first init. Changing
# it afterwards locks the api out of a database that still expects the old one.
if volume_exists && [[ -n "$existing_db_pass" ]]; then
  if [[ $FORCE -eq 1 ]]; then
    warn "Postgres volume exists — keeping the existing DB_PASSWORD (use --reset-db to change it)"
  fi
  db_pass="$existing_db_pass"
elif is_placeholder "$existing_db_pass"; then
  db_pass="$(gen_hex 24)"
else
  db_pass="$existing_db_pass"
fi

if [[ $FORCE -eq 1 ]] || is_placeholder "$existing_jwt"; then
  jwt_key="$(gen_token 48)"
  if [[ -n "$existing_jwt" && $FORCE -eq 1 ]]; then
    warn "New JWT_KEY generated — existing sessions and tokens are now invalid"
  fi
else
  jwt_key="$existing_jwt"
fi

# Gemini key: flag > environment > existing .env > interactive prompt.
gemini_key="${GEMINI_KEY_ARG:-${GEMINI_API_KEY:-}}"
if [[ -z "$gemini_key" ]]; then
  gemini_key="$(env_get GEMINI_API_KEY)"
fi
if is_placeholder "$gemini_key"; then
  gemini_key=""
  if [[ -t 0 && $ASSUME_YES -ne 1 ]]; then
    gemini_key="$(ask_gemini_key)"
  fi
fi

gemini_configured=0
if [[ -n "$gemini_key" ]]; then
  gemini_configured=1
  if [[ "$gemini_key" != AIza* ]]; then
    warn "That key does not look like a Gemini API key (expected a leading 'AIza'); keeping it anyway"
  fi
else
  warn "No Gemini API key — setup will finish, receipt parsing stays disabled until you add one"
fi

[[ "$web_port" =~ ^[0-9]+$ ]] || die "invalid port: $web_port"

# --------------------------------------------------------------- vapid keys ---

need_vapid=0
if [[ $FORCE -eq 1 ]] || is_placeholder "$existing_vapid_priv" || is_placeholder "$existing_vapid_pub"; then
  need_vapid=1
fi

if [[ $need_vapid -eq 1 ]]; then
  info "Building the api image (needed to generate VAPID keys)"
  docker compose build api >/dev/null

  info "Generating VAPID key pair"
  vapid_out="$(docker compose run --rm --no-deps -T api python - <<'PY'
from py_vapid import Vapid
import base64
import cryptography.hazmat.primitives.serialization as sz

v = Vapid()
v.generate_keys()
private = base64.urlsafe_b64encode(
    v.private_key.private_numbers().private_value.to_bytes(32, "big")
).rstrip(b"=").decode()
public = base64.urlsafe_b64encode(
    v.public_key.public_bytes(sz.Encoding.X962, sz.PublicFormat.UncompressedPoint)
).rstrip(b"=").decode()
print("VAPID_PRIVATE_KEY=" + private)
print("VAPID_PUBLIC_KEY=" + public)
PY
)"
  vapid_priv="$(printf '%s\n' "$vapid_out" | sed -n 's/^VAPID_PRIVATE_KEY=//p' | head -n 1)"
  vapid_pub="$(printf '%s\n' "$vapid_out" | sed -n 's/^VAPID_PUBLIC_KEY=//p' | head -n 1)"
  [[ -n "$vapid_priv" && -n "$vapid_pub" ]] || die "VAPID key generation failed (no key material returned)"
  if [[ -n "$existing_vapid_priv" && $FORCE -eq 1 ]]; then
    warn "New VAPID keys generated — browsers must re-subscribe for push notifications"
  fi
else
  vapid_priv="$existing_vapid_priv"
  vapid_pub="$existing_vapid_pub"
fi

# ---------------------------------------------------------------- write .env ---

info "Writing .env"
umask 077
tmp_env="$(mktemp "$REPO_ROOT/.env.XXXXXX")"
trap 'rm -f "$tmp_env"' EXIT
cat >"$tmp_env" <<EOF
# Generated by setup.sh on $(date -Iseconds).
# Secrets live here and nowhere else. Do not commit this file.

# --- Postgres ---
DB_NAME=$db_name
DB_USER=$db_user
DB_PASSWORD=$db_pass

# --- Auth ---
JWT_KEY=$jwt_key

# --- AI receipt parsing (LiteLLM -> Gemini) ---
LLM_MODEL=$llm_model
GEMINI_API_KEY=$gemini_key

# --- Web ---
WEB_PORT=$web_port

# --- Web Push (VAPID) ---
VAPID_PRIVATE_KEY=$vapid_priv
VAPID_PUBLIC_KEY=$vapid_pub
VAPID_SUBJECT=$vapid_subject
EOF
mv "$tmp_env" "$ENV_FILE"
trap - EXIT
chmod 600 "$ENV_FILE"

info "Configuration written to .env (mode 600). Secrets were not printed."

# -------------------------------------------------------------- start stack ---

if port_in_use "$web_port" && [[ "$(docker compose ps -q --status running web 2>/dev/null)" == "" ]]; then
  warn "Port $web_port is already in use — web may fail to bind"
fi

info "Building and starting containers"
docker compose up -d --build --remove-orphans

wait_healthy() {
  local service="$1" timeout="${2:-240}" start elapsed state
  start=$SECONDS
  while :; do
    state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      "$(docker compose ps -q "$service" 2>/dev/null)" 2>/dev/null || echo missing)"
    case "$state" in
      healthy|running) return 0 ;;
      unhealthy|exited) return 1 ;;
    esac
    elapsed=$((SECONDS - start))
    if (( elapsed > timeout )); then
      return 1
    fi
    sleep 3
  done
}

info "Waiting for the database"
wait_healthy db 120 || die "database did not become healthy; check 'docker compose logs db'"

info "Waiting for the api"
wait_healthy api 180 || die "api did not become healthy; check 'docker compose logs api'"

# ------------------------------------------------------------------- schema ---

info "Applying schema.sql (idempotent)"
docker compose exec -T api python init_db.py

# ------------------------------------------------------------------ summary ---

lan_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
[[ -n "$lan_ip" ]] || lan_ip="<server-lan-ip>"

cat <<EOF

HomeTracker is up.

  UI            http://${lan_ip}:${web_port}
Next steps:
  1. Create the first account in the UI — registration is open by default.
EOF

if [[ $gemini_configured -eq 1 ]]; then
  printf '  2. Receipt parsing is configured (Gemini key present).\n'
else
  cat <<EOF
  2. Receipt parsing is NOT configured. Uploads will fail until you add the key:
       edit .env, set GEMINI_API_KEY
       docker compose up -d api
EOF
fi

cat <<EOF

Schema rebuild (destroys all HomeTracker data):
  docker compose exec api python init_db.py --reset
EOF
