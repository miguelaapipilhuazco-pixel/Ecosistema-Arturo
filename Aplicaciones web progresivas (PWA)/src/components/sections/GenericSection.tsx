import { motion } from 'motion/react';

export default function GenericSection({ titulo, subtitulo }: { titulo: string, subtitulo: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <header className="pb-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{titulo}</h1>
        <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em] mt-1">
          {subtitulo}
        </p>
      </header>
      
      <div className="ecosystem-card p-8 min-h-[400px] flex items-center justify-center border-dashed">
         <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Módulo fuera de línea o restringido
         </div>
      </div>
    </motion.div>
  );
}
