import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Code, 
  Terminal, 
  Box, 
  FileText, 
  Gamepad, 
  Monitor, 
  Smartphone, 
  Layout, 
  Settings, 
  Sliders, 
  Folder, 
  Layers, 
  Clock, 
  Zap,
  Activity,
  ChevronRight,
  Search,
  Download,
  ExternalLink,
  Server,
  Users,
  Network,
  AppWindow,
  Apple,
  Compass,
  Bot,
  Globe,
  Glasses,
  X,
  Music,
  LayoutGrid
} from 'lucide-react';
import FileManager from '../FileManager';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../lib/core';
import { useAuthState } from '../../lib/oss/useAuthState';
import { collection, onSnapshot, query, where } from '../../lib/oss/firestore';
import { getSyncBackendUrl } from '../../lib/oss/autoSync';

import { getOS, OS } from '../../lib/os';

const ICONOS_SO: Record<OS, any> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
  android: Smartphone,
  ios: Smartphone,
  unknown: Bot
};

type TipoVista = 'apps' | 'runtimes' | 'user';

export default function MaquinaVirtual({ onLaunch, appActiva }: { onLaunch: (app: any) => void, appActiva: any | null }) {
  const { t } = useTranslation();
  const [vistaActiva, setVistaActiva] = useState<TipoVista | 'vms'>('apps');
  const [os, setOs] = useState<OS>('unknown');

  useEffect(() => {
    setOs(getOS());
  }, []);

  const LogoOS = ICONOS_SO[os];

  return (
    <div className="space-y-6 pb-16">
      <header className="border-b border-border/50 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] mb-2 text-foreground uppercase flex items-center gap-4">
            {t('Runtime')}
          </h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.4em] mt-3 opacity-60">
            {t('Universal Compatibility Engine')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shrink-0 self-start md:self-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-primary">Core v2.5.0-AR</span>
        </div>
      </header>

      <div className="grid grid-cols-3 sm:flex gap-1 p-1 bg-muted/50 dark:bg-black-accent rounded-xl border border-border w-full sm:w-fit">
        {(['apps', 'runtimes', 'vms', 'user'] as Array<TipoVista | 'vms'>).map((vista) => {
          return (
            <button
              key={vista}
              onClick={() => setVistaActiva(vista)}
              className={`flex items-center justify-center gap-2 px-1 sm:px-4 md:px-6 py-2.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all text-center truncate ${vistaActiva === vista ? 'bg-primary text-primary-foreground shadow-xl' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {vista === 'apps' ? (
                <>
                  {t('Biblioteca')}
                </>
              ) : vista === 'runtimes' ? (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  {t('Motores')}
                </>
              ) : vista === 'vms' ? (
                <>
                  <Server className="w-3.5 h-3.5" />
                  {t('Máquinas')}
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  {t('Mis Datos')}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <AnimatePresence mode="wait">
          {vistaActiva === 'apps' && <VistaBibliotecaAplicaciones key="apps" t={t} onLaunch={onLaunch} />}
          {vistaActiva === 'runtimes' && <VistaMotoresEjecucion key="runtimes" t={t} />}
          {vistaActiva === 'vms' && <VistaMaquinasVirtuales key="vms" t={t} />}
          {vistaActiva === 'user' && <VistaDatosUsuario key="user" t={t} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

const OllamaLogo = ({ className }: { className?: string }) => (
  <img src="https://cdn.simpleicons.org/ollama" className={className || "w-5 h-5 shrink-0"} alt="Ollama" />
);
const BraveLogo = ({ className }: { className?: string }) => (
  <img src="https://cdn.simpleicons.org/brave/FB542B" className={className || "w-5 h-5 shrink-0"} alt="Brave" />
);

const WolvicLogo = ({ className }: { className?: string }) => (
  <img src="https://wolvic.com/images/logo.svg" className={className || "w-5 h-5 shrink-0"} onError={(e) => { e.currentTarget.src = 'https://cdn.simpleicons.org/firefoxbrowser/FF7139' }} alt="Wolvic" />
);

const QuestBrowserLogo = ({ className }: { className?: string }) => (
  <img src="https://cdn.simpleicons.org/meta/0467DF" className={className || "w-5 h-5 shrink-0"} alt="Quest Browser" />
);

function VistaBibliotecaAplicaciones({ t, onLaunch }: { t: any, onLaunch: (app: any) => void, key?: string }) {
  const [filtroDispositivo, setFiltroDispositivo] = useState<'all' | 'desktop' | 'mobile' | 'vr'>('all');
  const [filtroOS, setFiltroOS] = useState<'all' | 'windows' | 'linux' | 'macos' | 'android' | 'ios'>('all');
  const [busqueda, setBusqueda] = useState("");
  const [usuario] = useAuthState(auth);
  const [appsNube, setAppsNube] = useState<any[]>([]);
  const [programasNube, setProgramasNube] = useState<any[]>([]);
  const [juegosNube, setJuegosNube] = useState<any[]>([]);
  const [carpetasNube, setCarpetasNube] = useState<any[]>([]);
  const [mensajeRuntime, setMensajeRuntime] = useState('');

  useEffect(() => {
    if (!usuario) {
      setAppsNube([]);
      setProgramasNube([]);
      setJuegosNube([]);
      setCarpetasNube([]);
      return;
    }

    const unsubApps = onSnapshot(
      query(collection(db, 'cloud_apps'), where('userId', '==', usuario.uid)),
      (snapshot) => setAppsNube(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubProgramas = onSnapshot(
      query(collection(db, 'cloud_programs'), where('userId', '==', usuario.uid)),
      (snapshot) => setProgramasNube(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubJuegos = onSnapshot(
      query(collection(db, 'cloud_games'), where('userId', '==', usuario.uid)),
      (snapshot) => setJuegosNube(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubCarpetas = onSnapshot(
      query(collection(db, 'cloud_folders'), where('userId', '==', usuario.uid)),
      (snapshot) => setCarpetasNube(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubApps();
      unsubProgramas();
      unsubJuegos();
      unsubCarpetas();
    };
  }, [usuario]);

  const todasLasAplicaciones = [
    {
      title: 'Brave Browser',
      desc: 'Secure Web Browser',
      logo: BraveLogo,
      deviceIcon: Monitor,
      os: ['windows', 'linux', 'macos', 'android'],
      showOnVR: false,
      status: 'Disponible',
      launchType: 'web',
      url: 'https://html.duckduckgo.com/html/',
      runtimeType: 'app'
    },
    {
      title: 'Ollama Local',
      desc: 'Open Source AI Runtime',
      logo: OllamaLogo,
      deviceIcon: Bot,
      os: ['windows', 'linux', 'macos', 'android'],
      showOnVR: false,
      status: 'Disponible',
      launchType: 'chat',
      runtimeType: 'program'
    },
    {
      title: 'Wolvic',
      desc: 'VR Browser',
      logo: WolvicLogo,
      deviceIcon: Glasses,
      os: ['android'],
      showOnVR: true,
      status: 'Disponible',
      launchType: 'web',
      url: 'https://wolvic.com',
      runtimeType: 'app'
    },
    {
      title: 'Quest Browser',
      desc: 'Meta WebXR Entry',
      logo: QuestBrowserLogo,
      deviceIcon: Glasses,
      os: ['android'],
      showOnVR: true,
      status: 'Disponible',
      launchType: 'web',
      url: 'https://www.meta.com/help/quest/',
      runtimeType: 'app'
    }
  ];

  const aplicacionesNube = [
    ...appsNube.map((item) => ({
      title: String(item.name || 'App Nube'),
      desc: String(item.path || item.source || 'Aplicacion importada desde el dispositivo'),
      logo: AppWindow,
      deviceIcon: Monitor,
      os: ['windows'],
      showOnVR: false,
      status: String(item.status || 'Importado'),
      launchType: String(item.url || '').startsWith('http') ? 'web' : 'local-exec',
      url: String(item.url || ''),
      path: String(item.path || ''),
      source: 'cloud',
      runtimeType: 'app',
    })),
    ...programasNube.map((item) => ({
      title: String(item.name || 'Programa Nube'),
      desc: String(item.path || item.source || 'Programa importado desde el dispositivo'),
      logo: Code,
      deviceIcon: Monitor,
      os: ['windows'],
      showOnVR: false,
      status: String(item.status || 'Importado'),
      launchType: 'local-exec',
      path: String(item.path || ''),
      source: 'cloud',
      runtimeType: 'program',
    })),
    ...juegosNube.map((item) => ({
      title: String(item.name || 'Juego Nube'),
      desc: String(item.path || item.source || 'Juego importado desde el dispositivo'),
      logo: Gamepad,
      deviceIcon: Monitor,
      os: ['windows'],
      showOnVR: false,
      status: String(item.status || 'Importado'),
      launchType: 'local-exec',
      path: String(item.path || ''),
      source: 'cloud',
      runtimeType: 'game',
    })),
    ...carpetasNube.map((item) => ({
      title: String(item.name || 'Carpeta Nube'),
      desc: String(item.path || item.source || 'Carpeta importada desde el dispositivo'),
      logo: Folder,
      deviceIcon: Monitor,
      os: ['windows'],
      showOnVR: false,
      status: String(item.status || 'Importado'),
      launchType: 'local-exec',
      path: String(item.path || ''),
      source: 'cloud',
      runtimeType: 'folder',
    })),
  ];

  const universoAplicaciones = [...aplicacionesNube, ...todasLasAplicaciones];

  const getRuntimeTypeMeta = (runtimeType: string | undefined) => {
    if (runtimeType === 'game') {
      return { label: 'Juego', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Gamepad };
    }
    if (runtimeType === 'program') {
      return { label: 'Programa', className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Code };
    }
    if (runtimeType === 'folder') {
      return { label: 'Carpeta', className: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Folder };
    }
    if (runtimeType === 'app') {
      return { label: 'App', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: AppWindow };
    }
    return { label: 'Sistema', className: 'text-primary bg-primary/10 border-primary/20', icon: LayoutGrid };
  };

  const aplicaciones = universoAplicaciones.filter(app => {
    // 1. Filtro de Búsqueda
    const coincideBusqueda = app.title.toLowerCase().includes(busqueda.toLowerCase()) || 
                             app.desc.toLowerCase().includes(busqueda.toLowerCase());
    
    // 2. Filtro de Dispositivo
    let coincideDispositivo = true;
    if (filtroDispositivo === 'desktop') {
      coincideDispositivo = !app.showOnVR && (app.os.includes('windows') || app.os.includes('macos') || app.os.includes('linux'));
    } else if (filtroDispositivo === 'mobile') {
      coincideDispositivo = !app.showOnVR && (app.os.includes('android') || app.os.includes('ios'));
    } else if (filtroDispositivo === 'vr') {
      coincideDispositivo = app.showOnVR === true;
    }

    // 3. Filtro de OS
    const coincideOS = filtroOS === 'all' ? true : (app.os && app.os.includes(filtroOS));

    return coincideBusqueda && coincideDispositivo && coincideOS;
  });

  const launchApp = async (app: any) => {
    if (app.launchType === 'local-exec') {
      try {
        setMensajeRuntime(`Iniciando ${app.title} en el host...`);
        const backendUrl = getSyncBackendUrl().replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/runtime/launch-local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: app.path }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }
        setMensajeRuntime(`Aplicación ${app.title} iniciada con éxito.`);
      } catch (error: any) {
        setMensajeRuntime(`Error al lanzar en el host: ${error?.message || 'Error desconocido'}`);
      }

      // Abrir la interfaz de consola del proceso en el sitio
      onLaunch({
        ...app,
        launchType: 'console-monitor'
      });
      return;
    }

    onLaunch(app);
  };

  const ICONOS_SO: Record<string, any> = {
    windows: AppWindow,
    linux: Terminal,
    macos: Apple,
    android: Smartphone,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {mensajeRuntime && (
        <div className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary font-mono text-[8px] uppercase tracking-widest">
          {mensajeRuntime}
        </div>
      )}

      <div className="flex flex-col gap-4 bg-card/40 p-4 border border-border rounded-2xl backdrop-blur-md">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center w-full">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 dark:bg-black-accent rounded-xl border border-border w-full xl:max-w-xs focus-within:border-primary/50 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar aplicación..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-mono uppercase tracking-widest flex-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <div className="flex flex-wrap items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50">
              <span className="text-[7px] font-mono uppercase text-muted-foreground px-2">Dispositivo:</span>
              {[
                { key: 'all', label: 'Todos', icon: LayoutGrid },
                { key: 'desktop', label: 'PC', icon: Monitor },
                { key: 'mobile', label: 'Móvil', icon: Smartphone },
                { key: 'vr', label: 'VR/MR', icon: Glasses }
              ].map(d => {
                const IconComponent = d.icon;
                const active = filtroDispositivo === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setFiltroDispositivo(d.key as any)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider border transition-all ${active ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_var(--glow)]' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50">
              <span className="text-[7px] font-mono uppercase text-muted-foreground px-2">S.O.:</span>
              {[
                { key: 'all', label: 'Todos', icon: Globe },
                { key: 'windows', label: 'Windows', icon: AppWindow },
                { key: 'macos', label: 'macOS', icon: Apple },
                { key: 'linux', label: 'Linux', icon: Terminal },
                { key: 'android', label: 'Android', icon: Smartphone }
              ].map(o => {
                const IconComponent = o.icon;
                const active = filtroOS === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => setFiltroOS(o.key as any)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider border transition-all ${active ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_var(--glow)]' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {aplicaciones.map((app, i) => {
          const LogoComponent = app.logo;
          const DeviceIconComponent = app.deviceIcon;
          const runtimeMeta = getRuntimeTypeMeta(app.runtimeType);
          const RuntimeTypeIcon = runtimeMeta.icon;
          return (
            <div 
              key={i} 
              onClick={() => launchApp(app)}
              className="ecosystem-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                   <LogoComponent />
                   <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                     {app.title}
                   </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded border ${runtimeMeta.className} flex items-center gap-1`}>
                    <RuntimeTypeIcon className="w-2.5 h-2.5" />
                    {runtimeMeta.label}
                  </span>
                  <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                    {app.status}
                  </p>
                  <div className="flex gap-1 items-center">
                    {app.os.map((osClave, indice) => {
                      const Icono = ICONOS_SO[osClave];
                      return Icono ? <Icono key={indice} className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={1.5} /> : null;
                    })}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                 <DeviceIconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </div>

              <div className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none opacity-20 group-hover:opacity-40">
                 <LogoComponent className="w-full h-full" />
              </div>
            </div>
          );
        })}
      </div>

      {aplicaciones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-muted/20 border border-dashed border-border rounded-3xl opacity-60 text-center">
          <Search className="w-12 h-12 mb-4 text-muted-foreground" />
          <h3 className="text-sm uppercase tracking-widest mb-2">No se encontraron aplicaciones</h3>
          <p className="text-[10px] max-w-xs uppercase">Intenta ajustar los filtros o el término de búsqueda.</p>
          <button 
            onClick={() => { setBusqueda(""); setFiltroDispositivo("all"); setFiltroOS("all"); }}
            className="mt-6 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[8px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition-all"
          >
            Restablecer Filtros
          </button>
        </div>
      )}
    </motion.div>
  );
}

function VistaMaquinasVirtuales({ t }: any) {
  const [vms, setVms] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarVms = async () => {
    setCargando(true);
    setMensaje('');
    try {
      const backendUrl = getSyncBackendUrl().replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/runtime/vms`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setVms(items);
      setMensaje(`Detectadas ${items.length} maquinas virtuales.`);
    } catch (error: any) {
      setMensaje(`No se pudieron detectar VMs: ${error?.message || 'Error desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarVms();
  }, []);

  const iniciarVm = async (vm: any) => {
    if (vm.provider === 'hyperv' && !vm.path) {
      try {
        const backendUrl = getSyncBackendUrl().replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/runtime/start-vm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: vm.name }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }
        setMensaje(`VM iniciada: ${vm.name}`);
      } catch (error: any) {
        setMensaje(`No se pudo iniciar ${vm.name}: ${error?.message || 'Error desconocido'}`);
      }
      return;
    }

    if (!vm.path) {
      setMensaje(`La VM ${vm.name} no tiene ruta para abrir.`);
      return;
    }

    try {
      const backendUrl = getSyncBackendUrl().replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/runtime/launch-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: vm.path }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      setMensaje(`Recurso de VM abierto: ${vm.name}`);
    } catch (error: any) {
      setMensaje(`No se pudo abrir ${vm.name}: ${error?.message || 'Error desconocido'}`);
    }
  };

  const vmsFiltradas = vms.filter((vm) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return (
      String(vm?.name || '').toLowerCase().includes(q) ||
      String(vm?.provider || '').toLowerCase().includes(q) ||
      String(vm?.path || '').toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/40 p-4 border border-border rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 dark:bg-black-accent rounded-xl border border-border w-full sm:max-w-xs focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar VM..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-mono uppercase tracking-widest flex-1"
          />
        </div>
        <button
          onClick={() => void cargarVms()}
          className="px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-border bg-muted hover:border-primary/50 transition-all"
        >
          {cargando ? 'Escaneando...' : 'Escanear VMs'}
        </button>
      </div>

      {mensaje && (
        <div className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary font-mono text-[8px] uppercase tracking-widest">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vmsFiltradas.map((vm, index) => (
          <div key={`${vm.name}-${index}`} className="ecosystem-card p-4 flex flex-col gap-3 bg-card/40 backdrop-blur-md border border-border">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground truncate">{vm.name}</h3>
              <span className="text-[7px] font-mono uppercase px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">
                {vm.provider || 'generic'}
              </span>
            </div>
            <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-70 truncate">
              {vm.path || 'VM detectada por proveedor (sin ruta local)'}
            </p>
            <button
              onClick={() => void iniciarVm(vm)}
              className="px-3 py-1.5 rounded-lg border border-border text-[8px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors"
            >
              {vm.provider === 'hyperv' && !vm.path ? 'Iniciar VM' : 'Abrir recurso'}
            </button>
          </div>
        ))}
      </div>

      {vmsFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 border border-dashed border-border rounded-3xl opacity-60 text-center">
          <Server className="w-12 h-12 mb-4 text-muted-foreground" />
          <h3 className="text-sm uppercase tracking-widest mb-2">No se detectaron máquinas virtuales</h3>
          <p className="text-[10px] max-w-xs uppercase">Asegúrate de tener VirtualBox/VMware/Hyper-V instalado y vuelve a escanear.</p>
        </div>
      )}
    </motion.div>
  );
}

function VistaMotoresEjecucion({ t }: any) {
  const [prefGlobal, setPrefGlobal] = useState<'hybrid' | 'remote' | 'local'>('hybrid');
  
  const [ajustesRuntime, setAjustesRuntime] = useState<Record<string, 'auto' | 'force-local' | 'force-remote'>>({
    win: 'auto',
    lin: 'auto',
    mac: 'auto',
    and: 'auto',
    ios: 'auto',
  });

  const [runtimeExpandido, setRuntimeExpandido] = useState<string | null>(null);

  const motores = [
    { id: 'win', title: 'Runtime Windows', desc: 'Win32/x64 Compatibility Layer', icon: Monitor, deviceIcon: Monitor, iconColor: 'text-blue-500', localSize: '4.8 GB', latency: '4ms' },
    { id: 'lin', title: 'Runtime Linux', desc: 'Native ELF Execution & Docker', icon: Terminal, deviceIcon: Monitor, iconColor: 'text-amber-500', localSize: '3.2 GB', latency: '2ms' },
    { id: 'mac', title: 'Runtime macOS', desc: 'Darwin Environment & Cocoa Sandboxing', icon: Layout, deviceIcon: Monitor, iconColor: 'text-indigo-400', localSize: '5.1 GB', latency: '6ms' },
    { id: 'and', title: 'Runtime Android', desc: 'ART/Dalvik Engine & Kotlin Sandbox', icon: Smartphone, deviceIcon: Smartphone, iconColor: 'text-green-500', localSize: '2.4 GB', latency: '8ms' },
    { id: 'ios', title: 'Runtime iOS', desc: 'Cocoa Touch & Swift Container', icon: Smartphone, deviceIcon: Smartphone, iconColor: 'text-pink-500', localSize: '2.9 GB', latency: '9ms' },
  ];

  const obtenerEstadoRuntime = (id: string) => {
    const ajuste = ajustesRuntime[id];
    
    if (ajuste === 'force-remote') {
      return { 
        label: 'Ejecución Remota', 
        desc: 'Ejecutándose en servidor remoto (0 GB local usados)', 
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', 
        sizeLabel: 'Remoto (Cloud)' 
      };
    }
    if (ajuste === 'force-local') {
      return { 
        label: 'Descargado Localmente', 
        desc: 'Instalado por completo en almacenamiento local', 
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
        sizeLabel: 'Instalado' 
      };
    }

    // Default 'auto' behavior based on global pref
    if (prefGlobal === 'remote') {
      return { 
        label: 'Listo en Servidor (Remoto)', 
        desc: 'Sincronizado con servidor central (Optimizado)', 
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', 
        sizeLabel: 'Remoto (Cloud)' 
      };
    }
    if (prefGlobal === 'local') {
      return { 
        label: 'Descargado Localmente', 
        desc: 'Aprovisionado para uso offline inmediato', 
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
        sizeLabel: 'Instalado' 
      };
    }
    
    // Hybrid Mode
    if (['win', 'lin'].includes(id)) {
      return { 
        label: 'Descargado Localmente', 
        desc: 'Descarga automática priorizada por hardware local', 
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
        sizeLabel: 'Instalado' 
      };
    }
    return { 
      label: 'Disponible en Servidor (Remoto)', 
      desc: 'Listo para streaming bajo demanda', 
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', 
      sizeLabel: 'On-Demand (Remoto)' 
    };
  };

  const manejarCambioAjuste = (id: string, modo: 'auto' | 'force-local' | 'force-remote') => {
    setAjustesRuntime(prev => ({
      ...prev,
      [id]: modo
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* 1. NÚCLEO - SIEMPRE INSTALADO */}
      <div className="bg-card border border-emerald-500/20 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-medium uppercase tracking-[0.2em] text-xs text-emerald-500">
                  Ecosistema Core
                </h2>
                <span className="text-[7.5px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instalado Permanentemente
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed max-w-2xl mt-1.5">
                El núcleo base del ecosistema se encuentra **siempre instalado** de forma nativa en tu dispositivo. Proporciona el bus de mensajería (Kafka), la base distribuida y la infraestructura esencial para garantizar un rendimiento óptimo sin fricciones.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded-xl font-mono text-[8px] uppercase tracking-wider shrink-0 text-muted-foreground">
            <span>Espacio Base: NATIVO</span>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATIC RUNTIME POLICY & GLOBAL CONFIG */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
          <div>
            <h3 className="font-display font-medium uppercase tracking-[0.2em] text-xs text-foreground">
              Aprovisionamiento de Runtimes
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
              Los runtimes se descargan **automáticamente** cuando se necesitan, o se ejecutan **remotamente** si el dispositivo no tiene recursos suficientes. No es necesario realizar configuraciones manuales, a menos que desees administrarlos específicamente desde esta sección.
            </p>
          </div>

          {/* Global Delivery Mode Segmented Controls */}
          <div className="flex flex-wrap gap-1 p-1 bg-muted/50 dark:bg-black-accent border border-border rounded-xl">
            {(['hybrid', 'remote', 'local'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setPrefGlobal(pref)}
                className={`px-3 py-1.5 rounded-lg font-mono text-[8.5px] uppercase tracking-wider transition-all ${prefGlobal === pref ? 'bg-primary text-primary-foreground font-semibold shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {pref === 'hybrid' ? 'Híbrido Automático' : pref === 'remote' ? 'Solo Remoto' : 'Local Forzado'}
              </button>
            ))}
          </div>
        </div>

        {/* Informative stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col justify-between">
            <span>Estrategia de Carga</span>
            <span className="text-foreground font-semibold mt-1">
              {prefGlobal === 'hybrid' ? 'Inteligente (Auto-Detección)' : prefGlobal === 'remote' ? 'Ahorro de Recursos (Cloud)' : 'Uso Fuera de Línea'}
            </span>
          </div>
          <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col justify-between">
            <span>Ancho de Banda Utilizado</span>
            <span className="text-foreground font-semibold mt-1">Optimizado por Redundancia</span>
          </div>
          <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col justify-between">
            <span>Estado de Descargas</span>
            <span className="text-emerald-500 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Gestión Transparente Activa
            </span>
          </div>
        </div>
      </div>

      {/* 3. RUNTIMES PLATFORMS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-medium uppercase tracking-[0.25em] text-[10px] text-muted-foreground">
            Entornos Disponibles
          </h4>
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
            Clic en un motor para administrarlo manualmente
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {motores.map((motor) => {
            const IconoComponente = motor.icon;
            const IconoDispositivo = motor.deviceIcon;
            const estaExpandido = runtimeExpandido === motor.id;
            const estado = obtenerEstadoRuntime(motor.id);
            const ajuste = ajustesRuntime[motor.id];

            return (
              <div 
                key={motor.id}
                className={`border rounded-2xl transition-all overflow-hidden ${estaExpandido ? 'border-primary bg-primary/[0.02]' : 'border-border bg-card hover:border-primary/20'}`}
              >
                {/* Header card */}
                <button
                  onClick={() => setRuntimeExpandido(estaExpandido ? null : motor.id)}
                  className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                      <IconoComponente className={`w-4 h-4 ${motor.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground">
                        {motor.title}
                      </h3>
                      <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">
                        {motor.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Status Badge */}
                    <span className={`text-[7.5px] font-mono uppercase px-2.5 py-1 rounded-lg border ${estado.color}`}>
                      {estado.label}
                    </span>

                    {/* Auto Indicator Badge */}
                    {ajuste === 'auto' && (
                      <span className="text-[7.5px] font-mono uppercase bg-muted text-muted-foreground px-2 py-1 rounded-lg border border-border">
                        Administrado Automáticamente
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-lg text-muted-foreground">
                      <IconoDispositivo className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-[8px] font-mono tracking-wider uppercase">
                        {motor.deviceIcon === Monitor ? 'PC' : 'Móvil'}
                      </span>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${estaExpandido ? 'rotate-90 text-primary' : ''}`} />
                  </div>
                </button>

                {/* Manual Admin controls (Configuración del runtime) */}
                <AnimatePresence>
                  {estaExpandido && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border bg-muted/30 p-5 font-mono text-[9px] space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground block mb-2">
                            Ajustes de Administración Manual
                          </span>
                          
                          {/* Radio toggles */}
                          <div className="space-y-2">
                            {[
                              { key: 'auto', label: 'Gestión Inteligente (Recomendado)', desc: 'El sistema decide de manera transparente según tus recursos.' },
                              { key: 'force-local', label: 'Forzar Descarga Local', desc: `Mantiene el motor local listo en disco (~${motor.localSize}).` },
                              { key: 'force-remote', label: 'Forzar Streaming Remoto', desc: `Ejecuta en la nube sin almacenamiento local (Latencia: ~${motor.latency}).` },
                            ].map((opcion) => (
                              <button
                                key={opcion.key}
                                onClick={() => manejarCambioAjuste(motor.id, opcion.key as any)}
                                className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${ajuste === opcion.key ? 'border-primary/50 bg-primary/5 text-foreground' : 'border-border hover:border-primary/20 text-muted-foreground'}`}
                              >
                                <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5">
                                  {ajuste === opcion.key && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground uppercase tracking-wider block text-[8px]">{opcion.label}</span>
                                  <p className="text-[7.5px] opacity-75 mt-0.5">{opcion.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Runtime Stats */}
                        <div className="space-y-3 bg-muted/40 border border-border p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground block mb-3">
                              Métricas de Rendimiento y Recursos
                            </span>
                            
                            <div className="space-y-2.5 text-[8.5px]">
                              <div className="flex justify-between border-b border-border pb-1.5">
                                <span className="text-muted-foreground">Estado del Motor:</span>
                                <span className="text-foreground uppercase font-semibold">{estado.sizeLabel}</span>
                              </div>
                              <div className="flex justify-between border-b border-border pb-1.5">
                                <span className="text-muted-foreground">Espacio en Disco Local:</span>
                                <span className="text-foreground font-semibold">{ajuste === 'force-remote' ? '0 Bytes (Soberano)' : motor.localSize}</span>
                              </div>
                              <div className="flex justify-between border-b border-border pb-1.5">
                                <span className="text-muted-foreground">Latencia del Servidor:</span>
                                <span className="text-foreground font-semibold">{motor.latency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Uso de Canal (Kafka):</span>
                                <span className="text-emerald-500 font-semibold uppercase">Estable y Enlazado</span>
                              </div>
                              <div className="pt-2">
                                <div className="flex justify-between mb-1">
                                  <span className="text-muted-foreground uppercase text-[7px]">Carga de CPU:</span>
                                  <span className="text-primary font-bold">{(Math.random() * 40 + 10).toFixed(1)}%</span>
                                </div>
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.random() * 60 + 20}%` }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                                    className="h-full bg-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <span className="text-[7px] uppercase tracking-widest text-primary/75">
                              Entorno de Tiempo de Ejecución de Máquina Virtual v2.4
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function VistaDatosUsuario({ t }: any) {
  const opcionesDatos = [
    { title: 'Configuración', desc: 'Preferencias del Runtime', icon: Settings, deviceIcon: Monitor, iconColor: 'text-blue-400' },
    { title: 'Archivos', desc: 'Archivos Multiplataforma', icon: Folder, deviceIcon: Monitor, iconColor: 'text-yellow-500' },
    { title: 'Proyectos', desc: 'Espacios de Trabajo y Compilaciones', icon: Layers, deviceIcon: Monitor, iconColor: 'text-emerald-500' },
    { title: 'Preferencias', desc: 'Identidad de Usuario', icon: Sliders, deviceIcon: Monitor, iconColor: 'text-pink-400' },
    { title: 'Accesos Rápidos', desc: 'Aplicaciones Ancladas', icon: Zap, deviceIcon: Monitor, iconColor: 'text-amber-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {opcionesDatos.map((opt, i) => (
          <div 
            key={i} 
            className="ecosystem-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                {t(opt.title)}
              </h3>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                {opt.desc}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
            </div>

            
          </div>
        ))}
      </div>

      <div className="p-8 ecosystem-card bg-card/20 border-dashed flex flex-col items-center justify-center text-center">
        <Folder className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
        <h3 className="font-display text-sm tracking-widest uppercase mb-2">Explorador de Archivos Distribuido</h3>
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground max-w-sm">
          Accede a tu almacenamiento distribuido (Ceph/MinIO) directamente desde el runtime.
        </p>
        <button className="mt-6 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition-all">
          Abrir Gestor de Archivos
        </button>
      </div>
    </motion.div>
  );
}


