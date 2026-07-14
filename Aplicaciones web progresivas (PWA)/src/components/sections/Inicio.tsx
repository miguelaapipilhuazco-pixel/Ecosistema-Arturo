import { motion } from 'motion/react';
import { Activity, Database, Shield, Zap, HardDrive, Star, Clock, Cloud, Grid, RefreshCcw, Server, Cpu, Box, Layout, Circle, Hexagon, Triangle, Trash2, Monitor, Settings, ChevronRight, Apple, Terminal, Smartphone } from 'lucide-react';
import type { IdSeccion } from '../../types';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { db, auth, manejarErrorDatos, TipoAccionDatos } from '../../lib/core';
import { collection, onSnapshot, query, where, doc, deleteDoc, addDoc, serverTimestamp } from '../../lib/oss/firestore';
import { useAuthState } from '../../lib/oss/useAuthState';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsQR from 'jsqr';
import { QRCodeSVG } from 'qrcode.react';
import { getOS, OS } from '../../lib/os';
import { getHardwareProfile } from '../../lib/hardwareProfile';

const ICONOS_SO: Record<OS, any> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
  android: Smartphone,
  ios: Smartphone,
  unknown: Shield
};

const WidgetSistema = () => {
  const [os, setOs] = useState<OS>('unknown');
  useEffect(() => { setOs(getOS()); }, []);
  const Icono = ICONOS_SO[os];
  
  return (
    <div className="ecosystem-card p-3.5 h-full flex flex-col items-center justify-center min-h-[150px]">
       <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 shadow-[0_0_15px_var(--glow)]">
         <Icono className="w-6 h-6 text-primary" />
       </div>
       <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">Entorno Detectado</span>
       <span className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{os === 'unknown' ? 'Sistema Seguro' : os}</span>
    </div>
  );
};

interface PropiedadesInicio {
  onNavigate: (seccionId: IdSeccion) => void;
}

const WidgetNotas = () => {
  const [nota, setNota] = useState(() => localStorage.getItem('widget_note') || '');
  return (
    <div className="ecosystem-card p-3.5 h-full flex flex-col min-h-[150px]">
       <div className="flex items-center justify-between mb-2">
         <span className="font-bold text-xs uppercase tracking-wider text-primary">Bloc de Notas</span>
         <Box className="w-4 h-4 text-primary" />
       </div>
       <textarea 
         value={nota} 
         onChange={(e) => { setNota(e.target.value); localStorage.setItem('widget_note', e.target.value); }}
         className="flex-1 bg-transparent resize-none outline-none text-sm text-muted-foreground font-mono custom-scrollbar"
         placeholder="Escribe algo aquí..."
       />
    </div>
  );
};

const WidgetReloj = () => {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ecosystem-card p-3.5 h-full flex flex-col items-center justify-center min-h-[150px]">
       <span className="text-3xl font-display text-primary">{hora.toLocaleTimeString()}</span>
       <span className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-widest">{hora.toLocaleDateString()}</span>
    </div>
  );
};

const WidgetEstadisticasSistema = () => {
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setCpu(Math.floor(Math.random() * 100));
      setRam(Math.floor(Math.random() * 100));
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ecosystem-card p-3.5 h-full flex flex-col min-h-[150px]">
       <div className="flex items-center justify-between mb-4">
         <span className="font-bold text-xs uppercase tracking-wider text-primary">Rendimiento</span>
         <Activity className="w-4 h-4 text-primary" />
       </div>
       <div className="space-y-4 flex-1 justify-center flex flex-col">
         <div>
           <div className="flex justify-between text-[10px] font-mono mb-1">
             <span>CPU</span>
             <span className="text-primary">{cpu}%</span>
           </div>
           <div className="h-1 bg-muted rounded-full overflow-hidden">
             <div className="h-full bg-primary transition-all duration-500" style={{ width: `${cpu}%` }} />
           </div>
         </div>
         <div>
           <div className="flex justify-between text-[10px] font-mono mb-1">
             <span>RAM</span>
             <span className="text-primary">{ram}%</span>
           </div>
           <div className="h-1 bg-muted rounded-full overflow-hidden">
             <div className="h-full bg-primary transition-all duration-500" style={{ width: `${ram}%` }} />
           </div>
         </div>
       </div>
    </div>
  );
};

const WidgetTareas = () => {
    const [tareas, setTareas] = useState<{text: string, done: boolean}[]>(() => {
    try {
      const d = (localStorage.getItem('widget_tasks') || "").trim();
      if (d && !['undefined', 'null', '[object Object]'].includes(d)) {
        const parsed = JSON.parse(d);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch(e) { return []; }
  });
  const [nuevaTarea, setNuevaTarea] = useState("");
  
  const agregarTarea = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nuevaTarea.trim()) {
      const siguiente = [...tareas, { text: nuevaTarea, done: false }];
      setTareas(siguiente);
      localStorage.setItem('widget_tasks', JSON.stringify(siguiente));
      setNuevaTarea("");
    }
  };
  
  const alternarTarea = (i: number) => {
    const siguiente = [...tareas];
    siguiente[i].done = !siguiente[i].done;
    setTareas(siguiente);
    localStorage.setItem('widget_tasks', JSON.stringify(siguiente));
  };
  
  return (
    <div className="ecosystem-card p-3.5 h-full flex flex-col min-h-[150px]">
       <div className="flex items-center justify-between mb-2">
         <span className="font-bold text-xs uppercase tracking-wider text-primary">Tareas</span>
         <Grid className="w-4 h-4 text-primary" />
       </div>
       <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 mb-2 max-h-24">
         {tareas.length === 0 && <span className="text-[10px] text-muted-foreground font-mono">Sin tareas...</span>}
         {tareas.map((t, i) => (
           <div key={i} className="flex items-center gap-2 cursor-pointer group" onClick={() => alternarTarea(i)}>
             <div className={`w-3 h-3 shrink-0 rounded-sm border border-primary ${t.done ? 'bg-primary' : 'bg-transparent'} transition-colors`} />
             <span className={`text-xs font-mono truncate group-hover:text-primary transition-colors ${t.done ? 'line-through opacity-50' : ''}`}>{t.text}</span>
           </div>
         ))}
       </div>
       <input 
         value={nuevaTarea}
         onChange={e => setNuevaTarea(e.target.value)}
         onKeyDown={agregarTarea}
         placeholder="Nueva tarea..."
         className="w-full bg-muted border border-border rounded p-1.5 text-xs outline-none font-mono focus:border-primary/50 transition-colors"
       />
    </div>
  );
};

const MINI_WIDGETS = [
  { id: 'notes', title: 'Bloc de Notas', component: WidgetNotas, icon: Box },
  { id: 'clock', title: 'Reloj Digital', component: WidgetReloj, icon: Clock },
  { id: 'stats', title: 'Monitor de Sistema', component: WidgetEstadisticasSistema, icon: Activity },
  { id: 'tasks', title: 'Lista de Tareas', component: WidgetTareas, icon: Grid },
  { id: 'os', title: 'Sistema Detectado', component: WidgetSistema, icon: Monitor },
];

export default function Inicio({ onNavigate }: PropiedadesInicio) {
  const { t } = useTranslation();
  const [perfilHardware] = useState(() => getHardwareProfile());
  const esModoLigero = perfilHardware.tier === 'low';
  const [arturoLinkActivo, setArturoLinkActivo] = useState<boolean>(() => {
    return localStorage.getItem('arturo_link_activo') !== 'false';
  });
  const [tamanoTotal, setTamanoTotal] = useState(0);
  const [conteoDispositivos, setConteoDispositivos] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState<{ time: string, cpu: number, ram: number }[]>([]);
  const [datosGraficoSinc, setDatosGraficoSinc] = useState<{ time: string, sent: number, received: number }[]>([]);
  const [datosGraficoNube, setDatosGraficoNube] = useState<{ time: string, latency: number, requests: number }[]>([]);
  const [datosGraficoSeguridad, setDatosGraficoSeguridad] = useState<{ time: string, threats: number, blocks: number }[]>([]);
  const [datosGraficoAlmacenamiento, setDatosGraficoAlmacenamiento] = useState<{ time: string, system: number, apps: number, files: number }[]>([]);
  const [datosGraficoRed, setDatosGraficoRed] = useState<{ time: string, download: number, upload: number }[]>([]);
  const [datosGraficoIA, setDatosGraficoIA] = useState<{ time: string, inference: number, tokens: number }[]>([]);

  const [mostrarGraficoActividad, setMostrarGraficoActividad] = useState(false);
  const [mostrarEstadoSinc, setMostrarEstadoSinc] = useState(false);
  const [mostrarEstadoNube, setMostrarEstadoNube] = useState(false);
  const [mostrarEstadoSeguridad, setMostrarEstadoSeguridad] = useState(false);
  const [mostrarEstadoAlmacenamiento, setMostrarEstadoAlmacenamiento] = useState(false);
  const [mostrarEstadoRed, setMostrarEstadoRed] = useState(false);
  const [mostrarEstadoIA, setMostrarEstadoIA] = useState(false);
  const [iaSeleccionada, setIaSeleccionada] = useState("ollama");
  const [cuentaIA, setCuentaIA] = useState("");
  const [contrasenaIA, setContrasenaIA] = useState("");
  const [estaIAAutenticada, setEstaIAAutenticada] = useState(false);
  const [errorAutenticacionIA, setErrorAutenticacionIA] = useState("");
  const [mostrarArchivosRecientes, setMostrarArchivosRecientes] = useState(false);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [mostrarDispositivos, setMostrarDispositivos] = useState(false);
  const [mostrarAccesoRapido, setMostrarAccesoRapido] = useState(false);
  const [mostrarPersonalizarWidgets, setMostrarPersonalizarWidgets] = useState(false);
  const [mostrarNoticias, setMostrarNoticias] = useState(false);
  const [mostrarModalQr, setMostrarModalQr] = useState(false);
  const [errorQr, setErrorQr] = useState("");
  const [archivosRecientesReales, setArchivosRecientesReales] = useState<any[]>([]);
  const [archivosFavoritosReales, setArchivosFavoritosReales] = useState<any[]>([]);
  const [dispositivosReales, setDispositivosReales] = useState<any[]>([]);
  const [widgetsOcultos, setWidgetsOcultos] = useState<string[]>([]);
  const [miniWidgetsActivos, setMiniWidgetsActivos] = useState<string[]>([]);

  useEffect(() => {
    const actualizarEstadoLink = () => {
      setArturoLinkActivo(localStorage.getItem('arturo_link_activo') !== 'false');
    };
    actualizarEstadoLink();
    const intervaloLink = setInterval(actualizarEstadoLink, 1000);
    window.addEventListener('storage', actualizarEstadoLink);
    return () => {
      clearInterval(intervaloLink);
      window.removeEventListener('storage', actualizarEstadoLink);
    };
  }, []);

  useEffect(() => {
    const savedHiddenWidgets = (localStorage.getItem('hiddenWidgets') || "").trim();
    if (savedHiddenWidgets && !['undefined', 'null', '[object Object]'].includes(savedHiddenWidgets)) {
      try {
        const parsed = JSON.parse(savedHiddenWidgets);
        if (Array.isArray(parsed)) setWidgetsOcultos(parsed);
      } catch (e) {}
    }
    const savedMiniWidgets = (localStorage.getItem('activeMiniWidgets') || "").trim();
    if (savedMiniWidgets && !['undefined', 'null', '[object Object]'].includes(savedMiniWidgets)) {
      try {
        const parsed = JSON.parse(savedMiniWidgets);
        if (Array.isArray(parsed)) setMiniWidgetsActivos(parsed);
      } catch (e) {}
    } else {
      // Activar widgets por defecto según el perfil del dispositivo
      const defaultWidgets = esModoLigero ? ['clock', 'os'] : ['clock', 'stats', 'os'];
      setMiniWidgetsActivos(defaultWidgets);
      localStorage.setItem('activeMiniWidgets', JSON.stringify(defaultWidgets));
    }
  }, [esModoLigero]);

  const alternarVisibilidadWidget = (title: string) => {
    setWidgetsOcultos(prev => {
      const next = prev.includes(title) ? prev.filter(w => w !== title) : [...prev, title];
      localStorage.setItem('hiddenWidgets', JSON.stringify(next));
      return next;
    });
  };

  const alternarMiniWidget = (id: string) => {
    setMiniWidgetsActivos(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem('activeMiniWidgets', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    // Cargar archivos desde localStorage
    const cargarArchivos = () => {
      let allFiles: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
          if (key?.startsWith('system_files_')) {
            try {
              const data = (localStorage.getItem(key) || "").trim();
              if (data && !['undefined', 'null', '[object Object]'].includes(data)) {
                const files = JSON.parse(data);
                if (Array.isArray(files)) {
                  allFiles = [...allFiles, ...files];
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
      }
      
      const sorted = allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setArchivosRecientesReales(sorted.slice(0, 15));
      // Suponiendo que los favoritos tienen una bandera
      const favorites = sorted.filter(f => f.isFavorite).slice(0, 15);
      setArchivosFavoritosReales(favorites);
    };

    if (mostrarArchivosRecientes || mostrarFavoritos) {
      cargarArchivos();
    }
  }, [mostrarArchivosRecientes, mostrarFavoritos]);

  useEffect(() => {
    // Generar datos iniciales de los gráficos
    const initialPoints = esModoLigero ? 8 : 15;

    const initialData = Array.from({ length: initialPoints }).map((_, i) => ({
      time: `${i}s`,
      cpu: Math.floor(Math.random() * 40) + 20,
      ram: Math.floor(Math.random() * 30) + 40,
    }));
    setDatosGrafico(initialData);

    const initialSyncData = Array.from({ length: initialPoints }).map((_, i) => ({
      time: `${i}s`,
      sent: Math.floor(Math.random() * 500) + 100,
      received: Math.floor(Math.random() * 800) + 200,
    }));
    setDatosGraficoSinc(initialSyncData);

    const initialCloudData = Array.from({ length: initialPoints }).map((_, i) => ({
      time: `${i}s`,
      latency: Math.floor(Math.random() * 20) + 10, // ms
      requests: Math.floor(Math.random() * 100) + 50,
    }));
    setDatosGraficoNube(initialCloudData);

    const initialSecurityData = Array.from({ length: initialPoints }).map((_, i) => ({
      time: `${i}s`,
      threats: Math.floor(Math.random() * 10),
      blocks: Math.floor(Math.random() * 5),
    }));
    setDatosGraficoSeguridad(initialSecurityData);

    const initialStorageData = Array.from({ length: initialPoints }).map((_, i) => ({
      time: `${i}s`,
      system: 15.4,
      apps: 22.1,
      files: 18.5,
    }));
    setDatosGraficoAlmacenamiento(initialStorageData);

    let chartInterval: any;
    if (mostrarGraficoActividad && !esModoLigero) {
      chartInterval = setInterval(() => {
        setDatosGrafico(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            cpu: Math.floor(Math.random() * 40) + 20,
            ram: Math.floor(Math.random() * 30) + 40,
          }];
          return newData;
        });
      }, 3000);
    }

    let syncInterval: any;
    if (mostrarEstadoSinc && !esModoLigero) {
      syncInterval = setInterval(() => {
        setDatosGraficoSinc(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            sent: Math.floor(Math.random() * 500) + 100,
            received: Math.floor(Math.random() * 800) + 200,
          }];
          return newData;
        });
      }, 3000);
    }

    let cloudInterval: any;
    if (mostrarEstadoNube && !esModoLigero) {
      cloudInterval = setInterval(() => {
        setDatosGraficoNube(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            latency: Math.floor(Math.random() * 20) + 10,
            requests: Math.floor(Math.random() * 100) + 50,
          }];
          return newData;
        });
      }, 3000);
    }

    let securityInterval: any;
    if (mostrarEstadoSeguridad && !esModoLigero) {
      securityInterval = setInterval(() => {
        setDatosGraficoSeguridad(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            threats: Math.floor(Math.random() * 10),
            blocks: Math.floor(Math.random() * 5),
          }];
          return newData;
        });
      }, 3000);
    }

    let storageInterval: any;
    if (mostrarEstadoAlmacenamiento && !esModoLigero) {
      storageInterval = setInterval(() => {
        setDatosGraficoAlmacenamiento(prev => {
          const last = prev[prev.length - 1];
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            system: Math.max(10, last.system + (Math.random() * 0.4 - 0.2)),
            apps: Math.max(10, last.apps + (Math.random() * 1.0 - 0.4)),
            files: Math.max(5, last.files + (Math.random() * 2.0 - 0.8)),
          }];
          return newData;
        });
      }, 3000);
    }

    let aiInterval: any;
    if (mostrarEstadoIA && !esModoLigero) {
      aiInterval = setInterval(() => {
        setDatosGraficoIA(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
            inference: Math.floor(Math.random() * 200) + 50,
            tokens: Math.floor(Math.random() * 1000) + 100,
          }];
          return newData;
        });
      }, 3000);
    }

    const actualizarTamano = () => {
      let total = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('system_files') || key === 'system_files')) {
            const data = (localStorage.getItem(key) || "").trim();
            if (data && !['undefined', 'null', '[object Object]'].includes(data)) {
              try {
                const files = JSON.parse(data);
                if (Array.isArray(files)) {
                  files.forEach((file: any) => {
                    total += (file.size || 0);
                  });
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error("Error al calcular el tamaño de almacenamiento:", e);
      }
      setTamanoTotal(total);
    };
    actualizarTamano();
    window.addEventListener('storage', actualizarTamano);

    // Conteo de dispositivos vinculados en la capa local OSS
    const userId = "demo-user";
    const q = query(collection(db, "devices"), where("ownerId", "==", userId));
    const unsubscribeDevices = onSnapshot(q, (snapshot) => {
      setConteoDispositivos(snapshot.docs.length);
      const devices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDispositivosReales(devices);
    });

    const intervalo = setInterval(actualizarTamano, 2000);
    return () => {
      window.removeEventListener('storage', actualizarTamano);
      clearInterval(intervalo);
      if (chartInterval) clearInterval(chartInterval);
      if (syncInterval) clearInterval(syncInterval);
      if (cloudInterval) clearInterval(cloudInterval);
      if (securityInterval) clearInterval(securityInterval);
      if (storageInterval) clearInterval(storageInterval);
      if (aiInterval) clearInterval(aiInterval);
      unsubscribeDevices();
    };
  }, [esModoLigero, mostrarGraficoActividad, mostrarEstadoSinc, mostrarEstadoNube, mostrarEstadoSeguridad, mostrarEstadoAlmacenamiento, mostrarEstadoIA]);

  const manejarLimpiarMemoria = () => {
    if (window.confirm(t("¿Estás seguro? Esta acción no se puede deshacer."))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const formatearTamano = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.1) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const obtenerCapacidadMaximaCuenta = () => {
    const guardado = Number(localStorage.getItem('arturo_account_capacity_tb') || '1024');
    const capacidadTB = Number.isFinite(guardado) && guardado > 0 ? guardado : 1024;
    if (capacidadTB >= 1024) return '1 PB';
    return `${capacidadTB.toFixed(0)} TB`;
  };

  const widgets: { title: string, icon: any, target: IdSeccion, status?: string, statusColor?: string, action?: { icon: any, onClick: () => void }, onClickOverride?: () => void }[] = [
    {
      title: t("Estado de sincronización"),
      icon: RefreshCcw,
      target: 'inicio',
      status: arturoLinkActivo ? t("Sincronizado") : t("Pausado"),
      statusColor: arturoLinkActivo ? "text-green-500" : "text-yellow-500",
      onClickOverride: () => setMostrarEstadoSinc(true)
    },
    { title: t("Estado de la nube"), icon: Cloud, target: 'inicio', status: t("En línea"), statusColor: "text-primary", onClickOverride: () => setMostrarEstadoNube(true) },
    { title: t("Estado de seguridad"), icon: Shield, target: 'inicio', status: t("Protegido"), statusColor: "text-green-500", onClickOverride: () => setMostrarEstadoSeguridad(true) },
    { title: t("Uso de almacenamiento"), icon: HardDrive, target: 'inicio', status: `${formatearTamano(tamanoTotal)} / ${obtenerCapacidadMaximaCuenta()}`, action: { icon: Trash2, onClick: manejarLimpiarMemoria }, onClickOverride: () => setMostrarEstadoAlmacenamiento(true) },
    { title: t("Actividad reciente"), icon: Activity, target: 'inicio', onClickOverride: () => setMostrarGraficoActividad(true) },
    { title: t("Archivos recientes"), icon: Clock, target: 'inicio', onClickOverride: () => setMostrarArchivosRecientes(true) },
    { title: t("Favoritos"), icon: Star, target: 'inicio', onClickOverride: () => setMostrarFavoritos(true) },
    { title: t("Dispositivos vinculados"), icon: Server, target: 'inicio', status: `${conteoDispositivos} ${t("Activos")}`, onClickOverride: () => setMostrarDispositivos(true) },
    { title: t("Accesos rápidos"), icon: Zap, target: 'inicio', onClickOverride: () => setMostrarAccesoRapido(true) },
    { title: t("Widgets personalizables"), icon: Layout, target: 'inicio', onClickOverride: () => setMostrarPersonalizarWidgets(true) },
    { title: t("Noticias y actualizaciones"), icon: Box, target: 'inicio', onClickOverride: () => setMostrarNoticias(true) },
    { title: t("Estado de la IA"), icon: Cpu, target: 'inicio', status: t("Activo"), statusColor: "text-green-500", onClickOverride: () => setMostrarEstadoIA(true) },
  ];

  if (mostrarGraficoActividad) {
    const logsRecientes = [
      { id: 1, time: '10:42 AM', user: 'Sistema', action: 'Sincronización completada con éxito', type: 'success' },
      { id: 2, time: '10:38 AM', user: 'Usuario', action: 'Sesión iniciada desde nueva IP', type: 'info' },
      { id: 3, time: '10:15 AM', user: 'Seguridad', action: 'Análisis de vulnerabilidades finalizado', type: 'success' },
      { id: 4, time: '09:50 AM', user: 'Sistema', action: 'Actualización de módulo AI aplicada', type: 'info' },
      { id: 5, time: '09:30 AM', user: 'Red', action: 'Micro-corte detectado y recuperado', type: 'warning' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarGraficoActividad(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Actividad Reciente")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Monitor y Registros")}</p>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ecosystem-card p-6 h-96 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Monitor de Rendimiento")}</h2>
            </div>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosGrafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                    labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                  <Area type="monotone" dataKey="ram" name="RAM (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="ecosystem-card p-6 h-96 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Registro de Eventos")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {logsRecientes.map((log) => (
                <div key={log.id} className="flex gap-4 items-start p-3 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
                  <div className="mt-1">
                    {log.type === 'success' && <Circle className="w-2 h-2 text-green-500 fill-green-500" />}
                    {log.type === 'info' && <Circle className="w-2 h-2 text-blue-500 fill-blue-500" />}
                    {log.type === 'warning' && <Circle className="w-2 h-2 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-muted-foreground">
                      <span>{log.time}</span>
                      <span>•</span>
                      <span className="text-primary/70">{log.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarEstadoSinc) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarEstadoSinc(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Estado de Sincronización")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Tráfico de Red")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-primary animate-spin-slow" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Sincronización en Tiempo Real")}</h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] opacity-70">
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-blue-500 fill-blue-500" /> Enviado</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-orange-500 fill-orange-500" /> Recibido</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoSinc} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="sent" name="Enviado (KB/s)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="received" name="Recibido (KB/s)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRecv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarEstadoNube) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarEstadoNube(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Estado de la Nube")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Métricas de Conexión")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-primary animate-pulse" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Métricas de Nube")}</h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] opacity-70">
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-cyan-400 fill-cyan-400" /> Latencia (ms)</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-indigo-400 fill-indigo-400" /> Solicitudes/s</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoNube} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="latency" name="Latencia (ms)" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                <Area type="monotone" dataKey="requests" name="Solicitudes/s" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorReqs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarEstadoSeguridad) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarEstadoSeguridad(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Estado de Seguridad")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Monitoreo de Amenazas")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Actividad de Seguridad")}</h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] opacity-70">
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-red-500 fill-red-500" /> Amenazas Detectadas</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-green-500 fill-green-500" /> Intentos Bloqueados</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoSeguridad} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="threats" name="Amenazas Detectadas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
                <Area type="monotone" dataKey="blocks" name="Intentos Bloqueados" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarEstadoAlmacenamiento) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarEstadoAlmacenamiento(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Uso de Almacenamiento")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Métricas de Disco")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Distribución de Espacio (GB)")}</h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] opacity-70">
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-rose-500 fill-rose-500" /> Sistema</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-amber-500 fill-amber-500" /> Apps</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-emerald-500 fill-emerald-500" /> Archivos</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoAlmacenamiento} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSystem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                />
                <Area type="monotone" stackId="1" dataKey="system" name="Sistema (GB)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorSystem)" />
                <Area type="monotone" stackId="1" dataKey="apps" name="Apps (GB)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
                <Area type="monotone" stackId="1" dataKey="files" name="Archivos (GB)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFiles)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  const manejarInicioSesionIA = (e: React.FormEvent) => {
    e.preventDefault();
    if (cuentaIA && contrasenaIA) {
      // Simulación básica
      if (cuentaIA.length > 3 && contrasenaIA.length > 3) {
        setEstaIAAutenticada(true);
        setErrorAutenticacionIA("");
      } else {
        setErrorAutenticacionIA("Credenciales inválidas o muy cortas");
      }
    } else {
      setErrorAutenticacionIA("Por favor completa todos los campos");
    }
  };

  if (mostrarEstadoIA) {
    if (!estaIAAutenticada) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <header className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setMostrarEstadoIA(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="text-xl">←</span>
              </button>
              <div>
                <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Estado de la IA")}</h2>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Autenticación Requerida")}</p>
              </div>
            </div>
          </header>

          <div className="ecosystem-card p-6 max-w-md mx-auto mt-12">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold tracking-widest uppercase">{t("Conectar Modelo de IA")}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-2">{t("Inicia sesión para acceder a las métricas y uso de tokens")}</p>
            </div>

            <form onSubmit={manejarInicioSesionIA} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">{t("Proveedor de IA")}</label>
                <select 
                  value={iaSeleccionada}
                  onChange={(e) => setIaSeleccionada(e.target.value)}
                  className="w-full bg-muted dark:bg-black-accent border border-border rounded p-2 text-sm outline-none font-mono focus:border-primary/50 transition-colors text-foreground"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="vllm">vLLM (Local)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">{t("Cuenta / API Key")}</label>
                <input 
                  type="text" 
                  value={cuentaIA}
                  onChange={(e) => setCuentaIA(e.target.value)}
                  className="w-full bg-muted dark:bg-black-accent border border-border rounded p-2 text-sm outline-none font-mono focus:border-primary/50 transition-colors"
                  placeholder="usuario@ejemplo.com o sk-..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">{t("Contraseña / Token")}</label>
                <input 
                  type="password" 
                  value={contrasenaIA}
                  onChange={(e) => setContrasenaIA(e.target.value)}
                  className="w-full bg-muted dark:bg-black-accent border border-border rounded p-2 text-sm outline-none font-mono focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errorAutenticacionIA && (
                <p className="text-red-400 text-xs font-mono text-center">{errorAutenticacionIA}</p>
              )}
              <button 
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground font-bold rounded uppercase tracking-wider text-xs hover:bg-primary/90 transition-colors mt-2"
              >
                {t("Conectar")}
              </button>
            </form>
          </div>
        </motion.div>
      );
    }

    const currentTokens = 125430;
    const maxTokens = 500000;
    const tokenPercentage = Math.min((currentTokens / maxTokens) * 100, 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarEstadoIA(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Estado de la IA")}</h2>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Métricas de Inferencia")}</p>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono uppercase">{iaSeleccionada}</span>
              </div>
            </div>
          </div>
          <button onClick={() => { setEstaIAAutenticada(false); setContrasenaIA(""); }} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1 rounded">
            {t("Desconectar")}
          </button>
        </header>

        <div className="ecosystem-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold tracking-widest uppercase text-sm">{t("Uso de Tokens (Plan Mensual)")}</h3>
            <span className="font-mono text-xs text-primary">{currentTokens.toLocaleString()} / {maxTokens.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${tokenPercentage}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>0%</span>
            <span>{tokenPercentage.toFixed(1)}% {t("Utilizado")}</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Rendimiento del Modelo")}</h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] opacity-70">
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-violet-500 fill-violet-500" /> Inferencia (ms)</span>
              <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-fuchsia-500 fill-fuchsia-500" /> Tokens/s</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoIA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInference" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="inference" name="Inferencia (ms)" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorInference)" />
                <Area type="monotone" dataKey="tokens" name="Tokens/s" stroke="#d946ef" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarArchivosRecientes) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarArchivosRecientes(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Archivos Recientes")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Actividad de Archivos")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm tracking-widest uppercase">{t("Últimos Archivos Modificados")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {archivosRecientesReales.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Box className="w-12 h-12 mb-4" />
                <p>{t("No hay archivos recientes")}</p>
              </div>
            )}
            {archivosRecientesReales.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md">
                    <Box className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate uppercase tracking-wider">{file.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[8px] sm:text-[9px] text-muted-foreground">
                      <span>{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                      <span>•</span>
                      <span>{formatearTamano(file.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="font-mono text-[8px] sm:text-[9px] text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>
                  <span className="font-mono text-[8px] sm:text-[9px] text-muted-foreground">{new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarFavoritos) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarFavoritos(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Favoritos")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Archivos Destacados")}</p>
            </div>
          </div>
        </header>
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h2 className="font-display text-sm tracking-widest uppercase">{t("Tus Favoritos")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {archivosFavoritosReales.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md">
                    <Box className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate uppercase tracking-wider">{file.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[8px] sm:text-[9px] text-muted-foreground">
                      <span>{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                      <span>•</span>
                      <span>{formatearTamano(file.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            ))}
            {archivosFavoritosReales.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Star className="w-12 h-12 mb-4" />
                <p>{t("No hay favoritos")}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarDispositivos) {
    const desvincularDispositivo = async (deviceId: string) => {
      try {
        await deleteDoc(doc(db, "devices", deviceId));
      } catch (error) {
        manejarErrorDatos(error as any, TipoAccionDatos.ELIMINACION);
      }
    };

    const manejarSubidaQr = (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorQr("");
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            try {
              let deviceData;
              try {
                const dataStr = (code.data || "").trim();
                if (dataStr && dataStr !== 'undefined' && dataStr !== 'null') {
                  deviceData = JSON.parse(dataStr);
                } else {
                  throw new Error("Invalid data");
                }
              } catch {
                deviceData = { name: code.data, ip: 'Unknown', os: 'Unknown' };
              }
              
              await addDoc(collection(db, "devices"), {
                name: deviceData.name || 'Dispositivo Desconocido',
                ip: deviceData.ip || '192.168.x.x',
                os: deviceData.os || 'Unknown',
                lastSeen: 'Activo ahora',
                status: 'active',
                ownerId: "demo-user",
                createdAt: serverTimestamp()
              });
              setMostrarModalQr(false);
            } catch (err) {
              setErrorQr("Error al guardar dispositivo vinculado.");
            }
          } else {
            setErrorQr("No se encontró ningún código QR válido en la imagen.");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };

    const agregarDispositivoPrueba = async () => {
      try {
        const testDevices = [
          { name: 'Desktop-Workstation', ip: '192.168.1.45', os: 'Linux', lastSeen: 'Activo ahora', status: 'active' },
          { name: 'MacBook-Pro', ip: '192.168.1.112', os: 'macOS', lastSeen: 'Hace 5 min', status: 'active' },
          { name: 'Mobile-Device', ip: '10.0.0.5', os: 'Android', lastSeen: 'Hace 2 horas', status: 'offline' }
        ];
        const randomDevice = testDevices[Math.floor(Math.random() * testDevices.length)];
        await addDoc(collection(db, "devices"), {
          ...randomDevice,
          ownerId: "demo-user",
          createdAt: serverTimestamp()
        });
      } catch (error) {
        manejarErrorDatos(error as any, TipoAccionDatos.ESCRITURA);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarDispositivos(false)} className="p-2 hover:bg-muted rounded-full transition-colors shrink-0">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-widest text-primary uppercase">{t("Dispositivos Vinculados")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Control de Acceso")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <button onClick={() => setMostrarModalQr(true)} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-primary text-black font-bold border border-primary/20 rounded hover:bg-primary/90 transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              {t("+ Vincular por QR")}
            </button>
            <button onClick={agregarDispositivoPrueba} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              {t("+ Prueba Automática")}
            </button>
          </div>
        </header>

        {mostrarModalQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="ecosystem-card p-6 max-w-sm w-full mx-4 flex flex-col items-center">
              <h3 className="font-bold tracking-widest uppercase mb-2">{t("Vincular Dispositivo")}</h3>
              <p className="text-xs text-muted-foreground text-center mb-6">{t("Sube una imagen con un código QR para vincular el nodo a esta cuenta.")}</p>
              
              <div className="w-48 h-48 bg-muted dark:bg-black-accent border border-border rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={manejarSubidaQr}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center text-center">
                  <Box className="w-8 h-8 text-primary mb-2" />
                  <span className="text-xs uppercase font-mono">{t("Subir imagen QR")}</span>
                </div>
              </div>

              {errorQr && (
                <p className="text-red-400 text-xs font-mono mb-4 text-center">{errorQr}</p>
              )}

              <button 
                onClick={() => setMostrarModalQr(false)}
                className="px-4 py-2 bg-muted hover:bg-muted rounded font-mono text-xs uppercase tracking-wider w-full transition-colors"
              >
                {t("Cancelar")}
              </button>
            </div>
          </div>
        )}
        
        <div className="ecosystem-card p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm tracking-widest uppercase">{t("Red de Nodos")}</h2>
            </div>
            <div className="font-mono text-[10px] opacity-70">
              {conteoDispositivos > 0 ? `${conteoDispositivos} ${t("en la nube")}` : t("Local")}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {dispositivosReales.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Server className="w-12 h-12 mb-4" />
                <p>{t("No hay dispositivos vinculados")}</p>
              </div>
            )}
            {dispositivosReales.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg relative">
                    <Monitor className="w-5 h-5 text-primary" />
                    <Circle className={`absolute top-2 right-2 w-2 h-2 fill-current ${device.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-muted-foreground">
                      <span>{device.ip}</span>
                      <span>•</span>
                      <span>{device.os}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{device.lastSeen}</span>
                  <button onClick={() => desvincularDispositivo(device.id)} className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors uppercase border border-red-500/30 hover:border-red-500 px-2 py-1 rounded">
                    {t("Desvincular")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarAccesoRapido) {
    const enlacesRapidos = [
      { id: 1, title: 'Panel de Control', desc: 'Ajustes del sistema', icon: Layout, target: 'configuracion' },
      { id: 2, title: 'Editor de Textos', desc: 'Crear nuevo documento', icon: Box, target: 'editor' },
      { id: 3, title: 'Monitor de Red', desc: 'Estadísticas de tráfico', icon: Activity, target: 'inicio', onClickOverride: () => setMostrarGraficoActividad(true) },
      { id: 4, title: 'Centro de Admin', desc: 'Consola global', icon: Settings, target: 'admin-center' },
      { id: 5, title: 'Gestor de Archivos', desc: 'Explorar espacios', icon: HardDrive, target: 'espacios' },
      { id: 6, title: 'Historial', desc: 'Registros del sistema', icon: History, target: 'configuracion' }
    ];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarAccesoRapido(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Accesos Rápidos")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Atajos del Sistema")}</p>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enlacesRapidos.map((link) => {
            const Icon = link.icon;
            return (
              <div 
                key={link.id} 
                className="ecosystem-card p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => {
                  if (link.onClickOverride) {
                    setMostrarAccesoRapido(false);
                    link.onClickOverride();
                  } else {
                    onNavigate(link.target as any);
                  }
                }}
              >
                <div className="p-4 bg-muted rounded-full group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold tracking-wider uppercase mb-1">{link.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{link.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (mostrarPersonalizarWidgets) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarPersonalizarWidgets(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Personalizar")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Configura tu panel principal")}</p>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          <div>
            <h3 className="font-bold tracking-widest uppercase mb-4 text-sm text-primary">{t("Mini-Aplicaciones")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MINI_WIDGETS.map((widget) => {
                const isActive = miniWidgetsActivos.includes(widget.id);
                const Icon = widget.icon;
                return (
                  <div 
                    key={widget.id} 
                    onClick={() => alternarMiniWidget(widget.id)}
                    className={`ecosystem-card p-4 flex items-center justify-between cursor-pointer transition-colors ${!isActive ? 'opacity-50 hover:opacity-75' : 'hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${!isActive ? 'bg-muted' : 'bg-primary/20'}`}>
                        <Icon className={`w-5 h-5 ${!isActive ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <h3 className="font-display text-xs tracking-wider uppercase">{widget.title}</h3>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${!isActive ? 'bg-muted' : 'bg-primary'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${!isActive ? 'translate-x-0' : 'translate-x-5'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-bold tracking-widest uppercase mb-4 text-sm text-primary">{t("Accesos Directos")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget, i) => {
                const isHidden = widgetsOcultos.includes(widget.title);
                const Icon = widget.icon;
                return (
                  <div 
                    key={i} 
                    onClick={() => alternarVisibilidadWidget(widget.title)}
                    className={`ecosystem-card p-4 flex items-center justify-between cursor-pointer transition-colors ${isHidden ? 'opacity-50 hover:opacity-75' : 'hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isHidden ? 'bg-muted' : 'bg-primary/20'}`}>
                        <Icon className={`w-5 h-5 ${isHidden ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <h3 className="font-display text-xs tracking-wider uppercase">{widget.title}</h3>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isHidden ? 'bg-muted' : 'bg-primary'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isHidden ? 'translate-x-0' : 'translate-x-5'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mostrarNoticias) {
    const noticias = [
      { id: 1, title: 'Lanzamiento de OS v2.0', date: '15 de junio, 2026', type: 'system', desc: 'Actualización mayor del sistema operativo. Mejoras en rendimiento, interfaz rediseñada y nuevas capacidades de IA integrada.' },
      { id: 2, title: 'Nuevo modelo vLLM disponible', date: '10 de junio, 2026', type: 'ai', desc: 'El nuevo modelo lingüístico para inferencia local ya está disponible en el servidor. Reduce el tiempo de respuesta en un 30%.' },
      { id: 3, title: 'Mantenimiento programado: Storage', date: '05 de junio, 2026', type: 'maintenance', desc: 'El nodo principal de Ceph entrará en mantenimiento el próximo fin de semana. No se espera tiempo de inactividad gracias a la replicación distribuida.' },
      { id: 4, title: 'Parche de seguridad crítico', date: '01 de junio, 2026', type: 'security', desc: 'Se ha aplicado un parche automático para mitigar vulnerabilidades recientes en la capa de red. No se requiere acción del usuario.' }
    ];

    const obtenerIcono = (type: string) => {
      switch (type) {
        case 'system': return <Monitor className="w-5 h-5 text-blue-400" />;
        case 'ai': return <Cpu className="w-5 h-5 text-purple-400" />;
        case 'maintenance': return <RefreshCcw className="w-5 h-5 text-yellow-400" />;
        case 'security': return <Shield className="w-5 h-5 text-green-400" />;
        default: return <Box className="w-5 h-5 text-primary" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMostrarNoticias(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <span className="text-xl">←</span>
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-widest text-primary uppercase">{t("Noticias")}</h2>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{t("Actualizaciones del Sistema")}</p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          {noticias.map((item) => (
            <div key={item.id} className="ecosystem-card p-6 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="p-3 bg-muted dark:bg-black-accent rounded-lg inline-block">
                  {obtenerIcono(item.type)}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                  <h3 className="font-bold text-lg tracking-wider uppercase text-foreground">{item.title}</h3>
                  <span className="font-mono text-xs text-muted-foreground bg-muted dark:bg-black-accent px-2 py-1 rounded w-fit">{item.date}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16 pb-12"
    >
      <header className="flex justify-between items-end border-b border-border/50 pb-8 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('INICIO')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('SISTEMA CENTRAL OPERATIVO')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {widgets.filter(w => !widgetsOcultos.includes(w.title)).map((widget, i) => (
          <div 
            key={i} 
            className="relative group"
          >
            <button 
              onClick={() => widget.onClickOverride ? widget.onClickOverride() : onNavigate(widget.target)}
              className="ecosystem-card w-full p-4 flex items-center justify-between group/card hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md text-left relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover/card:text-primary transition-colors">
                  {widget.title}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                    {widget.status || t("Acceder")}
                  </p>
                  {widget.statusColor && (
                    <div className={`w-1 h-1 rounded-full animate-pulse ${widget.statusColor.replace('text-', 'bg-')}`} />
                  )}
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3">
              </div>

              {/* Decorative background icon */}
              <widget.icon className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover/card:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
            </button>
            {widget.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  widget.action?.onClick();
                }}
                className="absolute top-1/2 -translate-y-1/2 right-12 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 z-20"
                title={t("Vaciar")}
              >
                <widget.action.icon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {miniWidgetsActivos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
          {MINI_WIDGETS.filter(w => miniWidgetsActivos.includes(w.id)).map(widget => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className="relative">
                <WidgetComponent />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
