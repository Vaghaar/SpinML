#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  SpinMyLunch — Script de build & déploiement Linux/Mac
#  Usage : ./build.sh [--skip-backend] [--skip-frontend] [--restart] [-d]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SKIP_BACKEND=false
SKIP_FRONTEND=false
RESTART=false
DETACH=false

for arg in "$@"; do
  case $arg in
    --skip-backend)  SKIP_BACKEND=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --restart)       RESTART=true ;;
    -d)              DETACH=true ;;
  esac
done

step() { echo -e "\n\033[36m▶ $1\033[0m"; }
ok()   { echo -e "  \033[32m✓ $1\033[0m"; }
fail() { echo -e "  \033[31m✗ $1\033[0m"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── 1. Chargement du .env ───────────────────────────────────────────────────
step "Chargement du .env"
ENV_FILE="$SCRIPT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  fail ".env introuvable. Copiez .env.example vers .env et remplissez les valeurs."
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
ok "Variables d'environnement chargées"

# ─── 2. Validation ───────────────────────────────────────────────────────────
step "Validation de la configuration"
for var in JWT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET POSTGRES_PASSWORD REDIS_PASSWORD; do
  [[ -z "${!var:-}" ]] && fail "Variable manquante dans .env : $var"
done
ok "Configuration valide"

# ─── 3. Build backend ────────────────────────────────────────────────────────
if [[ "$SKIP_BACKEND" == false ]]; then
  step "Build backend Spring Boot (Maven)"
  cd "$SCRIPT_DIR/backend"
  mvn package -Dmaven.test.skip=true -B -q
  ok "JAR généré : backend/target/spinmylunch-backend-0.1.0-SNAPSHOT.jar"
  cd "$SCRIPT_DIR"
fi

# ─── 4. Build frontend ───────────────────────────────────────────────────────
if [[ "$SKIP_FRONTEND" == false ]]; then
  step "Build frontend Next.js"
  cd "$SCRIPT_DIR/frontend"
  export NEXT_TELEMETRY_DISABLED=1
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8080}"
  export NEXT_PUBLIC_WS_URL="${NEXT_PUBLIC_WS_URL:-ws://localhost:8080}"
  export NEXT_PUBLIC_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
  npm run build
  ok "Standalone build généré : frontend/.next/standalone"
  cd "$SCRIPT_DIR"
fi

# ─── 5. Docker Compose ───────────────────────────────────────────────────────
step "Démarrage avec Docker Compose"
cd "$SCRIPT_DIR"
if [[ "$RESTART" == true ]]; then
  echo "  Arrêt des conteneurs existants..."
  docker compose down
fi
COMPOSE_ARGS="up --build"
[[ "$DETACH" == true ]] && COMPOSE_ARGS="$COMPOSE_ARGS -d"
# shellcheck disable=SC2086
docker compose $COMPOSE_ARGS

# ─── 6. Résumé ───────────────────────────────────────────────────────────────
echo -e "\n\033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[32mSpinMyLunch est opérationnel !\033[0m"
echo    "  Frontend  → http://localhost:3000"
echo    "  API       → http://localhost:8080/api/v1"
echo    "  Health    → http://localhost:8080/actuator/health"
echo -e "\033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
