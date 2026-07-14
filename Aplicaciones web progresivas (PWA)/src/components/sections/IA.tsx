import { motion } from 'motion/react';
import { MessageSquare, FolderTree, Sparkles, Languages, FileText, ScanText, Settings, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function IA({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();
  const opciones = [
    { title: "Chat", icon: MessageSquare },
    { title: "Organización", icon: FolderTree },
    { title: "Automatizaciones", icon: Sparkles },
    { title: "Traducciones", icon: Languages },
    { title: "Resúmenes", icon: FileText },
    { title: "OCR", icon: ScanText },
    { title: "Reglas", icon: Settings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-12 pb-12"
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">{t("IA")}</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.8em] opacity-50">{t("ASISTENTE INTELIGENTE")}</p>
        </div>
      </header>

      <div className="ecosystem-card p-6 sm:p-10 mb-6 sm:mb-10 border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-6 bg-primary/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 sm:gap-8 relative z-10 w-full sm:w-auto">
          <div>
            <div className="font-display text-xl sm:text-2xl uppercase tracking-[0.2em] text-foreground mb-1">Núcleo Neural En Línea</div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/70 font-bold">LISTO PARA ENTRADA</div>
          </div>
        </div>
        
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
                Motor de IA para {opt.title.toLowerCase()}
              </p>
            </div>
            
            
          </button>
        ))}
      </div>
    </motion.div>
  );
}
