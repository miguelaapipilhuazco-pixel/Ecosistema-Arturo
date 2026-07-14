import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Configuración": "Settings",
      "General": "General",
      "Idioma": "Language",
      "Tema": "Theme",
      "VPN": "VPN",
      "Accesibilidad": "Accessibility",
      "Almacenamiento": "Storage",
      "Caché": "Cache",
      "Compresión": "Compression",
      "Descargas": "Downloads",
      "Espacio": "Space",
      "Red": "Network",
      "WiFi": "WiFi",
      "Bluetooth": "Bluetooth",
      "Proxy": "Proxy",
      "Seguridad": "Security",
      "Protección": "Protection",
      "Cifrado": "Encryption",
      "Firewall": "Firewall",
      "Auditoría": "Audit",
      "Apariencia": "Appearance",
      "Resolución": "Resolution",
      "Animaciones": "Animations",
      "Transparencia": "Transparency",
      "Claro": "Light",
      "Oscuro": "Dark",
      "Sistema": "System",
      "Avanzado": "Advanced",
      "Desarrollador": "Developer",
      "Terminal": "Terminal",
      "Diagnóstico": "Diagnostics",
      "Sonidos": "Sounds",
      "Inglés": "English",
      "Español": "Spanish",
      "Activado": "Enabled",
      "Desactivado": "Disabled",
      "Limpiar caché": "Clear Cache",
      "Caché limpiado": "Cache Cleared",
      "Telemetría": "Telemetry",
      "Preferencias del sistema": "System Preferences",
      "Inicio": "Home",
      "Archivos": "Files",
      "Carpetas": "Folders",
      "Buscar": "Search",
      "Sincronización": "Sync",
      "Streaming": "Streaming",
      "Compartidos": "Shared",
      "IA": "AI",
      "XR": "XR",
      "Perfil": "Profile",
      "Dispositivos": "Devices",
      "Estadísticas": "Statistics",
      "Ayuda": "Help",
      "System OS": "System OS",
      "Arquitectura y Stack Tecnológico": "Architecture and Tech Stack",
      "Área": "Area",
      "Tecnología": "Technology",
      "Sistema Operativo": "Operating System",
      "Cliente de escritorio": "Desktop Client",
      "Aplicación móvil": "Mobile App",
      "Backend": "Backend",
      "Almacenamiento distribuido": "Distributed Storage",
      "Almacenamiento de objetos": "Object Storage",
      "Base de datos": "Database",
      "Contenedores": "Containers",
      "Orquestación": "Orchestration",
      "Mensajería": "Messaging",
      "Búsqueda": "Search Engine",
      "Monitorización": "Monitoring",
      "Servidor web": "Web Server",
      "Motor 3D": "3D Engine",
      "Ecosistema": "Ecosystem",
      "Nuevo Espacio": "New Space",
      "Volver": "Back",
      "Documentos": "Documents",
      "Imágenes": "Images",
      "Videos": "Videos",
      "Música": "Music",
      "Archivados": "Archived",
      "Universidad": "University",
      "Trabajo": "Work",
      "Familia": "Family",
      "Juegos": "Gaming",
      "Ingeniería": "Engineering",
      "Fotografía": "Photography",
      "Multimedia": "Multimedia",
      "Clases, apuntes y proyectos": "Classes, notes, and projects",
      "Documentos, reuniones y tareas": "Documents, meetings, and tasks",
      "Fotos compartidas y eventos": "Shared photos and events",
      "Librería y partidas guardadas": "Library and saved games",
      "Modelos, prompts y pruebas": "Models, prompts, and testing",
      "Planos, código y manuales": "Blueprints, code, and manuals",
      "RAWs, ediciones y álbumes": "RAWs, edits, and albums",
      "Películas, series y música": "Movies, series, and music",
      "Archivos recientes": "Recent Files",
      "Aplicaciones": "Applications",
      "Configuraciones": "Settings",
      "Ajustes": "Settings",
      "Proyectos": "Projects",
      "items": "items",
      "elementos encontrados": "items found",
      "Perfil y cuenta": "Profile and account",
      "Cerrar sesión": "Log Out",
      "Iniciar sesión": "Log In",
      "Foto": "Photo",
      "Alias": "Alias",
      "Cuenta": "Account",
      "Plan": "Plan",
      "Identidad": "Identity",
      "Privacidad": "Privacy",
      "Zona horaria": "Timezone",
      "Preferencias": "Preferences",
      "Centro de Administración": "Admin Center",
      "Dashboard": "Dashboard",
      "Usuarios": "Users",
      "Runtime": "Runtime",
      "Analítica": "Analytics",
      "Registros": "Logs",
      "Mantenimiento": "Maintenance",
      "Comunicaciones": "Communications",
      "Configuración Global": "Global Configuration",
      "Cuenta e identidad": "Account and identity",
      "No hay carpetas": "No folders",
      "Agregar archivo": "Add file",
      "Carpeta vacía": "Folder is empty",
      "Sincronizado": "Synced",
      "En línea": "Online",
      "Protegido": "Protected",
      "Activo": "Active",
      "Activos": "Active",
      "Comunidad": "Community",
      "Usuarios conectados al ecosistema": "Users connected to the ecosystem",
      "Espacio vacío": "Empty space",
      "Máquina Virtual": "Runtime",
      "Dispositivo": "Device",
      "Vincular": "Link",
      "Sincronizar todo": "Sync All",
      "Nombre del dispositivo": "Device Name",
      "Tipo de hardware": "Hardware Type",
      "Confirmar vínculo": "Confirm Link",
      "Batería": "Battery",
      "Señal": "Signal",
      "Carga CPU": "CPU Load",
      "UUID": "UUID",
      "¿Estás seguro?": "Are you sure?",
      "Detectando dispositivos...": "Detecting devices...",
      "Sincronizando con Cloud": "Syncing with Cloud",
      "Dispositivos detectados en el ecosistema": "Devices detected in the ecosystem",
      "Sesión Remota Activa": "Active Remote Session",
      "RAM": "RAM",
      "CPU": "CPU",
      "Conectar": "Connect",
      "Iniciando emulación...": "Starting emulation...",
      "Emulación de dispositivos": "Device Emulation",
      "Estado del Sistema": "System Status",
      "Encender": "Power On",
      "Apagar": "Power Off",
      "Reiniciar": "Restart",
      "Pantalla Completa": "Full Screen",
      "Captura": "Screenshot",
      "Ajustes de Runtime": "Runtime Settings",
      "Aplicaciones Instaladas": "Installed Apps",
      "Herramientas": "Tools",
      "Conectando a la instancia...": "Connecting to instance...",
      "Memoria RAM": "RAM Memory",
      "Procesador": "Processor",
      "Gráficos": "Graphics",
      "Zona de Peligro": "Danger Zone",
      "Borrar todos los datos": "Clear all data",
      "Elimina permanentemente archivos, espacios y configuraciones locales.": "Permanently deletes local files, spaces, and settings.",
      "¿Estás seguro? Esta acción no se puede deshacer.": "Are you sure? This action cannot be undone.",
      "Memoria vaciada": "Memory cleared",
      "Ejecutar": "Execute",
      "Vaciar": "Empty",
      "Dispositivos Vinculados": "Linked Devices",
      "Vincular Dispositivo": "Link Device",
      "Dispositivo vinculado": "Device linked",
      "Dispositivo desvinculado": "Device unlinked",
      "Tipo": "Type",
      "Confirmar": "Confirm",
      "No hay dispositivos vinculados": "No linked devices",
      "Vincule dispositivos en la sección de dispositivos": "Link devices in devices section",
      "Cancelar": "Cancel",
      "Cuenta e Identidad": "Account and Identity",
      "Vincular Cuenta": "Link Account",
      "Identidad unificada": "Unified Identity",
      "Cuentas vinculadas": "Linked Accounts",
      "Detectando identidad...": "Detecting identity...",
      "Identidad detectada": "Identity detected",
      "Vincular Identity": "Link Identity",
      "Ingrese ID de identidad": "Enter Identity ID",
      "Copiar Mi ID": "Copy My ID",
      "ID Copiado": "ID Copied"
    }
  },
  es: {
    translation: {
      "Configuración": "Configuración",
      "General": "General",
      "Idioma": "Idioma",
      "Tema": "Tema",
      "VPN": "VPN",
      "Accesibilidad": "Accesibilidad",
      "Almacenamiento": "Almacenamiento",
      "Caché": "Caché",
      "Compresión": "Compresión",
      "Descargas": "Descargas",
      "Espacio": "Espacio",
      "Red": "Red",
      "WiFi": "WiFi",
      "Bluetooth": "Bluetooth",
      "Proxy": "Proxy",
      "Seguridad": "Seguridad",
      "Protección": "Protección",
      "Cifrado": "Cifrado",
      "Firewall": "Firewall",
      "Auditoría": "Auditoría",
      "Apariencia": "Apariencia",
      "Resolución": "Resolución",
      "Animaciones": "Animaciones",
      "Transparencia": "Transparencia",
      "Claro": "Claro",
      "Oscuro": "Oscuro",
      "Sistema": "Sistema",
      "Avanzado": "Avanzado",
      "Desarrollador": "Desarrollador",
      "Terminal": "Terminal",
      "Diagnóstico": "Diagnóstico",
      "Sonidos": "Sonidos",
      "Inglés": "Inglés",
      "Español": "Español",
      "Activado": "Activado",
      "Desactivado": "Desactivado",
      "Limpiar caché": "Limpiar caché",
      "Caché limpiado": "Caché limpiado",
      "Telemetría": "Telemetría",
      "Preferencias del sistema": "Preferencias del sistema",
      "Inicio": "Inicio",
      "Archivos": "Archivos",
      "Carpetas": "Carpetas",
      "Buscar": "Buscar",
      "Sincronización": "Sincronización",
      "Streaming": "Streaming",
      "Compartidos": "Compartidos",
      "IA": "IA",
      "XR": "XR",
      "Perfil": "Perfil",
      "Dispositivos": "Dispositivos",
      "Estadísticas": "Estadísticas",
      "Ayuda": "Ayuda",
      "System OS": "System OS",
      "Arquitectura y Stack Tecnológico": "Arquitectura y Stack Tecnológico",
      "Área": "Área",
      "Tecnología": "Tecnología",
      "Sistema Operativo": "Sistema Operativo",
      "Cliente de escritorio": "Cliente de escritorio",
      "Aplicación móvil": "Aplicación móvil",
      "Backend": "Backend",
      "Almacenamiento distribuido": "Almacenamiento distribuido",
      "Almacenamiento de objetos": "Almacenamiento de objetos",
      "Base de datos": "Base de datos",
      "Contenedores": "Contenedores",
      "Orquestación": "Orchestration",
      "Mensajería": "Mensajería",
      "Búsqueda": "Búsqueda",
      "Monitorización": "Monitorización",
      "Servidor web": "Servidor web",
      "Motor 3D": "Motor 3D",
      "Ecosistema": "Ecosistema",
      "Nuevo Espacio": "Nuevo Espacio",
      "Volver": "Volver",
      "Documentos": "Documentos",
      "Imágenes": "Imágenes",
      "Videos": "Videos",
      "Música": "Música",
      "Archivados": "Archivados",
      "Universidad": "Universidad",
      "Trabajo": "Trabajo",
      "Familia": "Familia",
      "Juegos": "Juegos",
      "Ingeniería": "Ingeniería",
      "Fotografía": "Fotografía",
      "Multimedia": "Multimedia",
      "Clases, apuntes y proyectos": "Clases, apuntes y proyectos",
      "Documentos, reuniones y tareas": "Documentos, reuniones y tareas",
      "Fotos compartidas y eventos": "Fotos compartidas y eventos",
      "Librería y partidas guardadas": "Librería y partidas guardadas",
      "Modelos, prompts y pruebas": "Modelos, prompts y pruebas",
      "Planos, código y manuales": "Planos, código y manuales",
      "RAWs, ediciones y álbumes": "RAWs, ediciones y álbumes",
      "Películas, series y música": "Películas, series y música",
      "Archivos recientes": "Archivos recientes",
      "Aplicaciones": "Aplicaciones",
      "Configuraciones": "Configuraciones",
      "Ajustes": "Ajustes",
      "Proyectos": "Proyectos",
      "items": "elementos",
      "elementos encontrados": "elementos encontrados",
      "Perfil y cuenta": "Perfil y cuenta",
      "Cerrar sesión": "Cerrar sesión",
      "Abrir": "Abrir",
      "Cerrar": "Cerrar",
      "Buscar aplicación...": "Buscar aplicación...",
      "Modo Estándar": "Modo Estándar",
      "Modo XR": "Modo XR",
      "Conectado": "Conectado",
      "Pronto": "Pronto",
      "Nativo": "Nativo",
      "Config": "Config",
      "VR Ready": "VR Ready",
      "Identidad y Seguridad": "Identidad y Seguridad",
      "Hardware y Red": "Hardware y Red",
      "Ajustes del Sistema": "Ajustes del Sistema",
      "Chat Qwen": "Chat Ollama",
      "Gestor de Archivos": "Gestor de Archivos",
      "Iniciar sesión": "Iniciar sesión",
      "Foto": "Foto",
      "Alias": "Alias",
      "Cuenta": "Cuenta",
      "Plan": "Plan",
      "Identidad": "Identidad",
      "Privacidad": "Privacidad",
      "Zona horaria": "Zona horaria",
      "Preferencias": "Preferencias",
      "Centro de Administración": "Centro de Administración",
      "Dashboard": "Dashboard",
      "Usuarios": "Usuarios",
      "Runtime": "Runtime",
      "Analítica": "Analítica",
      "Registros": "Registros",
      "Mantenimiento": "Mantenimiento",
      "Comunicaciones": "Comunicaciones",
      "Configuración Global": "Configuración Global",
      "Cuenta e identidad": "Cuenta e identidad",
      "No hay carpetas": "No hay carpetas",
      "Agregar archivo": "Agregar archivo",
      "Carpeta vacía": "Carpeta vacía",
      "Sincronizado": "Sincronizado",
      "En línea": "En línea",
      "Protegido": "Protegido",
      "Activo": "Activo",
      "Activos": "Activos",
      "Comunidad": "Comunidad",
      "Usuarios conectados al ecosistema": "Usuarios conectados al ecosistema",
      "Espacio vacío": "Espacio vacío",
      "Máquina Virtual": "Runtime",
      "Dispositivo": "Dispositivo",
      "Vincular": "Vincular",
      "Sincronizar todo": "Sincronizar todo",
      "Nombre del dispositivo": "Nombre del dispositivo",
      "Tipo de hardware": "Tipo de hardware",
      "Confirmar vínculo": "Confirmar vínculo",
      "Batería": "Batería",
      "Señal": "Señal",
      "Carga CPU": "Carga CPU",
      "UUID": "UUID",
      "¿Estás seguro?": "¿Estás seguro?",
      "Detectando dispositivos...": "Detectando dispositivos...",
      "Sincronizando con Cloud": "Sincronizando con Cloud",
      "Dispositivos detectados en el ecosistema": "Dispositivos detectados en el ecosistema",
      "Sesión Remota Activa": "Sesión Remota Activa",
      "RAM": "RAM",
      "CPU": "CPU",
      "Conectar": "Conectar",
      "Iniciando emulación...": "Iniciando emulación...",
      "Emulación de dispositivos": "Emulación de dispositivos",
      "Estado del Sistema": "Estado del Sistema",
      "Encender": "Encender",
      "Apagar": "Apagar",
      "Reiniciar": "Reiniciar",
      "Pantalla Completa": "Pantalla Completa",
      "Captura": "Captura",
      "Ajustes de Runtime": "Ajustes de Runtime",
      "Aplicaciones Instaladas": "Aplicaciones Instaladas",
      "Herramientas": "Herramientas",
      "Conectando a la instancia...": "Conectando a la instancia...",
      "Memoria RAM": "Memoria RAM",
      "Procesador": "Procesador",
      "Gráficos": "Gráficos",
      "Zona de Peligro": "Zona de Peligro",
      "Borrar todos los datos": "Borrar todos los datos",
      "Elimina permanentemente archivos, espacios y configuraciones locales.": "Elimina permanentemente archivos, espacios y configuraciones locales.",
      "¿Estás seguro? Esta acción no se puede deshacer.": "¿Estás seguro? Esta acción no se puede deshacer.",
      "Memoria vaciada": "Memoria vaciada",
      "Ejecutar": "Ejecutar",
      "Vaciar": "Vaciar",
      "Dispositivos Vinculados": "Dispositivos Vinculados",
      "Vincular Dispositivo": "Vincular Dispositivo",
      "Dispositivo vinculado": "Dispositivo vinculado",
      "Dispositivo desvinculado": "Dispositivo desvinculado",
      "Tipo": "Tipo",
      "Confirmar": "Confirmar",
      "No hay dispositivos vinculados": "No hay dispositivos vinculados",
      "Vincule dispositivos en la sección de dispositivos": "Vincule dispositivos en la sección de dispositivos",
      "Cancelar": "Cancelar",
      "Cuenta e Identidad": "Cuenta e Identidad",
      "Vincular Cuenta": "Vincular Cuenta",
      "Identidad unificada": "Identidad unificada",
      "Cuentas vinculadas": "Cuentas vinculadas",
      "Detectando identidad...": "Detectando identidad...",
      "Identidad detectada": "Identidad detectada",
      "Vincular Identity": "Vincular Identity",
      "Ingrese ID de identidad": "Ingrese ID de identidad",
      "Copiar Mi ID": "Copiar Mi ID",
      "ID Copiado": "ID Copiado"
    }
  }
};

import { pipeline, env } from '@xenova/transformers';

// Configure transformers to avoid WebGL/WebGPU issues in iframe
env.allowLocalModels = true;
env.useBrowserCache = true;
if (typeof window !== 'undefined') {
  // Disable GPU/WebGL backends to avoid version detection errors in restricted environments
  // @ts-ignore
  env.backends.onnx.wasm.proxy = true;
  // @ts-ignore
  env.backends.onnx.gpu = false;
  // @ts-ignore
  env.backends.onnx.wasm.numThreads = 1;
}

// Helper to load language using transformers.js
let translator: any = null;

export const loadLanguage = async (lang: string) => {
  // Check if already loaded
  if (i18n.hasResourceBundle(lang, 'translation')) {
    i18n.changeLanguage(lang);
    return;
  }

  // Try to load from cache
  const cached = (localStorage.getItem(`lang_${lang}`) || "").trim();
  if (cached && !['undefined', 'null', '[object Object]'].includes(cached)) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        i18n.addResourceBundle(lang, 'translation', parsed, true, true);
        i18n.changeLanguage(lang);
        return;
      }
    } catch (e) {
      console.error("Invalid cache found, clearing...", e);
      localStorage.removeItem(`lang_${lang}`);
    }
  } else if (['undefined', 'null', '[object Object]'].includes(cached) || cached === '') {
    localStorage.removeItem(`lang_${lang}`);
  }

  // Load translator pipeline if not loaded
  if (!translator) {
    try {
      translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
    } catch (e) {
      console.error("Failed to load translator pipeline:", e);
      // Fallback: don't translate
      i18n.changeLanguage(lang);
      return;
    }
  }

  // Translate each string
  const source = resources.es.translation;
  const translated: Record<string, string> = {};

  const langMap: Record<string, string> = {
    'es': 'spa_Latn',
    'en': 'eng_Latn',
    'fr': 'fra_Latn',
    'de': 'deu_Latn',
    'it': 'ita_Latn',
    'pt': 'por_Latn',
    'ja': 'jpn_Jpan',
    'zh': 'zho_Hans',
    'ru': 'rus_Cyrl',
    'ar': 'arb_Arab',
    'hi': 'hin_Deva',
    'ko': 'kor_Hang',
    'nah': 'nch_Latn',
    'que': 'que_Latn',
    'aym': 'aym_Latn',
    'gua': 'grn_Latn',
  };

  const targetLang = langMap[lang] || 'eng_Latn';

  try {
    for (const [key, value] of Object.entries(source)) {
        const output = await translator(value, {
            src_lang: 'spa_Latn',
            tgt_lang: targetLang,
        });
        translated[key] = output[0].translation_text;
    }

    localStorage.setItem(`lang_${lang}`, JSON.stringify(translated));
    i18n.addResourceBundle(lang, 'translation', translated, true, true);
  } catch (e) {
    console.error("Translation failed:", e);
  }
  
  i18n.changeLanguage(lang);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    lng: 'es', // Force Spanish
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
