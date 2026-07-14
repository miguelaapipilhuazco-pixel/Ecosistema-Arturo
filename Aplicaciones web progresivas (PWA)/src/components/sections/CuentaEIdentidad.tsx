import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Hash, UserSquare, CreditCard, Shield, Eye, Settings, Globe, Clock, Languages, Code, ArrowLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '../../lib/oss/useAuthState';
import { auth } from '../../lib/core';
import i18n from '../../i18n';

export default function CuentaEIdentidad() {
  const { t } = useTranslation();
  const [usuario] = useAuthState(auth);
  
  const [opcionActiva, setOpcionActiva] = useState<string | null>(null);
  const [alias, setAlias] = useState(usuario?.displayName || "");
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState(i18n.language);
  const [vpnActiva, setVpnActiva] = useState(false);
  const [regionVpn, setRegionVpn] = useState('us-east');
  const [zonaHoraria, setZonaHoraria] = useState('UTC-6');
  const [telemetria, setTelemetria] = useState(false);

  const opciones = [
    { title: t("Foto"), icon: Camera },
    { title: t("Alias"), icon: Hash },
    { title: t("Cuenta"), icon: UserSquare },
    { title: t("Plan"), icon: CreditCard },
    { title: t("Identidad"), icon: Shield },
    { title: t("Privacidad"), icon: Eye },
    { title: t("Idioma"), icon: Languages },
    { title: t("VPN"), icon: Globe },
    { title: t("Zona horaria"), icon: Clock },
    { title: t("Preferencias"), icon: Settings },
    { title: t("Centro de Administración"), icon: Code },
  ];

  const renderDetalles = (title: string) => {
    switch (title) {
      case t("Foto"):
        return (
          <div className="mt-4 flex flex-col gap-3">
             <p className="text-xs text-muted-foreground">Sube una nueva imagen de perfil.</p>
             <input type="file" className="text-xs" accept="image/*" />
             <button className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit mt-2 hover:opacity-90">Guardar</button>
          </div>
        );
      case t("Alias"):
        return (
           <div className="mt-4 flex flex-col gap-3">
             <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} className="bg-background text-foreground px-4 py-2 text-xs font-mono w-full max-w-xs border border-border focus:border-primary outline-none" placeholder="Nuevo alias" />
             <button className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit mt-2 hover:opacity-90">Actualizar</button>
           </div>
        );
      case t("Cuenta"):
        return (
           <div className="mt-4 flex flex-col gap-3">
             <p className="text-xs text-muted-foreground font-mono">Email: {usuario?.email || 'N/A'}</p>
             <p className="text-xs text-muted-foreground font-mono">ID: {usuario?.uid || 'invitado-123'}</p>
             <button className="border border-destructive text-destructive px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit hover:bg-destructive/10 mt-2">Restablecer Contraseña</button>
           </div>
        );
      case t("Plan"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <div className="p-4 border border-primary/20 bg-primary/5 w-fit rounded-lg">
                <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Ecosystem Free</p>
                <p className="text-xs text-muted-foreground">Plan actual</p>
             </div>
             <button className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit mt-2 hover:opacity-90">Actualizar a Pro</button>
           </div>
         );
      case t("Identidad"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <p className="text-xs text-muted-foreground">Gestiona tus métodos de autenticación.</p>
             <div className="flex gap-2 mt-2">
                 <button className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-muted">Configurar 2FA</button>
                 <button className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-muted">Ver sesiones activas</button>
             </div>
           </div>
         );
      case t("Privacidad"):
         return (
           <div className="mt-4 flex flex-col gap-4">
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" checked={telemetria} onChange={(e) => setTelemetria(e.target.checked)} className="accent-primary" />
               <span className="text-xs uppercase tracking-widest">Compartir telemetría anónima</span>
             </label>
             <button className="border border-destructive text-destructive px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit hover:bg-destructive/10 mt-2">Borrar mis datos</button>
           </div>
         );
      case t("Idioma"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <select 
               value={idiomaSeleccionado} 
               onChange={(e) => {
                 setIdiomaSeleccionado(e.target.value);
                 i18n.changeLanguage(e.target.value);
               }} 
               className="bg-background text-foreground px-4 py-2 text-xs font-mono w-full max-w-xs border border-border focus:border-primary outline-none"
             >
               <option value="es">Español</option>
               <option value="en">English</option>
             </select>
           </div>
         );
      case t("VPN"):
         return (
           <div className="mt-4 flex flex-col gap-4">
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" checked={vpnActiva} onChange={(e) => setVpnActiva(e.target.checked)} className="accent-primary" />
               <span className="text-xs uppercase tracking-widest">Activar VPN Global</span>
             </label>
             {vpnActiva && (
               <select value={regionVpn} onChange={(e) => setRegionVpn(e.target.value)} className="bg-background text-foreground px-4 py-2 text-xs font-mono w-full max-w-xs border border-border focus:border-primary outline-none mt-2">
                 <option value="us-east">US East (Virginia)</option>
                 <option value="eu-west">EU West (London)</option>
                 <option value="ap-south">AP South (Mumbai)</option>
               </select>
             )}
           </div>
         );
      case t("Zona horaria"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <select value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)} className="bg-background text-foreground px-4 py-2 text-xs font-mono w-full max-w-xs border border-border focus:border-primary outline-none">
               <option value="UTC-6">UTC-6 (Ciudad de México)</option>
               <option value="UTC-5">UTC-5 (Nueva York)</option>
               <option value="UTC+1">UTC+1 (Madrid)</option>
               <option value="UTC+9">UTC+9 (Tokio)</option>
             </select>
           </div>
         );
      case t("Preferencias"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <p className="text-xs text-muted-foreground">Ajustes visuales y de notificaciones.</p>
             <div className="flex gap-2 mt-2">
                <button className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-muted">Notificaciones Push</button>
                <button className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-muted">Sonidos del sistema</button>
             </div>
           </div>
         );
      case t("Centro de Administración"):
         return (
           <div className="mt-4 flex flex-col gap-3">
             <p className="text-xs text-muted-foreground">Accede a las herramientas de administrador del ecosistema.</p>
             <button className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold w-fit mt-2 hover:opacity-90">Abrir Admin Center</button>
           </div>
         );
      default: return null;
    }
  };

  const optSeleccionada = opciones.find(o => o.title === opcionActiva);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-16 pb-12"
    >


      {/* Profile Header Card */}
      <div className="ecosystem-card p-6 sm:p-10 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 relative overflow-hidden group bg-card/40 backdrop-blur-lg border-primary/20">
        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-primary/30 p-1 bg-background/50 group-hover:border-primary/60 transition-all shrink-0 shadow-[0_0_20px_var(--glow)]">
          <div className="w-full h-full rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
            {usuario?.photoURL ? (
              <img src={usuario.photoURL} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <UserSquare className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-lg shadow-primary/30">
            <Camera className="w-3 h-3" />
          </div>
        </div>
        
        <div className="relative z-10 overflow-hidden text-center sm:text-left flex-1">
          <h2 className="font-display text-2xl sm:text-4xl tracking-[0.15em] uppercase mb-2 truncate">
            {usuario?.displayName || "USUARIO_ALFA"}
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 opacity-60">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {usuario?.email || "ECOSYSTEM_ID_NULL"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3 h-3" />
              {t("Acceso Nivel 1")}
            </p>
          </div>
        </div>

        {/* Background Decoration */}
        <Shield className="absolute -right-10 -top-10 w-64 h-64 text-primary/5 opacity-40 rotate-12 pointer-events-none" strokeWidth={1} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Options Grid / Sidebar */}
        {!opcionActiva ? (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {opciones.map((opt, i) => (
                <div 
                  key={i} 
                  className="ecosystem-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden bg-card/40 backdrop-blur-md"
                  onClick={() => setOpcionActiva(opt.title)}
                >
                  <div className="relative z-10 flex flex-col gap-1">
                    <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                      {opt.title}
                    </h3>
                    <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                      {t("Gestionar")} {opt.title.toLowerCase()}
                    </p>
                  </div>

                  <opt.icon className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar List (Tablet/Desktop) */}
            <div className="hidden lg:block w-72 shrink-0 space-y-2">
              <button 
                onClick={() => setOpcionActiva(null)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t("Volver al perfil")}</span>
              </button>

              <div className="space-y-1">
                {opciones.map((opt, i) => {
                  const isActive = opcionActiva === opt.title;
                  return (
                    <button
                      key={i}
                      onClick={() => setOpcionActiva(opt.title)}
                      className={`w-full p-3 flex items-center gap-4 transition-all text-left rounded-xl group relative overflow-hidden ${
                        isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <opt.icon className={`w-4 h-4 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                      <span className="font-display font-medium uppercase tracking-[0.1em] text-[10px] relative z-10">
                        {opt.title}
                      </span>
                      {isActive && (
                        <motion.div 
                          layoutId="opt-active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-20"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <motion.div
                key={opcionActiva}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <header className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setOpcionActiva(null)}
                    className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
                    title={t("Volver")}
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-[0.2em] text-foreground uppercase leading-none">{optSeleccionada?.title}</h2>
                    <p className="font-mono text-muted-foreground uppercase text-[8px] tracking-widest mt-1 opacity-60">
                      {t("Parámetro del ecosistema")}
                    </p>
                  </div>
                </header>

                <div className="ecosystem-card p-8 relative overflow-hidden min-h-[300px] bg-card/40 backdrop-blur-md">
                  <div className="relative z-10">
                    {renderDetalles(opcionActiva)}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
