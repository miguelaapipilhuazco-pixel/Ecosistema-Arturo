import os
from datetime import datetime, timezone
from typing import Any

import httpx
import redis
from fastapi import FastAPI
from pydantic import BaseModel, Field
from prometheus_fastapi_instrumentator import Instrumentator
from psycopg import connect

app = FastAPI(title="Arturo FastAPI Service", version="0.1.0")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "arturo")
POSTGRES_USER = os.getenv("POSTGRES_USER", "arturo")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "arturo_dev_password")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

MINIO_HOST = os.getenv("MINIO_HOST", "minio")
MINIO_PORT = int(os.getenv("MINIO_PORT", "9000"))

KAFKA_HOST = os.getenv("KAFKA_HOST", "kafka")
KAFKA_PORT = int(os.getenv("KAFKA_PORT", "9092"))

OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "opensearch")
OPENSEARCH_PORT = int(os.getenv("OPENSEARCH_PORT", "9200"))

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "ollama")
OLLAMA_PORT = int(os.getenv("OLLAMA_PORT", "11434"))

VLLM_HOST = os.getenv("VLLM_HOST", "vllm")
VLLM_PORT = int(os.getenv("VLLM_PORT", "8001"))

SYNCTHING_HOST = os.getenv("SYNCTHING_HOST", "syncthing")
SYNCTHING_PORT = int(os.getenv("SYNCTHING_PORT", "8384"))

PROMETHEUS_HOST = os.getenv("PROMETHEUS_HOST", "prometheus")
PROMETHEUS_PORT = int(os.getenv("PROMETHEUS_PORT", "9090"))
PROMETHEUS_OCCUPANCY_QUERY = os.getenv("PROMETHEUS_OCCUPANCY_QUERY", "arturo_storage_occupancy_percent")

OPENSEARCH_CAPACITY_TB = float(os.getenv("OPENSEARCH_CAPACITY_TB", "1000"))
TB_IN_BYTES = 1024**4


class CapacitySimulationRequest(BaseModel):
    used_capacity_tb: float | None = Field(default=None, ge=0)
    consume_tb: float | None = Field(default=None, ge=0)


class AccountAllocationRequest(BaseModel):
    requested_tb: float = Field(gt=0)


MODEL_C_POLICY = {
    "name": "Modelo C - Expansion automatica",
    "threshold_percent": 80.0,
    "scale_batch_nodes": 20,
    "node_capacity_tb": 50.0,
    "max_account_capacity_tb": 1024.0,
    "institutional_statement": (
        "Cada cuenta dispone de una capacidad maxima de hasta 1 PB de almacenamiento, "
        "asignada dinamicamente conforme el usuario la utiliza. La infraestructura de "
        "Arturo Ecosystem se expande de manera continua para satisfacer la demanda y "
        "mantener la disponibilidad del servicio."
    ),
}

MODEL_C_STATE: dict[str, Any] = {
    "datacenter": "A",
    "node_count": 120,
    "total_capacity_tb": 6000.0,
    "used_capacity_tb": 2400.0,
    "allocations_tb": {},
    "events": [],
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _occupancy_percent() -> float:
    total = MODEL_C_STATE["total_capacity_tb"]
    if total <= 0:
        return 0.0
    return round((MODEL_C_STATE["used_capacity_tb"] / total) * 100, 2)


def _available_capacity_tb() -> float:
    return round(MODEL_C_STATE["total_capacity_tb"] - MODEL_C_STATE["used_capacity_tb"], 2)


def _record_event(kind: str, detail: str) -> None:
    MODEL_C_STATE["events"].insert(
        0,
        {
            "at": _now_iso(),
            "kind": kind,
            "detail": detail,
            "occupancy_percent": _occupancy_percent(),
            "total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
            "used_capacity_tb": MODEL_C_STATE["used_capacity_tb"],
        },
    )
    MODEL_C_STATE["events"] = MODEL_C_STATE["events"][:100]


def _expand_if_needed() -> dict[str, Any]:
    threshold = MODEL_C_POLICY["threshold_percent"]
    occupancy = _occupancy_percent()

    if occupancy < threshold:
        return {
            "expanded": False,
            "reason": "below-threshold",
            "occupancy_percent": occupancy,
        }

    nodes = MODEL_C_POLICY["scale_batch_nodes"]
    capacity_per_node = MODEL_C_POLICY["node_capacity_tb"]
    added_capacity = nodes * capacity_per_node

    MODEL_C_STATE["node_count"] += nodes
    MODEL_C_STATE["total_capacity_tb"] = round(MODEL_C_STATE["total_capacity_tb"] + added_capacity, 2)

    _record_event(
        "autoscale",
        f"Centro de datos {MODEL_C_STATE['datacenter']} supero {threshold}% y anadio {nodes} servidores (+{added_capacity} TB)",
    )

    return {
        "expanded": True,
        "reason": "threshold-reached",
        "added_nodes": nodes,
        "added_capacity_tb": added_capacity,
        "new_total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
        "new_occupancy_percent": _occupancy_percent(),
    }


def _expand_for_occupancy(live_occupancy_percent: float) -> dict[str, Any]:
    threshold = MODEL_C_POLICY["threshold_percent"]
    if live_occupancy_percent < threshold:
        return {
            "expanded": False,
            "reason": "below-threshold",
            "occupancy_percent": round(live_occupancy_percent, 2),
            "source": "live-telemetry",
        }

    nodes = MODEL_C_POLICY["scale_batch_nodes"]
    capacity_per_node = MODEL_C_POLICY["node_capacity_tb"]
    added_capacity = nodes * capacity_per_node

    MODEL_C_STATE["node_count"] += nodes
    MODEL_C_STATE["total_capacity_tb"] = round(MODEL_C_STATE["total_capacity_tb"] + added_capacity, 2)

    _record_event(
        "autoscale-live",
        f"Telemetria reporto {live_occupancy_percent:.2f}% y se anadieron {nodes} servidores (+{added_capacity} TB)",
    )

    return {
        "expanded": True,
        "reason": "threshold-reached",
        "source": "live-telemetry",
        "added_nodes": nodes,
        "added_capacity_tb": added_capacity,
        "new_total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
        "telemetry_occupancy_percent": round(live_occupancy_percent, 2),
    }


async def _fetch_prometheus_occupancy() -> dict[str, Any]:
    url = f"http://{PROMETHEUS_HOST}:{PROMETHEUS_PORT}/api/v1/query"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params={"query": PROMETHEUS_OCCUPANCY_QUERY})
            payload = resp.json()

        result = payload.get("data", {}).get("result", [])
        if not result:
            return {
                "status": "no-data",
                "source": "prometheus",
                "query": PROMETHEUS_OCCUPANCY_QUERY,
            }

        value = float(result[0]["value"][1])
        return {
            "status": "ok",
            "source": "prometheus",
            "query": PROMETHEUS_OCCUPANCY_QUERY,
            "occupancy_percent": round(value, 2),
        }
    except Exception as exc:
        return {
            "status": "error",
            "source": "prometheus",
            "query": PROMETHEUS_OCCUPANCY_QUERY,
            "error": str(exc),
        }


async def _fetch_opensearch_occupancy() -> dict[str, Any]:
    url = f"http://{OPENSEARCH_HOST}:{OPENSEARCH_PORT}/_cluster/stats"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            payload = resp.json()

        store_size_bytes = float(payload.get("indices", {}).get("store", {}).get("size_in_bytes", 0.0))
        if OPENSEARCH_CAPACITY_TB <= 0:
            return {
                "status": "error",
                "source": "opensearch",
                "error": "OPENSEARCH_CAPACITY_TB must be > 0",
            }

        capacity_bytes = OPENSEARCH_CAPACITY_TB * TB_IN_BYTES
        occupancy = (store_size_bytes / capacity_bytes) * 100.0
        return {
            "status": "ok",
            "source": "opensearch",
            "store_size_bytes": int(store_size_bytes),
            "capacity_tb": OPENSEARCH_CAPACITY_TB,
            "occupancy_percent": round(occupancy, 4),
        }
    except Exception as exc:
        return {
            "status": "error",
            "source": "opensearch",
            "error": str(exc),
        }


async def _fetch_kafka_ingestion() -> dict[str, Any]:
    query = "sum(rate(kafka_server_brokertopicmetrics_messagesin_total[5m]))"
    url = f"http://{PROMETHEUS_HOST}:{PROMETHEUS_PORT}/api/v1/query"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params={"query": query})
            payload = resp.json()

        result = payload.get("data", {}).get("result", [])
        if not result:
            return {
                "status": "no-data",
                "source": "kafka-prometheus",
                "query": query,
            }

        rate_per_sec = float(result[0]["value"][1])
        return {
            "status": "ok",
            "source": "kafka-prometheus",
            "query": query,
            "messages_per_sec": round(rate_per_sec, 4),
        }
    except Exception as exc:
        return {
            "status": "error",
            "source": "kafka-prometheus",
            "query": query,
            "error": str(exc),
        }


async def _fetch_live_capacity_telemetry() -> dict[str, Any]:
    prom = await _fetch_prometheus_occupancy()
    os_stats = await _fetch_opensearch_occupancy()
    kafka_ingest = await _fetch_kafka_ingestion()

    occupancy_percent = None
    selected_source = None

    if prom.get("status") == "ok":
        occupancy_percent = float(prom["occupancy_percent"])
        selected_source = "prometheus"
    elif os_stats.get("status") == "ok":
        occupancy_percent = float(os_stats["occupancy_percent"])
        selected_source = "opensearch"

    return {
        "occupancy_percent": occupancy_percent,
        "selected_source": selected_source,
        "prometheus": prom,
        "opensearch": os_stats,
        "kafka_ingestion": kafka_ingest,
    }


def probe_postgres() -> dict[str, Any]:
    try:
        with connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            connect_timeout=2,
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("select 1")
                cur.fetchone()
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def probe_redis() -> dict[str, Any]:
    try:
        client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_timeout=2)
        pong = client.ping()
        return {"status": "ok" if pong else "error"}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


async def probe_http(name: str, url: str) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(url)
            return {
                "status": "ok" if resp.status_code < 500 else "error",
                "http_status": resp.status_code,
                "service": name,
            }
    except Exception as exc:
        return {"status": "error", "service": name, "error": str(exc)}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "fastapi", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/stack")
def stack() -> dict[str, str]:
    return {
        "backend": "fastapi",
        "cache": "redis",
        "database": "postgresql",
        "search": "opensearch",
        "object_storage": "minio",
    }


@app.get("/capacity/model-c")
def capacity_model_c_status() -> dict[str, Any]:
    return {
        "policy": MODEL_C_POLICY,
        "state": {
            **MODEL_C_STATE,
            "occupancy_percent": _occupancy_percent(),
            "available_capacity_tb": _available_capacity_tb(),
        },
        "diagram": "Centro de datos A -> 80% ocupado -> Anadir 20 servidores -> Nueva capacidad disponible",
    }


@app.post("/capacity/model-c/simulate")
def capacity_model_c_simulate(payload: CapacitySimulationRequest) -> dict[str, Any]:
    if payload.used_capacity_tb is not None:
        MODEL_C_STATE["used_capacity_tb"] = round(payload.used_capacity_tb, 2)

    if payload.consume_tb is not None:
        MODEL_C_STATE["used_capacity_tb"] = round(MODEL_C_STATE["used_capacity_tb"] + payload.consume_tb, 2)

    if MODEL_C_STATE["used_capacity_tb"] > MODEL_C_STATE["total_capacity_tb"]:
        MODEL_C_STATE["used_capacity_tb"] = MODEL_C_STATE["total_capacity_tb"]

    _record_event("usage-update", "Actualizacion de uso de almacenamiento")
    expansion = _expand_if_needed()

    return {
        "state": {
            "used_capacity_tb": MODEL_C_STATE["used_capacity_tb"],
            "total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
            "occupancy_percent": _occupancy_percent(),
            "available_capacity_tb": _available_capacity_tb(),
            "node_count": MODEL_C_STATE["node_count"],
        },
        "expansion": expansion,
    }


@app.post("/capacity/model-c/evaluate")
def capacity_model_c_evaluate() -> dict[str, Any]:
    expansion = _expand_if_needed()
    return {
        "expansion": expansion,
        "state": {
            "occupancy_percent": _occupancy_percent(),
            "node_count": MODEL_C_STATE["node_count"],
            "total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
        },
    }


@app.post("/capacity/model-c/evaluate-live")
async def capacity_model_c_evaluate_live() -> dict[str, Any]:
    telemetry = await _fetch_live_capacity_telemetry()

    if telemetry["occupancy_percent"] is None:
        return {
            "status": "no-live-occupancy",
            "message": "No live occupancy metric available. Configure Prometheus metric or OpenSearch capacity.",
            "telemetry": telemetry,
            "state": {
                "occupancy_percent_simulated": _occupancy_percent(),
                "node_count": MODEL_C_STATE["node_count"],
                "total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
            },
        }

    expansion = _expand_for_occupancy(float(telemetry["occupancy_percent"]))
    return {
        "status": "ok",
        "expansion": expansion,
        "telemetry": telemetry,
        "state": {
            "node_count": MODEL_C_STATE["node_count"],
            "total_capacity_tb": MODEL_C_STATE["total_capacity_tb"],
            "simulated_used_capacity_tb": MODEL_C_STATE["used_capacity_tb"],
        },
    }


@app.post("/capacity/accounts/{account_id}/allocate")
def allocate_account_capacity(account_id: str, payload: AccountAllocationRequest) -> dict[str, Any]:
    requested = min(payload.requested_tb, MODEL_C_POLICY["max_account_capacity_tb"])
    available = _available_capacity_tb()

    granted = min(requested, available)
    allocations = MODEL_C_STATE["allocations_tb"]
    current = float(allocations.get(account_id, 0.0))
    allocations[account_id] = round(current + granted, 2)

    MODEL_C_STATE["used_capacity_tb"] = round(MODEL_C_STATE["used_capacity_tb"] + granted, 2)
    _record_event("account-allocation", f"Cuenta {account_id} recibio {granted} TB")
    expansion = _expand_if_needed()

    return {
        "account_id": account_id,
        "requested_tb": payload.requested_tb,
        "capped_request_tb": requested,
        "granted_tb": granted,
        "max_per_account_tb": MODEL_C_POLICY["max_account_capacity_tb"],
        "state": {
            "account_total_tb": allocations[account_id],
            "cluster_occupancy_percent": _occupancy_percent(),
            "cluster_available_tb": _available_capacity_tb(),
        },
        "expansion": expansion,
    }


@app.get("/infra/status")
async def infra_status() -> dict[str, Any]:
    postgres = probe_postgres()
    redis_state = probe_redis()

    minio = await probe_http("minio", f"http://{MINIO_HOST}:{MINIO_PORT}/minio/health/live")
    opensearch = await probe_http("opensearch", f"http://{OPENSEARCH_HOST}:{OPENSEARCH_PORT}")
    ollama = await probe_http("ollama", f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/tags")
    vllm = await probe_http("vllm", f"http://{VLLM_HOST}:{VLLM_PORT}/v1/models")
    syncthing = await probe_http("syncthing", f"http://{SYNCTHING_HOST}:{SYNCTHING_PORT}")

    kafka = {
        "status": "ok",
        "bootstrap": f"{KAFKA_HOST}:{KAFKA_PORT}",
        "note": "Network-level availability assumed in this base endpoint",
    }

    checks = {
        "postgres": postgres,
        "redis": redis_state,
        "minio": minio,
        "kafka": kafka,
        "opensearch": opensearch,
        "ollama": ollama,
        "vllm": vllm,
        "syncthing": syncthing,
    }

    overall = "ok" if all(v.get("status") == "ok" for v in checks.values()) else "degraded"
    return {
        "overall": overall,
        "checks": checks,
    }


Instrumentator().instrument(app).expose(app)
