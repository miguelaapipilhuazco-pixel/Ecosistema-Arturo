$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

kubectl delete -f .\k8s\apps\observability.yaml --ignore-not-found
kubectl delete -f .\k8s\apps\stream-search-ai.yaml --ignore-not-found
kubectl delete -f .\k8s\apps\data-services.yaml --ignore-not-found
kubectl delete -f .\k8s\apps\nginx.yaml --ignore-not-found
kubectl delete -f .\k8s\apps\backend-rust.yaml --ignore-not-found
kubectl delete -f .\k8s\apps\backend-fastapi.yaml --ignore-not-found
kubectl delete -f .\k8s\base\configmap-nginx.yaml --ignore-not-found
kubectl delete -f .\k8s\base\secrets-example.yaml --ignore-not-found

Write-Host "[Arturo] Kubernetes workloads removed." -ForegroundColor Yellow
