import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, GraduationCap, Briefcase, Users, Gamepad2, Bot, Wrench, 
  Camera, Film, Plus, ChevronRight, Layout, Settings2, FileText, 
  AppWindow, Globe, Image, Video, Music, Layers, ArrowLeft, Cpu,
  Upload, X, Move, Copy, Scissors, Clipboard, Type, Tag, History, Search, Filter, SortAsc, Eye, Radio, Clock, Share2, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, auth, manejarErrorDatos, TipoAccionDatos } from '../../lib/core';
import { collection, onSnapshot, query, limit, addDoc, where } from '../../lib/oss/firestore';
import { useAuthState } from '../../lib/oss/useAuthState';
import { getIconComponent } from '../../config/sections';
import FileManager from '../FileManager';

export default function Espacios() {
  const { t } = useTranslation();
  const [usuarioActual] = useAuthState(auth);
  const [espacioActivo, setEspacioActivo] = useState<any | null>(null);
  const [carpetaActiva, setCarpetaActiva] = useState<string | null>(null);
  const [estaCreando, setEstaCreando] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [espacios, setEspacios] = useState<any[]>([
    { id: 'comunidad', name: t("Comunidad"), icon: Globe, color: "text-primary", desc: t("Usuarios conectados al ecosistema") },
    { id: 'nube', name: t("Nube"), icon: Layout, color: "text-sky-500", desc: t("Carpetas, programas y apps sincronizadas") },
    { id: 'ia_core', name: "Núcleo de Inteligencia", icon: Bot, color: "text-indigo-500", desc: t("Núcleo de inteligencia artificial") },
    { id: 'proyectos', name: t("Proyectos"), icon: Briefcase, color: "text-amber-500", desc: t("Gestión de activos y tareas") },
  ]);

  useEffect(() => {
    const rutaUsers = 'users';
    const qUsers = query(collection(db, rutaUsers), limit(50));
    const desvinUsers = onSnapshot(qUsers, (snapshot) => {
      // Solo mostrar usuarios aprobados por el admin
      setUsuarios(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.approvalStatus === 'approved')
      );
    }, (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, rutaUsers));

    const rutaDevices = 'devices';
    const qDevices = query(collection(db, rutaDevices), limit(50));
    const desvinDevices = onSnapshot(qDevices, (snapshot) => {
      setDispositivos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, rutaDevices));

    return () => { desvinUsers(); desvinDevices(); };
  }, []);

  // Agrupar usuarios por dispositivo: si varias cuentas comparten dispositivo, se muestran juntas
  const usuariosAgrupados = React.useMemo(() => {
    const uidMap = new Map<string, any>(usuarios.map(u => [u.id, u]));
    const vistos = new Set<string>();
    const grupos: Array<{ principal: any; cuentasVinculadas: any[] }> = [];

    // Primero agrupar los que comparten dispositivo
    for (const device of dispositivos) {
      const linkedIds: string[] = device.linkedAccountIds || [];
      if (linkedIds.length < 2) continue;
      const cuentas = linkedIds.map(uid => uidMap.get(uid)).filter(Boolean);
      if (cuentas.length === 0) continue;
      // Marcar todos como vistos
      linkedIds.forEach(uid => vistos.add(uid));
      // El principal es el que estuvo activo más recientemente
      const principal = cuentas.reduce((a, b) =>
        (a.lastSeen?.seconds || 0) >= (b.lastSeen?.seconds || 0) ? a : b
      );
      grupos.push({ principal, cuentasVinculadas: cuentas.filter(c => c.id !== principal.id) });
    }

    // Luego agregar los usuarios sin dispositivo compartido (cuentas independientes)
    for (const u of usuarios) {
      if (!vistos.has(u.id)) {
        grupos.push({ principal: u, cuentasVinculadas: [] });
      }
    }

    return grupos;
  }, [usuarios, dispositivos]);

  const [nombreNuevoEspacio, setNombreNuevoEspacio] = useState("");
  const [estaSugiriendo, setEstaSugiriendo] = useState(false);
  const [iconoSugerido, setIconoSugerido] = useState<{ icon: string, color: string } | null>(null);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null);
  const referenciaEntradaArchivo = useRef<HTMLInputElement>(null);

  const manejarSubidaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => {
        setFotoSeleccionada(lector.result as string);
      };
      lector.readAsDataURL(archivo);
    }
  };

  const manejarSugerirIcono = async () => {
    if (!nombreNuevoEspacio.trim() || fotoSeleccionada) return;
    setEstaSugiriendo(true);
    try {
      const respuesta = await fetch("/api/suggest-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombreNuevoEspacio }),
      });
      if (!respuesta.ok) {
        throw new Error(`HTTP error! status: ${respuesta.status}`);
      }
      
      const tipoContenido = respuesta.headers.get("content-type");
      if (!tipoContenido || !tipoContenido.includes("application/json")) {
        throw new Error(`Expected JSON but got: ${tipoContenido}`);
      }

      const datos = await respuesta.json();
      setIconoSugerido(datos);
    } catch (error) {
      console.error("Error al sugerir icono:", error);
    } finally {
      setEstaSugiriendo(false);
    }
  };

  const [historial, setHistorial] = useState<any[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    if (!usuarioActual) return;
    const ruta = 'space_history';
    const q = query(
      collection(db, ruta),
      where("userId", "==", usuarioActual.uid),
      limit(50)
    );
    const desvincular = onSnapshot(q, (snapshot) => {
      const registros = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
      setHistorial(registros);
    }, (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, ruta));
    return () => desvincular();
  }, [usuarioActual]);

  const registrarAccion = async (accion: string, nombreEspacio: string, detalles?: string) => {
    if (!usuarioActual) return;
    try {
      await addDoc(collection(db, 'space_history'), {
        userId: usuarioActual.uid,
        action: accion,
        spaceName: nombreEspacio,
        details: detalles,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error al registrar acción:", error);
    }
  };

  const manejarCrearEspacio = async () => {
    if (!nombreNuevoEspacio.trim()) return;
    
    if (idEditando) {
      const espacioViejo = espacios.find(s => s.id === idEditando);
      setEspacios(espacios.map(s => s.id === idEditando ? {
        ...s,
        name: nombreNuevoEspacio,
        photo: fotoSeleccionada,
        iconName: iconoSugerido?.icon || s.iconName,
        color: iconoSugerido?.color || s.color,
        desc: `${t("Espacio vinculado a")} ${nombreNuevoEspacio}`,
      } : s));
      
      await registrarAccion("UPDATE", nombreNuevoEspacio, `${t("Renombrado de")} ${espacioViejo?.name}`);
      
      setIdEditando(null);
      if (espacioActivo?.id === idEditando) {
        setEspacioActivo({
          ...espacioActivo,
          name: nombreNuevoEspacio,
          photo: fotoSeleccionada,
          iconName: iconoSugerido?.icon || espacioActivo.iconName,
          color: iconoSugerido?.color || espacioActivo.color,
        });
      }
    } else {
      const nuevoEspacio = {
        id: `space-${Date.now()}`,
        name: nombreNuevoEspacio,
        photo: fotoSeleccionada,
        iconName: iconoSugerido?.icon || 'Folder',
        color: iconoSugerido?.color || '#888888',
        desc: `${t("Espacio vinculado a")} ${nombreNuevoEspacio}`,
      };
      setEspacios([...espacios, nuevoEspacio]);
      await registrarAccion("CREATE", nombreNuevoEspacio, t("Nuevo espacio configurado"));
      setEstaCreando(false);
    }
    
    setNombreNuevoEspacio("");
    setIconoSugerido(null);
    setFotoSeleccionada(null);
  };

  const iniciarEdicion = (espacio: any) => {
    setIdEditando(espacio.id);
    setNombreNuevoEspacio(espacio.name);
    setFotoSeleccionada(espacio.photo || null);
    setIconoSugerido({ icon: espacio.iconName || 'Folder', color: espacio.color || '#888888' });
    setEstaCreando(false);
  };

  const manejarAccion = async (idAccion: string) => {
    if (!espacioActivo) return;
    
    switch (idAccion) {
      case 'log':
        setMostrarHistorial(!mostrarHistorial);
        break;
      case 'new':
        setEstaCreando(true);
        break;
      case 'rename':
        iniciarEdicion(espacioActivo);
        break;
      case 'search':
        console.log("Buscar en", espacioActivo.name);
        break;
      default:
        await registrarAccion("ACTION", espacioActivo.name, `${t("Acción ejecutada")}: ${idAccion}`);
        break;
    }
  };

  const acciones = [
    { id: 'new', icon: Plus, label: t('Crear') },
    { id: 'move', icon: Move, label: t('Mover') },
    { id: 'copy', icon: Copy, label: t('Copiar') },
    { id: 'cut', icon: Scissors, label: t('Cortar') },
    { id: 'paste', icon: Clipboard, label: t('Pegar') },
    { id: 'rename', icon: Type, label: t('Renombrar') },
    { id: 'tags', icon: Tag, label: t('Etiquetas') },
    { id: 'versions', icon: History, label: t('Versiones') },
    { id: 'share', icon: Share2, label: t('Compartir') },
    { id: 'search', icon: Search, label: t('Buscar') },
    { id: 'filter', icon: Filter, label: t('Filtrar') },
    { id: 'sort', icon: SortAsc, label: t('Ordenar') },
    { id: 'preview', icon: Eye, label: t('Vista Previa') },
    { id: 'stream', icon: Radio, label: t('Streaming') },
    { id: 'log', icon: Clock, label: t('Historial') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16 pb-16"
    >
      <header className="flex flex-row items-center gap-4 mb-8">
        {espacioActivo && (
          <button
            onClick={() => {
              if (carpetaActiva) {
                setCarpetaActiva(null);
              } else {
                setEspacioActivo(null);
              }
            }}
            className="p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            title={t("Volver")}
            aria-label={t("Volver")}
          >
            <span className="text-xl">←</span>
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
            {espacioActivo ? t("Archivos") : t("ESPACIOS")}
          </h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em] opacity-70">
            {espacioActivo 
              ? (carpetaActiva 
                  ? `${espacioActivo.name} / ${t(carpetaActiva)}` 
                  : espacioActivo.name)
              : t("ECOSISTEMA DE COLABORACIÓN")
            }
          </p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {(estaCreando || idEditando) ? (
          <motion.div 
            key="creating"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto space-y-8 py-10"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
                {idEditando ? t("Edita la configuración") : t("Configura tu nuevo espacio")}
              </h2>
              <button 
                onClick={() => { setEstaCreando(false); setIdEditando(null); setIconoSugerido(null); setNombreNuevoEspacio(""); setFotoSeleccionada(null); }}
                className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> {t("Volver")}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div 
                    onClick={() => referenciaEntradaArchivo.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex items-center justify-center group"
                  >
                    {fotoSeleccionada ? (
                      <>
                        <img src={fotoSeleccionada} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-muted/40 opacity-100 flex items-center justify-center transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <Camera className="w-8 h-8" />
                        <span className="text-[8px] font-mono uppercase tracking-widest">{t("Foto")}</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={referenciaEntradaArchivo} 
                    onChange={manejarSubidaFoto} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("Nombre del Espacio")}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nombreNuevoEspacio}
                      onChange={(e) => {
                        setNombreNuevoEspacio(e.target.value);
                        if (iconoSugerido) setIconoSugerido(null);
                      }}
                      onBlur={manejarSugerirIcono}
                      onKeyDown={(e) => e.key === 'Enter' && manejarSugerirIcono()}
                      placeholder={t("Ej: Universidad, Mi Startup, Viajes...")}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 font-display text-sm focus:outline-none focus:border-primary/50 transition-all"
                      autoFocus
                    />
                    {estaSugiriendo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Cpu className="w-4 h-4 text-primary/50" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(iconoSugerido || fotoSeleccionada) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ecosystem-card p-6 flex flex-col items-center gap-4 border-primary/20 bg-primary/5"
                >
                  <div className="relative">
                    {fotoSeleccionada ? (
                      <div className="w-16 h-16 rounded-full shadow-xl overflow-hidden bg-background">
                        <img src={fotoSeleccionada} alt="Final Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : iconoSugerido && (
                      <div 
                        className="p-4 rounded-2xl bg-background border border-border shadow-xl"
                        style={{ color: iconoSugerido.color }}
                      >
                        {React.createElement(getIconComponent(iconoSugerido.icon), { className: "w-8 h-8" })}
                      </div>
                    )}
                    {fotoSeleccionada && (
                      <button 
                        onClick={() => setFotoSeleccionada(null)}
                        className="absolute -top-1 -right-1 p-1 bg-background border border-border rounded-full hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
                      {fotoSeleccionada ? t("Foto Importada") : t("IA Sugiere")}
                    </p>
                    <h3 className="font-display text-lg font-bold">{nombreNuevoEspacio}</h3>
                  </div>
                  
                  <button
                    onClick={manejarCrearEspacio}
                    className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-display text-xs uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    {idEditando ? t("Guardar Cambios") : t("Confirmar y Crear")}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : !espacioActivo ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {espacios.map((espacio) => {
              const Icono = typeof espacio.icon === 'string' ? getIconComponent(espacio.icon) : (espacio.iconName ? getIconComponent(espacio.iconName) : espacio.icon);
              return (
                <div key={espacio.id} className="relative group">
                  <motion.button 
                    onClick={() => { setCarpetaActiva(null); setEspacioActivo(espacio); }}
                    className="ecosystem-card p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden text-left w-full"
                  >
                    <div className="relative z-10 flex flex-col gap-1">
                      <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                        {espacio.name}
                      </h3>
                      <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                        {espacio.desc || t("Ver detalles")}
                      </p>
                    </div>

                    <Icono className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
                  </motion.button>
                  
                  {espacio.id !== 'comunidad' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); iniciarEdicion(espacio); }}
                      className="absolute top-1/2 -translate-y-1/2 right-12 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100 z-20"
                      title={t("Configurar")}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            <motion.button 
              onClick={() => setEstaCreando(true)}
              className="ecosystem-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all border-dashed border-2 opacity-40 hover:opacity-100 bg-card/20 backdrop-blur-md text-left"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] uppercase text-foreground group-hover:text-primary transition-colors">{t("Crear nueva")}</h3>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                  {t("Inicia un nuevo espacio")}
                </p>
              </div>
              <div className="w-8 h-8 rounded border border-border border-dashed flex items-center justify-center bg-muted/30 group-hover:border-primary/30 transition-all">
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {espacioActivo.id === 'comunidad' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {usuariosAgrupados.map(({ principal, cuentasVinculadas }) => (
                  <div key={principal.id} className="ecosystem-card p-6 flex items-center gap-4 group hover:border-primary/40 transition-all bg-card/20 backdrop-blur-md">
                    {/* Foto principal */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary/20 p-0.5 bg-background/50 shadow-[0_0_25px_var(--primary-shadow)] group-hover:shadow-[0_0_40px_var(--primary-shadow-hover)] transition-all duration-500">
                        <img
                          src={principal.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(principal.displayName || 'U')}&background=888&color=fff`}
                          alt={principal.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {/* Fotos de cuentas vinculadas apiladas */}
                      {cuentasVinculadas.slice(0, 2).map((cv, ci) => (
                        <img
                          key={cv.id}
                          src={cv.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cv.displayName || 'U')}&background=555&color=fff`}
                          alt={cv.displayName}
                          title={cv.email || cv.displayName}
                          className="absolute -bottom-1 rounded-full border border-border object-cover w-6 h-6"
                          style={{ right: `${ci * 18}px`, zIndex: 10 - ci }}
                        />
                      ))}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xs sm:text-sm uppercase tracking-[0.2em] truncate">
                        {principal.displayName || 'Usuario'}
                        {principal.id === usuarioActual?.uid && <span className="ml-2 text-[9px] text-primary font-bold">(TÚ)</span>}
                      </h3>
                      <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest opacity-50 mt-0.5 truncate">
                        {principal.email || ''}
                      </p>
                      {cuentasVinculadas.length > 0 && (
                        <p className="font-mono text-[8px] text-primary/60 uppercase tracking-widest mt-1">
                          +{cuentasVinculadas.length} cuenta{cuentasVinculadas.length > 1 ? 's' : ''} vinculada{cuentasVinculadas.length > 1 ? 's' : ''}
                        </p>
                      )}
                      <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest opacity-40 mt-0.5">
                        {principal.status || 'OFFLINE'}
                      </p>
                    </div>
                    {/* Indicador online */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${principal.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-muted-foreground opacity-30'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <FileManager 
                  idContexto={espacioActivo.id} 
                  nombreContexto={espacioActivo.name} 
                  onBack={() => setEspacioActivo(null)} 
                  carpetaActivaProp={carpetaActiva}
                  setCarpetaActivaProp={setCarpetaActiva}
                  hideHeader={true}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
