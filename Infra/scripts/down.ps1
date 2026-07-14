$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "[Arturo] Stopping infrastructure stack..." -ForegroundColor Yellow

docker compose down
