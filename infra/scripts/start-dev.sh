#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/infra/container/podman-compose.dev.yml"
ENV_FILE="${REPO_ROOT}/.env"
ENV_TEMPLATE="${REPO_ROOT}/.env.example"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"
  printf 'Created %s from %s\n' "${ENV_FILE}" "${ENV_TEMPLATE}"
fi

if command -v podman-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(podman-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}")
elif command -v podman >/dev/null 2>&1; then
  COMPOSE_CMD=(podman compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}")
else
  printf 'Podman is required but was not found in PATH.\n' >&2
  exit 1
fi

cd "${REPO_ROOT}"

"${COMPOSE_CMD[@]}" up -d
"${COMPOSE_CMD[@]}" ps
