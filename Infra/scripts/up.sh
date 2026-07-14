#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
echo "[Arturo] Starting infrastructure stack..."
docker compose up -d

echo "[Arturo] Core endpoints:"
echo "- Nginx: http://localhost/"
echo "- FastAPI health: http://localhost:8000/health"
echo "- FastAPI infra status: http://localhost:8000/infra/status"
echo "- Rust health: http://localhost:8080/health"
echo "- Grafana: http://localhost:3001"
echo "- Prometheus: http://localhost:9090"
