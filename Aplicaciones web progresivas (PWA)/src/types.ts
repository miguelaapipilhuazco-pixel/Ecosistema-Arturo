export type IdSeccion = 
  | 'inicio' 
  | 'maquina-virtual'
  | 'admin-center'
  | 'espacios'
  | 'buscar'
  | 'sincronizacion'
  | 'streaming'
  | 'ia'
  | 'seguridad'
  | 'xr'
  | 'sistema'
  | 'compartidos'
  | 'estadisticas'
  | 'configuracion'
  | 'ayuda'
  | 'perfil'
  | 'historial';

export interface Seccion {
  id: IdSeccion;
  titulo: string;
  icono: string;
  descripcion: string;
  barraLateral?: boolean;
}
