import { motion } from 'motion/react';
import { Gamepad2, Film, Tv, FileText, Box, History, Settings2, Database, ChevronRight, ArrowLeft } from 'lucide-react';

export default function Streaming({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const opciones = [
    { title: "Juegos", icon: Gamepad2 },
    { title: "Películas", icon: Film },
    { title: "Programas", icon: Tv },
    { title: "Documentos", icon: FileText },
    { title: "Modelos", icon: Box },
    { title: "Historial", icon: History },
    { title: "Calidad", icon: Settings2 },
    { title: "Caché", icon: Database },
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">STREAMING</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em]">
            CONTENIDO BAJO DEMANDA
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {opciones.map((opt, i) => (
          <button 
            key={i} 
            className="ecosystem-card w-full p-3.5 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                {opt.title}
              </h3>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">
                Acceder a {opt.title.toLowerCase()}
              </p>
            </div>
            
            
          </button>
        ))}
      </div>
    </motion.div>
  );
}
