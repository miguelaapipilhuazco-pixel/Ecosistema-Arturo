# Arturo Ecosystem - Infra Stack

This directory implements a practical end-to-end baseline for your requested stack using Docker Compose and Kubernetes manifests.

## Implemented Stack Mapping

| Area | Technology | Status in this repo |
| --- | --- | --- |
| Operating System | Debian | Deployment target for nodes |
| Desktop Client | Rust + Tauri | Client layer planned in platform folders |
| Mobile App | Flutter | Client layer planned in platform folders |
| Backend | Rust + FastAPI | Implemented services and gateway routes |
| Distributed Storage | Ceph | Implemented Kubernetes path with Rook manifests |
| Object Storage | MinIO | Implemented in docker-compose |
| Database | PostgreSQL | Implemented in docker-compose |
| Cache | Redis | Implemented in docker-compose |
| Sync | Syncthing | Implemented in docker-compose |
| Containers | Docker | Implemented with docker-compose |
| Orchestration | Kubernetes | Implemented manifests and deployment scripts |
| Messaging | Apache Kafka | Implemented in docker-compose |
| Search | OpenSearch | Implemented in docker-compose |
| AI | Ollama + vLLM | Implemented in docker-compose (vLLM under `gpu` profile) |
| Monitoring | Prometheus + Grafana | Implemented with provisioning |
| Web Server | Nginx | Implemented gateway config |
| XR | OpenXR | Engine/runtime integration planned at client layer |
| 3D Engine | Godot Engine | Runtime integration planned at client layer |

## Files

- `docker-compose.yml`: core infrastructure stack.
- `nginx/nginx.conf`: API gateway for Rust/FastAPI routes.
- `prometheus/prometheus.yml`: scraping config.
- `grafana/provisioning/datasources/datasource.yml`: auto datasource.
- `backend-fastapi/app/main.py`: FastAPI service + `/metrics` + `/infra/status`.
- `backend-rust/src/main.rs`: Rust Axum health service.
- `k8s/`: Kubernetes baseline for gateway, backends, data, AI and observability.
- `k8s/storage/ceph-rook/`: Ceph integration path with Rook.
- `scripts/`: helper scripts for compose and Kubernetes operations.

## Quick Start

Prerequisite: Docker Desktop (or Docker Engine) must be running.

From this folder:

```bash
docker compose up -d
```

Services:

- Nginx: <http://localhost/>
- FastAPI: <http://localhost:8000/health>
- FastAPI stack status: <http://localhost:8000/infra/status>
- Rust: <http://localhost:8080/health>
- Grafana: <http://localhost:3001>
- Prometheus: <http://localhost:9090>
- MinIO Console: <http://localhost:9001>
- OpenSearch API: <http://localhost:9200>
- Ollama API: <http://localhost:11434>

Model C API:

- Model C status: <http://localhost:8000/capacity/model-c>
- Simulate usage and autoscale: `POST /capacity/model-c/simulate`
- Force evaluate threshold: `POST /capacity/model-c/evaluate`
- Evaluate with live telemetry (Prometheus/OpenSearch): `POST /capacity/model-c/evaluate-live`
- Dynamic account allocation (max 1 PB): `POST /capacity/accounts/{account_id}/allocate`

Run vLLM profile when you have GPU runtime:

```bash
docker compose --profile gpu up -d vllm
```

On Windows you can use:

```powershell
.\scripts\up.ps1
```

## Kubernetes Baseline

Apply baseline manifests:

```powershell
.\scripts\k8s-apply.ps1
```

Delete workloads:

```powershell
.\scripts\k8s-delete.ps1
```

Ceph path with Rook is documented in:

- `k8s/storage/ceph-rook/README.md`

## Notes

- This is a development baseline, not a hardened production cluster.
- Replace default passwords and move secrets to Vault or external secret manager.
- For production, add TLS everywhere, persistent volumes, backup policies, RBAC hardening, autoscaling, and network policies.

## Model C Expansion Logic

- Threshold: when cluster usage reaches 80% occupancy.
- Action: adds 20 servers automatically.
- Capacity model: each account can be allocated up to 1 PB (1024 TB), assigned dynamically based on real usage.
- Objective: continuous growth with service availability as demand increases.

### Live telemetry sources

- Primary source: Prometheus query `arturo_storage_occupancy_percent`
- Fallback source: OpenSearch `_cluster/stats` using `OPENSEARCH_CAPACITY_TB`
- Kafka signal: ingestion rate from Prometheus query `sum(rate(kafka_server_brokertopicmetrics_messagesin_total[5m]))`

Environment variables for live evaluation:

- `PROMETHEUS_HOST` (default: `prometheus`)
- `PROMETHEUS_PORT` (default: `9090`)
- `PROMETHEUS_OCCUPANCY_QUERY` (default: `arturo_storage_occupancy_percent`)
- `OPENSEARCH_CAPACITY_TB` (default: `1000`)
