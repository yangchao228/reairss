#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-reairss-demo}"
CONTAINER_NAME="${CONTAINER_NAME:-reairss-demo}"
HOST_PORT="${HOST_PORT:-8000}"
DATA_DIR="${DATA_DIR:-/tmp/reairss-demo-data}"
FRESH=0
NO_BUILD=0

usage() {
  cat <<'EOF'
Usage: ./scripts/run_demo_backend.sh [--fresh] [--no-build]

Options:
  --fresh      Remove the existing SQLite file before starting.
  --no-build   Reuse the existing Docker image instead of rebuilding it.

Environment overrides:
  IMAGE_NAME       Docker image tag, default: reairss-demo
  CONTAINER_NAME   Docker container name, default: reairss-demo
  HOST_PORT        Host port mapped to container 8000, default: 8000
  DATA_DIR         Host data directory mounted to /data, default: /tmp/reairss-demo-data
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fresh)
      FRESH=1
      shift
      ;;
    --no-build)
      NO_BUILD=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

mkdir -p "$DATA_DIR"
if [[ "$FRESH" -eq 1 ]]; then
  rm -f "$DATA_DIR/app.db"
fi

if [[ "$NO_BUILD" -eq 0 ]]; then
  docker build -t "$IMAGE_NAME" "$ROOT_DIR"
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

exec docker run --rm --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:8000" \
  -e APP_DB_PATH=/data/app.db \
  -v "${DATA_DIR}:/data" \
  "$IMAGE_NAME"
