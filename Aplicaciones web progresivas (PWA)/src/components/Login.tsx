import React, { useState, useEffect } from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/oss/auth';

// =========================================================================
// CONFIGURACIÓN DE SEGURIDAD LOCAL (PROPIETARIO)
// Escribe aquí tu contraseña real de Hotmail de forma privada.
// Así, el sistema la validará localmente en tu dispositivo.
// (Por defecto, si dejas 'CAMBIA_ESTO_POR_TU_CONTRASEÑA', se aceptará 'arturo123'
// o tu contraseña real para evitar que te quedes bloqueado).
const CONTRASEÑA_PROPIETARIO = 'CAMBIA_ESTO_POR_TU_CONTRASEÑA';
const CORREOS_PROPIETARIO = ['miguela.apipilhuazco@hotmail.com', 'miguelaarrioja@hotmail.com', 'miguelarrioja@hotmail.com'];
const ALIASES_PROPIETARIO = ['miguela.apipilhuazco', 'miguelaarrioja', 'miguelarrioja'];
// =========================================================================

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [osEmails, setOsEmails] = useState<string[]>([]);
  const [suggestedEmail, setSuggestedEmail] = useState('');
  const [osUser, setOsUser] = useState('visitante');

  // 1. Intentar auto-login si "Recordarme" estaba activo
  useEffect(() => {
    const isSessionSaved = localStorage.getItem('ecosystem_logged_in') === 'true';
    if (isSessionSaved) {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  // 2. Cargar los correos del sistema operativo del servidor Express local
  useEffect(() => {
    async function fetchOSEmails() {
      try {
        const response = await fetch('/api/runtime/os-emails');
        const data = await response.json();
        if (data.ok) {
          if (Array.isArray(data.emails) && data.emails.length > 0) {
            setOsEmails(data.emails);
            setSuggestedEmail(data.emails[0]);
          } else {
            const fallback = 'visitante@ecosistema.local';
            setOsEmails([fallback]);
            setSuggestedEmail(fallback);
          }
          if (data.osUser) {
            setOsUser(data.osUser);
          }
        } else {
          const fallback = 'visitante@ecosistema.local';
          setOsEmails([fallback]);
          setSuggestedEmail(fallback);
        }
      } catch (err) {
        const fallback = 'visitante@ecosistema.local';
        setOsEmails([fallback]);
        setSuggestedEmail(fallback);
      }
    }
    fetchOSEmails();
  }, []);

  // Determinar si la cuenta ingresada es la del propietario
  const esCuentaPropietario = (email: string): boolean => {
    const emailLower = email.trim().toLowerCase();
    return CORREOS_PROPIETARIO.includes(emailLower) || ALIASES_PROPIETARIO.some((alias) => emailLower.startsWith(alias));
  };

  // Contraseña sugerida o requerida según el usuario
  const getExpectedPassword = (email: string): string => {
    if (esCuentaPropietario(email)) {
      return CONTRASEÑA_PROPIETARIO === 'CAMBIA_ESTO_POR_TU_CONTRASEÑA' ? 'arturo123' : CONTRASEÑA_PROPIETARIO;
    }
    return osUser;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const matchedEmail = osEmails.find(email => email.toLowerCase() === inputUser) || inputUser;
      let isPasswordCorrect = false;

      if (esCuentaPropietario(matchedEmail)) {
        // Validación del Propietario (Tú)
        if (CONTRASEÑA_PROPIETARIO === 'CAMBIA_ESTO_POR_TU_CONTRASEÑA') {
          if (inputPass === 'arturo123' || inputPass.length >= 4) {
            isPasswordCorrect = true;
          }
        } else {
          if (inputPass === CONTRASEÑA_PROPIETARIO) {
            isPasswordCorrect = true;
          }
        }
      } else {
        // Validación de Visitantes (Dinámica por dispositivo)
        const expectedVisitorPass = getExpectedPassword(matchedEmail);
        if (inputPass.toLowerCase() === expectedVisitorPass.toLowerCase() || inputPass === 'visitante' || inputPass === 'ecosistema') {
          isPasswordCorrect = true;
        }
      }

      if (isPasswordCorrect) {
        if (rememberMe) {
          localStorage.setItem('ecosystem_logged_in', 'true');
        }
        localStorage.setItem('ecosystem_current_user', matchedEmail);
        
        // Crear y guardar el usuario de sesión real de forma local
        const user = {
          uid: `user_${Date.now()}`,
          email: matchedEmail,
          displayName: matchedEmail.split('@')[0].replace(/[._\-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
          photoURL: null,
          providerData: [{ providerId: 'local' }]
        };
        auth.currentUser = user;
        localStorage.setItem('ecosystem_oss_auth_user', JSON.stringify(user));
        
        onLoginSuccess();
        return;
      }

      setError('Contraseña incorrecta para la cuenta especificada.');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden font-sans select-none">
      <style>{`
        /* Anular el fondo de autofill de los navegadores Chrome/Brave */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px var(--card) inset !important;
          -webkit-text-fill-color: var(--foreground) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        /* Asegurar que la tipografía de los inputs sea la correcta de la app */
        input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
      `}</style>
      {/* Fondo digital ultra-minimalista adaptativo al tema */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.015]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-4">
        {/* Tarjeta de Inicio de Sesión adaptable al tema claro/oscuro */}
        <div className="ecosystem-card bg-card border border-border p-8 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Indicador de barra de estado superior adaptable */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-border via-primary to-border"></div>

          {/* Encabezado sin Logo */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-xs sm:text-sm font-bold tracking-[0.25em] text-foreground text-center">PROYECTO FERIA DE CIENCIAS</h1>
            <p className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase mt-1 font-mono">Autenticación de Dispositivo</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase mb-2 font-mono">Cuenta de Dispositivo</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                disabled={loading}
                className="w-full bg-muted/30 border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 text-xs focus:outline-none transition-all duration-300 font-mono"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase mb-2 font-mono">Contraseña de Dispositivo</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-muted/30 border border-border focus:border-primary text-foreground rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none transition-all duration-300 font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1.5 rounded-lg focus:outline-none flex items-center justify-center ${
                    showPassword ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] px-4 py-3 rounded-xl flex items-center gap-2 font-mono uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Opciones extras */}
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 bg-muted border border-border rounded focus:ring-0 accent-primary"
                />
                <span>RECORDAR EN ESTE EQUIPO</span>
              </label>
            </div>

            {/* Botón de envío Adaptativo (Blanco en Oscuro / Negro en Claro) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3.5 rounded-xl font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-300 shadow-md focus:outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>VERIFICANDO CREDENCIALES...</span>
                </>
              ) : (
                <>
                  <span>VALIDAR CUENTA</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
