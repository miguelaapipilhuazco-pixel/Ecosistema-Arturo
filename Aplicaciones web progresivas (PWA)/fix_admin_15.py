import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """function VistaDepuracion({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('DEPURACIÓN')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('HERRAMIENTAS DE DIAGNÓSTICO')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="ecosystem-card p-6 border-border/50">
            <header className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Caché del Sistema')}</h3>
                <div className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-[7px] font-bold uppercase">
                   ACTIVO
                </div>
             </header>
             <div className="space-y-4">
                <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                   <span>Hit Rate</span>
                   <span>94.2%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                   <div className="h-full bg-green-500" style={{ width: '94%' }} />
                </div>
             </div>
         </div>
         <div className="ecosystem-card p-6 border-border/50">
            <header className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Sincronización')}</h3>
                <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-[7px] font-bold uppercase">
                   OK
                </div>
             </header>
             <div className="space-y-2 text-[8px] font-mono opacity-50 uppercase">
                <p>Última Sync: Hace 12s</p>
                <p>Nodos: 4/4 Sincronizados</p>
                <p>Conflictos: 0</p>
             </div>
         </div>
      </div>
    </div>
  );
}

function VistaLogs({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('LOGS')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('REGISTRO DE EVENTOS DEL SISTEMA')}</p>
        </div>
      </header>
      <div className="ecosystem-card p-0 border-border/50 overflow-hidden">
        <div className="flex gap-1 border-b border-border/50 p-2 bg-muted/30">
          <div className="w-3 h-3 rounded-full bg-red-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /></div>
        </div>
        <div className="p-4 font-mono text-[9px] sm:text-[10px] h-[400px] overflow-y-auto space-y-2 bg-black/40 text-green-500/70">
          <p className="text-muted-foreground">=========================================</p>
          <p className="text-primary/70">SISTEMA DE LOGS INICIALIZADO - V 2.4.1</p>
          <p className="text-muted-foreground">=========================================</p>
          {[...Array(20)].map((_, i) => (
             <p key={i} className="opacity-80">
                <span className="text-blue-400">[{new Date(Date.now() - (20 - i) * 60000).toISOString().replace('T', ' ').substring(0, 19)}]</span>
                <span className="text-purple-400"> [INFO]</span>
                <span className="text-foreground/80"> {['Sistema de archivos montado correctamente.', 'Iniciando servicio de indexación...', 'Conexión a base de datos establecida.', 'Sincronización de nodos completada en 1.2s', 'Worker de background reiniciado.'][i % 5]}</span>
             </p>
          ))}
          <p className="text-yellow-400">[{new Date().toISOString().replace('T', ' ').substring(0, 19)}] [WARN] Latencia alta detectada en el nodo 3 (120ms)</p>
          <p className="animate-pulse">_</p>
        </div>
      </div>
    </div>
  );
}

export function AdminCenter() {
  const { t } = useLanguage();
  const [vistaActiva, setVistaActiva] = useState('dashboard');

  const Vistas: Record<string, React.ReactNode> = {
    'dashboard': <VistaDashboard t={t} />,
    'usuarios': <VistaUsuarios t={t} />,
    'almacenamiento': <VistaAlmacenamiento t={t} />,
    'servidores': <VistaServidores t={t} />,
    'ia': <VistaIA t={t} />,
    'seguridad': <VistaSeguridad t={t} />,
    'depuracion': <VistaDepuracion t={t} />,
    'red': <VistaRed t={t} />,
    'logs': <VistaLogs t={t} />
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row mt-12 md:mt-16">
      {/* Sidebar de navegación */}
      <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border/50 bg-muted/10">
        <div className="p-4 md:p-6 md:sticky top-16 md:h-[calc(100vh-4rem)] overflow-y-auto hidden-scrollbar">
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 md:mb-6">{t('Administración')}</h2>
           <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
             {elementosMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setVistaActiva(item.id)}
                  className={`
                    w-full text-left p-3 md:p-4 rounded-xl border flex flex-col gap-2 transition-all group shrink-0 w-32 md:w-auto
                    ${vistaActiva === item.id
                      ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)]'
                      : 'border-transparent hover:border-border/50 hover:bg-muted/50'}
                  `}
                >
                  <item.icono className={`w-5 h-5 ${vistaActiva === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                  <span className={`text-[10px] font-medium tracking-widest uppercase truncate ${vistaActiva === item.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {t(item.label)}
                  </span>
                </button>
             ))}
           </nav>
        </div>
      </aside>

      {/* Área de contenido */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto hidden-scrollbar min-h-[500px]">
        <div className="max-w-5xl mx-auto w-full animate-fade-in relative z-10">
           {Vistas[vistaActiva] || <VistaDashboard t={t} />}
        </div>
      </main>
    </div>
  );
}
"""

content = re.sub(r'function VistaDepuracion\(\{ t \}: \{ t: any \}\) \{.*', replacement, content, flags=re.DOTALL)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
