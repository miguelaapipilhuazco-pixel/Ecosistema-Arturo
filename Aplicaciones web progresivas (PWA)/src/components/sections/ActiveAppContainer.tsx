import React, { useState, useEffect } from 'react';
import { Globe, X, ExternalLink, Terminal, Cpu, HardDrive, Square, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChatOllama from './ChatOllama';

interface ActiveAppContainerProps {
  app: any;
  onExit: () => void;
  visible: boolean;
}

export default function ActiveAppContainer({ app, onExit, visible }: ActiveAppContainerProps) {
  const { t } = useTranslation();
  const [urlNavegador, setUrlNavegador] = useState("");
  const [valorEntrada, setValorEntrada] = useState("");

  const resolverDestino = (entrada: string) => {
    const texto = entrada.trim();
    if (!texto) return 'https://html.duckduckgo.com/html/';

    if (texto.startsWith('http://') || texto.startsWith('https://')) {
      return texto;
    }

    const pareceDominio = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(texto);
    const contieneEspacios = /\s/.test(texto);

    if (pareceDominio && !contieneEspacios) {
      return `https://${texto}`;
    }

    return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(texto)}`;
  };

  useEffect(() => {
    if (app) {
      const urlDefecto = app.url || 'https://www.wikipedia.org';
      setUrlNavegador(urlDefecto);
      setValorEntrada(urlDefecto);
    }
  }, [app]);

  if (!app) return null;

  if (app.launchType === 'console-monitor') {
    return (
      <div className={visible ? 'flex' : 'hidden'}>
        <ConsoleMonitor app={app} onExit={onExit} />
      </div>
    );
  }

  if (app.launchType === 'chat' || app.title === 'Ollama Local') {
    return (
      <div className={visible ? 'flex' : 'hidden'}>
        <ChatOllama onExit={onExit} />
      </div>
    );
  }

  const IconoApp = app.logo;

  return (
    <div
      className={`fixed inset-x-0 top-14 bottom-20 lg:inset-y-0 lg:left-64 lg:right-0 z-[9999] bg-background flex-col animate-in fade-in zoom-in-95 duration-200 border-l border-border/50 shadow-2xl ${visible ? 'flex' : 'hidden'}`}
    >
       <div className="flex items-center gap-4 p-3 border-b border-border bg-card backdrop-blur-xl">
         <div className="flex items-center gap-3 pl-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_10px_var(--glow)]">
              <IconoApp />
            </div>
             <span className="font-display text-xs sm:text-sm tracking-widest uppercase truncate">{app.title}</span>
         </div>
         <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2">
           <div className="flex-1 flex items-center gap-3 bg-muted/40 dark:bg-black-accent px-4 py-2 rounded-xl border border-border focus-within:border-primary/50 transition-all">
             <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
             <input 
               type="text" 
               value={valorEntrada}
               placeholder="https://sitio-web"
               title="URL de navegación"
               onChange={(e) => setValorEntrada(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   const url = resolverDestino(valorEntrada);
                   setUrlNavegador(url);
                   setValorEntrada(url);
                 }
               }}
               className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground min-w-0"
             />
           </div>
           <button
             onClick={() => window.open(urlNavegador, '_blank', 'noopener,noreferrer')}
             className="p-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:text-primary transition-all shrink-0"
             title="Abrir en pestaña nueva"
           >
             <ExternalLink className="w-4 h-4" />
           </button>
         </div>
          <button 
            onClick={onExit} 
            className="group flex items-center gap-2 p-2 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all rounded-xl mr-2 shrink-0"
          >
             <span className="text-[10px] font-mono uppercase tracking-widest hidden md:inline-block">{t('Cerrar')}</span>
             <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
       </div>
       <div className="flex-1 w-full bg-white relative overflow-hidden">
         <iframe 
           src={`/api/proxy?url=${encodeURIComponent(urlNavegador)}`} 
           className="w-full h-full border-none" 
           sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
           title="Visualizador de Aplicación"
         />
       </div>
    </div>
  );
}

function ConsoleMonitor({ app, onExit }: { app: any; onExit: () => void }) {
  const [cpu, setCpu] = useState(15);
  const [ram, setRam] = useState(1.4);
  const [logs, setLogs] = useState<string[]>([]);
  const IconoApp = app.logo || Terminal;

  useEffect(() => {
    setLogs([
      `[${new Date().toLocaleTimeString()}] [SYSTEM] PREPARANDO ENTORNO RUNTIME...`,
      `[${new Date().toLocaleTimeString()}] [SYSTEM] ASIGNANDO PUERTOS Y RECURSOS DE MAQUINA VIRTUAL`,
      `[${new Date().toLocaleTimeString()}] [RUNTIME] LOCALIZANDO ARCHIVO DE ENTRADA: ${app.path || 'SISTEMA_LOCAL'}`,
      `[${new Date().toLocaleTimeString()}] [RUNTIME] INICIANDO PROCESO EN SEGUNDO PLANO...`,
      `[${new Date().toLocaleTimeString()}] [HOST] PROCESO EN EJECUCIÓN (PID: ${Math.floor(Math.random() * 9000) + 1000})`,
      `[${new Date().toLocaleTimeString()}] [INFO] CAPTURANDO SALIDA DE CONSOLA DEL PROCESO ACTIVO...`
    ]);

    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 35) + 10);
      setRam(parseFloat((Math.random() * 0.8 + 1.2).toFixed(2)));

      const eventos = [
        "Sincronizando hilos de procesamiento...",
        "Esperando eventos de E/S locales...",
        "Monitor de compatibilidad v2.5 estable.",
        "Optimizando consumo de recursos nativos...",
        "Conexión con el bus Kafka verificada.",
        "Capturando microsegundos de respuesta..."
      ];
      const logAleatorio = eventos[Math.floor(Math.random() * eventos.length)];
      setLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] [INFO] ${logAleatorio}`]);
    }, 3000);

    return () => clearInterval(interval);
  }, [app]);

  return (
    <div className="fixed inset-x-0 top-14 bottom-20 lg:inset-y-0 lg:left-64 lg:right-0 z-[9999] bg-background flex flex-col border-l border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary animate-pulse">
            <IconoApp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-xs tracking-widest uppercase">{app.title}</h3>
            <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider truncate max-w-xs sm:max-w-md">{app.path || 'Proceso del Sistema'}</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 p-2 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all rounded-xl"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">Cerrar Monitor</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
        <div className="md:col-span-1 bg-card/40 border border-border p-5 rounded-2xl flex flex-col gap-6 backdrop-blur-md">
          <h4 className="font-display text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">Hardware Monitor</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
              <span>Uso de CPU</span>
              <span className="text-primary font-bold">{cpu}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${cpu}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
              <span>Memoria Asignada</span>
              <span className="text-secondary font-bold">{ram} GB</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${(ram / 4) * 100}%` }} />
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              <p className="font-bold">Proceso Activo</p>
              <p className="text-[7.5px] text-muted-foreground">Monitoreo en tiempo real</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-black border border-border p-5 rounded-2xl flex flex-col h-[300px] md:h-full relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">stdout_output</span>
          </div>
          <div className="flex-1 font-mono text-[9px] text-emerald-400 space-y-1.5 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-muted">
            {logs.map((log, index) => (
              <div key={index} className="truncate select-text text-left">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
