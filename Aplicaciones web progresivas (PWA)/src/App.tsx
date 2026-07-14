/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import type { IdSeccion } from './types';
import Diseño from './components/Layout';
import ActiveAppContainer from './components/sections/ActiveAppContainer';
import { startAutoSync } from './lib/oss/autoSync';
import Login from './components/Login';
import type { HardwareProfile } from './lib/hardwareProfile';
import { getHardwareProfile } from './lib/hardwareProfile';

const Inicio = lazy(() => import('./components/sections/Inicio'));
const MaquinaVirtual = lazy(() => import('./components/sections/MaquinaVirtual'));
const AdminCenter = lazy(() => import('./components/sections/AdminCenter'));
const Carpetas = lazy(() => import('./components/sections/Espacios'));
const Buscar = lazy(() => import('./components/sections/Buscar'));
const Sincronizacion = lazy(() => import('./components/sections/Sincronizacion'));
const Streaming = lazy(() => import('./components/sections/Streaming'));
const IA = lazy(() => import('./components/sections/IA'));
const Seguridad = lazy(() => import('./components/sections/Seguridad'));
const XR = lazy(() => import('./components/sections/XR'));
const Sistema = lazy(() => import('./components/sections/Sistema'));
const Compartidos = lazy(() => import('./components/sections/Compartidos'));
const Estadisticas = lazy(() => import('./components/sections/Estadisticas'));
const Configuracion = lazy(() => import('./components/sections/Configuracion'));
const Ayuda = lazy(() => import('./components/sections/Ayuda'));
const Historial = lazy(() => import('./components/sections/Historial'));

const OWNER_EMAILS = ['miguela.apipilhuazco@hotmail.com', 'miguelaarrioja@hotmail.com', 'miguelarrioja@hotmail.com'];
const OWNER_ALIASES = ['miguela.apipilhuazco', 'miguelaarrioja', 'miguelarrioja'];

const esCorreoPropietario = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return OWNER_EMAILS.includes(normalizedEmail) || OWNER_ALIASES.some((alias) => normalizedEmail.startsWith(alias));
};

export default function Aplicacion() {
  const perfilHardware = useMemo<HardwareProfile>(() => getHardwareProfile(), []);
  const [sesionIniciada, setSesionIniciada] = useState<boolean>(() => {
    return localStorage.getItem('ecosystem_logged_in') === 'true';
  });
  const [seccionActiva, setSeccionActiva] = useState<IdSeccion>('inicio');
  const [tema, setTema] = useState<'light' | 'dark'>(() => {
    const guardado = localStorage.getItem('ecosystem_theme');
    return guardado === 'light' || guardado === 'dark' ? guardado : 'dark';
  });
  const [modoColor, setModoColor] = useState<boolean>(false);
  const [aplicacionIniciada, setAplicacionIniciada] = useState<any | null>(null);
  const [arturoLinkActivo, setArturoLinkActivo] = useState<boolean>(() => {
    const guardado = localStorage.getItem('arturo_link_activo');
    return guardado ? guardado === 'true' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    localStorage.setItem('ecosystem_theme', tema);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', tema === 'light' ? '#f2f2f4' : '#111113');
    }
  }, [tema]);

  useEffect(() => {
    localStorage.setItem('arturo_link_activo', String(arturoLinkActivo));
  }, [arturoLinkActivo]);

  useEffect(() => {
    if (!arturoLinkActivo) {
      return;
    }

    const stop = startAutoSync(5000);
    return () => stop();
  }, [arturoLinkActivo]);

  const alternarTema = () => setTema(tema === 'light' ? 'dark' : 'light');

  const fallbackCarga = (
    <div className="min-h-[50vh] flex items-center justify-center px-6 py-12">
      <div className="ecosystem-card max-w-md w-full p-6 text-center space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Cargando módulo
        </div>
        <div className="text-lg font-display uppercase tracking-[0.2em]">Ajustando carga según hardware</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Perfil detectado: {perfilHardware.tier.toUpperCase()} / {perfilHardware.rendererCategory}
        </p>
      </div>
    </div>
  );

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case 'inicio': return <Inicio onNavigate={setSeccionActiva} />;
      case 'buscar': return <Buscar alNavegar={setSeccionActiva} />;
      case 'sincronizacion': return <Sincronizacion arturoLinkActivo={arturoLinkActivo} onToggleArturoLink={() => setArturoLinkActivo((prev) => !prev)} alNavegar={setSeccionActiva} />;
      case 'streaming': return <Streaming alNavegar={setSeccionActiva} />;
      case 'ia': return <IA alNavegar={setSeccionActiva} />;
      case 'seguridad': return <Seguridad alNavegar={setSeccionActiva} />;
      case 'xr': return <XR alNavegar={setSeccionActiva} />;
      case 'sistema': return <Sistema alNavegar={setSeccionActiva} />;
      case 'compartidos': return <Compartidos alNavegar={setSeccionActiva} />;
      case 'estadisticas': return <Estadisticas alNavegar={setSeccionActiva} />;
      case 'maquina-virtual': return <MaquinaVirtual onLaunch={setAplicacionIniciada} appActiva={aplicacionIniciada} />;
      case 'admin-center': {
        const userEmail = localStorage.getItem('ecosystem_current_user') || '';
        const isOwner = esCorreoPropietario(userEmail);
        return isOwner ? <AdminCenter alNavegar={setSeccionActiva} /> : <Inicio onNavigate={setSeccionActiva} />;
      }
      case 'espacios': return <Carpetas />;
      case 'configuracion': return <Configuracion tema={tema} alternarTema={alternarTema} modoColor={modoColor} alternarModoColor={() => setModoColor(!modoColor)} alNavegar={setSeccionActiva} />;
      case 'ayuda': return <Ayuda alNavegar={setSeccionActiva} />;
      case 'historial': return <Historial alNavegar={setSeccionActiva} />;
      default: return <Inicio onNavigate={setSeccionActiva} />;
    }
  };

  if (!sesionIniciada) {
    return <Login onLoginSuccess={() => setSesionIniciada(true)} />;
  }

  return (
    <Diseño
      seccionActiva={seccionActiva}
      alNavegar={setSeccionActiva}
      alternarTema={alternarTema}
      modoColor={modoColor}
      arturoLinkActivo={arturoLinkActivo}
      alternarArturoLink={() => setArturoLinkActivo((prev) => !prev)}
    >
      <Suspense fallback={fallbackCarga}>
        {renderizarSeccion()}
      </Suspense>
      <ActiveAppContainer 
        app={aplicacionIniciada} 
        onExit={() => setAplicacionIniciada(null)} 
        visible={seccionActiva === 'maquina-virtual' && aplicacionIniciada !== null}
      />
    </Diseño>
  );
}

