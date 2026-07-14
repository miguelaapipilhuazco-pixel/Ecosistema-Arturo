export interface TechStackItem {
  area: string;
  tech: string;
  category: 'OS' | 'Client' | 'Backend' | 'Storage' | 'Database' | 'DevOps' | 'AI' | 'Monitoring' | 'Graphics' | 'Network';
}

/**
 * Global Ecosystem - Official Technical Stack
 * This defines the architecture used by the system core.
 */
export const SYSTEM_STACK: TechStackItem[] = [
  { area: "Sistema Operativo", tech: "Debian", category: "OS" },
  { area: "Cliente de escritorio", tech: "Rust + Tauri", category: "Client" },
  { area: "Aplicación móvil", tech: "Flutter", category: "Client" },
  { area: "Backend", tech: "Rust + FastAPI", category: "Backend" },
  { area: "Almacenamiento distribuido", tech: "Ceph", category: "Storage" },
  { area: "Almacenamiento de objetos", tech: "MinIO", category: "Storage" },
  { area: "Base de datos", tech: "PostgreSQL", category: "Database" },
  { area: "Caché", tech: "Redis", category: "Backend" },
  { area: "Sincronización", tech: "Syncthing", category: "Network" },
  { area: "Contenedores", tech: "Docker", category: "DevOps" },
  { area: "Orquestación", tech: "Kubernetes", category: "DevOps" },
  { area: "Mensajería", tech: "Apache Kafka", category: "Network" },
  { area: "Búsqueda", tech: "OpenSearch", category: "Backend" },
  { area: "IA", tech: "Ollama + vLLM", category: "AI" },
  { area: "Monitorización", tech: "Prometheus + Grafana", category: "Monitoring" },
  { area: "Servidor web", tech: "Nginx", category: "Backend" },
  { area: "XR", tech: "OpenXR", category: "Graphics" },
  { area: "Motor 3D", tech: "Godot Engine", category: "Graphics" },
];

/**
 * System capabilities based on the defined stack.
 */
export const SYSTEM_CAPABILITIES = {
  highPerformance: true,
  distributedStorage: true,
  aiNative: true,
  crossPlatform: true,
  realtimeSync: true
};
