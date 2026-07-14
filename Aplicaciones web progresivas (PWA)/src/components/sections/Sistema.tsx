import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Server, 
  Terminal, 
  Smartphone, 
  Database, 
  HardDrive, 
  Cpu, 
  Cloud, 
  ShieldCheck, 
  LayoutGrid, 
  MessageSquare,
  Search,
  Bot,
  Activity,
  Globe,
  Glasses,
  Box,
  ArrowLeft
} from 'lucide-react';

export default function Sistema({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();

  const arquitectura = [
    { area: "Sistema Operativo", tech: "Debian", icon: Terminal },
    { area: "Cliente de escritorio", tech: "Rust + Tauri", icon: LayoutGrid },
    { area: "Aplicación móvil", tech: "Flutter", icon: Smartphone },
    { area: "Backend", tech: "Rust + FastAPI (Python para IA)", icon: Server },
    { area: "Almacenamiento distribuido", tech: "Ceph", icon: Cloud },
    { area: "Almacenamiento de objetos", tech: "MinIO", icon: HardDrive },
    { area: "Base de datos", tech: "PostgreSQL", icon: Database },
    { area: "Caché", tech: "Redis", icon: Cpu },
    { area: "Sincronización", tech: "Syncthing", icon: ShieldCheck },
    { area: "Contenedores", tech: "Docker", icon: Box },
    { area: "Orquestación", tech: "Kubernetes", icon: LayoutGrid },
    { area: "Mensajería", tech: "Apache Kafka", icon: MessageSquare },
    { area: "Búsqueda", tech: "OpenSearch", icon: Search },
    { area: "IA", tech: "Ollama + vLLM", icon: Bot },
    { area: "Monitorización", tech: "Prometheus + Grafana", icon: Activity },
    { area: "Servidor web", tech: "Nginx", icon: Globe },
    { area: "XR", tech: "OpenXR", icon: Glasses },
    { area: "Motor 3D", tech: "Godot Engine", icon: Box }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16 pb-12"
    >
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title={t("Volver")}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">{t("SISTEMA")}</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.8em] opacity-50">{t("ARQUITECTURA Y STACK TECNOLÓGICO")}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arquitectura.map((item, index) => (
          <div key={index} className="ecosystem-card p-3.5 flex items-center group bg-card/40 backdrop-blur-md border border-border/30 hover:border-primary/50 transition-all relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                {item.tech}
              </h3>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">
                {t(item.area)}
              </p>
            </div>
            
            
          </div>
        ))}
      </div>
    </motion.div>
  );
}
