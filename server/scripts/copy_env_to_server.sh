#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/copy_env_to_server.sh <server_user>@<host> <deploy_dir>
# Example: ./scripts/copy_env_to_server.sh deploy@1.2.3.4 /opt/lecolier

REMOTE=${1:?server}
DEPLOY_DIR=${2:-/opt/lecolier}

if [ ! -f .env ]; then
  echo "Local .env not found. Create it from .env.prod.example and fill secrets first."
  exit 1
fi

echo "Copying .env to ${REMOTE}:${DEPLOY_DIR}/.env"
scp -o StrictHostKeyChecking=no .env ${REMOTE}:${DEPLOY_DIR}/.env

echo "Restarting docker compose on remote host"
ssh -o StrictHostKeyChecking=no ${REMOTE} "cd ${DEPLOY_DIR} && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --remove-orphans"

echo "Done."
