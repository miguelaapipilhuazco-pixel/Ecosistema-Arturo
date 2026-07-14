import { db } from './oss/firestore';
import { auth, GoogleAuthProvider, OAuthProvider } from './oss/auth';

export { db, auth };
auth.useDeviceLanguage();
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
export const appleProvider = new OAuthProvider('apple.com');

export enum TipoAccionDatos {
  LECTURA = 'LECTURA',
  ESCRITURA = 'ESCRITURA',
  ELIMINACION = 'ELIMINACION',
  LISTADO = 'LISTADO'
}

export function manejarErrorDatos(error: any, _tipoAccion: TipoAccionDatos, ruta?: string): string {
  if (error.code === 'permission-denied') {
    return `Permiso denegado en ${ruta || 'la operación'}. No tienes acceso a esta acción.`;
  }
  return error.message || 'Error desconocido';
}
