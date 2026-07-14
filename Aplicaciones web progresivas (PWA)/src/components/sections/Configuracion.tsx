import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Globe, Database, RefreshCw, Tv, Shield, Bot, Wifi, Bell, Palette, Accessibility, Wrench, Check, ChevronRight, User, Cpu, Smartphone, Laptop, Tablet, Server, Plus, X, Monitor, ChevronDown, History, Search, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { loadLanguage } from '../../i18n';
import CuentaEIdentidad from './CuentaEIdentidad';
import Historial from './Historial';
import {
  getSyncDeviceDisplayName,
  setSyncDeviceDisplayName,
  getSyncScopeConfig,
  setSyncScopeConfig,
} from '../../lib/oss/autoSync';
import { readDb, subscribeDb } from '../../lib/oss/store';
import { usePWAInstall } from '../../lib/usePWAInstall';

interface Device {
  id: string;
  label: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'laptop' | 'server';
  status: 'ONLINE' | 'OFFLINE';
}

interface PropiedadesConfiguracion {
  tema: 'light' | 'dark';
  alternarTema: () => void;
  modoColor: boolean;
  alternarModoColor: () => void;
  alNavegar: (id: any) => void;
}

type TipoAjuste = 'toggle' | 'select' | 'action';

interface DefinicionAjuste {
  id: string;
  label: string;
  type: TipoAjuste;
  options?: { value: string; label: string }[];
  action?: () => void;
}

interface DefinicionCategoria {
  title: string;
  icon: any;
  items: DefinicionAjuste[];
}

export default function Configuracion({ tema, alternarTema, modoColor, alternarModoColor, alNavegar }: PropiedadesConfiguracion) {
  const { t, i18n } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const syncConfigInicial = getSyncScopeConfig();
  const enlaceInicial = localStorage.getItem('arturo_link_activo');
  
  const [ajustesActivos, setAjustesActivos] = useState<Record<string, any>>(() => {
    const guardado = (localStorage.getItem('ajustes_sistema') || "").trim();
    if (guardado && !['undefined', 'null', '[object Object]'].includes(guardado)) {
      try {
        const parsed = JSON.parse(guardado);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      "wifi": true,
      "proteccion": true,
      "cifrado": true,
      "sonidos": true,
      "animaciones": true,
      "transparencia": true,
      "telemetria": false,
      "activar_link": enlaceInicial ? enlaceInicial === 'true' : true,
      "pausar": enlaceInicial ? enlaceInicial !== 'true' : false,
      "consola_depuracion": localStorage.getItem('ecosystem_debug') === 'true',
    };
  });

  const [nombreEquipoSync, setNombreEquipoSync] = useState<string>(() => getSyncDeviceDisplayName());
  const [modoSync, setModoSync] = useState<'all' | 'custom'>(syncConfigInicial.mode);
  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState<string[]>(syncConfigInicial.collections);
  const [coleccionesDisponibles, setColeccionesDisponibles] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('ajustes_sistema', JSON.stringify(ajustesActivos));
  }, [ajustesActivos]);

  const [consultaBusqueda, setConsultaBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<DefinicionCategoria | null>(null);
  const [aviso, setAviso] = useState<{ mensaje: string; visible: boolean }>({ mensaje: '', visible: false });

  const mostrarAviso = (mensaje: string) => {
    setAviso({ mensaje, visible: true });
  };

  const manejarAlternar = (id: string) => {
    const nuevoEstado = !ajustesActivos[id];

    setAjustesActivos(prev => {
      if (id === 'activar_link') {
        localStorage.setItem('arturo_link_activo', String(nuevoEstado));
        return {
          ...prev,
          activar_link: nuevoEstado,
          pausar: !nuevoEstado,
        };
      }

      if (id === 'pausar') {
        const enlaceActivo = !nuevoEstado;
        localStorage.setItem('arturo_link_activo', String(enlaceActivo));
        return {
          ...prev,
          pausar: nuevoEstado,
          activar_link: enlaceActivo,
        };
      }

      if (id === 'consola_depuracion') {
        if (nuevoEstado) {
          localStorage.setItem('ecosystem_debug', 'true');
          import('eruda').then(module => {
            const eruda = module.default;
            if (!(window as any).__ecosystemErudaInitialized) {
              eruda.init();
              (window as any).__ecosystemErudaInitialized = true;
            }
          }).catch(e => console.warn(e));
        } else {
          localStorage.removeItem('ecosystem_debug');
          import('eruda').then(module => {
            const eruda = module.default;
            try {
              eruda.destroy();
            } catch(e) {}
            (window as any).__ecosystemErudaInitialized = false;
          }).catch(e => console.warn(e));
        }
      }

      return {
        ...prev,
        [id]: nuevoEstado
      };
    });

    mostrarAviso(`${t(id)} ${nuevoEstado ? t('Activado') : t('Desactivado')}`);
  };

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

  const manejarCambioIdioma = async (idioma: string) => {
    await loadLanguage(idioma);
    mostrarAviso(`${t('Idioma')} -> ${idioma.toUpperCase()}`);
  };

  useEffect(() => {
    if (aviso.visible) {
      const temporizador = setTimeout(() => {
        setAviso(prev => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(temporizador);
    }
  }, [aviso.visible, aviso.mensaje]);

  const categorias: DefinicionCategoria[] = [
    {
      title: t("Cuenta e Identidad"),
      icon: User,
      items: [
        { id: "vincular_cuenta", label: t("Vincular Identidad Única"), type: "action", action: () => {
          const id = window.prompt(t("Ingrese ID de identidad"));
          if (id) {
            mostrarAviso(t("Identidad vinculada"));
          }
        }},
        { id: "mi_id", label: t("Copiar Mi ID"), type: "action", action: () => {
          navigator.clipboard.writeText("ID_SISTEMA_DEMO_01");
          mostrarAviso(t("ID Copiado"));
        }},
        { id: "identidad_unificada", label: t("Identidad unificada"), type: "toggle" },
        { id: "cuentas_vinculadas", label: t("Cuentas vinculadas"), type: "action" },
      ]
    },
    { 
      title: t("Idioma"), 
      icon: Globe, 
      items: [
        { 
          id: "idioma_actual", 
          label: t("Seleccionar idioma"), 
          type: "select", 
          options: [
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
            { value: 'it', label: 'Italiano' },
            { value: 'pt', label: 'Português' },
            { value: 'ja', label: '日本語' },
            { value: 'zh', label: '中文' },
            { value: 'ru', label: 'Русский' },
            { value: 'ar', label: 'العربية' },
            { value: 'hi', label: 'हिन्दी' },
            { value: 'ko', label: '한국어' },
            { value: 'nah', label: 'Náhuatl' },
            { value: 'que', label: 'Quechua' },
            { value: 'aym', label: 'Aymara' },
            { value: 'gua', label: 'Guaraní' },
          ]
        },
      ] 
    },
    { 
      title: t("Sincronización"), 
      icon: RefreshCw, 
      items: [
        { id: "activar_link", label: t("Activar Enlace (Syncthing)"), type: "toggle" },
        { id: "pausar", label: t("Pausar Sincronización"), type: "toggle" },
        { id: "prioridad", label: t("Prioridad de Tráfico"), type: "action" },
        { id: "programacion", label: t("Programación Horaria"), type: "action" },
        { id: "uso_de_datos", label: t("Límite de Uso de Datos"), type: "action" },
        { id: "sincronizacion_selectiva", label: t("Sincronización Selectiva de Directorios"), type: "action" },
      ] 
    },
    { 
      title: t("Almacenamiento"), 
      icon: Database, 
      items: [
        { id: "espacio_utilizado", label: t("Espacio Utilizado (Ceph / MinIO)"), type: "action" },
        { id: "cache", label: t("Limpiar Caché local y Redis"), type: "action", action: () => mostrarAviso(t("Caché local y Redis limpiado")) },
        { id: "compresion", label: t("Compresión de datos en tránsito"), type: "toggle" },
        { id: "descargas", label: t("Ubicación de Descargas"), type: "action" },
        { id: "archivos_temporales", label: t("Limpiar Archivos Temporales"), type: "action" },
      ] 
    },
    {
      title: t("Red y Conectividad"),
      icon: Wifi,
      items: [
        { id: "wifi", label: t("Conexión de Red"), type: "toggle" },
        { id: "telemetria", label: t("Enviar datos de telemetría"), type: "toggle" },
        { id: "proxy", label: t("Configurar Proxy (Nginx)"), type: "action" },
        { id: "kafka_broker", label: t("Estado de Mensajería (Kafka)"), type: "action" },
      ]
    },
    {
      title: t("Seguridad y Privacidad"),
      icon: Shield,
      items: [
        { id: "proteccion", label: t("Protección en Tiempo Real"), type: "toggle" },
        { id: "cifrado", label: t("Cifrado Extremo a Extremo"), type: "toggle" },
        { id: "auditoria", label: t("Registros de Auditoría"), type: "action" },
        { id: "firewall", label: t("Reglas de Firewall"), type: "action" },
      ]
    },
    {
      title: t("Interfaz y Aspecto"),
      icon: Palette,
      items: [
        { id: "tema", label: t("Modo Oscuro (Dark Theme)"), type: "toggle", action: () => alternarTema() },
        { id: "modo_color", label: t("Modo Color (High Contrast)"), type: "toggle", action: () => alternarModoColor() },
        { id: "animaciones", label: t("Habilitar Animaciones"), type: "toggle" },
        { id: "transparencia", label: t("Efectos de Transparencia"), type: "toggle" },
      ]
    },
    {
      title: t("Inteligencia Artificial"),
      icon: Bot,
      items: [
        { id: "ia_local", label: t("Motor de IA Local (Ollama)"), type: "toggle" },
        { id: "model_select", label: t("Modelo Activo (vLLM)"), type: "select", options: [
          { value: 'llama3', label: 'Llama 3' },
          { value: 'mistral', label: 'Mistral 7B' },
          { value: 'phi3', label: 'Phi-3' },
          { value: 'ollama', label: 'Ollama' },
          { value: 'ecosystem_v1', label: 'Ecosystem-LLM v1' }
        ]},
        { id: "temperatura", label: t("Ajustar Temperatura de Generación"), type: "action" },
      ]
    },
    {
      title: t("Notificaciones"),
      icon: Bell,
      items: [
        { id: "sonidos", label: t("Efectos de Sonido"), type: "toggle" },
        { id: "notificaciones_push", label: t("Notificaciones de Escritorio"), type: "toggle" },
        { id: "alertas_criticas", label: t("Alertas Críticas del Sistema"), type: "toggle" },
        { id: "mensajes_ia", label: t("Sugerencias de Inteligencia"), type: "toggle" },
        { id: "seguridad_datos", label: t("Alertas de Seguridad de Datos"), type: "toggle" },
        { id: "actualizaciones", label: t("Avisos de Actualización"), type: "toggle" },
        { id: "resumen_actividad", label: t("Resumen de Actividad Diario"), type: "toggle" },
      ]
    },
    {
      title: t("Avanzado y Herramientas"),
      icon: Wrench,
      items: [
        { id: "modo_desarrollador", label: t("Modo Desarrollador"), type: "toggle" },
        { id: "consola_depuracion", label: t("Consola de Depuración (Eruda)"), type: "toggle" },
        { id: "logs_level", label: t("Nivel de Logs"), type: "select", options: [
          { value: 'error', label: 'ERROR' },
          { value: 'warn', label: 'WARN' },
          { value: 'info', label: 'INFO' },
          { value: 'debug', label: 'DEBUG' }
        ]},
        { id: "reset_sistema", label: t("Restablecer Valores de Fábrica"), type: "action", action: () => mostrarAviso(t("Valores del sistema restablecidos")) },
      ]
    },
    {
      title: t("Aplicación Móvil / PC (PWA)"),
      icon: Smartphone,
      items: [
        { id: "pwa_status", label: t("Estado de Instalación"), type: "action", action: () => {
          if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            mostrarAviso(t("Ejecutándose como aplicación nativa"));
          } else {
            mostrarAviso(t("Ejecutándose en navegador web"));
          }
        }},
        { id: "pwa_install_btn", label: isInstalled ? t("Aplicación ya Instalada") : (isInstallable ? t("Instalar en este Dispositivo") : t("Instalar (No disponible)")), type: "action", action: () => {
          if (isInstallable) {
            installApp().then(success => {
              if (success) mostrarAviso(t("¡Instalación exitosa!"));
            });
          } else if (isInstalled) {
            mostrarAviso(t("Ya está ejecutándose como aplicación."));
          } else {
            mostrarAviso(t("La instalación nativa rápida no está lista. Usa la opción 'Instalar' del navegador."));
          }
        }}
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16 relative pb-16 px-4"
    >
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => alNavegar('inicio')}
          className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
          title={t("Volver")}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
            {t("Ajustes")}
          </h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em] opacity-70">
            {t("PREFERENCIAS DEL ECOSISTEMA")}
          </p>
        </div>
      </header>

      {categoriaActiva && (
        <button 
          onClick={() => setCategoriaActiva(null)}
          className="lg:hidden font-mono text-xs uppercase tracking-widest text-primary hover:text-foreground transition-colors flex items-center gap-2 mb-6"
        >
          <span className="text-lg">←</span> {t("Volver")}
        </button>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category List Sidebar / Grid */}
        {!categoriaActiva ? (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorias.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setCategoriaActiva(cat)}
                  className="ecosystem-card w-full p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden text-left"
                >
                  <div className="relative z-10 flex flex-col gap-1">
                    <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                      {t("Configurar")} {cat.title.toLowerCase()}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                  </div>

                  {/* Decorative background icon */}
                  
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar (Tablet/Desktop) */}
            <div className="hidden lg:block w-72 shrink-0 space-y-2">

              
              <div className="space-y-1">
                {categorias.map((cat, i) => {
                  const isActive = categoriaActiva?.title === cat.title;
                  return (
                    <button
                      key={i}
                      onClick={() => setCategoriaActiva(cat)}
                      className={`w-full p-3 flex items-center gap-4 transition-all text-left rounded-xl group ${
                        isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <cat.icon className={`w-4 h-4 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                      <h3 className="font-display font-medium uppercase tracking-[0.1em] text-[10px]">
                        {cat.title}
                      </h3>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <categoriaActiva.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-foreground uppercase leading-none">{categoriaActiva.title}</h2>
                  <p className="font-mono text-muted-foreground uppercase text-[8px] tracking-widest mt-1 opacity-60">
                    {t("Parámetros y preferencias")}
                  </p>
                </div>
              </div>

              {categoriaActiva.title === t("Cuenta e Identidad") ? (
                <CuentaEIdentidad />
              ) : (
                <div className="space-y-8">
                  {categoriaActiva.title === t("Idioma") ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <input 
                          type="text" 
                          placeholder={t("Buscar idioma...")} 
                          className="w-full bg-black border border-primary/20 pl-12 pr-4 py-4 rounded-2xl text-sm font-mono text-foreground outline-none focus:border-primary transition-all"
                          value={consultaBusqueda}
                          onChange={(e) => setConsultaBusqueda(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoriaActiva.items[0].options
                          ?.filter(opt => opt.label.toLowerCase().includes(consultaBusqueda.toLowerCase()))
                          .map(opt => (
                            <button 
                              key={opt.value}
                              onClick={() => manejarCambioIdioma(opt.value)}
                              className={`ecosystem-card p-4 text-left transition-all group relative overflow-hidden ${
                                i18n.language === opt.value ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
                              }`}
                            >
                              <div className="relative z-10">
                                <span className={`font-mono text-[10px] uppercase tracking-widest ${i18n.language === opt.value ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                  {opt.label}
                                </span>
                              </div>
                              
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {categoriaActiva.items.map((item, j) => {
                        const esAlternar = item.type === 'toggle';
                        const esAccion = item.type === 'action';
                        const esSeleccion = item.type === 'select';
                        const estaActivo = item.id === 'tema' ? tema === 'dark' : (item.id === 'modo_color' ? modoColor : ajustesActivos[item.id] || false);
                        
                        return (
                          <div 
                            key={j} 
                            onClick={() => {
                              if (esAlternar) {
                                if (item.action) item.action();
                                else manejarAlternar(item.id);
                              } else if (esAccion && item.action) {
                                item.action();
                              }
                            }}
                            className={`ecosystem-card p-5 flex flex-col justify-between gap-4 transition-all group relative overflow-hidden min-h-[120px] ${
                              !esSeleccion ? 'cursor-pointer hover:border-primary/50' : ''
                            }`}
                          >
                            <div className="relative z-10">
                              <h4 className="font-display font-medium uppercase tracking-[0.15em] text-[10px] text-foreground group-hover:text-primary transition-colors">
                                {item.label}
                              </h4>
                              <p className="font-mono text-[7px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                {t("Ajuste del sistema")}
                              </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-auto">
                              {esAlternar && (
                                <div 
                                  className={`w-10 h-5 rounded-full p-1 transition-colors cursor-pointer ${estaActivo ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-muted-foreground/30'}`}
                                >
                                  <div className={`w-3 h-3 rounded-full bg-background transition-transform ${estaActivo ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                              )}

                              {esSeleccion && (
                                <select
                                  onClick={(e) => e.stopPropagation()}
                                  title={item.label}
                                  aria-label={item.label}
                                  value={item.id === 'idioma_actual' ? i18n.language : (ajustesActivos[item.id] || (item.options?.[0]?.value))}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (item.id === 'idioma_actual') {
                                      manejarCambioIdioma(val);
                                    } else {
                                      setAjustesActivos(prev => ({ ...prev, [item.id]: val }));
                                      mostrarAviso(`${t(item.label)} -> ${val.toUpperCase()}`);
                                    }
                                  }}
                                  className="w-full bg-black/40 border border-border rounded-lg text-foreground font-mono text-[9px] uppercase tracking-widest px-2 py-1.5 outline-none focus:border-primary/50 backdrop-blur-sm"
                                >
                                  {item.options?.map(opt => (
                                    <option key={opt.value} value={opt.value} className="bg-black text-foreground">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {esAccion && !esSeleccion && (
                                <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                              )}
                            </div>

                            {/* Background decoration */}
                            
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {categoriaActiva.title === t("Notificaciones") && (
                    <div className="space-y-8 pt-8 border-t border-border/30 mt-8">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <History className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{t("Historial Reciente")}</h3>
                          <p className="text-[8px] font-mono uppercase text-muted-foreground tracking-widest mt-0.5">{t("Registro de actividad y alertas")}</p>
                        </div>
                      </div>
                      <div className="ecosystem-card bg-card/20 backdrop-blur-md p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <Historial />
                      </div>
                    </div>
                  )}

                  {categoriaActiva.title === t("Sincronización") && (
                    <div className="space-y-4 pt-8 border-t border-border/30 mt-8">
                      <div className="ecosystem-card p-5 sm:p-6 space-y-4 bg-card/30">
                        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Estado de sincronizacion</h3>
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          Equipo: {nombreEquipoSync} | Modo: {modoSync === 'all' ? 'Todo' : 'Personalizado'}
                        </p>
                      </div>

                      <div className="ecosystem-card p-5 sm:p-6 space-y-4 bg-card/30">
                        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Nombre real del equipo</h3>
                        <div className="flex flex-col md:flex-row gap-2">
                          <input
                            value={nombreEquipoSync}
                            onChange={(e) => setNombreEquipoSync(e.target.value)}
                            placeholder="MI-EQUIPO-PRINCIPAL"
                            className="flex-1 bg-black/40 border border-border rounded-lg text-foreground font-mono text-[9px] uppercase tracking-widest px-3 py-2 outline-none focus:border-primary/50 backdrop-blur-sm"
                          />
                          <button
                            onClick={() => {
                              setSyncDeviceDisplayName(nombreEquipoSync);
                              setNombreEquipoSync(getSyncDeviceDisplayName());
                              mostrarAviso('Nombre de equipo actualizado');
                            }}
                            className="px-4 py-2 rounded-lg border border-border text-[9px] font-mono uppercase tracking-[0.2em] hover:border-primary/50 transition-colors"
                          >
                            Guardar nombre
                          </button>
                        </div>
                      </div>

                      <div className="ecosystem-card p-5 sm:p-6 space-y-4 bg-card/30">
                        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Sincronizacion global o personalizada</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setModoSync('all');
                              setSyncScopeConfig({ mode: 'all', collections: coleccionesSeleccionadas });
                              mostrarAviso('Modo sincronizacion: todo');
                            }}
                            className={`px-4 py-2 rounded-lg border text-[9px] font-mono uppercase tracking-[0.2em] transition-colors ${
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
                              mostrarAviso('Modo sincronizacion: personalizado');
                            }}
                            className={`px-4 py-2 rounded-lg border text-[9px] font-mono uppercase tracking-[0.2em] transition-colors ${
                              modoSync === 'custom'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            Personalizada
                          </button>
                        </div>

                        {modoSync === 'custom' && (
                          <div className="space-y-2">
                            {coleccionesDisponibles.length === 0 ? (
                              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                                No hay colecciones detectadas aun.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                                      className={`px-3 py-2 rounded-lg border text-left text-[9px] font-mono uppercase tracking-[0.2em] transition-colors ${
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>


      {/* Toast Notification */}
      <AnimatePresence>
        {aviso.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 px-6 py-3 bg-background/90 backdrop-blur-xl border border-primary/30 rounded-full shadow-[0_0_20px_var(--glow)] flex items-center gap-3 pointer-events-none"
          >
            <Check className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-widest text-foreground">{aviso.mensaje}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

