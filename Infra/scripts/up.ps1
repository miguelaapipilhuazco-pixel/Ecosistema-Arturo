$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "[Arturo] Starting infrastructure stack..." -ForegroundColor Cyan

docker compose up -d

Write-Host "[Arturo] Core endpoints:" -ForegroundColor Green
Write-Host "- Nginx: http://localhost/"
Write-Host "- FastAPI health: http://localhost:8000/health"
Write-Host "- FastAPI infra status: http://localhost:8000/infra/status"
Write-Host "- Rust health: http://localhost:8080/health"
Write-Host "- Grafana: http://localhost:3001"
Write-Host "- Prometheus: http://localhost:9090"
