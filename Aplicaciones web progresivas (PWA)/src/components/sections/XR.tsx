import { motion } from 'motion/react';
import { Library, Monitor, Layout, MonitorSmartphone, Users, Box, ChevronRight, ArrowLeft } from 'lucide-react';

export default function XR({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const opciones = [
    { title: "Biblioteca VR", icon: Library },
    { title: "Pantallas", icon: Monitor },
    { title: "Espacios", icon: Layout },
    { title: "Escritorios", icon: MonitorSmartphone },
    { title: "Salas", icon: Users },
    { title: "Objetos 3D", icon: Box },
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">XR</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em]">
            REALIDAD MIXTA
          </p>
        </div>
      </header>

      <div className="ecosystem-card p-8 sm:p-16 mb-6 sm:mb-10 border-primary/20 flex flex-col items-center justify-center text-center relative overflow-hidden bg-primary/5 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glow)_0%,transparent_100%)] opacity-20" />
        <div className="w-24 h-24 sm:w-36 sm:h-36 border border-primary/30 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative z-10 animate-[spin_30s_linear_infinite]">
           <div className="w-16 h-16 sm:w-28 sm:h-28 border border-primary/50 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
           <div className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full blur-[2px]" style={{ top: '10%' }} />
        </div>
        <div className="font-display text-xl sm:text-3xl uppercase tracking-[0.3em] text-foreground relative z-10 font-medium">Entorno Espacial Listo</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary mt-4 relative z-10 font-bold">CONECTE EL VISOR PARA ENTRAR</div>
      </div>

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
                Entorno XR para {opt.title.toLowerCase()}
              </p>
            </div>
            
            
          </button>
        ))}
      </div>
    </motion.div>
  );
}
