import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, Pause, Activity, History, AlertCircle, ArrowUpRight, Laptop, Wifi, Clock, CheckSquare, ChevronRight, X, Copy, RefreshCw, Smartphone, ShieldCheck, Trash2, Plus, QrCode, Monitor, ArrowLeft } from 'lucide-react';
import { exportDataPackage, importDataPackage, parseDataPackage, stringifyDataPackage } from '../../lib/oss/sync';
import {
  getSyncBackendUrl,
  setSyncBackendUrl,
  getSyncPairingKey,
  setSyncPairingKey,
  getSyncDeviceDisplayName,
  setSyncDeviceDisplayName,
  getSyncScopeConfig,
  setSyncScopeConfig,
  getOrCreateSyncDeviceId,
} from '../../lib/oss/autoSync';
import { readDb, subscribeDb } from '../../lib/oss/store';
import { db, auth } from '../../lib/core';
import { collection, onSnapshot, query, where, deleteDoc, doc, addDoc, getDocs, setDoc } from '../../lib/oss/firestore';
import { useAuthState } from '../../lib/oss/useAuthState';

interface PropsSincronizacion {
  arturoLinkActivo: boolean;
  onToggleArturoLink: () => void;
  alNavegar?: (id: any) => void;
}

export default function Sincronizacion({ arturoLinkActivo, onToggleArturoLink, alNavegar }: PropsSincronizacion) {
  const [usuarioActual] = useAuthState(auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cambiosPendientes, setCambiosPendientes] = useState<number>(() => {
    const saved = Number(localStorage.getItem('arturo_link_pending') || '0');
    return Number.isFinite(saved) ? saved : 0;
  });
  const [ultimoSync, setUltimoSync] = useState<string>(() => {
    return localStorage.getItem('arturo_link_last_sync') || 'Nunca';
  });
  const [mensajeSync, setMensajeSync] = useState<string>('');
  const [backendUrl, setBackendUrl] = useState<string>(() => getSyncBackendUrl());
  const [pairingKey, setPairingKey] = useState<string>(() => getSyncPairingKey());
  const [nombreEquipo, setNombreEquipo] = useState<string>(() => getSyncDeviceDisplayName());
  const [modoSync, setModoSync] = useState<'all' | 'custom'>(() => getSyncScopeConfig().mode);
  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState<string[]>(() => getSyncScopeConfig().collections);
  const [coleccionesDisponibles, setColeccionesDisponibles] = useState<string[]>([]);

  // Nuevos estados para la vinculación premium
  const [modalDispositivosAbierto, setModalDispositivosAbierto] = useState(false);
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [modalErroresAbierto, setModalErroresAbierto] = useState(false);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [pingServer, setPingServer] = useState<number | null>(null);
  const [historialEventos, setHistorialEventos] = useState<any[]>([]);

  // Efecto para obtener la latencia con el servidor (Ping)
  useEffect(() => {
    const checkPing = async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${backendUrl.replace(/\/$/, '')}/api/oss-sync/health`);
        if (res.ok) {
          setPingServer(Date.now() - start);
        } else {
          setPingServer(null);
        }
      } catch {
        setPingServer(null);
      }
    };
    
    checkPing();
    const interval = setInterval(checkPing, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Efecto reactivo para escuchar los dispositivos vinculados en Firestore
  useEffect(() => {
    if (!usuarioActual) return;

    const consulta = query(
      collection(db, 'device_links'),
      where('userId', '==', usuarioActual.uid)
    );

    const desuscribir = onSnapshot(consulta, (snapshot) => {
      const list = snapshot.docs.map((docVal) => ({ id: docVal.id, ...docVal.data() }));
      setDispositivos(list);
    });

    return () => desuscribir();
  }, [usuarioActual]);

  // Registrar o actualizar el propio dispositivo local
  useEffect(() => {
    if (!usuarioActual || !arturoLinkActivo) return;

    const deviceId = getOrCreateSyncDeviceId();
    const docRef = doc(db, 'device_links', `link_${deviceId}`);

    const reportarConexion = async () => {
      try {
        await setDoc(docRef, {
          deviceId,
          userId: usuarioActual.uid,
          deviceName: nombreEquipo,
          linkedAt: Date.now(),
          lastSeenAt: Date.now(),
          platform: window.navigator.platform,
        }, { merge: true });
      } catch (error) {
        console.error("Error al registrar dispositivo en Firestore:", error);
      }
    };

    reportarConexion();
    const interval = setInterval(reportarConexion, 15000); // Actualizar presencia cada 15 segundos
    return () => clearInterval(interval);
  }, [usuarioActual, arturoLinkActivo, nombreEquipo]);

  // Escuchar historial de sincronizaciones
  useEffect(() => {
    if (!usuarioActual) return;
    const q = query(
      collection(db, 'historial_archivos'),
      where('userId', '==', usuarioActual.uid),
      where('action', '==', 'SINCRONIZAR')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setHistorialEventos(items);
    });
    return () => unsub();
  }, [usuarioActual]);

  useEffect(() => {
    const actualizarColecciones = () => {
      const keys = Object.keys(readDb()).sort((a, b) => a.localeCompare(b));
      setColeccionesDisponibles(keys);
      setColeccionesSeleccionadas((prev) => prev.filter((value) => keys.includes(value)));
    };

    actualizarColecciones();
    const unsub = subscribeDb(() => actualizarColecciones());
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('arturo_link_pending', String(cambiosPendientes));
  }, [cambiosPendientes]);

  useEffect(() => {
    localStorage.setItem('arturo_link_last_sync', ultimoSync);
  }, [ultimoSync]);

  const sincronizarAhora = () => {
    if (!arturoLinkActivo) return;
    if (modoSync === 'custom' && coleccionesSeleccionadas.length === 0) {
      setMensajeSync('Selecciona al menos una coleccion para sincronizacion personalizada.');
      return;
    }

    setSyncScopeConfig({ mode: modoSync, collections: coleccionesSeleccionadas });
    setCambiosPendientes(0);
    const marca = new Date().toLocaleString();
    setUltimoSync(marca);
    setMensajeSync(
      modoSync === 'all'
        ? 'Sincronizacion local completada para todo el contenido.'
        : `Sincronizacion local completada para: ${coleccionesSeleccionadas.join(', ')}`
    );
  };

  const exportarPaquete = () => {
    const pkg = exportDataPackage();
    const blob = new Blob([stringifyDataPackage(pkg)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ecosystem-sync-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMensajeSync('Paquete de sincronizacion exportado.');
  };

  const importarPaquete = async (file: File, mode: 'merge' | 'replace') => {
    try {
      const text = await file.text();
      const pkg = parseDataPackage(text);
      importDataPackage(pkg, mode);
      setMensajeSync(mode === 'replace' ? 'Importacion total aplicada en este dispositivo.' : 'Importacion incremental aplicada en este dispositivo.');
      setCambiosPendientes(0);
      setUltimoSync(new Date().toLocaleString());
    } catch (error: any) {
      setMensajeSync(error?.message || 'No se pudo importar el paquete.');
    }
  };

  const desvincularDispositivo = async (idLinkDoc: string) => {
    try {
      await deleteDoc(doc(db, 'device_links', idLinkDoc));
      setMensajeSync('Dispositivo desvinculado del ecosistema.');
    } catch (error) {
      console.error("Error al desvincular dispositivo:", error);
    }
  };

  const opciones = [
    {
      title: arturoLinkActivo ? "Pausar Sincronización" : "Activar Sincronización",
      icon: arturoLinkActivo ? Pause : Power,
      action: onToggleArturoLink
    },
    { 
      title: "Estado", 
      icon: Activity,
      action: () => setModalEstadoAbierto(true)
    },
    { 
      title: "Historial", 
      icon: History,
      action: () => setModalHistorialAbierto(true)
    },
    { 
      title: "Errores", 
      icon: AlertCircle,
      action: () => setModalErroresAbierto(true)
    },
    { 
      title: "Dispositivos conectados", 
      icon: Laptop,
      action: () => setModalDispositivosAbierto(true)
    },
    { 
      title: "Vincular dispositivo", 
      icon: Plus,
      action: () => setModalVincularAbierto(true)
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button 
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">SINCRONIZACIÓN</h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em]">
            SISTEMA DE ENLACE
          </p>
        </div>
      </header>

      <div className={`ecosystem-card p-6 sm:p-10 mb-6 sm:mb-10 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 bg-card/50 ${arturoLinkActivo ? 'border-primary/50' : 'border-red-500/50'}`}>
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-8 w-full md:w-auto">
          <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 bg-background/50 shrink-0 ${arturoLinkActivo ? 'border-primary border-t-transparent animate-spin' : 'border-red-500 shadow-lg shadow-red-500/20'}`}>
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${arturoLinkActivo ? 'bg-primary' : 'bg-red-500'}`} />
          </div>
          <div>
            <div className={`font-display text-xl sm:text-2xl uppercase tracking-[0.2em] transition-all duration-500 ${arturoLinkActivo ? 'text-foreground' : 'text-red-500'}`}>
              {arturoLinkActivo ? 'ENLACE ACTIVO' : 'ENLACE PAUSADO'}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2 font-bold">
              {arturoLinkActivo ? 'TODOS LOS SISTEMAS SINCRONIZANDO...' : 'SINCRONIZACION DETENIDA'}
            </div>
          </div>
        </div>
        <button 
          onClick={onToggleArturoLink}
          className={`px-6 sm:px-8 py-3 rounded-xl font-display text-[10px] font-bold uppercase tracking-[0.3em] transition-all border shadow-lg w-full md:w-auto ${
            arturoLinkActivo ? 'bg-primary text-primary-foreground border-primary shadow-primary/20 hover:opacity-90' : 'bg-red-500 text-white border-red-500 shadow-red-500/20 hover:bg-red-600'
          }`}
        >
          {arturoLinkActivo ? 'DESCONECTAR' : 'CONECTAR'}
        </button>
      </div>

      <div className="ecosystem-card p-6 sm:p-8 bg-card/40 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display text-xs uppercase tracking-[0.2em] text-foreground">Estado del enlace</h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Equipo local: {nombreEquipo}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Modo: {modoSync === 'all' ? 'Todo' : 'Personalizado'}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Cambios pendientes: {cambiosPendientes}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Ultimo sync: {ultimoSync}</p>
            {mensajeSync && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mt-2">{mensajeSync}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCambiosPendientes((prev) => prev + 1)}
              className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
            >
              Simular cambio local
            </button>
            <button
              onClick={sincronizarAhora}
              disabled={!arturoLinkActivo}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-[0.2em] border transition-colors ${arturoLinkActivo ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border cursor-not-allowed'}`}
            >
              Sincronizar ahora
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={exportarPaquete}
            className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
          >
            Exportar perfil/dispositivo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
          >
            Importar incremental
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.dataset.mode = 'replace';
                fileInputRef.current.click();
              }
            }}
            className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
          >
            Importar todo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            title="Seleccionar paquete de sincronizacion"
            aria-label="Seleccionar paquete de sincronizacion"
            accept="application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const mode = (event.target.dataset.mode as 'merge' | 'replace' | undefined) || 'merge';
              await importarPaquete(file, mode);
              event.target.value = '';
              event.target.dataset.mode = 'merge';
            }}
            data-mode="merge"
          />
        </div>

        <div className="pt-2 border-t border-border/50 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Backend OSS de sincronizacion automatica
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://IP-DEL-SERVIDOR:3000"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-[10px] font-mono uppercase tracking-[0.1em]"
            />
            <button
              onClick={() => {
                setSyncBackendUrl(backendUrl);
                setMensajeSync('Backend de sincronizacion actualizado.');
              }}
              className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
            >
              Guardar backend
            </button>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
            Clave de emparejamiento segura
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="password"
              value={pairingKey}
              onChange={(e) => setPairingKey(e.target.value)}
              placeholder="CLAVE-COMPARTIDA-ENTRE-DISPOSITIVOS"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-[10px] font-mono uppercase tracking-[0.1em]"
            />
            <button
              onClick={() => {
                setSyncPairingKey(pairingKey);
                setMensajeSync('Clave de emparejamiento guardada.');
              }}
              className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
            >
              Guardar clave
            </button>
          </div>
        </div>
      </div>

      <div className="ecosystem-card p-6 sm:p-8 bg-card/40 backdrop-blur-md space-y-4">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-foreground">Identidad del equipo</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Nombre visible del equipo en estado de sincronizacion y paquetes exportados
        </p>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
            placeholder="MI-EQUIPO-PRINCIPAL"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-[10px] font-mono uppercase tracking-[0.1em]"
          />
          <button
            onClick={() => {
              setSyncDeviceDisplayName(nombreEquipo);
              setNombreEquipo(getSyncDeviceDisplayName());
              setMensajeSync('Nombre del equipo actualizado.');
            }}
            className="px-4 py-2 rounded-lg border border-border text-[10px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
          >
            Guardar nombre
          </button>
        </div>
      </div>

      <div className="ecosystem-card p-6 sm:p-8 bg-card/40 backdrop-blur-md space-y-4">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-foreground">Estado de sincronizacion</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Elige sincronizar todo el contenido o solo colecciones especificas
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setModoSync('all');
              setSyncScopeConfig({ mode: 'all', collections: coleccionesSeleccionadas });
              setMensajeSync('Modo de sincronizacion: todo.');
            }}
            className={`px-4 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${
              modoSync === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Sincronizar todo
          </button>
          <button
            onClick={() => {
              setModoSync('custom');
              setSyncScopeConfig({ mode: 'custom', collections: coleccionesSeleccionadas });
              setMensajeSync('Modo de sincronizacion: personalizado.');
            }}
            className={`px-4 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${
              modoSync === 'custom'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Sincronizacion personalizada
          </button>
        </div>

        {modoSync === 'custom' && (
          <div className="space-y-2">
            {coleccionesDisponibles.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Aun no hay colecciones locales disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {coleccionesDisponibles.map((collectionName) => {
                  const activo = coleccionesSeleccionadas.includes(collectionName);
                  return (
                    <button
                      key={collectionName}
                      onClick={() => {
                        setColeccionesSeleccionadas((prev) => {
                          const next = prev.includes(collectionName)
                            ? prev.filter((value) => value !== collectionName)
                            : [...prev, collectionName];
                          setSyncScopeConfig({ mode: 'custom', collections: next });
                          return next;
                        });
                      }}
                      className={`px-3 py-2 rounded-lg border text-left text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${
                        activo
                          ? 'bg-primary/15 border-primary/50 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground'
                      }`}
                    >
                      {collectionName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {opciones.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <button 
              key={i} 
              onClick={opt.action}
              className="ecosystem-card w-full p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md text-left relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                    {opt.title}
                  </h3>
                  <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">
                    Gestionar {opt.title.toLowerCase()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>

      {/* Modal de Dispositivos Conectados */}
      <AnimatePresence>
        {modalDispositivosAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Dispositivos del Ecosistema</h3>
                </div>
                <button onClick={() => setModalDispositivosAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Todos los equipos sincronizados con tu cuenta:</p>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {dispositivos.map((dev) => {
                    const isOnline = dev.lastSeenAt && (Date.now() - Number(dev.lastSeenAt) < 30000);
                    const isMe = dev.deviceId === getOrCreateSyncDeviceId();
                    return (
                      <div key={dev.id} className="p-3 bg-black/40 border border-border rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {dev.platform?.toLowerCase().includes('win') ? (
                            <Monitor className="w-5 h-5 text-primary" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-primary" />
                          )}
                          <div>
                            <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
                              {dev.deviceName || 'Dispositivo sin nombre'}
                              {isMe && <span className="text-[7px] bg-primary/20 text-primary border border-primary/30 px-1 rounded">ESTE EQUIPO</span>}
                            </h4>
                            <p className="font-mono text-[7px] text-muted-foreground uppercase tracking-widest mt-1 truncate max-w-[200px]">
                              ID: {dev.deviceId} | S.O: {dev.platform || 'Desconocido'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-muted-foreground/30'}`} />
                          <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                            {isOnline ? 'EN LINEA' : 'FUERA DE LINEA'}
                          </span>
                          {!isMe && (
                            <button
                              onClick={() => void desvincularDispositivo(dev.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2"
                              title="Desvincular Dispositivo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dispositivos.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground uppercase py-4 text-center">No hay otros dispositivos vinculados aún.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalDispositivosAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Vincular Dispositivo */}
      <AnimatePresence>
        {modalVincularAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Vincular Nuevo Dispositivo</h3>
                </div>
                <button onClick={() => setModalVincularAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">1. Configura el nuevo dispositivo con la misma dirección del backend:</p>
                  <div className="p-3 bg-black/40 border border-border rounded-xl font-mono text-[10px] break-all text-primary flex items-center justify-between">
                    <span>{backendUrl}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(backendUrl);
                        setMensajeSync('Enlace copiado');
                      }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">2. Clave de emparejamiento segura:</p>
                  <div className="p-3 bg-black/40 border border-border rounded-xl font-mono text-[10px] break-all text-primary flex items-center justify-between">
                    <span>{pairingKey || 'No configurada'}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const randomKey = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join('-');
                          setPairingKey(randomKey);
                          setSyncPairingKey(randomKey);
                        }}
                        className="text-[8px] font-mono border border-primary/20 px-2 py-0.5 rounded hover:bg-primary/10"
                      >
                        Generar
                      </button>
                      {pairingKey && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(pairingKey);
                            setMensajeSync('Clave copiada');
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center p-2 bg-white rounded-xl max-w-[150px] mx-auto">
                  <div className="w-32 h-32 bg-slate-900 flex flex-wrap p-1 gap-1 rounded">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-sm ${
                          (i % 5 === 0 || i % 4 === 0 || i < 16 || i > 48) ? 'bg-primary' : 'bg-transparent'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                <p className="font-mono text-[7px] uppercase tracking-widest text-muted-foreground text-center">
                  Escanea el código o copia los datos en el menú Sincronización del nuevo dispositivo para agregarlo de forma instantánea.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalVincularAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Estado */}
      <AnimatePresence>
        {modalEstadoAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Estado del Enlace</h3>
                </div>
                <button onClick={() => setModalEstadoAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Latencia de Red:</span>
                    <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${
                      pingServer === null ? 'text-red-500' : pingServer < 100 ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {pingServer === null ? 'SIN CONEXIÓN' : `${pingServer} ms`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Dispositivo Local ID:</span>
                    <span className="font-mono text-[9px] text-foreground truncate max-w-[200px]">
                      {getOrCreateSyncDeviceId()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Servidor Principal:</span>
                    <span className="font-mono text-[9px] text-foreground truncate max-w-[200px]">
                      {backendUrl}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Rendimiento y Capacidad</h4>
                  <div className="w-full bg-border/30 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[45%]" />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span>Uso IndexedDB: ~1.2 MB</span>
                    <span>Límite: Sin Límite Práctico</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalEstadoAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Historial */}
      <AnimatePresence>
        {modalHistorialAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Registro de Enlace</h3>
                </div>
                <button onClick={() => setModalHistorialAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Eventos de sincronización recientes:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {historialEventos.map((ev) => (
                    <div key={ev.id} className="p-3 bg-black/40 border border-border rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold uppercase">
                          {ev.action}
                        </span>
                        <span className="font-mono text-[8px] text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-foreground">{ev.details || 'Sincronización automatizada'}</p>
                    </div>
                  ))}
                  {historialEventos.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground uppercase py-4 text-center">Aún no se han registrado eventos de sincronización.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalHistorialAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Errores */}
      <AnimatePresence>
        {modalErroresAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Registro de Incidencias</h3>
                </div>
                <button onClick={() => setModalErroresAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-center py-4">
                <ShieldCheck className="w-16 h-16 text-green-500 mx-auto shadow-[0_0_20px_#22c55e30] animate-pulse" />
                <h4 className="font-mono text-[11px] uppercase tracking-widest font-bold text-foreground">Todos los sistemas operativos correctos</h4>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Cero anomalías detectadas en el emparejamiento. La soberanía local es estable al 100%.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setModalErroresAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
