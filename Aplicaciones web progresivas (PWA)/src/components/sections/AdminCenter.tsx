import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Layout, Users, Database, Server, AppWindow, Cpu, Bot, Globe, Shield, 
  BarChart, FileText, Wrench, MessageSquare, Settings, Search, UserPlus, 
  RefreshCw, Power, AlertTriangle, CheckCircle2, ArrowLeft, MoreVertical,
  Activity, HardDrive, Network, ShieldCheck, Clock, Download, Upload,
  Mail, Bell, Terminal, Key, Smartphone, Trash2, Apple, Monitor, Bug, Crosshair, ChevronRight
} from 'lucide-react';
import { db, auth, manejarErrorDatos, TipoAccionDatos } from '../../lib/core';
import { collection, onSnapshot, query, limit, addDoc, serverTimestamp, getDocs, updateDoc, doc, deleteDoc } from '../../lib/oss/firestore';
import { useAuthState } from '../../lib/oss/useAuthState';
import { getOS, OS } from '../../lib/os';

const ICONOS_SO: Record<OS, any> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
  android: Smartphone,
  ios: Smartphone,
  unknown: Shield
};

type SubseccionAdmin = 
  | 'dashboard' 
  | 'usuarios' 
  | 'almacenamiento' 
  | 'servidores' 
  | 'aplicaciones' 
  | 'runtime' 
  | 'ia' 
  | 'red' 
  | 'seguridad' 
  | 'analitica' 
  | 'registros' 
  | 'depuracion'
  | 'mantenimiento' 
  | 'comunicaciones' 
  | 'configuracion';

export default function AdminCenter({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();
  const [subseccionActiva, setSubseccionActiva] = useState<SubseccionAdmin | null>(null);
  const [usuarioActual] = useAuthState(auth);
  const [os, setOs] = useState<OS>('unknown');

  useEffect(() => {
    setOs(getOS());
  }, []);

  const LogoOS = ICONOS_SO[os];

  const elementosMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout, desc: 'Estado general, métricas y alertas' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, desc: 'Gestión de cuentas y dispositivos' },
    { id: 'almacenamiento', label: 'Almacenamiento', icon: Database, desc: 'Nodos, replicación e integridad' },
    { id: 'servidores', label: 'Servidores', icon: Server, desc: 'Nodos de procesamiento y estado' },
    { id: 'aplicaciones', label: 'Aplicaciones', icon: AppWindow, desc: 'Repositorio y despliegue' },
    { id: 'runtime', label: 'Runtime', icon: Cpu, desc: 'Motores y rendimiento' },
    { id: 'ia', label: 'IA', icon: Bot, desc: 'Modelos, carga e inferencia' },
    { id: 'red', label: 'Red', icon: Globe, desc: 'Balanceadores, tráfico y latencia' },
    { id: 'seguridad', label: 'Seguridad', icon: Shield, desc: 'Firewall, ataques y auditoría' },
    { id: 'analitica', label: 'Analítica', icon: BarChart, desc: 'Estadísticas globales de crecimiento' },
    { id: 'registros', label: 'Registros', icon: FileText, desc: 'Logs del sistema y errores' },
    { id: 'depuracion', label: 'Depuración', icon: Wrench, desc: 'OpenTelemetry, Sentry, y Jaeger' },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, desc: 'Optimización y actualizaciones' },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare, desc: 'Mensajes globales y avisos' },
    { id: 'configuracion', label: 'Configuración Global', icon: Settings, desc: 'Parámetros, políticas y licencias' },
  ];

  if (subseccionActiva) {
    const elementoActivo = elementosMenu.find(m => m.id === subseccionActiva);
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="p-6 flex items-center justify-between bg-card backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSubseccionActiva(null)}
              className="p-3 hover:bg-primary/10 rounded-xl transition-all text-muted-foreground hover:text-primary border border-border/50"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-sm font-display font-medium tracking-[0.2em] text-foreground uppercase">{t(elementoActivo?.label || subseccionActiva)}</h2>
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-mono mt-0.5">{t('CONSOLA DE CONTROL')}</p>
              </div>
            </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-muted border border-border/50 rounded-lg text-[9px] font-mono text-muted-foreground uppercase tracking-widest shadow-sm">
                ACCESO_ROOT_CONCEDIDO</div></div>
             </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full max-w-6xl mx-auto"
          >
            {renderizarSubseccion(subseccionActiva, t)}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full space-y-16 pb-20">
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title={t("Volver")}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          </button>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
            {t('ADMIN')}
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-1 font-mono opacity-60">{t('CENTRO DE ADMINISTRACIÓN')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {elementosMenu.map((item, i) => {
          const Icono = item.icon;
          return (
            <motion.button 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSubseccionActiva(item.id as SubseccionAdmin)}
              className="ecosystem-card p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden text-left w-full"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                  {t(item.label)}
                </h3>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                  {t(item.desc)}
                </p>
              </div>

              <Icono className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
function renderizarSubseccion(id: SubseccionAdmin, t: any) {
  switch (id) {
    case 'dashboard': return <VistaDashboard t={t} />;
    case 'usuarios': return <VistaUsuarios t={t} />;
    case 'almacenamiento': return <VistaAlmacenamiento t={t} />;
    case 'servidores': return <VistaServidores t={t} />;
    case 'ia': return <VistaIA t={t} />;
    case 'seguridad': return <VistaSeguridad t={t} />;
    case 'aplicaciones': return <VistaAplicaciones t={t} />;
    case 'runtime': return <VistaRuntime t={t} />;
    case 'red': return <VistaRed t={t} />;
    case 'registros': return <VistaLogs t={t} />;
    case 'depuracion': return <VistaDepuracion t={t} />;
    default: return (
      <div className="flex flex-col items-center justify-center h-full opacity-30 py-20">
        <Activity className="w-12 h-12 mb-4" />
        <h3 className="text-xs uppercase tracking-[0.3em] font-mono">{t(id)}</h3>
        <p className="text-[10px] mt-2 uppercase tracking-widest">{t('En desarrollo...')}</p>
      </div>
    );
  }
}

function VistaAplicaciones({ t }: { t: any }) {
  const aplicaciones = [
    { name: 'System Client', v: 'v2.1.0', status: 'ESTABLE', platform: 'Windows/Linux' },
    { name: 'Mobile Hub', v: 'v1.4.5', status: 'BETA', platform: 'Android/iOS' },
    { name: 'XR Node', v: 'v0.8.0', status: 'ALPHA', platform: 'OpenXR' },
    { name: 'Admin Console', v: 'v2.0.0', status: 'LIVE', platform: 'Web' },
  ];
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('APLICACIONES')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('REPOSITORIO Y DESPLIEGUE')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aplicaciones.map((app, i) => (
          <div key={i} className="ecosystem-card p-6 border-border/50 flex items-center justify-between">
            <div>
               <h3 className="text-sm font-bold uppercase tracking-widest">{app.name}</h3>
               <p className="text-[8px] text-muted-foreground uppercase font-mono mt-1">{app.platform} | {app.v}</p>
            </div>
            <div className={`px-2 py-1 rounded text-[7px] font-bold uppercase ${app.status === 'ESTABLE' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
               {app.status}
            </div>
          </div>
        ))}
      
      </div>
      </div>
  );
}

function VistaRuntime({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('RUNTIME')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('MOTORES Y RENDIMIENTO')}</p>
        </div>
      </header>
      <div className="ecosystem-card p-6 border-border/50 space-y-6">
         {['Rust Engine', 'Flutter Runtime', 'Godot Render', 'Ollama Core'].map((motor, i) => (
           <div key={i} className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-widest">
                 <span>{motor}</span>
                 <span className="text-primary">99.9% Uptime</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-primary" style={{ width: `${90 + i}%` }} />
              </div>
           </div>
         ))}
      </div>
      
      </div>
  );
}

function VistaRed({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('RED')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('BALANCEADORES Y TRÁFICO')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="ecosystem-card p-6 border-border/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4">Tráfico Entrante</h3>
            <div className="h-32 flex items-end gap-1">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="flex-1 bg-primary/40 rounded-t" style={{ height: `${Math.random() * 100}%` }} />
               ))}
         </div>
            </div>
         <div className="ecosystem-card p-6 border-border/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4">Latencia Global</h3>
            <div className="space-y-4">
               {['EU-WEST', 'US-EAST', 'ASIA-PACIFIC'].map((region, i) => (
                 <div key={i} className="flex justify-between text-[9px] font-mono uppercase">
                    <span>{region}</span>
                    <span className="text-green-500">{15 + i*10}ms</span>
                 </div>
               ))}
            
      </div>
      </div>
      </div>
    </div>
  );
}

function VistaLogs({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('REGISTROS')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('LOGS DEL SISTEMA')}</p>
        </div>
      </header>
      <div className="ecosystem-card p-4 bg-black-accent font-mono text-[9px] leading-relaxed overflow-x-auto text-foreground">
         <div className="text-green-500">[OK] Sistema inicializado en 1.4s</div>
         <div className="text-blue-400">[INFO] Sincronizando sesiones de usuario...</div>
         <div className="text-yellow-500">[WARN] Uso de memoria alto en IA-vLLM-02</div>
         <div className="text-muted-foreground opacity-50">09:44:15 - Sincronización en segundo plano iniciada</div>
         <div className="text-blue-400">[INFO] Reintentando conexión...</div>
      </div>
      </div>
  );
}

function VistaDashboard({ t }: { t: any }) {
  const [conteos, setConteos] = useState({ usuarios: 0, dispositivos: 0, servidores: 0 });
  const [eventosRecientes, setEventosRecientes] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsuarios = onSnapshot(collection(db, 'users'), (snap) => {
      setConteos(prev => ({ ...prev, usuarios: snap.size }));
    });
    const unsubDispositivos = onSnapshot(collection(db, 'devices'), (snap) => {
      setConteos(prev => ({ ...prev, dispositivos: snap.size }));
    });
    const unsubServidores = onSnapshot(collection(db, 'servers'), (snap) => {
      setConteos(prev => ({ ...prev, servidores: snap.size }));
    });
    
    const unsubEventos = onSnapshot(query(collection(db, 'historial_archivos'), limit(10)), (snap) => {
      setEventosRecientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsuarios();
      unsubDispositivos();
      unsubServidores();
      unsubEventos();
    };
  }, []);

  const estadisticas = [
    { label: 'Usuarios Registrados', value: conteos.usuarios.toString(), icon: Users, color: 'text-blue-500' },
    { label: 'Dispositivos Vinculados', value: conteos.dispositivos.toString(), icon: Smartphone, color: 'text-green-500' },
    { label: 'Servidores Activos', value: conteos.servidores.toString(), icon: Server, color: 'text-primary' },
    { label: 'Uso de CPU', value: '24%', icon: Cpu, color: 'text-orange-500' },
    { label: 'Uso de RAM', value: '42GB', icon: Database, color: 'text-pink-500' },
    { label: 'Tráfico de Red', value: '1.2 GB/s', icon: Network, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-12 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div className="w-full">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-[0.3em] text-foreground uppercase leading-none mb-4">{t('DASHBOARD')}</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.4em] font-mono opacity-60">{t('ESTADO GENERAL DEL SISTEMA')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {estadisticas.map((est, i) => (
          <div key={i} className="ecosystem-card p-8 hover:border-primary/40 transition-all group bg-card relative overflow-hidden flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2 opacity-60">
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                EN VIVO
              </div>
              <est.icon className="w-6 h-6 text-primary/40 group-hover:text-primary/60 transition-colors" strokeWidth={1.5} />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-70">{t(est.label)}</p>
              <h4 className="text-4xl sm:text-5xl font-display font-medium tracking-tighter text-foreground">{est.value}</h4>
            </div>
            
            {/* Background Accent */}
            
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ecosystem-card p-6 border-border/50 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Bell className="w-3 h-3 text-primary" />
              {t('Eventos Recientes')}
            </h3>
          </div>
          <div className="space-y-4 flex-1">
            {eventosRecientes.length > 0 ? eventosRecientes.map((evento, i) => (
              <div key={evento.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full bg-blue-500`} />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest">{evento.action} - {evento.fileName}</p>
                    <p className="text-[7px] text-muted-foreground opacity-60">Contexto: {evento.contextId}</p>
                  </div>
                </div>
                <span className="text-[7px] font-mono opacity-40">
                  {evento.timestamp ? new Date(evento.timestamp).toLocaleTimeString() : '...'}
                </span>
              </div>
            )) : (
               <div className="flex flex-col items-center justify-center flex-1 opacity-20">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-[8px] uppercase tracking-widest">{t('Sin eventos recientes')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="ecosystem-card p-6 border-border/50 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              {t('Alertas Críticas')}
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 opacity-20">
            <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
            <p className="text-[10px] uppercase tracking-widest">{t('Sin incidencias detectadas')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function VistaUsuarios({ t }: { t: any }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsuarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    }, (error) => {
      manejarErrorDatos(error, TipoAccionDatos.LISTADO, 'users');
       setCargando(false);
    });
    return () => unsub();
  }, []);

  const usuariosDeduplicados = useMemo(() => {
    const vistos = new Set();
    return usuarios.filter(u => {
      const clave = u.primaryUid || u.emails?.[0] || u.id;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  }, [usuarios]);

  const usuariosFiltrados = usuariosDeduplicados.filter(u => 
    u.id.toLowerCase().includes(terminoBusqueda.toLowerCase()) || 
    (u.emails && u.emails[0]?.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  const manejarCrearUsuarioPrueba = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        primaryUid: `PRUEBA_${Date.now()}`,
        linkedUids: [],
        emails: [`usuario_${Math.floor(Math.random()*1000)}@prueba.net`],
        createdAt: serverTimestamp()
      });
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, 'users');
    }
  };

  const manejarEliminarUsuario = async (id: string) => {
    if (!window.confirm(t('¿Seguro que desea eliminar este usuario?'))) return;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ELIMINACION, `users/${id}`);
    }
  };

  const manejarAprobar = async (id: string) => {
    try {
      const { updateDoc, doc: firestoreDoc } = await import('../../lib/oss/firestore');
      await updateDoc(firestoreDoc(db, 'users', id), { approvalStatus: 'approved' });
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, `users/${id}`);
    }
  };

  const manejarRechazar = async (id: string) => {
    try {
      const { updateDoc, doc: firestoreDoc } = await import('../../lib/oss/firestore');
      await updateDoc(firestoreDoc(db, 'users', id), { approvalStatus: 'rejected' });
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, `users/${id}`);
    }
  };

  const usuariosPendientes = usuariosFiltrados.filter((u: any) => u.approvalStatus === 'pending' || !u.approvalStatus);
  const usuariosAprobados = usuariosFiltrados.filter((u: any) => u.approvalStatus === 'approved');
  const usuariosRechazados = usuariosFiltrados.filter((u: any) => u.approvalStatus === 'rejected');

  const renderFilaUsuario = (usuario: any) => (
    <tr key={usuario.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors group">
      <td className="p-4 max-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-mono text-[10px] shrink-0 overflow-hidden">
            {usuario.photoURL
              ? <img src={usuario.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
              : <span>{(usuario.displayName || usuario.email || 'U').substring(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-widest uppercase truncate">{usuario.displayName || 'Sin nombre'}</p>
            <p className="text-[8px] text-muted-foreground opacity-60 truncate">{usuario.email || usuario.id}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        {usuario.approvalStatus === 'approved' && (
          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[7px] text-green-500 font-bold uppercase">Aprobado</span>
        )}
        {(usuario.approvalStatus === 'pending' || !usuario.approvalStatus) && (
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[7px] text-amber-500 font-bold uppercase">Pendiente</span>
        )}
        {usuario.approvalStatus === 'rejected' && (
          <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] text-red-500 font-bold uppercase">Rechazado</span>
        )}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {usuario.approvalStatus !== 'approved' && (
            <button
              onClick={() => manejarAprobar(usuario.id)}
              className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded text-[8px] text-green-500 font-bold uppercase tracking-widest transition-colors"
            >
              Aprobar
            </button>
          )}
          {usuario.approvalStatus !== 'rejected' && (
            <button
              onClick={() => manejarRechazar(usuario.id)}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded text-[8px] text-amber-500 font-bold uppercase tracking-widest transition-colors"
            >
              Rechazar
            </button>
          )}
          <button
            onClick={() => manejarEliminarUsuario(usuario.id)}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group/btn"
          >
            <Trash2 className="w-3 h-3 text-muted-foreground group-hover/btn:text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-12 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div className="w-full">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-[0.3em] text-foreground uppercase leading-none mb-4">{t('USUARIOS')}</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('ADMINISTRACIÓN DE CUENTAS')}</p>
        </div>
      </header>

      <div className="ecosystem-card p-4 border-border/50 flex items-center gap-4">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <input
          type="text"
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          placeholder={t("BUSCAR USUARIO...")}
          className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] uppercase tracking-widest placeholder:opacity-30"
        />
      </div>

      {/* Sección: Pendientes de aprobación */}
      {usuariosPendientes.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Pendientes de Aprobación ({usuariosPendientes.length})
          </h2>
          <div className="ecosystem-card overflow-hidden border-amber-500/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-amber-500/5">
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Usuario</th>
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Estado</th>
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>{usuariosPendientes.map(renderFilaUsuario)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección: Usuarios Aprobados */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-green-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          Aprobados ({usuariosAprobados.length})
        </h2>
        <div className="ecosystem-card overflow-hidden border-border/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/50">
                <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Usuario</th>
                <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Estado</th>
                <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={3} className="p-8 text-center text-[10px] animate-pulse uppercase tracking-[0.5em]">{t('CARGANDO...')}</td></tr>
              ) : usuariosAprobados.length > 0 ? usuariosAprobados.map(renderFilaUsuario) : (
                <tr><td colSpan={3} className="p-8 text-center text-[10px] opacity-30 uppercase tracking-[0.5em]">Sin usuarios aprobados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección: Rechazados */}
      {usuariosRechazados.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Rechazados ({usuariosRechazados.length})
          </h2>
          <div className="ecosystem-card overflow-hidden border-red-500/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-red-500/5">
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Usuario</th>
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Estado</th>
                  <th className="p-4 text-[8px] uppercase tracking-widest text-muted-foreground font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>{usuariosRechazados.map(renderFilaUsuario)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaAlmacenamiento({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
       <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('ALMACENAMIENTO')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('INFRAESTRUCTURA DE DATOS')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Capacidad Global')}</h3>
              <HardDrive className="w-4 h-4 text-primary" />
           </div>
           <div className="space-y-4">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-primary" style={{ width: '65%' }} />
                 <div className="h-full bg-blue-500" style={{ width: '15%' }} />
              </div>
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>650 TB Utilizado</span>
                 <span>1 PB Total</span>
              </div>
           </div>
        </div>
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Estado de Nodos')}</h3>
              <Server className="w-4 h-4 text-primary" />
           </div>
           <div className="grid grid-cols-4 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`h-8 rounded ${i === 7 ? 'bg-orange-500/40 border-orange-500/60' : 'bg-green-500/40 border-green-500/60'} border animate-pulse`} style={{ animationDelay: `${i * 100}ms` }} />
              ))}
           </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {['Replicación', 'Integridad', 'Copias de Seguridad'].map((etiqueta, i) => (
           <div key={i} className="ecosystem-card p-4 border-border/50 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest">{t(etiqueta)}</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
           </div>
         ))}
      </div>
    </div>
  );
}
function VistaServidores({ t }: { t: any }) {
  const [servidores, setServidores] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'servers'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServidores(docs);
    }, (error) => {
      manejarErrorDatos(error, TipoAccionDatos.LECTURA, 'servers');
    });
    return () => unsub();
  }, []);

  const manejarActualizarServidor = async (id: string) => {
    try {
      await updateDoc(doc(db, 'servers', id), {
        lastPing: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, `servers/${id}`);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('SERVIDORES')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('NODOS DE PROCESAMIENTO')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {servidores.map((servidor) => (
          <div key={servidor.id} className="ecosystem-card p-6 border-border/50 group hover:border-primary/40 transition-all">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div>
                      <h3 className="text-sm font-bold tracking-widest uppercase">{servidor.name}</h3>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Debian Kernel 6.1</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button
                      onClick={() => manejarActualizarServidor(servidor.id)}
                     className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title={t('Actualizar métricas')}
                   >
                     <RefreshCw className="w-4 h-4 text-muted-foreground" />
                   </button>
                   <div className={`px-2 py-1 rounded text-[7px] font-bold uppercase flex items-center gap-1 ${servidor.status === 'ONLINE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${servidor.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {servidor.status}
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-4">
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">CPU</span>
                   <p className="text-[10px] font-mono">{servidor.status === 'ONLINE' ? `${servidor.cpu}%` : '0%'}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">RAM</span>
                   <p className="text-[10px] font-mono">{servidor.status === 'ONLINE' ? `${servidor.ram} GB` : '0 GB'}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">DISCO</span>
                   <p className="text-[10px] font-mono">{servidor.disk}%</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function VistaIA({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('INTELIGENCIA ARTIFICIAL')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('MODELOS Y ENTRENAMIENTO')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Llama 3 8B')}</h3>
              <Cpu className="w-4 h-4 text-primary" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>Uso CPU</span>
                 <span>78%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-primary" style={{ width: '78%' }} />
              </div>
           </div>
        </div>

        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Ollama 1.5')}</h3>
              <Cpu className="w-4 h-4 text-blue-500" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>Uso CPU</span>
                 <span>42%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-blue-500" style={{ width: '42%' }} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
function VistaSeguridad({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('SEGURIDAD')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('PROTECCIÓN Y AUDITORÍA')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <ShieldCheck className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Firewall Activo')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">1.2M Bloqueos / mes</p>
         </div>
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <Key className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Certificados')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">Todos vigentes</p>
         </div>
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <Terminal className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Auditoría')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">Logs íntegros</p>
         </div>
      </div>
      <div className="ecosystem-card p-6 bg-red-500/5 border-red-500/20">
         <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            {t('Ataques Detectados (Últimas 24h)')}
         </h3>
         <div className="space-y-2 opacity-50">
            <p className="text-[8px] font-mono text-red-500/80">09:12:45 | Intento de Inyección SQL | IP: 185.23.XX.XX | BLOQUEADO</p>
            <p className="text-[8px] font-mono text-red-500/80">04:33:12 | Fuerza Bruta Detectada | IP: 91.102.XX.XX | BLOQUEADO</p>
         </div>
      </div>
    </div>
  );
}
function VistaDepuracion({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end pb-4 mb-2">
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


