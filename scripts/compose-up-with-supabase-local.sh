#!/usr/bin/env bash
# scripts/compose-up-with-supabase-local.sh
# Lance Supabase local, exporte les variables requises et démarre Docker Compose.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI est requise. Installation: https://supabase.com/docs/guides/cli"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker est requis et doit être disponible dans le PATH."
  exit 1
fi

cd "$REPO_ROOT"

echo "[compose-helper] Démarrage de Supabase local..."
supabase start

echo "[compose-helper] Lecture des variables Supabase..."
status_env="$(supabase status -o env)"

extract_env_value() {
  local key="$1"
  echo "$status_env" | sed -n "s/^${key}=//p" | tail -n 1
}

supabase_url="$(extract_env_value API_URL)"
supabase_publishable_key="$(extract_env_value ANON_KEY)"
supabase_secret_key="$(extract_env_value SERVICE_ROLE_KEY)"

if [[ -z "$supabase_url" || -z "$supabase_publishable_key" || -z "$supabase_secret_key" ]]; then
  echo "Impossible de lire API_URL, ANON_KEY et SERVICE_ROLE_KEY depuis 'supabase status -o env'."
  exit 1
fi

# Docker Desktop expose l’hôte via host.docker.internal depuis les conteneurs.
container_supabase_url="${supabase_url/127.0.0.1/host.docker.internal}"
container_supabase_url="${container_supabase_url/localhost/host.docker.internal}"

export SUPABASE_URL="$container_supabase_url"
export SUPABASE_SECRET_KEY="$supabase_secret_key"
export SUPABASE_PUBLISHABLE_KEY="$supabase_publishable_key"
export CLIENT_SUPABASE_URL="$SUPABASE_URL"
export CLIENT_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY"
export CLIENT_API_BASE_URL="http://api:3000"

echo "[compose-helper] Variables exportées. Lancement de Docker Compose..."
docker compose -f compose.local.yml up --build "$@"
