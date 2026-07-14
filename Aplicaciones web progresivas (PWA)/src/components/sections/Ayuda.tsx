import { motion } from 'motion/react';
import { BookOpen, PlayCircle, HelpCircle, ActivitySquare, MessageSquare, AlertTriangle, LogOut, Compass, Library, ShieldCheck, Scale, FileText, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Ayuda({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();

  const opciones = [
    { title: t("Manual del usuario"), icon: BookOpen },
    { title: t("Primeros pasos"), icon: Compass },
    { title: t("Tutoriales"), icon: PlayCircle },
    { title: t("Preguntas frecuentes"), icon: HelpCircle },
    { title: t("Centro de aprendizaje"), icon: Library },
    { title: t("Diagnóstico automático"), icon: ActivitySquare },
    { title: t("Reportar errores"), icon: AlertTriangle },
    { title: t("Contactar soporte"), icon: MessageSquare },
    { title: t("Estado del servicio"), icon: ShieldCheck },
    { title: t("Información legal"), icon: Scale },
    { title: t("Licencias"), icon: FileText },
    { title: t("Acerca del Ecosistema"), icon: Info },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16"
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">{t('AYUDA')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-1 font-mono opacity-60">{t('SOPORTE Y DOCUMENTACIÓN')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {opciones.map((opt, i) => (
          <button 
             key={i} 
             className="ecosystem-card p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden text-left w-full"
          >
            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                {opt.title}
              </h3>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                {t("CONSULTAR")}
              </p>
            </div>
            <opt.icon className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
