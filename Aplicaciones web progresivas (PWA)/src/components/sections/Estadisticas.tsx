import { motion } from 'motion/react';
import { Database, FileDigit, RefreshCw, Download, Globe, Bot, Activity, History, ArrowLeft } from 'lucide-react';

export default function Estadisticas({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const estadisticas = [
    { title: "Espacio usado", value: "4.2 TB", icon: Database },
    { title: "Espacio libre", value: "∞", icon: Database },
    { title: "Archivos", value: "1.2M", icon: FileDigit },
    { title: "Sincronizaciones", value: "4,209", icon: RefreshCw },
    { title: "Descargas", value: "89 GB", icon: Download },
    { title: "Streaming", value: "1.2 TB", icon: Globe },
    { title: "IA (Peticiones)", value: "14,502", icon: Bot },
    { title: "Actividad (Horas)", value: "3,201", icon: Activity },
    { title: "Historial (Eventos)", value: "2M+", icon: History },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">ESTADÍSTICAS</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em]">
            USO Y ACTIVIDAD
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {estadisticas.map((stat, i) => (
          <div key={i} className="ecosystem-card p-3.5 flex items-center gap-4 group bg-card/40 backdrop-blur-md relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[13px] text-primary">{stat.value}</h3>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">{stat.title}</p>
            </div>
            
            
          </div>
        ))}
      </div>
      
      <div className="ecosystem-card p-6 h-[200px] flex items-end justify-between border-b-primary/50 relative overflow-hidden">
         <div className="absolute top-6 left-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rendimiento de Red</div>
         {/* Fake Chart Bars */}
         {Array.from({ length: 40 }).map((_, i) => (
           <div 
             key={i} 
             className="w-full bg-primary/20 mx-0.5 hover:bg-primary transition-colors cursor-crosshair" 
             style={{ height: `${Math.random() * 100}%` }}
           />
         ))}
      </div>
    </motion.div>
  );
}
