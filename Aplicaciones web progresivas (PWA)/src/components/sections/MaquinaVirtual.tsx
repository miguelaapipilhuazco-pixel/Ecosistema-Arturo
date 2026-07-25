import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Terminal, 
  Monitor, 
  Bot, 
  Globe, 
  Smartphone, 
  Glasses, 
  X, 
  Maximize2, 
  Minimize2, 
  Folder,
  Code,
  Sparkles,
  Cpu,
  ChevronDown,
  Clock
} from 'lucide-react';
import ChatOllama from './ChatOllama';

interface Ventana {
  id: string;
  titulo: string;
  alias: string;
  url?: string;
  logo: React.ComponentType<any>;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  minimizada: boolean;
  maximizada: boolean;
  esChat?: boolean;
  agent?: 'ollama' | 'antigravity';
}

export default function MaquinaVirtual({ onLaunch }: { onLaunch: (app: any) => void; appActiva: any | null }) {
  const { t } = useTranslation();
  
  // OS.js State: Sin ventanas abiertas por defecto al inicio
  const [ventanas, setVentanas] = useState<Ventana[]>([]);
  const [zIndices, setZIndices] = useState<string[]>([]);
  const [menuAppsAbierto, setMenuAppsAbierto] = useState(false);
  const [horaFecha, setHoraFecha] = useState({ hora: '', fecha: '' });

  // Terminal Logs State
  const [logsSimulados, setLogsSimulados] = useState<string[]>([]);
  const [cmdInput, setCmdInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const bootIniciado = useRef(false);

  // Dragging states
  const [dragWindowId, setDragWindowId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Lista de Aplicaciones disponibles en el menú de OS.js
  const aplicacionesOSJS = [
    {
      alias: 'terminal',
      title: 'Terminal KVM',
      logo: Terminal,
      os: ['linux'],
      categoria: 'System',
      launchType: 'terminal'
    },
    {
      alias: 'brave',
      title: 'Brave Browser',
      logo: Globe,
      url: 'https://html.duckduckgo.com',
      categoria: 'Internet',
      launchType: 'web'
    },
    {
      alias: 'vscode',
      title: 'VS Code',
      logo: Code,
      url: 'https://github1s.com',
      categoria: 'Development',
      launchType: 'web'
    },
    {
      alias: 'antigravity',
      title: 'Antigravity AI',
      logo: Sparkles,
      esChat: true,
      agent: 'antigravity' as const,
      categoria: 'Office / AI',
      launchType: 'chat'
    },
    {
      alias: 'ollama',
      title: 'Ollama Local',
      logo: Cpu,
      esChat: true,
      agent: 'ollama' as const,
      categoria: 'System',
      launchType: 'chat'
    },
    {
      alias: 'wolvic',
      title: 'Wolvic VR',
      logo: Globe,
      url: 'https://wolvic.com',
      categoria: 'Internet',
      launchType: 'web'
    },
    {
      alias: 'playstore',
      title: 'Play Store',
      logo: Smartphone,
      url: 'https://play.google.com/store',
      categoria: 'System',
      launchType: 'web'
    }
  ];

  // Iniciar la secuencia de la terminal silenciosamente en segundo plano
  useEffect(() => {
    if (bootIniciado.current) return;
    bootIniciado.current = true;
    
    const runBoot = async () => {
      const bootSequence = [
        "OS.js v3.0 Core loading...",
        "Initializing QEMU open-source emulator v8.2.0...",
        "Virtual CPU: 4 Cores (x86_64 Emulated Host)",
        "Virtual RAM: 4096 MB allocation successful",
        "Mounting host storage over virtfs...",
        "Booting Linux KVM kernel 6.6.15-ecosystem-universal...",
        "Loading systemd initial RAM disk...",
        "Mounting overlay root filesystem [OK]",
        "Starting D-Bus message bus system [OK]",
        "Starting Docker Daemon container socket [OK]",
        "Waydroid service subsystem initialized [OK]",
        "Bridging virtual ethernet adapter (virbr0)...",
        "OS.js Core OS Environment [Open Source] v2.5.0-AR ready.",
        "Type 'help' or 'apps' to explore, and 'run <app_alias>' to execute."
      ];

      for (let i = 0; i < bootSequence.length; i++) {
        await new Promise(r => setTimeout(r, 50));
        setLogsSimulados(prev => [...prev, `[osjs] ${bootSequence[i]}`]);
      }
    };
    void runBoot();
  }, []);

  // Reloj digital para la barra de OS.js
  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date();
      setHoraFecha({
        hora: ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        fecha: ahora.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
      });
    };
    actualizarReloj();
    const intervalId = setInterval(actualizarReloj, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [logsSimulados]);

  const abrirVentana = (alias: string) => {
    setMenuAppsAbierto(false);

    if (ventanas.some(v => v.alias === alias)) {
      setZIndices(prev => [alias, ...prev.filter(id => id !== alias)]);
      setVentanas(prev => prev.map(v => v.alias === alias ? { ...v, minimizada: false } : v));
      return;
    }

    const meta = aplicacionesOSJS.find(a => a.alias === alias);
    if (!meta) return;

    const compensacion = (ventanas.length * 25) % 150;

    const nuevaVentana: Ventana = {
      id: alias,
      alias: alias,
      titulo: meta.title,
      logo: meta.logo,
      url: meta.url,
      x: 60 + compensacion,
      y: 60 + compensacion,
      ancho: alias === 'terminal' ? 550 : 750,
      alto: alias === 'terminal' ? 380 : 500,
      minimizada: false,
      maximizada: false,
      esChat: meta.esChat,
      agent: meta.agent
    };

    setVentanas(prev => [...prev, nuevaVentana]);
    setZIndices(prev => [alias, ...prev]);
  };

  const cerrarVentana = (id: string) => {
    setVentanas(prev => prev.filter(v => v.id !== id));
    setZIndices(prev => prev.filter(item => item !== id));
  };

  const alternarMaximizada = (id: string) => {
    setVentanas(prev => prev.map(v => v.id === id ? { ...v, maximizada: !v.maximizada } : v));
  };

  const traerAlFrente = (id: string) => {
    setZIndices(prev => [id, ...prev.filter(item => item !== id)]);
  };

  // Drag handlers
  const handleHeaderMouseDown = (id: string, e: React.MouseEvent) => {
    const win = ventanas.find(v => v.id === id);
    if (!win || win.maximizada) return;
    
    traerAlFrente(id);
    setDragWindowId(id);
    dragStartOffset.current = {
      x: e.clientX - win.x,
      y: e.clientY - win.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragWindowId) return;
    
    const posX = e.clientX - dragStartOffset.current.x;
    const posY = e.clientY - dragStartOffset.current.y;

    setVentanas(prev => prev.map(v => v.id === dragWindowId ? { ...v, x: Math.max(0, posX), y: Math.max(0, posY) } : v));
  };

  const handleMouseUp = () => {
    setDragWindowId(null);
  };

  const ejecutarComandoTerminal = () => {
    const cmdClean = cmdInput.trim();
    const parts = cmdClean.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts[1] ? parts[1].toLowerCase() : '';
    
    setCmdInput('');
    if (!cmdClean) return;

    setLogsSimulados(prev => [...prev, `guest@ecosystem-qemu:~$ ${cmdClean}`]);

    setTimeout(() => {
      let res = '';
      switch (cmd) {
        case 'help':
          res = "Available commands:\n  help            - Show this documentation\n  apps or list    - List all executable apps\n  run <app_alias> - Launch an application (e.g., run brave, run antigravity)\n  neofetch        - Display system hardware specifications\n  status          - Check virtual CPU/RAM performance\n  tech            - Explain architecture (tech 1, tech 2, tech 3)\n  clear           - Reset terminal screen";
          break;
        case 'clear':
          setLogsSimulados([]);
          return;
        case 'apps':
        case 'list':
          res = "Ecosystem Application Binary List:\n" + 
                "-----------------------------------------------------------------\n" +
                aplicacionesOSJS.filter(a => a.alias !== 'terminal').map(app => `  [${app.alias}] - ${app.title} [OS: OS.js/container]`).join('\n') +
                "\n-----------------------------------------------------------------\n" +
                "Use 'run <app_alias>' or launch from the top menu dropdown.";
          break;
        case 'run':
          if (!arg) {
            res = "Error: Please specify an application alias to run. Example: 'run brave'";
          } else {
            const appEncontrada = aplicacionesOSJS.find(a => a.alias === arg);
            if (appEncontrada) {
              res = `Launching container for [${appEncontrada.title}] in background mode... OK.`;
              abrirVentana(arg);
            } else {
              res = `Error: application alias '${arg}' not found. Type 'apps' to see the list.`;
            }
          }
          break;
        case 'status':
          res = "System health check:\n  CPU usage: 8% (Emulated 4x Intel Xeon)\n  RAM usage: 1420MB / 4096MB (34% allocated)\n  IP Address: 192.168.100.15 (bridged adapter virbr0)\n  Status: RUNNING STABLE";
          break;
        case 'tech':
          if (!arg) {
            res = "Virtualization & Compatibility Architecture Info:\n" +
                  "-----------------------------------------------------------------\n" +
                  "  [1] QEMU (Universal Architecture Hypervisor)\n" +
                  "  [2] Docker + Waydroid / Anbox (Containerization Subsystem)\n" +
                  "  [3] WebAssembly (Browser-Native VM)\n" +
                  "-----------------------------------------------------------------\n" +
                  "Type 'tech 1', 'tech 2' or 'tech 3' to view details.";
          } else if (arg === '1') {
            res = "1. QEMU (Hipervisor Universal de Arquitectura)\n" +
                  "-----------------------------------------------------------------\n" +
                  "  * Qué es: Es un emulador e hipervisor de código abierto y multiplataforma.\n" +
                  "  * Por qué es 'Universal': A diferencia de VirtualBox, QEMU puede emular arquitecturas de procesador totalmente diferentes.\n" +
                  "  * Cómo funciona: Permite emular procesadores ARM (celulares Android/iOS) y x86 (Windows/Linux) al mismo tiempo en tu laptop de Windows.";
          } else if (arg === '2') {
            res = "2. Docker + Waydroid / Anbox (Virtualización por Contenedores)\n" +
                  "-----------------------------------------------------------------\n" +
                  "  * Qué es: Simula únicamente las capas de software necesarias en vez de una máquina virtual pesada.\n" +
                  "  * Cómo funciona:\n" +
                  "    - Corre un núcleo Linux base súper ligero.\n" +
                  "    - Waydroid ejecuta apps de Android de forma nativa compartiendo el hardware.\n" +
                  "    - Contenedores Docker corren apps de Windows y Linux aisladas.";
          } else if (arg === '3') {
            res = "3. WebAssembly (WASM) - La Máquina Virtual del Navegador\n" +
                  "-----------------------------------------------------------------\n" +
                  "  * Qué es: Tecnología web para compilar código (C++, Rust, Go) a velocidad nativa en el navegador.\n" +
                  "  * Cómo funciona: Actúa como una máquina virtual integrada en el navegador. Permite que programas de escritorio complejos corran en la web sin instalar emuladores.";
          } else {
            res = "Invalid index. Type 'tech' to see available topics.";
          }
          break;
        case 'neofetch':
          res = `               .---.                 guest@ecosystem-qemu\n              /     \\                --------------------\n              \\_.._/                 OS: OS.js Core OS v2.5 [Open Source]\n              /  .  \\                Host: QEMU Emulated Machine (x86_64)\n             /\\  .  /\\               Kernel: Linux KVM 6.6.15-ecosystem-universal\n            /_ \\___/ _\\              Uptime: 2 mins\n           (  /     \\  )             Packages: 421 (dpkg)\n            \\_\\_   _/_/              Shell: bash 5.2.15\n              \\_\\_/_/                Terminal: emulated-pts/0\n                                     CPU: QEMU Virtual CPU (4 Cores)\n                                     Memory: 1420MB / 4096MB`;
          break;
        default:
          res = `bash: command not found: ${cmd}. Type 'help' for available commands.`;
      }
      setLogsSimulados(prev => [...prev, res]);
    }, 100);
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-cover bg-center select-none flex flex-col"
      style={{ 
        backgroundImage: 'radial-gradient(circle at center, #1b3d5c 0%, #11263b 100%)', // Fondo azul clásico de OS.js
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. OS.js TOP MENU BAR (Panel superior característico de OS.js) */}
      <div className="h-8 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-3 text-zinc-300 font-sans text-xs z-[999999] relative">
        <div className="flex items-center gap-3">
          {/* Applications Button (Drop-down trigger) */}
          <button 
            onClick={() => setMenuAppsAbierto(!menuAppsAbierto)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all hover:bg-zinc-800/80 active:scale-95 ${menuAppsAbierto ? 'bg-primary text-primary-foreground font-bold' : 'font-semibold'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Applications</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* Right side: Reloj y Estado */}
        <div className="flex items-center gap-4 text-zinc-400 font-mono text-[10px]">
          <div className="flex items-center gap-1 opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>OS.js Ready</span>
          </div>
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-200 font-semibold">{horaFecha.hora}</span>
          </div>
        </div>

        {/* Dropdown de aplicaciones de OS.js */}
        <AnimatePresence>
          {menuAppsAbierto && (
            <>
              {/* Overlay de clic para cerrar el menú */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuAppsAbierto(false)} />
              
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-3 top-9 w-64 bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 rounded-lg shadow-2xl p-2 z-50 text-left"
              >
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-3 py-1 border-b border-zinc-900 mb-1 font-mono">
                  Environment Packages
                </div>
                <div className="space-y-0.5">
                  {aplicacionesOSJS.map((app) => {
                    const AppIcon = app.logo;
                    return (
                      <button
                        key={app.alias}
                        onClick={() => abrirVentana(app.alias)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all text-zinc-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <AppIcon className="w-4 h-4 text-zinc-400 group-hover:text-primary shrink-0" />
                          <span className="text-xs font-semibold">{app.title}</span>
                        </div>
                        <span className="text-[8px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                          {app.categoria}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. AREA DE ESCRITORIO DE OS.js (Donde flotan las ventanas) */}
      <div className="flex-1 w-full relative overflow-hidden p-4">
        
        {/* Leyenda de OS.js de fondo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10 select-none">
          <div className="text-5xl font-extrabold tracking-widest text-white uppercase font-sans">OS.JS</div>
          <div className="text-xs font-mono tracking-widest text-white uppercase mt-2">Open Source Web Desktop Framework</div>
        </div>

        {ventanas.map((win) => {
          const LogoComp = win.logo;
          const indexProp = zIndices.indexOf(win.id);
          const zIndex = indexProp === -1 ? 10 : (100 - indexProp);

          return (
            <div
              key={win.id}
              onClick={() => traerAlFrente(win.id)}
              style={{
                top: win.maximizada ? 0 : win.y,
                left: win.maximizada ? 0 : win.x,
                width: win.maximizada ? '100%' : win.ancho,
                height: win.maximizada ? '100%' : win.alto,
                zIndex: zIndex
              }}
              className={`absolute flex flex-col rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-all duration-100 ${dragWindowId === win.id ? 'cursor-grabbing border-primary/50' : 'cursor-default'}`}
            >
              {/* OS.js Titlebar */}
              <div
                onMouseDown={(e) => handleHeaderMouseDown(win.id, e)}
                className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none cursor-grab"
              >
                <div className="flex items-center gap-2">
                  <LogoComp className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="text-[10px] font-bold font-sans text-zinc-200">{win.titulo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); alternarMaximizada(win.id); }}
                    className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); cerrarVentana(win.id); }}
                    className="p-1 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* OS.js Window Content */}
              <div className="flex-1 w-full relative overflow-hidden bg-black">
                {win.alias === 'terminal' ? (
                  <div className="w-full h-full flex flex-col font-mono text-left text-[10px] sm:text-xs">
                    <div className="flex-1 p-4 overflow-y-auto space-y-2 text-zinc-300 select-text" ref={terminalEndRef}>
                      {logsSimulados.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                    <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 select-none">
                      <span className="text-primary font-bold">guest@ecosystem-qemu:~$</span>
                      <input 
                        type="text"
                        value={cmdInput}
                        onChange={(e) => setCmdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && ejecutarComandoTerminal()}
                        className="flex-1 bg-transparent border-none outline-none text-zinc-100 font-mono caret-primary focus:ring-0 p-0 text-[10px] sm:text-xs"
                        placeholder="Type 'apps' or 'run <app_alias>'..."
                        autoFocus
                      />
                    </div>
                  </div>
                ) : win.esChat ? (
                  <div className="w-full h-full text-left bg-zinc-950 relative">
                    <ChatOllama onExit={() => cerrarVentana(win.id)} agent={win.agent} />
                  </div>
                ) : (
                  <iframe
                    src={win.url}
                    className="w-full h-full border-none bg-white"
                    title={win.titulo}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
