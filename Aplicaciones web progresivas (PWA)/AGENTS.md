# Arturo Ecosystem - System Instructions

## Architecture & Technical Stack
The Arturo Ecosystem is built upon a specific high-performance stack. All logic and features must respect this architectural foundation:

| Area | Technology |
| :--- | :--- |
| **Sistema Operativo** | Debian |
| **Cliente de escritorio** | Rust + Tauri |
| **Aplicación móvil** | Flutter |
| **Backend** | Rust + FastAPI |
| **Almacenamiento distribuido** | Ceph |
| **Almacenamiento de objetos** | MinIO |
| **Base de datos** | PostgreSQL |
| **Caché** | Redis |
| **Sincronización** | Syncthing |
| **Contenedores** | Docker |
| **Orquestación** | Kubernetes |
| **Mensajería** | Apache Kafka |
| **Búsqueda** | OpenSearch |
| **IA** | Ollama + vLLM |
| **Monitorización** | Prometheus + Grafana |
| **Servidor web** | Nginx |
| **XR** | OpenXR |
| **Motor 3D** | Godot Engine |

## Development Principles
1. **Performance First**: Logic should be modeled after Rust's efficiency where possible.
2. **Distributed Logic**: Assume a distributed storage environment (Ceph/MinIO) for file operations.
3. **AI Core**: The system is AI-native, utilizing Ollama and vLLM for core intelligence tasks.
4. **Resiliency**: High availability via Kubernetes and Kafka for message passing.
