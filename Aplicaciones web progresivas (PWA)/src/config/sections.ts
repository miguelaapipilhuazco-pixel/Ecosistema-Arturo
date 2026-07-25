import { 
  Home, 
  Folder, 
  Globe, 
  Settings, 
  HelpCircle,
  Briefcase,
  Code,
  Camera,
  Music,
  Play,
  Users,
  Shield,
  Cpu,
  Gamepad2,
  Box,
  Layers,
  GraduationCap,
  Building2,
  User,
  Archive,
  Star,
  FileText,
  Image,
  Video,
  Monitor,
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import type { Seccion } from '../types';

export const SECTIONS: Seccion[] = [
  { id: 'espacios', titulo: 'Carpetas', icono: 'Folder', descripcion: 'Contextos y proyectos', barraLateral: true },
  { id: 'inicio', titulo: 'Inicio', icono: 'Home', descripcion: 'Panel principal', barraLateral: true },
  { id: 'maquina-virtual', titulo: 'RUNTIME', icono: 'Play', descripcion: 'Motor de compatibilidad universal', barraLateral: false },
  { id: 'vm-terminal', titulo: 'Terminal KVM', icono: 'Terminal', descripcion: 'Consola de la VM', barraLateral: true },
  { id: 'vm-brave', titulo: 'Brave Browser', icono: 'Globe', descripcion: 'Navegador Web', barraLateral: true },
  { id: 'vm-vscode', titulo: 'VS Code', icono: 'Code', descripcion: 'Editor de código', barraLateral: true },
  { id: 'vm-antigravity', titulo: 'Antigravity AI', icono: 'Bot', descripcion: 'Asistente de IA', barraLateral: true },
  { id: 'vm-ollama', titulo: 'Ollama Local', icono: 'Cpu', descripcion: 'Motor local IA', barraLateral: true },
  { id: 'vm-wolvic', titulo: 'Wolvic VR', icono: 'Box', descripcion: 'Realidad virtual', barraLateral: true },
  { id: 'vm-playstore', titulo: 'Play Store', icono: 'Smartphone', descripcion: 'Google Play', barraLateral: true },

  { id: 'buscar', titulo: 'Buscar', icono: 'Search', descripcion: 'Busqueda inteligente', barraLateral: false },
  { id: 'sincronizacion', titulo: 'Sincronizacion', icono: 'RefreshCw', descripcion: 'ENLACE PROYECTO', barraLateral: false },
  { id: 'streaming', titulo: 'Streaming', icono: 'Play', descripcion: 'Contenido bajo demanda', barraLateral: false },
  { id: 'ia', titulo: 'IA', icono: 'Cpu', descripcion: 'Asistente inteligente', barraLateral: false },
  { id: 'seguridad', titulo: 'Seguridad', icono: 'Shield', descripcion: 'Privacidad y proteccion', barraLateral: false },
  { id: 'xr', titulo: 'XR', icono: 'Box', descripcion: 'Realidad virtual y mixta', barraLateral: false },
  { id: 'sistema', titulo: 'Sistema', icono: 'Layers', descripcion: 'Arquitectura y stack', barraLateral: false },
  { id: 'compartidos', titulo: 'Compartidos', icono: 'Users', descripcion: 'Permisos y enlaces', barraLateral: false },
  { id: 'estadisticas', titulo: 'Estadisticas', icono: 'BarChart3', descripcion: 'Metricas del ecosistema', barraLateral: false },
  { id: 'admin-center', titulo: 'Admin', icono: 'ShieldCheck', descripcion: 'Centro de administracion', barraLateral: false },
  { id: 'configuracion', titulo: 'Configuracion', icono: 'Settings', descripcion: 'Ajustes del sistema', barraLateral: false },
  { id: 'historial', titulo: 'Historial', icono: 'History', descripcion: 'Registros y actividad', barraLateral: false },
  { id: 'ayuda', titulo: 'Ayuda', icono: 'HelpCircle', descripcion: 'Soporte', barraLateral: false },
];

export const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Home, Folder, Globe, Settings, HelpCircle,
    Briefcase, Code, Camera, Music, Play,
    Users, Shield, Cpu, Gamepad2, Box,
    Layers, GraduationCap, Building2, User,
    Archive, Star, FileText, Image, Video, Monitor, History,
    Search, RefreshCw, ShieldCheck, BarChart3
  };
  return icons[iconName] || Home;
};

