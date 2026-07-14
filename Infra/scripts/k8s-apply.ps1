$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "[Arturo] Applying Kubernetes base resources..." -ForegroundColor Cyan
kubectl apply -f .\k8s\base\namespace.yaml
kubectl apply -f .\k8s\base\configmap-nginx.yaml
kubectl apply -f .\k8s\base\secrets-example.yaml

Write-Host "[Arturo] Applying app workloads..." -ForegroundColor Cyan
kubectl apply -f .\k8s\apps\backend-fastapi.yaml
kubectl apply -f .\k8s\apps\backend-rust.yaml
kubectl apply -f .\k8s\apps\nginx.yaml
kubectl apply -f .\k8s\apps\data-services.yaml
kubectl apply -f .\k8s\apps\stream-search-ai.yaml
kubectl apply -f .\k8s\apps\observability.yaml

Write-Host "[Arturo] Kubernetes baseline applied." -ForegroundColor Green
Write-Host "Tip: install Rook-Ceph using files under k8s/storage/ceph-rook."
