import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Terminal, 
  Play, 
  Cpu, 
  Server, 
  Globe, 
  Smartphone, 
  Glasses, 
  Monitor, 
  Apple, 
  Bot, 
  Code 
} from 'lucide-react';

const OllamaLogo = () => (
  <img src="https://cdn.simpleicons.org/ollama" className="w-3.5 h-3.5 shrink-0 inline-block align-middle mr-1.5" alt="Ollama" />
);
const BraveLogo = () => (
  <img src="https://cdn.simpleicons.org/brave/FB542B" className="w-3.5 h-3.5 shrink-0 inline-block align-middle mr-1.5" alt="Brave" />
);
const VSCodeLogo = () => (
  <img src="https://cdn.simpleicons.org/visualstudiocode/007ACC" className="w-3.5 h-3.5 shrink-0 inline-block align-middle mr-1.5" alt="VS Code" />
);
const AntigravityLogo = () => (
  <img src="https://cdn.simpleicons.org/googlegemini/8E78FF" className="w-3.5 h-3.5 shrink-0 inline-block align-middle mr-1.5" alt="Antigravity" />
);

export default function MaquinaVirtual({ onLaunch }: { onLaunch: (app: any) => void; appActiva: any | null }) {
  const { t } = useTranslation();
  const [faseSimulacion, setFaseSimulacion] = useState<'booting' | 'terminal'>('booting');
  const [logsSimulados, setLogsSimulados] = useState<string[]>([]);
  const [cmdInput, setCmdInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Lista de Aplicaciones Integradas en la VM Universal
  const aplicacionesDisponibles = [
    {
      alias: 'brave',
      title: 'Brave Browser',
      desc: 'Navegador Web Seguro e Inteligente',
      logo: BraveLogo,
      deviceIcon: Monitor,
      os: ['windows', 'linux', 'macos', 'android'],
      launchType: 'web',
      url: 'https://search.brave.com',
      runtimeType: 'app'
    },
    {
      alias: 'ollama',
      title: 'Ollama Local',
      desc: 'Motor de IA de código abierto',
      logo: OllamaLogo,
      deviceIcon: Bot,
      os: ['windows', 'linux', 'macos', 'android'],
      launchType: 'chat',
      runtimeType: 'program'
    },
    {
      alias: 'vscode',
      title: 'VS Code',
      desc: 'Editor de código premium de escritorio',
      logo: VSCodeLogo,
      deviceIcon: Monitor,
      os: ['windows', 'linux', 'macos'],
      launchType: 'web',
      url: 'https://github1s.com',
      runtimeType: 'program'
    },
    {
      alias: 'antigravity',
      title: 'Antigravity AI',
      desc: 'Asistente cognitivo avanzado de desarrollo',
      logo: AntigravityLogo,
      deviceIcon: Bot,
      os: ['windows', 'linux', 'macos', 'android'],
      launchType: 'chat',
      runtimeType: 'program'
    },
    {
      alias: 'wolvic',
      title: 'Wolvic VR',
      desc: 'Navegador para realidad virtual',
      logo: Globe,
      deviceIcon: Glasses,
      os: ['android'],
      launchType: 'web',
      url: 'https://wolvic.com',
      runtimeType: 'app'
    },
    {
      alias: 'playstore',
      title: 'Google Play Store',
      desc: 'Tienda de aplicaciones Android',
      logo: Smartphone,
      deviceIcon: Smartphone,
      os: ['android'],
      launchType: 'web',
      url: 'https://play.google.com/store',
      runtimeType: 'app'
    },
    {
      alias: 'appstore',
      title: 'Apple App Store',
      desc: 'Tienda de apps para iOS y macOS',
      logo: Smartphone,
      deviceIcon: Smartphone,
      os: ['ios', 'macos'],
      launchType: 'web',
      url: 'https://www.apple.com/app-store/',
      runtimeType: 'app'
    }
  ];

  // Auto-boot sequence al montar
  useEffect(() => {
    const runBoot = async () => {
      setFaseSimulacion('booting');
      setLogsSimulados([]);
      
      const bootSequence = [
        "Initializing QEMU emulator v8.2.0...",
        "Virtual CPU: 4 Cores (x86_64 Emulated Host)",
        "Virtual RAM: 4096 MB allocation successful",
        "Mounting host storage over virtfs...",
        "Booting Linux kernel 6.6.15-ecosystem-universal...",
        "Loading systemd initial RAM disk...",
        "Mounting overlay root filesystem [OK]",
        "Starting D-Bus message bus system [OK]",
        "Starting Docker Daemon container socket [OK]",
        "Waydroid service subsystem initialized [OK]",
        "Bridging virtual ethernet adapter (virbr0)...",
        "Ecosystem Universal OS Core v2.5.0-AR ready.",
        "Type 'help' or 'apps' to explore, and 'run <app_alias>' to execute."
      ];

      for (let i = 0; i < bootSequence.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 50 : 200));
        setLogsSimulados(prev => [...prev, `[system] ${bootSequence[i]}`]);
      }
      setFaseSimulacion('terminal');
    };
    void runBoot();
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [logsSimulados, faseSimulacion]);

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
          res = "Available commands:\n  help            - Show this documentation\n  apps or list    - List all executable apps\n  run <app_alias> - Launch an application (e.g., run brave, run antigravity)\n  neofetch        - Display system hardware specifications\n  status          - Check virtual CPU/RAM performance\n  clear           - Reset terminal screen";
          break;
        case 'clear':
          setLogsSimulados([]);
          return;
        case 'apps':
        case 'list':
          res = "Ecosystem Application Binary List:\n" + 
                "-----------------------------------------------------------------\n" +
                aplicacionesDisponibles.map(app => `  [${app.alias}] - ${app.title} (${app.desc}) [OS: ${app.os.join(', ')}]`).join('\n') +
                "\n-----------------------------------------------------------------\n" +
                "Use 'run <app_alias>' to launch the software container.";
          break;
        case 'run':
          if (!arg) {
            res = "Error: Please specify an application alias to run. Example: 'run brave'";
          } else {
            const appEncontrada = aplicacionesDisponibles.find(a => a.alias === arg);
            if (appEncontrada) {
              res = `Launching container for [${appEncontrada.title}] in background mode... OK.`;
              // Ejecutar la aplicación real en el navegador
              onLaunch(appEncontrada);
            } else {
              res = `Error: application alias '${arg}' not found. Type 'apps' to see the list.`;
            }
          }
          break;
        case 'status':
          res = "System health check:\n  CPU usage: 8% (Emulated 4x Intel Xeon)\n  RAM usage: 1420MB / 4096MB (34% allocated)\n  IP Address: 192.168.100.15 (bridged adapter virbr0)\n  Status: RUNNING STABLE";
          break;
        case 'neofetch':
          res = `               .---.                 guest@ecosystem-qemu\n              /     \\                --------------------\n              \\_.._/                 OS: Ecosystem Universal Core v2.5\n              /  .  \\                Host: QEMU Emulated Machine (x86_64)\n             /\\  .  /\\               Kernel: Linux 6.6.15-ecosystem-universal\n            /_ \\___/ _\\              Uptime: 2 mins\n           (  /     \\  )             Packages: 421 (dpkg)\n            \\_\\_   _/_/              Shell: bash 5.2.15\n              \\_\\_/_/                Terminal: emulated-pts/0\n                                     CPU: QEMU Virtual CPU (4 Cores)\n                                     Memory: 1420MB / 4096MB`;
          break;
        default:
          res = `bash: command not found: ${cmd}. Type 'help' for available commands.`;
      }
      setLogsSimulados(prev => [...prev, res]);
    }, 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-60px)] bg-black border border-border rounded-2xl overflow-hidden font-mono select-text shadow-2xl relative">
      {/* Header de la Terminal */}
      <div className="flex items-center justify-between p-3.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[9px] uppercase tracking-widest text-zinc-200 font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            Universal OS Core (QEMU / Docker Host)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          ONLINE
        </div>
      </div>

      {/* Salida de Logs / Consola */}
      <div className="flex-1 p-6 overflow-y-auto space-y-2.5 text-[10px] sm:text-xs text-zinc-300 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-850" ref={terminalEndRef}>
        {logsSimulados.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap text-left">{log}</div>
        ))}
        
        {faseSimulacion === 'booting' && (
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full border border-t-transparent border-zinc-500 animate-spin" />
            <span>Cargando recursos del hypervisor...</span>
          </div>
        )}
      </div>

      {/* Entrada de Comandos */}
      {faseSimulacion === 'terminal' && (
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-3 select-none">
          <span className="text-primary text-[10px] sm:text-xs font-bold">guest@ecosystem-qemu:~$</span>
          <input 
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ejecutarComandoTerminal()}
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 text-[10px] sm:text-xs font-mono caret-primary focus:ring-0 p-0"
            placeholder="Type 'apps' to list software, or 'run <app_alias>' to execute..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
