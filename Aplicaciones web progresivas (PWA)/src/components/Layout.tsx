import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Cpu, X, ChevronLeft, User, ChevronDown, LogOut, LogIn, Settings, HelpCircle, Code, LayoutGrid, Search, Layers, Database, Globe, Monitor, Terminal, Smartphone, Apple, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SECTIONS, getIconComponent } from '../config/sections';
import type { IdSeccion } from '../types';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider, microsoftProvider, appleProvider, manejarErrorDatos, TipoAccionDatos } from '../lib/core';
import { useAuthState } from '../lib/oss/useAuthState';
import { signInWithPopup, signOut, signInWithRedirect } from '../lib/oss/auth';
import type { GoogleAuthProvider, OAuthProvider } from '../lib/oss/auth';
import { getOS, OS } from '../lib/os';
import { getOrCreateSyncDeviceId, getSyncDeviceDisplayName } from '../lib/oss/autoSync';
import { usePWAInstall } from '../lib/usePWAInstall';
import { getHardwareProfile } from '../lib/hardwareProfile';

interface PropsDiseño {
  children: React.ReactNode;
  seccionActiva: IdSeccion;
  alNavegar: (id: IdSeccion) => void;
  alternarTema: () => void;
  modoColor: boolean;
  arturoLinkActivo: boolean;
  alternarArturoLink: () => void;
}

interface GitAutoPushStatus {
  enabled: boolean;
  isHealthy: boolean;
  lastCheckAt: number | null;
  lastPushAt: number | null;
  lastSuccessAt: number | null;
  lastError: string | null;
  lastCommitMessage: string | null;
  consecutiveFailures: number;
  nextRetryInMs: number;
}

const OWNER_EMAILS = ['miguela.apipilhuazco@hotmail.com', 'miguelaarrioja@hotmail.com', 'miguelarrioja@hotmail.com'];
const OWNER_ALIASES = ['miguela.apipilhuazco', 'miguelaarrioja', 'miguelarrioja'];

const esCorreoPropietario = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return OWNER_EMAILS.includes(normalizedEmail) || OWNER_ALIASES.some((alias) => normalizedEmail.startsWith(alias));
};

const ICONOS_SO: Record<OS, any> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
  android: Smartphone,
  ios: Smartphone,
  unknown: ShieldAlert
};

export default function Diseño({ children, seccionActiva, alNavegar, alternarTema, modoColor, arturoLinkActivo, alternarArturoLink }: PropsDiseño) {
  const { t } = useTranslation();
  const { isInstallable, installApp } = usePWAInstall();
  const perfilHardware = useRef(getHardwareProfile()).current;
  const [secuenciaArranque, setSecuenciaArranque] = useState(true);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [mensajeAuth, setMensajeAuth] = useState<string | null>(null);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  const [nombrePropuesto, setNombrePropuesto] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const refMenuUsuario = useRef<HTMLDivElement>(null);
  const [usuario, cargando] = useAuthState(auth);
  const [os, setOs] = useState<OS>('unknown');
  const [dispositivoCompartido, setDispositivoCompartido] = useState(false);
  const [nombreEquipoReal, setNombreEquipoReal] = useState<string>('');
  const [gitAutoPushStatus, setGitAutoPushStatus] = useState<GitAutoPushStatus | null>(null);
  type AuthProvider = GoogleAuthProvider | OAuthProvider;

  const NOMBRES_REALES: Record<string, string> = {
    'miguela.apipilhuazco@hotmail.com': 'Miguel A. Apipilhuazco',
    'miguelaarrioja@hotmail.com': 'Miguel Arrioja',
    'miguelarrioja@hotmail.com': 'Miguel Arrioja'
  };

  const obtenerAvatarFallback = (nombre: string) => {
    const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gradAvatar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gradAvatar)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="36" fill="#ffffff">${iniciales}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const correoVisible = (usuario?.email || localStorage.getItem('ecosystem_current_user') || '').trim();
  const nombreUsuarioVisible = NOMBRES_REALES[correoVisible.toLowerCase()] || (usuario?.displayName || correoVisible.split('@')[0] || 'Usuario').trim();
  const correoLocal = localStorage.getItem('ecosystem_current_user') || '';
  const esPropietario = esCorreoPropietario(correoLocal);
  const etiquetaSesion = usuario
    ? (dispositivoCompartido ? `Equipo compartido: ${nombreEquipoReal || 'desconocido'}` : `Equipo: ${nombreEquipoReal || 'desconocido'}`)
    : 'Offline';
  const mostrarAlertaGit = Boolean(gitAutoPushStatus?.lastError);

  const formatearUltimoPush = () => {
    if (!gitAutoPushStatus?.lastSuccessAt) return 'sin push reciente';
    return new Date(gitAutoPushStatus.lastSuccessAt).toLocaleString();
  };

  useEffect(() => {
    setOs(getOS());
    setNombreEquipoReal(getSyncDeviceDisplayName());
    const temporizador = setTimeout(() => setSecuenciaArranque(false), 1500);
    return () => clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    let active = true;

    const consultarEstadoGit = async () => {
      try {
        const response = await fetch('/api/git/auto-push-status');
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          setGitAutoPushStatus(data);
        }
      } catch {
        // Avoid noisy UI errors when backend is unavailable.
      }
    };

    consultarEstadoGit();
    const interval = setInterval(consultarEstadoGit, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (usuario) {
      if (usuario.email) {
        localStorage.setItem('last_login_email', usuario.email);
      }

      const sincronizarUsuario = async () => {
        const path = `users/${usuario.uid}`;
        try {
          const { setDoc, doc, serverTimestamp, getDoc, arrayUnion } = await import('../lib/oss/firestore');
          const { db } = await import('../lib/core');

          const deviceId = getOrCreateSyncDeviceId();
          const deviceName = getSyncDeviceDisplayName();
          setNombreEquipoReal(deviceName);
          const referenciaDispositivo = doc(db, 'devices', deviceId);
          const snapshotDispositivo = await getDoc(referenciaDispositivo);
          const cuentasPrevias = snapshotDispositivo.exists()
            ? ((snapshotDispositivo.data()?.linkedAccountIds as string[] | undefined) || [])
            : [];
          const providerActual = usuario.providerData?.[0]?.providerId || 'unknown';

          const existeOtraCuentaEnEsteDispositivo = cuentasPrevias.some((uid) => uid !== usuario.uid);
          setDispositivoCompartido(existeOtraCuentaEnEsteDispositivo);

          await setDoc(
            referenciaDispositivo,
            {
              deviceId,
              name: deviceName,
              os,
              linkedAccountIds: arrayUnion(usuario.uid),
              linkedProviders: arrayUnion(providerActual),
              updatedAt: serverTimestamp(),
              createdAt: snapshotDispositivo.exists() ? snapshotDispositivo.data()?.createdAt || serverTimestamp() : serverTimestamp(),
            },
            { merge: true }
          );

          const userRef = doc(db, 'users', usuario.uid);
          const userSnap = await getDoc(userRef);
          const esNuevoUsuario = !userSnap.exists();
          const esOwner = esCorreoPropietario(usuario.email || '');
          const nombreBruto = usuario.displayName || '';
          const esNombreGenerado = !nombreBruto || nombreBruto.startsWith('USER_') || nombreBruto.startsWith('Dispositivo');

          // Derivar nombre limpio desde email: sin doble espacio, capitalizado
          const nombreDesdeEmail = usuario.email
            ? usuario.email.split('@')[0]
                .replace(/[._\-]+/g, ' ')   // puntos/guiones → espacio
                .replace(/\s+/g, ' ')        // colapsar dobles espacios
                .replace(/\b\w/g, (c: string) => c.toUpperCase())
                .trim()
            : 'Usuario';

          let nombreFinal = esNombreGenerado ? nombreDesdeEmail : nombreBruto;

          // Si el nombre es generado, consultar fuentes externas de forma silenciosa
          if (esNombreGenerado && usuario.email) {
            try {
              const msToken = (usuario as any)?.stsTokenManager?.accessToken || '';
              const resolveUrl = `/api/resolve-name?email=${encodeURIComponent(usuario.email)}${msToken ? `&msToken=${encodeURIComponent(msToken)}` : ''}`;
              const resolveRes = await fetch(resolveUrl);
              if (resolveRes.ok) {
                const resolveData = await resolveRes.json();
                if (resolveData?.name) {
                  // Limpiar también el nombre recibido de fuentes externas
                  nombreFinal = resolveData.name.replace(/\s+/g, ' ').trim();
                }
              }
            } catch (_) {
              // Fallo silencioso → usa nombreDesdeEmail
            }
          }

          await setDoc(userRef, {
            displayName: nombreFinal,
            photoURL: usuario.photoURL || null,
            email: usuario.email,
            lastSeen: serverTimestamp(),
            status: 'online',
            lastDeviceId: deviceId,
            deviceLinked: true,
            deviceSharedAcrossAccounts: existeOtraCuentaEnEsteDispositivo,
            // Solo asignar approvalStatus si es usuario nuevo
            ...(esNuevoUsuario ? { approvalStatus: esOwner ? 'approved' : 'pending' } : {}),
          }, { merge: true });
        } catch (error) {
          manejarErrorDatos(error, TipoAccionDatos.ESCRITURA, path);
        }
      };
      sincronizarUsuario();
    } else {
      setDispositivoCompartido(false);
    }
  }, [usuario, os]);

  // Autologeo silencioso con dispositivo vinculado si no hay sesion de Firebase iniciada
  useEffect(() => {
    if (!cargando && !usuario) {
      manejarInicioSesion('dispositivo');
    }
  }, [usuario, cargando]);

  const construirProveedoresSegunSO = (): AuthProvider[] => {
    const proveedorPrincipalPorSO: Record<OS, AuthProvider> = {
      windows: microsoftProvider,
      macos: appleProvider,
      ios: appleProvider,
      android: googleProvider,
      linux: googleProvider,
      unknown: googleProvider,
    };

    const principal = proveedorPrincipalPorSO[os];
    const restantes = [googleProvider, microsoftProvider, appleProvider].filter((p) => p !== principal);
    return [principal, ...restantes];
  };

  const prepararProveedores = (modo: 'dispositivo' | 'cambiar') => {
    const prompt = modo === 'dispositivo' ? 'none' : 'select_account';
    googleProvider.setCustomParameters({ prompt });
    microsoftProvider.setCustomParameters({ prompt });
    appleProvider.setCustomParameters({ prompt });
  };

  const manejarInicioSesion = async (modo: 'dispositivo' | 'cambiar') => {
    const proveedores = construirProveedoresSegunSO();
    prepararProveedores(modo);
    setMensajeAuth(
      modo === 'dispositivo'
        ? 'Intentando iniciar con la cuenta vinculada al dispositivo...'
        : 'Abriendo selección de cuenta...'
    );

    for (const provider of proveedores) {
      try {
        await signInWithPopup(auth, provider);
        setMensajeAuth(null);
        setMenuUsuarioAbierto(false);
        return;
      } catch (error: any) {
        const code = error?.code || '';

        if (code === 'auth/operation-not-allowed' || code === 'auth/invalid-provider-id') {
          continue;
        }

        if (code === 'auth/popup-closed-by-user') {
          setMensajeAuth('El acceso se canceló antes de completar la autenticación.');
          return;
        }

        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          try {
            setMensajeAuth('Redirigiendo para continuar el acceso...');
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectError: any) {
            console.error('Error en redirect auth', redirectError);
            continue;
          }
        }

        if (code === 'auth/interaction-required' || code === 'auth/login-required') {
          if (modo === 'dispositivo') {
            continue;
          }
          setMensajeAuth('Se requiere seleccionar una cuenta disponible en el dispositivo.');
          return;
        }

        if (code === 'auth/unauthorized-domain') {
          setMensajeAuth('Este dominio no está autorizado. Verifica la lista de dominios permitidos del servidor de autenticación.');
          return;
        }

        console.error('Error al iniciar sesión', error);
      }
    }

    setMensajeAuth(
      modo === 'dispositivo'
        ? 'No se detectó cuenta previa. Se creó una sesión local vinculada al dispositivo.'
        : 'No fue posible iniciar sesión con los proveedores habilitados.'
    );
  };

  const manejarCierreSesion = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('ecosystem_logged_in');
      localStorage.removeItem('ecosystem_current_user');
      setMenuUsuarioAbierto(false);
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
      // Intentar forzar el logout local aun si falla firebase
      localStorage.removeItem('ecosystem_logged_in');
      localStorage.removeItem('ecosystem_current_user');
      window.location.reload();
    }
  };

  const guardarNombreConfirmado = async () => {
    if (!nombrePropuesto.trim() || !usuario) return;
    setGuardandoNombre(true);
    try {
      const { setDoc, doc, serverTimestamp } = await import('../lib/oss/firestore');
      const { db } = await import('../lib/core');
      await setDoc(doc(db, 'users', usuario.uid), {
        displayName: nombrePropuesto.trim(),
      }, { merge: true });
      setModalNombreAbierto(false);
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, `users/${usuario.uid}`);
    } finally {
      setGuardandoNombre(false);
    }
  };

  useEffect(() => {
    function manejarClickAfuera(event: MouseEvent) {
      if (refMenuUsuario.current && !refMenuUsuario.current.contains(event.target as Node)) {
        setMenuUsuarioAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickAfuera);
    return () => document.removeEventListener("mousedown", manejarClickAfuera);
  }, []);

  const LogoOS = ICONOS_SO[os];
  const seccionesPrincipales = SECTIONS.filter((seccion) => seccion.barraLateral);

  if (secuenciaArranque) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center font-mono text-primary z-[100]">
        <Cpu className={`w-16 h-16 mb-8 ${perfilHardware.tier === 'low' ? '' : 'animate-pulse'}`} />
        <div className={`text-xl tracking-[0.3em] uppercase text-center px-6 ${perfilHardware.tier === 'low' ? '' : 'animate-pulse'}`}>Inicializando Sistema...</div>
        <div className="mt-4 text-xs opacity-50 text-center px-6">Cargando Secuencias de Memoria...</div>
        <div className="mt-6 text-[10px] uppercase tracking-[0.3em] opacity-60 text-center px-6">
          Perfil detectado: {perfilHardware.tier.toUpperCase()} / Texturas {perfilHardware.features.textures.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] bg-background text-foreground flex flex-row overflow-hidden font-sans selection:bg-primary/30 selection:text-primary relative ${!modoColor ? 'grayscale' : ''}`}>
      
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-xl z-50 h-full">
        <div className="p-6 min-h-0 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex flex-col">
              <h1 className="text-xs font-bold tracking-[0.3em] uppercase leading-none">Ecosistema</h1>
              <span className="text-[8px] font-mono tracking-widest text-muted-foreground uppercase mt-1">Ecosystem v2.5</span>
            </div>
          </div>

          <nav className="space-y-1 overflow-y-auto pr-1 min-h-0">
            {seccionesPrincipales.map((seccion) => {
              const Icono = getIconComponent(seccion.icono);
              const estaActivo = seccionActiva === seccion.id;
              
              return (
                <button
                  key={seccion.id}
                  onClick={() => alNavegar(seccion.id as IdSeccion)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                    estaActivo 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icono className={`w-5 h-5 ${estaActivo ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t(seccion.titulo)}</span>
                  {estaActivo && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="ml-auto w-1 h-4 bg-primary-foreground rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
             <button 
               onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                className="w-full flex items-center gap-3 p-2 rounded-xl border border-border/50 hover:bg-muted transition-colors relative"
              >
                <img 
                  src={usuario?.photoURL || obtenerAvatarFallback(nombreUsuarioVisible)} 
                  alt="Perfil" 
                  className="w-8 h-8 rounded-full object-cover border border-border/50 bg-primary/10"
                />
                <div className="flex flex-col items-start overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-left">{nombreUsuarioVisible}</p>
                  <p className="text-[8px] text-muted-foreground font-mono truncate w-full text-left">{correoVisible || etiquetaSesion}</p>
                </div>
              </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="shrink-0 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex lg:hidden items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground">Ecosistema</span>
            {mostrarAlertaGit && (
              <span className="text-[8px] font-mono uppercase tracking-wider text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Git Sync con error
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              className="flex items-center gap-2 p-1 rounded-full border border-border/50 hover:bg-muted transition-colors"
            >
              <img 
                src={usuario?.photoURL || obtenerAvatarFallback(nombreUsuarioVisible)} 
                alt="Perfil" 
                className="w-8 h-8 rounded-full object-cover border border-border/50 bg-primary/10"
              />
            </button>
          </div>
        </header>

        {/* User Menu Modal (Floating) */}
        <AnimatePresence>
          {menuUsuarioAbierto && (
            <div className="absolute top-16 right-4 lg:top-auto lg:right-auto lg:bottom-24 lg:left-4 w-64 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl z-[60] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 lg:slide-in-from-bottom-2 duration-200">
              <div className="px-4 py-3 border-b border-border/50 mb-2 flex items-center gap-3">
                <img 
                  src={usuario?.photoURL || obtenerAvatarFallback(nombreUsuarioVisible)} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full object-cover border border-border/50 bg-primary/10 shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{nombreUsuarioVisible}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{correoVisible || "No autenticado"}</p>
                  <p className="text-[10px] text-primary/80 truncate font-mono mt-0.5">{etiquetaSesion}</p>
                </div>
              </div>
              {mostrarAlertaGit && (
                <div className="mx-3 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-amber-500">Auto-push con fallo</p>
                  <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed break-words">
                    {gitAutoPushStatus?.lastError}
                  </p>
                  <p className="text-[8px] text-muted-foreground/80 mt-1 uppercase tracking-wider">
                    Ultimo push ok: {formatearUltimoPush()}
                  </p>
                </div>
              )}
              {!usuario && (
                <>
                  <button
                    onClick={() => manejarInicioSesion('cambiar')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 font-mono uppercase tracking-widest"
                  >
                    <LogIn className="w-3 h-3" />
                    Iniciar Sesión con Dispositivo
                  </button>
                  {mensajeAuth && (
                    <div className="px-4 py-2 text-[10px] text-amber-400 font-mono leading-relaxed border-t border-border/50 mt-2">
                      {mensajeAuth}
                    </div>
                  )}
                </>
              )}
              {usuario && (
                <>
              <button 
                onClick={() => { alNavegar('configuracion'); setMenuUsuarioAbierto(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 font-mono uppercase tracking-widest"
              >
                <Settings className="w-3 h-3" />
                {t('Ajustes')}
              </button>
              {esPropietario && (
                <button 
                  onClick={() => { alNavegar('admin-center'); setMenuUsuarioAbierto(false); }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 font-mono uppercase tracking-widest"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {t('Admin')}
                </button>
              )}
              <button 
                onClick={() => { alNavegar('ayuda'); setMenuUsuarioAbierto(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 font-mono uppercase tracking-widest"
              >
                <HelpCircle className="w-3 h-3" />
                {t('Ayuda')}
              </button>
                </>
              )}

              {/* Botón de cierre de sesión local del Ecosistema */}
              <button 
                onClick={manejarCierreSesion}
                className="w-full text-left px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 border-t border-border/50 mt-1 pt-1.5 font-mono uppercase tracking-widest cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Cerrar Portal Local
              </button>

            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 lg:px-12 lg:py-12 scroll-smooth relative hide-scrollbar">
          <div className="max-w-7xl mx-auto w-full relative z-10">
            {children}

          </div>
        </main>

        {/* Bottom Navigation Dock (Mobile Only) */}
        <nav className="lg:hidden shrink-0 h-20 border-t border-border bg-background/80 backdrop-blur-xl flex items-center justify-center gap-2 px-2 pb-2 overflow-x-auto">
          {seccionesPrincipales.map((seccion) => {
            const Icono = getIconComponent(seccion.icono);
            const estaActivo = seccionActiva === seccion.id;
            
            return (
              <button
                key={seccion.id}
                onClick={() => alNavegar(seccion.id as IdSeccion)}
                className={`flex flex-col items-center justify-center gap-1 transition-all flex-none min-w-[74px] py-2 ${
                  estaActivo ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  estaActivo ? 'bg-primary/10 border border-primary/20 scale-110' : ''
                }`}>
                  <Icono className="w-5 h-5" />
                </div>
                <span className="text-[7px] font-bold uppercase tracking-widest truncate max-w-full px-1">
                  {t(seccion.titulo)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modal de confirmación de nombre */}
      {modalNombreAbierto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-lg uppercase tracking-[0.2em] text-foreground">¿Cuál es tu nombre?</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                No pudimos encontrarlo automáticamente. Puedes confirmarlo o escribirlo.
              </p>
            </div>
            <input
              type="text"
              value={nombrePropuesto}
              onChange={(e) => setNombrePropuesto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && guardarNombreConfirmado()}
              placeholder="Escribe tu nombre completo..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={guardarNombreConfirmado}
                disabled={guardandoNombre || !nombrePropuesto.trim()}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/80 transition-all disabled:opacity-40"
              >
                {guardandoNombre ? 'Guardando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setModalNombreAbierto(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 transition-all"
              >
                Omitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

