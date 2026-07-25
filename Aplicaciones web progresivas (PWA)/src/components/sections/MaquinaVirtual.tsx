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
  Wifi, 
  Volume2, 
  Battery, 
  Search, 
  Folder,
  Code,
  Sparkles,
  Cpu,
  Settings,
  Keyboard,
  Clipboard,
  Tv
} from 'lucide-react';
import ChatOllama from './ChatOllama';

const Win11Logo = () => (
  <svg viewBox="0 0 88 88" className="w-4 h-4 shrink-0 fill-[#0078d4]" alt="Ecosistema Inicio">
    <path d="M0 0h41.6v41.6H0zM46.4 0H88v41.6H46.4zM0 46.4h41.6V88H0zM46.4 46.4H88V88H46.4z" />
  </svg>
);

interface Ventana {
  id: string;
  titulo: string;
  alias: string;
  url?: string;
  logo: React.ComponentType<any> | (() => React.JSX.Element);
  x: number;
  y: number;
  ancho: number;
  alto: number;
  minimizada: boolean;
  maximizada: boolean;
  esChat?: boolean;
  agent?: 'ollama' | 'antigravity';
  esNoVnc?: boolean;
}

export default function MaquinaVirtual({ onLaunch }: { onLaunch: (app: any) => void; appActiva: any | null }) {
  const { t } = useTranslation();
  
  // Reloj en tiempo real para el Taskbar
  const [horaFecha, setHoraFecha] = useState({ hora: '', fecha: '' });

  // Dragging states
  const [dragWindowId, setDragWindowId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Lista de Aplicaciones del Dock
  const aplicacionesDock = [
    {
      alias: 'terminal',
      title: 'Terminal KVM',
      logo: Terminal,
      os: ['linux'],
      launchType: 'terminal'
    },
    {
      alias: 'brave',
      title: 'Brave Browser',
      logo: Globe,
      url: 'https://search.brave.com',
      launchType: 'web'
    },
    {
      alias: 'vscode',
      title: 'VS Code',
      logo: Code,
      url: 'https://github1s.com',
      launchType: 'web'
    },
    {
      alias: 'antigravity',
      title: 'Antigravity AI',
      logo: Sparkles,
      esChat: true,
      agent: 'antigravity' as const,
      launchType: 'chat'
    },
    {
      alias: 'ollama',
      title: 'Ollama Local',
      logo: Cpu,
      esChat: true,
      agent: 'ollama' as const,
      launchType: 'chat'
    },
    {
      alias: 'wolvic',
      title: 'Wolvic VR',
      logo: Globe,
      url: 'https://wolvic.com',
      launchType: 'web'
    },
    {
      alias: 'playstore',
      title: 'Play Store',
      logo: Smartphone,
      url: 'https://play.google.com/store',
      launchType: 'web'
    },
    {
      alias: 'novnc',
      title: 'Conexión noVNC',
      logo: Tv,
      esNoVnc: true,
      launchType: 'novnc'
    }
  ];

  // Iniciar con el escritorio limpio por defecto
  const [ventanas, setVentanas] = useState<Ventana[]>([]);
  const [zIndices, setZIndices] = useState<string[]>([]);
  const [faseSimulacion, setFaseSimulacion] = useState<'booting' | 'terminal'>('booting');
  const [logsSimulados, setLogsSimulados] = useState<string[]>([]);
  const [cmdInput, setCmdInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const bootIniciado = useRef(false);

  // Estados de la simulación interactiva de noVNC
  const [novncMenuOpen, setNovncMenuOpen] = useState(true);
  const [novncConnected, setNovncConnected] = useState(true);
  const [novncLogText, setNovncLogText] = useState('Connecting to ws://localhost:3005/vnc-proxy... Connected.');

  useEffect(() => {
    if (bootIniciado.current) return;
    bootIniciado.current = true;
    
    const runBoot = async () => {
      setFaseSimulacion('booting');
      setLogsSimulados([]);
      
      const bootSequence = [
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
        "Ecosystem Universal OS Core [Open Source] v2.5.0-AR ready.",
        "Type 'help' or 'apps' to explore, and 'run <app_alias>' to execute."
      ];

      for (let i = 0; i < bootSequence.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 50 : 180));
        setLogsSimulados(prev => [...prev, `[system] ${bootSequence[i]}`]);
      }
      setFaseSimulacion('terminal');
    };
    void runBoot();
  }, []);

  // Loop del reloj de Windows 11
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
  }, [logsSimulados, faseSimulacion]);

  const abrirVentana = (alias: string) => {
    if (ventanas.some(v => v.alias === alias)) {
      setZIndices(prev => [alias, ...prev.filter(id => id !== alias)]);
      setVentanas(prev => prev.map(v => v.alias === alias ? { ...v, minimizada: false } : v));
      return;
    }

    const meta = aplicacionesDock.find(a => a.alias === alias);
    if (!meta) return;

    const compensacion = (ventanas.length * 25) % 150;

    const nuevaVentana: Ventana = {
      id: alias,
      alias: alias,
      titulo: meta.title,
      logo: meta.logo,
      url: meta.url,
      x: 80 + compensacion,
      y: 60 + compensacion,
      ancho: alias === 'terminal' ? 550 : alias === 'novnc' ? 800 : 700,
      alto: alias === 'terminal' ? 380 : alias === 'novnc' ? 500 : 500,
      minimizada: false,
      maximizada: false,
      esChat: meta.esChat,
      agent: meta.agent,
      esNoVnc: meta.esNoVnc
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
                aplicacionesDock.filter(a => a.alias !== 'terminal').map(app => `  [${app.alias}] - ${app.title} [OS: linux/container]`).join('\n') +
                "\n-----------------------------------------------------------------\n" +
                "Use 'run <app_alias>' or click the dock icon to launch.";
          break;
        case 'run':
          if (!arg) {
            res = "Error: Please specify an application alias to run. Example: 'run brave'";
          } else {
            const appEncontrada = aplicacionesDock.find(a => a.alias === arg);
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
          res = `               .---.                 guest@ecosystem-qemu\n              /     \\                --------------------\n              \\_.._/                 OS: Ecosystem Universal Core v2.5 [Open Source]\n              /  .  \\                Host: QEMU Emulated Machine (x86_64)\n             /\\  .  /\\               Kernel: Linux KVM 6.6.15-ecosystem-universal\n            /_ \\___/ _\\              Uptime: 2 mins\n           (  /     \\  )             Packages: 421 (dpkg)\n            \\_\\_   _/_/              Shell: bash 5.2.15\n              \\_\\_/_/                Terminal: emulated-pts/0\n                                     CPU: QEMU Virtual CPU (4 Cores)\n                                     Memory: 1420MB / 4096MB`;
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
        backgroundImage: 'radial-gradient(circle at center, #1c1c1f 0%, #0c0c0e 100%)',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. Fondo decorativo tipo malla */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* 2. Monitor de Carga */}
      <div className="absolute top-6 left-6 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 space-y-1 pointer-events-none">
        <div>System: Ecosystem Universal Host (QEMU-KVM)</div>
        <div>Uptime: 100% stable / Virtualization ON</div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Core Status: Active
        </div>
      </div>

      {/* 3. Ventanas Flotantes */}
      <div className="absolute inset-0 p-4 pb-20 overflow-hidden">
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
                height: win.maximizada ? 'calc(100% - 56px)' : win.alto,
                zIndex: zIndex
              }}
              className={`absolute flex flex-col rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-all duration-100 ${dragWindowId === win.id ? 'cursor-grabbing border-primary/50' : 'cursor-default'}`}
            >
              {/* Barra de Título */}
              <div
                onMouseDown={(e) => handleHeaderMouseDown(win.id, e)}
                className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none cursor-grab"
              >
                <div className="flex items-center gap-2">
                  <LogoComp className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-zinc-200">{win.titulo}</span>
                </div>
                <div className="flex items-center gap-2">
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

              {/* Contenido */}
              <div className="flex-1 w-full relative overflow-hidden bg-black flex flex-row">
                {win.alias === 'terminal' ? (
                  <div className="w-full h-full flex flex-col font-mono text-left text-[10px] sm:text-xs">
                    <div className="flex-1 p-4 overflow-y-auto space-y-2 text-zinc-300 select-text" ref={terminalEndRef}>
                      {logsSimulados.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap">{log}</div>
                      ))}
                      {faseSimulacion === 'booting' && (
                        <div className="flex items-center gap-2 text-zinc-500">
                          <span className="w-2.5 h-2.5 rounded-full border border-t-transparent border-zinc-500 animate-spin" />
                          <span>Cargando recursos del hypervisor...</span>
                        </div>
                      )}
                    </div>
                    {faseSimulacion === 'terminal' && (
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
                    )}
                  </div>
                ) : win.esChat ? (
                  <div className="w-full h-full text-left bg-zinc-950 relative">
                    <ChatOllama onExit={() => cerrarVentana(win.id)} agent={win.agent} />
                  </div>
                ) : win.esNoVnc ? (
                  // INTERFAZ DE SIMULACIÓN DE CLIENTE noVNC
                  <div className="w-full h-full flex flex-col bg-zinc-900 font-sans text-left text-xs select-none">
                    {/* noVNC Control Bar (Top) */}
                    <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-3 text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold">noVNC CONNECTED</span>
                        <span className="text-zinc-500 font-mono text-[8px] pl-2">ws://localhost:3005/vnc-proxy</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">1920x1080 (32-bit)</span>
                        <button 
                          onClick={() => {
                            setNovncConnected(!novncConnected);
                            setNovncLogText(novncConnected ? 'Disconnected by user.' : 'Reconnecting... Connected.');
                          }} 
                          className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase transition-all ${novncConnected ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/35'}`}
                        >
                          {novncConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-row relative overflow-hidden">
                      {/* noVNC Left Action Menu */}
                      <div className={`h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-250 flex flex-col items-center py-4 gap-4 ${novncMenuOpen ? 'w-10' : 'w-0 overflow-hidden border-none'}`}>
                        <button title="Settings" className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all"><Settings className="w-4 h-4" /></button>
                        <button title="Show Keyboard" className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all"><Keyboard className="w-4 h-4" /></button>
                        <button title="Clipboard" className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all"><Clipboard className="w-4 h-4" /></button>
                        <button title="Viewport Settings" className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all"><Monitor className="w-4 h-4" /></button>
                      </div>

                      {/* noVNC Toggle Button */}
                      <button 
                        onClick={() => setNovncMenuOpen(!novncMenuOpen)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 border-l-none rounded-r-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 z-50 transition-all"
                      >
                        <span className="text-[8px] font-bold">{novncMenuOpen ? '‹' : '›'}</span>
                      </button>

                      {/* noVNC VNC Canvas (Interactive Desktop inside the VNC Viewer) */}
                      <div className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center p-4">
                        {novncConnected ? (
                          <div 
                            className="w-full max-w-2xl aspect-video bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl relative overflow-hidden flex flex-col"
                            style={{ backgroundImage: 'radial-gradient(circle at center, #27272a 0%, #09090b 100%)' }}
                          >
                            {/* Simulador de Escritorio Linux de la VM */}
                            <div className="p-4 flex-1 text-zinc-300 font-mono text-[10px] space-y-2 select-text">
                              <div className="text-emerald-400 font-bold">Ecosystem OS Core (KVM Terminal Emulator active)</div>
                              <div>Kernel: Linux KVM 6.6.15-ecosystem-universal</div>
                              <div>Host Architecture: x86_64 emulated via QEMU</div>
                              <div className="pt-4 border-t border-zinc-800 mt-4 text-zinc-400">
                                This VNC desktop is transmitted in real-time to your PWA via secure HTML5 Canvas.
                              </div>
                            </div>
                            
                            {/* Barra de estado inferior de la VM simulada */}
                            <div className="h-6 bg-zinc-950 border-t border-zinc-850 px-3 flex items-center justify-between text-zinc-500 text-[8px] font-mono select-none">
                              <span>user@qemu-kvm-guest:~$</span>
                              <span>CPU: 4.2% | RAM: 1.4 GB / 4.0 GB</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-500 font-mono text-center space-y-2">
                            <Tv className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                            <div className="text-sm font-semibold">VNC Connection Closed</div>
                            <div className="text-[10px]">{novncLogText}</div>
                          </div>
                        )}
                      </div>
                    </div>
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

      {/* 4. BARRA DE TAREAS ESTILO WINDOWS 11 */}
      <div className="absolute bottom-0 inset-x-0 h-14 bg-zinc-950/75 dark:bg-black/60 backdrop-blur-3xl border-t border-zinc-800/80 flex items-center justify-between px-6 z-[999999] select-none">
        
        {/* LADO IZQUIERDO */}
        <div className="flex items-center gap-4 shrink-0 w-24">
          <button 
            onClick={() => abrirVentana('terminal')}
            title="Inicio de Sistema"
            className="p-2 hover:bg-zinc-800/60 rounded-lg transition-all active:scale-95 flex items-center justify-center"
          >
            <Win11Logo />
          </button>
        </div>

        {/* CENTRO */}
        <div className="flex items-center gap-1.5 py-1">
          {aplicacionesDock.map((app) => {
            const AppLogo = app.logo;
            const activa = ventanas.some(v => v.alias === app.alias);

            return (
              <button
                key={app.alias}
                onClick={() => abrirVentana(app.alias)}
                title={`Iniciar ${app.title}`}
                className={`group relative p-2.5 rounded-lg transition-all flex items-center justify-center hover:bg-zinc-800/50 ${activa ? 'scale-105' : 'hover:scale-105'}`}
              >
                <AppLogo className="w-5 h-5 shrink-0" />
                
                {activa ? (
                  <span className="absolute bottom-0.5 w-4 h-0.5 rounded bg-sky-400" />
                ) : (
                  <span className="absolute bottom-0.5 w-1 h-0.5 rounded bg-zinc-500 scale-0 group-hover:scale-100 transition-transform" />
                )}

                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[8px] tracking-wider bg-zinc-950 border border-zinc-850 px-2 py-1 rounded text-zinc-300 uppercase whitespace-nowrap shadow-xl">
                  {app.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* LADO DERECHO */}
        <div className="flex items-center gap-3 shrink-0 text-zinc-400 text-right font-mono text-[10px] w-24 justify-end">
          <div className="flex items-center gap-2 pr-1 opacity-70">
            <Wifi className="w-3.5 h-3.5" />
            <Volume2 className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col items-end leading-tight text-[9px] border-l border-zinc-800/80 pl-2">
            <span className="text-zinc-200 font-semibold">{horaFecha.hora}</span>
            <span className="text-zinc-500 text-[8px] mt-0.5">{horaFecha.fecha}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
