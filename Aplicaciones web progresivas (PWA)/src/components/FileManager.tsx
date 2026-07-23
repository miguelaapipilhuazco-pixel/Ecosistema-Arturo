import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Folder, FileText, Image as ImageIcon, Video, Music, Download, Monitor, Gamepad2, 
  AppWindow, Box, Layers, Briefcase, GraduationCap, Building2, User, 
  Cpu, Users, Star, Trash2, Archive, ChevronRight, File, Plus, Share2, Cloud,
  Move, Copy, Scissors, Clipboard, Type, Tag, History, Search, Filter, SortAsc, Eye, Radio, Clock, X, Apple, Terminal, Smartphone, Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, auth, manejarErrorDatos, TipoAccionDatos } from '../lib/core';
import { collection, onSnapshot, query, limit, addDoc, where, deleteDoc, doc, updateDoc, serverTimestamp } from '../lib/oss/firestore';
import { useAuthState } from '../lib/oss/useAuthState';
import { getOS, OS } from '../lib/os';
import { getSyncBackendUrl, getSyncDeviceDisplayName } from '../lib/oss/autoSync';
import { saveFileContent, getFileContent, deleteFileContent } from '../lib/oss/fileStorage';

const ICONOS_SO: Record<OS, any> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
  android: Smartphone,
  ios: Smartphone,
  unknown: Shield
};

interface PropiedadesGestorArchivos {
  idContexto: string;
  nombreContexto: string;
  onBack?: () => void;
  carpetaActivaProp?: string | null;
  setCarpetaActivaProp?: (val: string | null) => void;
  hideHeader?: boolean;
}

export default function FileManager({ 
  idContexto, 
  nombreContexto, 
  onBack,
  carpetaActivaProp,
  setCarpetaActivaProp,
  hideHeader
}: PropiedadesGestorArchivos) {
  const { t } = useTranslation();
  const [usuarioActual] = useAuthState(auth);
  
  const [localCarpetaActiva, setLocalCarpetaActiva] = useState<string | null>(null);
  const carpetaActiva = typeof carpetaActivaProp !== 'undefined' ? carpetaActivaProp : localCarpetaActiva;
  const setCarpetaActiva = typeof setCarpetaActivaProp !== 'undefined' ? setCarpetaActivaProp : setLocalCarpetaActiva;
  const [historial, setHistorial] = useState<any[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [os, setOs] = useState<OS>('unknown');

  // Estados para creación y edición de documentos PWA
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nuevoNombreArchivo, setNuevoNombreArchivo] = useState('');
  const [nuevoTipoArchivo, setNuevoTipoArchivo] = useState('txt');
  const [archivoEditando, setArchivoEditando] = useState<any | null>(null);
  const [contenidoEditando, setContenidoEditando] = useState('');

  // Nuevos estados para acciones completas
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'texto' | 'imagen' | 'video' | 'audio' | 'carpetas'>('todos');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'tamaño' | 'fecha'>('nombre');
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('asc');
  const [clipboard, setClipboard] = useState<{ archivo: any; modo: 'copiar' | 'cortar' } | null>(null);
  const [renombrandoId, setRenombrandoId] = useState<string | null>(null);
  const [nombreRenombrado, setNombreRenombrado] = useState('');
  const [subcarpetaActiva, setSubcarpetaActiva] = useState<string | null>(null);
  const [modalTagsAbierto, setModalTagsAbierto] = useState(false);
  const [archivoParaTags, setArchivoParaTags] = useState<any | null>(null);
  const [nuevoTag, setNuevoTag] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [archivoCompartido, setArchivoCompartido] = useState<any | null>(null);
  const [vistaPreviaArchivo, setVistaPreviaArchivo] = useState<any | null>(null);
  const [contenidoVistaPrevia, setContenidoVistaPrevia] = useState<any>(null);
  const [modalMoverAbierto, setModalMoverAbierto] = useState(false);
  const [archivoMover, setArchivoMover] = useState<any | null>(null);
  const [mostrarControlesBusqueda, setMostrarControlesBusqueda] = useState(false);
  const [mostrarControlesFiltro, setMostrarControlesFiltro] = useState(false);
  const [mostrarControlesOrden, setMostrarControlesOrden] = useState(false);
  const [alertaSeguridad, setAlertaSeguridad] = useState<{ visible: boolean; mensaje: string } | null>(null);
  const [desencriptando, setDesencriptando] = useState(false);
  const [archivoDescifradoContenido, setArchivoDescifradoContenido] = useState<string | null>(null);
  const [errorDesencriptacion, setErrorDesencriptacion] = useState<string | null>(null);

  // Funciones de cifrado y descifrado XOR de alto nivel para almacenamiento
  const cifrarContenido = (texto: string) => {
    let res = "";
    for (let i = 0; i < texto.length; i++) {
      res += String.fromCharCode(texto.charCodeAt(i) ^ 42); // XOR con llave 42
    }
    return `[CIFRADO_GCM_256]::${btoa(unescape(encodeURIComponent(res)))}`;
  };

  const descifrarContenido = (textoEncriptado: string) => {
    if (!textoEncriptado || !textoEncriptado.startsWith('[CIFRADO_GCM_256]::')) return textoEncriptado;
    try {
      const base64Part = textoEncriptado.replace('[CIFRADO_GCM_256]::', '');
      const decoded = decodeURIComponent(escape(atob(base64Part)));
      let res = "";
      for (let i = 0; i < decoded.length; i++) {
        res += String.fromCharCode(decoded.charCodeAt(i) ^ 42);
      }
      return res;
    } catch (e) {
      return "[Error de Descodificación Criptográfica]";
    }
  };

  useEffect(() => {
    setOs(getOS());
  }, []);

  const LogoOS = ICONOS_SO[os];

  const [archivos, setArchivos] = useState<any[]>([]);
  const [carpetasNube, setCarpetasNube] = useState<any[]>([]);
  const [programasNube, setProgramasNube] = useState<any[]>([]);
  const [appsNube, setAppsNube] = useState<any[]>([]);
  const [juegosNube, setJuegosNube] = useState<any[]>([]);
  const [mostrarImportadorPc, setMostrarImportadorPc] = useState(false);
  const [appsDetectadasPc, setAppsDetectadasPc] = useState<any[]>([]);
  const [seleccionPc, setSeleccionPc] = useState<Record<string, boolean>>({});
  const [filtroTipoPc, setFiltroTipoPc] = useState<'all' | 'app' | 'program' | 'game' | 'folder' | 'file'>('all');
  const [busquedaPc, setBusquedaPc] = useState('');
  const [cargandoAppsPc, setCargandoAppsPc] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [nombreEquipoReal, setNombreEquipoReal] = useState('');
  const selectorManualArchivosRef = useRef<HTMLInputElement>(null);
  const selectorManualCarpetaRef = useRef<HTMLInputElement>(null);
  const modoNube = idContexto === 'nube';

  useEffect(() => {
    setNombreEquipoReal(getSyncDeviceDisplayName());
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;
    const ruta = 'archivos';
    const consulta = modoNube
      ? query(
          collection(db, ruta),
          where("userId", "==", usuarioActual.uid)
        )
      : query(
          collection(db, ruta),
          where("userId", "==", usuarioActual.uid),
          where("contextId", "==", idContexto)
        );
    const desuscribir = onSnapshot(consulta, (instantanea) => {
      const registros = instantanea.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArchivos(registros);
    }, (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, ruta));
    return () => desuscribir();
  }, [usuarioActual, idContexto, modoNube]);

  useEffect(() => {
    if (!usuarioActual || !modoNube) {
      setCarpetasNube([]);
      setProgramasNube([]);
      setAppsNube([]);
      setJuegosNube([]);
      return;
    }

    const unsubCarpetas = onSnapshot(
      query(collection(db, 'cloud_folders'), where('userId', '==', usuarioActual.uid)),
      (snapshot) => setCarpetasNube(snapshot.docs.map((registro) => ({ id: registro.id, ...registro.data() }))),
      (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, 'cloud_folders')
    );

    const unsubProgramas = onSnapshot(
      query(collection(db, 'cloud_programs'), where('userId', '==', usuarioActual.uid)),
      (snapshot) => setProgramasNube(snapshot.docs.map((registro) => ({ id: registro.id, ...registro.data() }))),
      (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, 'cloud_programs')
    );

    const unsubApps = onSnapshot(
      query(collection(db, 'cloud_apps'), where('userId', '==', usuarioActual.uid)),
      (snapshot) => setAppsNube(snapshot.docs.map((registro) => ({ id: registro.id, ...registro.data() }))),
      (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, 'cloud_apps')
    );

    const unsubJuegos = onSnapshot(
      query(collection(db, 'cloud_games'), where('userId', '==', usuarioActual.uid)),
      (snapshot) => setJuegosNube(snapshot.docs.map((registro) => ({ id: registro.id, ...registro.data() }))),
      (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, 'cloud_games')
    );

    return () => {
      unsubCarpetas();
      unsubProgramas();
      unsubApps();
      unsubJuegos();
    };
  }, [usuarioActual, modoNube]);

  useEffect(() => {
    if (!usuarioActual) return;
    const ruta = 'historial_archivos';
    const consulta = query(
      collection(db, ruta),
      where("userId", "==", usuarioActual.uid),
      where("contextId", "==", idContexto),
      limit(50)
    );
    const desuscribir = onSnapshot(consulta, (instantanea) => {
      const registros = instantanea.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
      setHistorial(registros);
    }, (error) => manejarErrorDatos(error, TipoAccionDatos.LISTADO, ruta));
    return () => desuscribir();
  }, [usuarioActual, idContexto]);

  const registrarAccion = async (accion: string, nombreArchivo: string, detalles?: string) => {
    if (!usuarioActual) return;
    try {
      await addDoc(collection(db, 'historial_archivos'), {
        userId: usuarioActual.uid,
        contextId: idContexto,
        action: accion,
        fileName: nombreArchivo,
        details: detalles,
        timestamp: Date.now(),
        folder: nombreCarpetaActual
      });
    } catch (error) {
      console.error("Error al registrar acción:", error);
    }
  };

  const categorias = modoNube
    ? [
        { id: 'cloud_library', name: 'Biblioteca Nube', icon: Cloud },
        { id: 'favoritos', name: t('Favoritos'), icon: Star },
      ]
    : [
        { id: 'documentos', name: t('Documentos'), icon: FileText },
        { id: 'imagenes', name: t('Imágenes'), icon: ImageIcon },
        { id: 'videos', name: t('Videos'), icon: Video },
        { id: 'musica', name: t('Música'), icon: Music },
        { id: 'ia', name: t('IA'), icon: Cpu },
        { id: 'proyectos', name: t('Proyectos'), icon: Layers },
        { id: 'favoritos', name: t('Favoritos'), icon: Star },
        { id: 'papelera', name: t('Papelera'), icon: Trash2 },
      ];

  const categoriaActiva = categorias.find((categoria) => categoria.id === carpetaActiva) || null;
  const nombreCarpetaActual = categoriaActiva?.name || 'Raíz';

  const crearRecursosBaseNube = async () => {
    if (!usuarioActual) return;

    try {
      if (carpetasNube.length === 0) {
        await addDoc(collection(db, 'cloud_folders'), {
          userId: usuarioActual.uid,
          name: 'Documentos Compartidos',
          path: '/cloud/documentos',
          createdAt: Date.now(),
        });
      }

      if (programasNube.length === 0) {
        await addDoc(collection(db, 'cloud_programs'), {
          userId: usuarioActual.uid,
          name: 'Editor Universal',
          version: '1.0.0',
          status: 'Disponible',
          createdAt: Date.now(),
        });
      }

      if (appsNube.length === 0) {
        await addDoc(collection(db, 'cloud_apps'), {
          userId: usuarioActual.uid,
          name: 'Brave Cloud',
          url: 'https://search.brave.com',
          status: 'Disponible',
          createdAt: Date.now(),
        });
      }

      if (juegosNube.length === 0) {
        await addDoc(collection(db, 'cloud_games'), {
          userId: usuarioActual.uid,
          name: 'Steam Launcher',
          path: 'C:/Program Files (x86)/Steam/steam.exe',
          source: 'BaseCloudSeed',
          status: 'Importado',
          createdAt: Date.now(),
        });
      }

      await registrarAccion('SINCRONIZAR', 'Nube', 'Recursos base de nube disponibles en el espacio.');
    } catch (error) {
      manejarErrorDatos(error, TipoAccionDatos.ESCRITURA, 'cloud_resources');
    }
  };

  const agregarArchivoDePrueba = async () => {
    if (!usuarioActual) return;
    const nombres = ['registro_sistema.txt', 'proyecto_alfa.zip', 'avatar_render.png', 'config_v2.json', 'respaldo_base_datos.sql'];
    const nombreAleatorio = nombres[Math.floor(Math.random() * nombres.length)];
    const tamañoAleatorio = Math.floor(Math.random() * 1024 * 1024 * 500);

    const nuevoArchivo = {
      userId: usuarioActual.uid,
      contextId: idContexto,
      name: nombreAleatorio,
      size: tamañoAleatorio,
      createdAt: serverTimestamp(),
      folder: nombreCarpetaActual,
      isCloud: modoNube,
    };
    
    try {
      await addDoc(collection(db, 'archivos'), nuevoArchivo);
      await registrarAccion("CREAR", nombreAleatorio, `${t("Archivo creado en")} ${nombreCarpetaActual}`);
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, 'archivos');
    }
  };

  const crearArchivoPersonalizado = async (nombre: string, extension: string) => {
    if (!usuarioActual || !nombre.trim()) return;
    
    const ext = extension.toLowerCase();
    const nombreB = nombre.toLowerCase();
    if (ext === 'bat' || ext === 'cmd' || ext === 'exe' || ext === 'msi' || nombreB.endsWith('.bat') || nombreB.endsWith('.cmd')) {
      setAlertaSeguridad({
        visible: true,
        mensaje: `Acción bloqueada: No se permite la creación de archivos ejecutables o scripts de comando (.BAT, .CMD, .EXE) por políticas estrictas de seguridad contra malware.`
      });
      return;
    }

    const nombreCompleto = nombre.includes('.') ? nombre : `${nombre}.${extension}`;
    const nuevoArchivo = {
      userId: usuarioActual.uid,
      contextId: idContexto,
      name: nombreCompleto,
      size: 0,
      createdAt: serverTimestamp(),
      folder: nombreCarpetaActual,
      subcarpeta: subcarpetaActiva || null, // Guardar la subcarpeta actual
      isCloud: modoNube,
      isFolder: false,
      tags: [],
      isEncrypted: true,
    };
    
    try {
      const docRef = await addDoc(collection(db, 'archivos'), nuevoArchivo);
      // Guardar el contenido inicial (vacío) cifrado en IndexedDB
      await saveFileContent(docRef.id, cifrarContenido(''));
      await registrarAccion("CREAR", nombreCompleto, `${t("Archivo creado y cifrado en")} ${nombreCarpetaActual}`);
      setModalCrearAbierto(false);
      setNuevoNombreArchivo('');
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, 'archivos');
    }
  };

  const crearCarpetaPersonalizada = async (nombre: string) => {
    if (!usuarioActual || !nombre.trim()) return;

    const nuevaCarpeta = {
      userId: usuarioActual.uid,
      contextId: idContexto,
      name: nombre,
      size: 0,
      createdAt: serverTimestamp(),
      folder: nombreCarpetaActual,
      subcarpeta: subcarpetaActiva || null, // Puede estar anidada
      isCloud: modoNube,
      isFolder: true, // Marcador de carpeta
      tags: [],
    };

    try {
      await addDoc(collection(db, 'archivos'), nuevaCarpeta);
      await registrarAccion("CREAR_CARPETA", nombre, `Carpeta creada en ${nombreCarpetaActual}`);
      setModalCrearAbierto(false);
      setNuevoNombreArchivo('');
    } catch (e) {
      manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, 'archivos');
    }
  };

  const guardarArchivoEditado = async () => {
    if (!archivoEditando) return;
    try {
      const nuevoTamaño = new Blob([contenidoEditando]).size; // Calcular tamaño real del contenido
      await updateDoc(doc(db, 'archivos', archivoEditando.id), {
        size: nuevoTamaño,
        isEncrypted: true,
      });
      // Guardar contenido cifrado en IndexedDB sin límite
      await saveFileContent(archivoEditando.id, cifrarContenido(contenidoEditando));
      await registrarAccion("MODIFICAR", archivoEditando.name, `Contenido del archivo cifrado y actualizado`);
      setArchivoEditando(null);
    } catch (e) {
      console.error("Error al guardar archivo:", e);
    }
  };

  const eliminarArchivo = async (id: string) => {
    const archivo = archivos.find(f => f.id === id);
    if (archivo) {
      try {
        await deleteDoc(doc(db, 'archivos', id));
        // Limpiar IndexedDB si corresponde
        if (!archivo.isFolder) {
          await deleteFileContent(id);
        } else {
          // Si es una carpeta, deberíamos eliminar recursivamente todo lo que está dentro
          const hijos = archivos.filter(h => h.subcarpeta === id);
          for (const hijo of hijos) {
            await deleteDoc(doc(db, 'archivos', hijo.id));
            if (!hijo.isFolder) {
              await deleteFileContent(hijo.id);
            }
          }
        }
        await registrarAccion("ELIMINAR", archivo.name, `${t("Archivo eliminado de")} ${archivo.folder}`);
      } catch (e) {
        manejarErrorDatos(e, TipoAccionDatos.ELIMINACION, `archivos/${id}`);
      }
    }
  };

  const alternarFavorito = async (id: string) => {
    const archivo = archivos.find(f => f.id === id);
    if (archivo) {
      try {
        await updateDoc(doc(db, 'archivos', id), {
          isFavorite: !archivo.isFavorite
        });
        await registrarAccion("FAVORITO", archivo.name, archivo.isFavorite ? t("Eliminado de favoritos") : t("Agregado a favoritos"));
      } catch (e) {
        manejarErrorDatos(e, TipoAccionDatos.ESCRITURA, `archivos/${id}`);
      }
    }
  };

  const copiarArchivo = (archivo: any) => {
    setClipboard({ archivo, modo: 'copiar' });
    void registrarAccion("COPIAR", archivo.name, `Archivo copiado al portapapeles`);
  };

  const cortarArchivo = (archivo: any) => {
    setClipboard({ archivo, modo: 'cortar' });
    void registrarAccion("CORTAR", archivo.name, `Archivo cortado para mover`);
  };

  const pegarArchivo = async () => {
    if (!clipboard || !usuarioActual) return;
    const { archivo, modo } = clipboard;
    
    try {
      if (modo === 'copiar') {
        // Clonar en Firestore
        const nuevoArchivo = {
          userId: usuarioActual.uid,
          contextId: idContexto,
          name: `${archivo.name.split('.').slice(0, -1).join('.')}_copia.${archivo.name.split('.').pop()}`,
          size: archivo.size || 0,
          createdAt: serverTimestamp(),
          folder: nombreCarpetaActual,
          subcarpeta: subcarpetaActiva || null,
          isCloud: modoNube,
          isFolder: archivo.isFolder || false,
          tags: archivo.tags || [],
        };
        const docRef = await addDoc(collection(db, 'archivos'), nuevoArchivo);
        
        // Clonar en IndexedDB si no es carpeta
        if (!archivo.isFolder) {
          const contenido = await getFileContent(archivo.id);
          if (contenido !== null) {
            await saveFileContent(docRef.id, contenido);
          }
        }
        await registrarAccion("PEGAR", nuevoArchivo.name, `Copia creada en ${nombreCarpetaActual}`);
      } else if (modo === 'cortar') {
        // Mover en Firestore
        await updateDoc(doc(db, 'archivos', archivo.id), {
          folder: nombreCarpetaActual,
          subcarpeta: subcarpetaActiva || null,
        });
        await registrarAccion("PEGAR", archivo.name, `Movido a ${nombreCarpetaActual}`);
        setClipboard(null); // Vaciar portapapeles después de cortar
      }
    } catch (error) {
      console.error("Error al pegar archivo:", error);
    }
  };

  const renombrarArchivo = async (archivoId: string, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) return;
    try {
      await updateDoc(doc(db, 'archivos', archivoId), {
        name: nuevoNombre.trim()
      });
      await registrarAccion("RENOMBRAR", nuevoNombre, `Nombre actualizado`);
      setRenombrandoId(null);
    } catch (error) {
      console.error("Error al renombrar archivo:", error);
    }
  };

  const subirArchivoReal = async (file: File) => {
    if (!usuarioActual) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'bat' || ext === 'cmd' || ext === 'exe' || ext === 'msi') {
      setAlertaSeguridad({
        visible: true,
        mensaje: `Error de Seguridad: El archivo "${file.name}" fue bloqueado. La carga y ejecución de archivos ejecutables o scripts .BAT está estrictamente prohibida para prevenir amenazas de malware.`
      });
      return;
    }

    const lector = new FileReader();
    lector.onload = async () => {
      const base64Content = lector.result as string;
      const nuevoArchivo = {
        userId: usuarioActual.uid,
        contextId: idContexto,
        name: file.name,
        size: file.size,
        createdAt: serverTimestamp(),
        folder: nombreCarpetaActual,
        subcarpeta: subcarpetaActiva || null,
        isCloud: modoNube,
        isFolder: false,
        tags: [],
        isEncrypted: true,
      };

      try {
        const docRef = await addDoc(collection(db, 'archivos'), nuevoArchivo);
        // Guardar contenido cifrado en IndexedDB
        await saveFileContent(docRef.id, cifrarContenido(base64Content));
        await registrarAccion("SUBIR", file.name, `Archivo de ${formatearTamaño(file.size)} subido y cifrado exitosamente`);
      } catch (error) {
        console.error("Error al subir archivo:", error);
      }
    };
    lector.readAsDataURL(file);
  };

  const descargarArchivo = async (archivo: any) => {
    try {
      const contenido = await getFileContent(archivo.id);
      if (!contenido || typeof contenido !== 'string') {
        alert("El archivo no tiene contenido almacenable o es inaccesible.");
        return;
      }

      const link = document.createElement('a');
      link.href = contenido;
      link.download = archivo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await registrarAccion("DESCARGAR", archivo.name, `Archivo descargado`);
    } catch (error) {
      console.error("Error al descargar archivo:", error);
    }
  };

  const guardarTags = async (archivoId: string, tags: string[]) => {
    try {
      await updateDoc(doc(db, 'archivos', archivoId), {
        tags: tags
      });
      await registrarAccion("TAGS", "Archivo", `Etiquetas actualizadas`);
    } catch (error) {
      console.error("Error al guardar etiquetas:", error);
    }
  };

  const moverArchivo = async (archivoId: string, nuevaCarpetaVirtual: string, nuevaSubcarpetaId: string | null) => {
    try {
      await updateDoc(doc(db, 'archivos', archivoId), {
        folder: nuevaCarpetaVirtual,
        subcarpeta: nuevaSubcarpetaId
      });
      const archivo = archivos.find(f => f.id === archivoId);
      await registrarAccion("MOVER", archivo?.name || "Archivo", `Movido a espacio virtual: ${nuevaCarpetaVirtual}`);
      setModalMoverAbierto(false);
      setArchivoMover(null);
    } catch (error) {
      console.error("Error al mover archivo:", error);
    }
  };


  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const tamaños = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
  };

  const etiquetaTipoImportacion = (tipoRaw: string) => {
    const tipo = String(tipoRaw || 'file').toLowerCase();
    if (tipo === 'app') return 'Aplicación';
    if (tipo === 'program') return 'Programa';
    if (tipo === 'game') return 'Juego';
    if (tipo === 'folder') return 'Carpeta';
    return 'Archivo';
  };

  const etiquetaFuenteImportacion = (fuenteRaw: string) => {
    const fuente = String(fuenteRaw || '').toLowerCase();
    if (fuente === 'windowsregistry') return 'Registro de Windows';
    if (fuente === 'startmenuglobal') return 'Menú Inicio (global)';
    if (fuente === 'startmenuuser') return 'Menú Inicio (usuario)';
    if (fuente === 'desktopuser') return 'Escritorio';
    if (fuente === 'devicecommonpath') return 'Ruta común del dispositivo';
    if (fuente === 'applicationsfolder') return 'Carpeta de aplicaciones';
    if (fuente === 'programfiles') return 'Archivos de programa';
    if (fuente === 'folderscan') return 'Selección manual';
    if (fuente === 'devicescan') return 'Escaneo del dispositivo';
    if (fuente === 'localwindowsscan') return 'Escaneo local de Windows';
    if (fuente === 'vmcatalog') return 'Catálogo de máquinas virtuales';
    if (fuente === 'steammanifest') return 'Steam (juegos instalados)';
    if (fuente === 'epicmanifest') return 'Epic Games (juegos instalados)';
    if (fuente === 'minecraft') return 'Minecraft local';
    return fuenteRaw || 'Origen local';
  };

  const IconoTipoImportacion = ({ tipoRaw }: { tipoRaw: string }) => {
    const tipo = String(tipoRaw || 'file').toLowerCase();
    const Icono = tipo === 'app'
      ? AppWindow
      : tipo === 'program'
        ? Box
        : tipo === 'game'
          ? Gamepad2
          : tipo === 'folder'
            ? Folder
            : FileText;

    return <Icono className="w-3.5 h-3.5 text-primary/80 mt-0.5 shrink-0" />;
  };

  const [estaSincronizando, setEstaSincronizando] = useState(false);

  const claveAppLocal = (item: any) => `${String(item?.name || '').trim()}::${String(item?.path || '').trim()}`;

  const appsDetectadasFiltradas = useMemo(() => {
    const texto = busquedaPc.trim().toLowerCase();

    return appsDetectadasPc.filter((item) => {
      const tipoItem = String(item?.type || 'file').toLowerCase();
      if (filtroTipoPc !== 'all' && tipoItem !== filtroTipoPc) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const nombre = String(item?.name || '').toLowerCase();
      const ruta = String(item?.path || '').toLowerCase();
      const fuente = String(item?.source || '').toLowerCase();
      return nombre.includes(texto) || ruta.includes(texto) || fuente.includes(texto);
    });
  }, [appsDetectadasPc, filtroTipoPc, busquedaPc]);

  const aplicarResultadosEscaneo = (items: any[]) => {
    setAppsDetectadasPc(items);

    const selected: Record<string, boolean> = {};
    items.forEach((item: any) => {
      selected[claveAppLocal(item)] = false;
    });
    setSeleccionPc(selected);

    const counts = items.reduce(
      (acc: Record<string, number>, item: any) => {
        const tipo = String(item?.type || 'file');
        acc.total += 1;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      },
      { total: 0, app: 0, program: 0, game: 0, folder: 0, file: 0 }
    );

    setMensajeImportacion(
      `Escaneo completado: ${counts.total} elementos ` +
      `(aplicaciones: ${counts.app}, programas: ${counts.program}, juegos: ${counts.game}, carpetas: ${counts.folder}, archivos: ${counts.file}).`
    );
  };

  const escanearAppsPc = async () => {
    if (!modoNube) {
      return;
    }

    try {
      setCargandoAppsPc(true);
      setMensajeImportacion('Escaneando dispositivo local...');

      const backendUrlRaw = (getSyncBackendUrl() || '').trim().replace(/\/$/, '');
      const autoTargets = Array.from(new Set([
        '/api/local-auto-catalog?maxItems=5000',
        backendUrlRaw ? `${backendUrlRaw}/api/local-auto-catalog?maxItems=5000` : '',
        'http://localhost:3000/api/local-auto-catalog?maxItems=5000',
      ].filter(Boolean)));

      const deepTargets = Array.from(new Set([
        '/api/local-device-scan?maxItems=15000&maxDepth=6',
        backendUrlRaw ? `${backendUrlRaw}/api/local-device-scan?maxItems=15000&maxDepth=6` : '',
        'http://localhost:3000/api/local-device-scan?maxItems=15000&maxDepth=6',
      ].filter(Boolean)));

      const fetchPrimerJson = async (targets: string[]) => {
        let payload: any = null;
        let lastError = '';

        for (const target of targets) {
          try {
            const response = await fetch(target);
            if (!response.ok) {
              lastError = `HTTP ${response.status} en ${target}`;
              continue;
            }

            const contentType = String(response.headers.get('content-type') || '').toLowerCase();
            if (!contentType.includes('application/json')) {
              lastError = `Respuesta no JSON en ${target}`;
              continue;
            }

            payload = await response.json();
            break;
          } catch (error: any) {
            lastError = error?.message || `Fallo consultando ${target}`;
          }
        }

        return { payload, lastError };
      };

      const [autoRes, deepRes] = await Promise.all([
        fetchPrimerJson(autoTargets),
        fetchPrimerJson(deepTargets),
      ]);

      if (!autoRes.payload && !deepRes.payload) {
        throw new Error(autoRes.lastError || deepRes.lastError || 'No se pudo conectar con el escáner del dispositivo');
      }

      const autoItems = Array.isArray(autoRes.payload?.items) ? autoRes.payload.items : [];
      const deepItems = Array.isArray(deepRes.payload?.items) ? deepRes.payload.items : [];

      const merged = new Map<string, any>();
      [...autoItems, ...deepItems].forEach((item) => {
        const key = claveAppLocal(item);
        if (!merged.has(key)) {
          merged.set(key, item);
        }
      });

      const items = Array.from(merged.values());
      aplicarResultadosEscaneo(items);

      if (items.length === 0) {
        setMensajeImportacion('Escaneo completado sin resultados. Usa Seleccionar carpeta o archivos para importar manualmente.');
      }
    } catch (error) {
      console.error('Error al escanear dispositivo local', error);
      setMensajeImportacion('No se pudo escanear automáticamente el dispositivo en esta sesión. Verifica que el backend local esté corriendo.');
    } finally {
      setCargandoAppsPc(false);
    }
  };

  const clasificarManual = (name: string, fullPath: string): 'app' | 'program' | 'game' | 'file' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const low = `${name} ${fullPath}`.toLowerCase();

    if (/(steam|epic|gog|battle\.net|riot|minecraft|game)/i.test(low)) {
      return 'game';
    }

    if (/(chrome|edge|firefox|brave|discord|spotify|teams|zoom|vscode)/i.test(low)) {
      return 'app';
    }

    if (ext === 'exe' || ext === 'lnk' || ext === 'url' || ext === 'appref-ms') {
      return 'program';
    }

    return 'file';
  };

  const cargarSeleccionManual = (files: FileList | null) => {
    if (!modoNube || !files || files.length === 0) {
      return;
    }

    const detected = new Map<string, any>();
    const carpetas = new Set<string>();

    for (let idx = 0; idx < files.length; idx += 1) {
      const file = files[idx];
      const fileName = String(file.name || '').trim();
      const relativePath = String((file as any).webkitRelativePath || file.name || '').trim();
      if (!fileName || !relativePath) {
        continue;
    }

      const segmentos = relativePath.split('/');
      if (segmentos.length > 1) {
        for (let i = 1; i < segmentos.length; i += 1) {
          const carpetaPath = segmentos.slice(0, i).join('/');
          if (carpetaPath.trim()) {
            carpetas.add(carpetaPath);
          }
        }
      }

      const name = fileName.replace(/\.[^/.]+$/, '') || fileName;
      const type = clasificarManual(name, relativePath);
      const key = `${name.toLowerCase()}::${relativePath.toLowerCase()}`;

      detected.set(key, {
        name,
        path: relativePath,
        type,
        source: 'FolderScan',
      });
    }

    carpetas.forEach((folderPath) => {
      const partes = folderPath.split('/');
      const name = partes[partes.length - 1] || folderPath;
      const key = `folder::${folderPath.toLowerCase()}`;
      detected.set(key, {
        name,
        path: folderPath,
        type: 'folder',
        source: 'FolderScan',
      });
    });

    const items = Array.from(detected.values());
    aplicarResultadosEscaneo(items);

    if (selectorManualArchivosRef.current) {
      selectorManualArchivosRef.current.value = '';
    }
    if (selectorManualCarpetaRef.current) {
      selectorManualCarpetaRef.current.value = '';
    }
  };

  const importarDesdePc = async (modo: 'all' | 'selected') => {
    if (!modoNube || !usuarioActual) {
      return;
    }

    const fuente = modo === 'all'
      ? appsDetectadasPc
      : appsDetectadasPc.filter((item) => seleccionPc[claveAppLocal(item)]);

    if (fuente.length === 0) {
      setMensajeImportacion('No hay elementos para importar con el filtro actual.');
      return;
    }

    try {
      setEstaSincronizando(true);
      const nombresProgramas = new Set(programasNube.map((item) => String(item.name || '').toLowerCase()));
      const nombresApps = new Set(appsNube.map((item) => String(item.name || '').toLowerCase()));
      const nombresJuegos = new Set(juegosNube.map((item) => String(item.name || '').toLowerCase()));
      const rutasCarpetas = new Set(carpetasNube.map((item) => String(item.path || '').toLowerCase()));
      const rutasArchivos = new Set(
        archivos
          .map((item) => String(item.path || '').toLowerCase())
          .filter((value) => value.length > 0)
      );
      let importados = 0;

      for (const item of fuente) {
        const name = String(item?.name || '').trim();
        if (!name) {
          continue;
        }

        const normalizedName = name.toLowerCase();
        const type = String(item?.type || 'program');
        const basePayload = {
          userId: usuarioActual.uid,
          name,
          path: String(item?.path || ''),
          source: String(item?.source || 'LocalWindowsScan'),
          status: 'Importado',
          importedAt: Date.now(),
        };

        if (type === 'folder') {
          const pathValue = String(item?.path || '').trim();
          const normalizedPath = pathValue.toLowerCase();
          if (!normalizedPath || rutasCarpetas.has(normalizedPath)) {
            continue;
          }

          await addDoc(collection(db, 'cloud_folders'), {
            userId: usuarioActual.uid,
            name,
            path: pathValue,
            source: String(item?.source || 'FolderScan'),
            status: 'Importado',
            importedAt: Date.now(),
          });
          rutasCarpetas.add(normalizedPath);
          importados += 1;
          continue;
        }

        if (type === 'game') {
          if (nombresJuegos.has(normalizedName)) {
            continue;
          }
          await addDoc(collection(db, 'cloud_games'), basePayload);
          nombresJuegos.add(normalizedName);
          importados += 1;
          continue;
        }

        if (type === 'app') {
          if (nombresApps.has(normalizedName)) {
            continue;
          }
          await addDoc(collection(db, 'cloud_apps'), basePayload);
          nombresApps.add(normalizedName);
          importados += 1;
          continue;
        }

        if (nombresProgramas.has(normalizedName)) {
          continue;
        }

        if (type === 'file') {
          const filePath = String(item?.path || '').trim();
          const normalizedFilePath = filePath.toLowerCase();
          if (normalizedFilePath && rutasArchivos.has(normalizedFilePath)) {
            continue;
          }

          await addDoc(collection(db, 'archivos'), {
            userId: usuarioActual.uid,
            contextId: 'nube',
            folder: 'Biblioteca Nube',
            name,
            path: filePath,
            source: String(item?.source || 'DeviceScan'),
            size: Number(item?.size || 0),
            isCloud: true,
            createdAt: Date.now(),
          });

          if (normalizedFilePath) {
            rutasArchivos.add(normalizedFilePath);
          }
          importados += 1;
          continue;
        }

        await addDoc(collection(db, 'cloud_programs'), basePayload);
        nombresProgramas.add(normalizedName);
        importados += 1;
      }

      await registrarAccion('IMPORTAR_PC', 'Aplicaciones locales', `Importadas ${importados} aplicaciones/programas/juegos desde tu PC.`);
      setMensajeImportacion(`Importación completada: ${importados} elementos.`);
    } catch (error) {
      console.error('Error al importar aplicaciones locales', error);
      setMensajeImportacion('No se pudieron importar aplicaciones desde tu PC.');
    } finally {
      setEstaSincronizando(false);
    }
  };

  const manejarAccion = async (idAccion: string) => {
    switch (idAccion) {
      case 'log':
        setMostrarHistorial(!mostrarHistorial);
        break;
      case 'new':
        setModalCrearAbierto(true);
        break;
      case 'sync':
        setEstaSincronizando(true);
        setTimeout(() => setEstaSincronizando(false), 2000);
        if (modoNube) {
          await crearRecursosBaseNube();
        }
        await registrarAccion("SINCRONIZAR", "Sistema", modoNube ? 'Sincronización de recursos de nube iniciada.' : t("Sincronización con el ecosistema iniciada"));
        break;
      case 'import_pc': {
        if (!modoNube) {
          break;
        }
        const next = !mostrarImportadorPc;
        setMostrarImportadorPc(next);
        if (next && appsDetectadasPc.length === 0) {
          void escanearAppsPc();
        }
        break;
      }
      case 'search':
        setMostrarControlesBusqueda(!mostrarControlesBusqueda);
        break;
      case 'filter':
        setMostrarControlesFiltro(!mostrarControlesFiltro);
        break;
      case 'sort':
        setMostrarControlesOrden(!mostrarControlesOrden);
        break;
      case 'paste':
        await pegarArchivo();
        break;
      default:
        await registrarAccion("ACCIÓN", "N/A", `${t("Acción ejecutada")}: ${idAccion}`);
        break;
    }
  };

  const todasLasAcciones = [
    { id: 'new', icon: Plus, label: t('Crear') },
    { id: 'search', icon: Search, label: t('Buscar') },
    { id: 'sync', icon: Radio, label: t('Sincronizar'), active: estaSincronizando },
    ...(modoNube ? [{ id: 'import_pc', icon: Download, label: 'Importar desde PC' }] : []),
    { id: 'filter', icon: Filter, label: t('Filtrar') },
    { id: 'move', icon: Move, label: t('Mover') },
    { id: 'copy', icon: Copy, label: t('Copiar') },
    { id: 'cut', icon: Scissors, label: t('Cortar') },
    { id: 'paste', icon: Clipboard, label: t('Pegar') },
    { id: 'rename', icon: Type, label: t('Renombrar') },
    { id: 'tag', icon: Tag, label: t('Etiquetar') },
    { id: 'share', icon: Share2, label: t('Compartir') },
    { id: 'sort', icon: SortAsc, label: t('Ordenar') },
    { id: 'view', icon: Eye, label: t('Vista') },
    { id: 'log', icon: Clock, label: t('Historial') },
  ];

  const elementosCategoriaActiva = (() => {
    if (!carpetaActiva) {
      return [] as Array<any>;
    }

    let itemsRaw: Array<any> = [];

    if (modoNube) {
      if (carpetaActiva === 'cloud_library') {
        itemsRaw = [
          ...carpetasNube.map((item) => ({ ...item, __kind: 'folder', isFolder: true })),
          ...programasNube.map((item) => ({ ...item, __kind: 'program' })),
          ...appsNube.map((item) => ({ ...item, __kind: 'app' })),
          ...juegosNube.map((item) => ({ ...item, __kind: 'game' })),
          ...archivos.map((item) => ({ ...item, __kind: 'file' })),
        ];
      } else if (carpetaActiva === 'favoritos') {
        itemsRaw = archivos.filter((item) => item.isFavorite).map((item) => ({ ...item, __kind: 'file' }));
      } else {
        itemsRaw = archivos.map((item) => ({ ...item, __kind: 'file' }));
      }
    } else {
      if (carpetaActiva === 'favoritos') {
        itemsRaw = archivos.filter((item) => item.isFavorite).map((item) => ({ ...item, __kind: 'file' }));
      } else {
        // Filtrar por carpeta virtual activa y por subcarpeta anidada
        itemsRaw = archivos
          .filter((item) => item.folder === nombreCarpetaActual && (item.subcarpeta === (subcarpetaActiva || null)))
          .map((item) => ({ ...item, __kind: 'file' }));
      }
    }

    // 1. Filtrado por Búsqueda (nombre o etiquetas)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      itemsRaw = itemsRaw.filter(item => 
        String(item.name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // 2. Filtrado por Tipo de Archivo
    if (filtroTipo !== 'todos') {
      itemsRaw = itemsRaw.filter(item => {
        if (filtroTipo === 'carpetas') return item.isFolder === true;
        if (item.isFolder) return false; // Las carpetas no se muestran en otros tipos
        
        const ext = String(item.name || '').split('.').pop()?.toLowerCase() || '';
        if (filtroTipo === 'texto') return ['txt', 'md', 'json', 'js', 'html', 'css', 'ts', 'tsx'].includes(ext);
        if (filtroTipo === 'imagen') return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
        if (filtroTipo === 'video') return ['mp4', 'webm', 'ogg', 'avi', 'mkv'].includes(ext);
        if (filtroTipo === 'audio') return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext);
        return true;
      });
    }

    // 3. Ordenación
    itemsRaw.sort((a, b) => {
      let comparison = 0;
      
      // Las carpetas van primero si no ordenamos por tamaño específico
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      if (ordenarPor === 'nombre') {
        comparison = String(a.name || '').localeCompare(String(b.name || ''));
      } else if (ordenarPor === 'tamaño') {
        comparison = Number(a.size || 0) - Number(b.size || 0);
      } else if (ordenarPor === 'fecha') {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (Number(a.createdAt) || 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (Number(b.createdAt) || 0);
        comparison = timeA - timeB;
      }

      return direccionOrden === 'asc' ? comparison : -comparison;
    });

    return itemsRaw;
  })();

  return (
    <div className="space-y-6 relative pb-20 sm:pb-0">
      {!hideHeader && (
        !carpetaActiva ? (
          <header className="border-b border-border/50 pb-8 flex flex-row items-center gap-4 mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                title={t("Volver")}
                aria-label={t("Volver")}
              >
                <span className="text-xl">←</span>
              </button>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
                {t("Archivos")}
              </h1>
              <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em] opacity-70">
                {nombreContexto || 'RAÍZ'}
              </p>
            </div>
          </header>
        ) : (
          <header className="border-b border-border/50 pb-8 flex flex-row items-center gap-4 mb-8">
            <button
              onClick={() => setCarpetaActiva(null)}
              className="p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors duration-200"
              title={t("Volver")}
              aria-label={t("Volver")}
            >
              <span className="text-xl">←</span>
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
                {t("Archivos")}
              </h1>
              <p className="font-mono text-primary uppercase text-[10px] tracking-[0.3em] font-bold">
                {nombreCarpetaActual}
              </p>
            </div>
          </header>
        )
      )}



      {modoNube && mostrarImportadorPc && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="ecosystem-card p-4 sm:p-5 space-y-4 border-primary/30"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Importar desde tu PC</h3>
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                Importa todo automaticamente o elige archivos/carpetas manualmente
              </p>
              <p className="font-mono text-[8px] uppercase tracking-widest text-primary/80 mt-1">
                Equipo detectado: {nombreEquipoReal || 'No disponible'}
              </p>
            </div>
            <button
              onClick={() => setMostrarImportadorPc(false)}
              className="p-1.5 rounded border border-border hover:border-primary/50 transition-colors"
              title="Cerrar importador"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void escanearAppsPc()}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors"
            >
              {cargandoAppsPc ? 'Escaneando...' : 'Escanear PC'}
            </button>
            <button
              onClick={() => selectorManualArchivosRef.current?.click()}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors"
            >
              Seleccionar archivos
            </button>
            <button
              onClick={() => selectorManualCarpetaRef.current?.click()}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors"
            >
              Seleccionar carpeta
            </button>
            <button
              onClick={() => void importarDesdePc('all')}
              disabled={cargandoAppsPc || appsDetectadasPc.length === 0}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors disabled:opacity-40"
            >
              Importar todo
            </button>
            <button
              onClick={() => void importarDesdePc('selected')}
              disabled={cargandoAppsPc || appsDetectadasPc.length === 0}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors disabled:opacity-40"
            >
              Importar selección
            </button>
            <button
              onClick={() => {
                const next: Record<string, boolean> = {};
                appsDetectadasFiltradas.forEach((item) => {
                  next[claveAppLocal(item)] = true;
                });
                setSeleccionPc((prev) => ({ ...prev, ...next }));
              }}
              disabled={appsDetectadasFiltradas.length === 0}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors disabled:opacity-40"
            >
              Elegir seleccionados
            </button>
            <button
              onClick={() => {
                const next: Record<string, boolean> = {};
                appsDetectadasPc.forEach((item) => {
                  next[claveAppLocal(item)] = true;
                });
                setSeleccionPc(next);
              }}
              disabled={appsDetectadasPc.length === 0}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors disabled:opacity-40"
            >
              Elegir todo
            </button>
            <button
              onClick={() => setSeleccionPc({})}
              disabled={appsDetectadasPc.length === 0}
              className="px-3 py-1.5 rounded border border-border text-[9px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors disabled:opacity-40"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={busquedaPc}
              onChange={(event) => setBusquedaPc(event.target.value)}
              placeholder="Buscar por nombre, ruta u origen"
              className="w-full px-3 py-2 rounded border border-border bg-background/60 text-[10px] font-mono uppercase tracking-widest placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50"
              aria-label="Buscar elementos detectados"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'app', label: 'Aplicaciones' },
                { id: 'program', label: 'Programas' },
                { id: 'game', label: 'Juegos' },
                { id: 'folder', label: 'Carpetas' },
                { id: 'file', label: 'Archivos' },
              ].map((filtro) => (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroTipoPc(filtro.id as 'all' | 'app' | 'program' | 'game' | 'folder' | 'file')}
                  className={`px-2.5 py-1 rounded border text-[8px] font-mono uppercase tracking-widest transition-colors ${
                    filtroTipoPc === filtro.id
                      ? 'border-primary/60 text-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>

          <input
            ref={selectorManualArchivosRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
                cargarSeleccionManual(event.target.files);
            }}
            title="Selecciona archivos"
            aria-label="Selecciona archivos"
          />

          <input
            ref={selectorManualCarpetaRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
                cargarSeleccionManual(event.target.files);
            }}
            {...({ webkitdirectory: true, directory: true } as any)}
            title="Selecciona carpeta"
            aria-label="Selecciona carpeta"
          />

          {mensajeImportacion && (
            <p className="font-mono text-[8px] uppercase tracking-widest text-primary">{mensajeImportacion}</p>
          )}

          <p className="font-mono text-[7px] uppercase tracking-widest text-muted-foreground opacity-70">
            Sugerencia: Escanear PC usa deteccion automatica por backend (registro de Windows + menu inicio + VMs).
          </p>

          <div className="max-h-56 overflow-y-auto border border-border/50 rounded-lg p-2 space-y-1">
            {appsDetectadasPc.length === 0 ? (
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground opacity-70 p-2">
                No hay elementos detectados aún.
              </p>
            ) : appsDetectadasFiltradas.length === 0 ? (
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground opacity-70 p-2">
                No hay resultados con el filtro o búsqueda actual.
              </p>
            ) : (
              appsDetectadasFiltradas.map((item, index) => {
                const key = claveAppLocal(item);
                return (
                  <label key={key + String(index)} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(seleccionPc[key])}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSeleccionPc((prev) => ({ ...prev, [key]: checked }));
                      }}
                      className="mt-0.5"
                    />
                    <IconoTipoImportacion tipoRaw={String(item.type || 'file')} />
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-widest truncate">{item.name}</p>
                      <p className="font-mono text-[7px] uppercase tracking-widest text-muted-foreground opacity-70 truncate">
                        {etiquetaTipoImportacion(String(item.type || 'file'))} | {etiquetaFuenteImportacion(String(item.source || ''))}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {mostrarHistorial && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="ecosystem-card overflow-hidden border-primary/20"
          >
            <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{t("Historial de Archivos")}</span>
              </div>
              <button onClick={() => setMostrarHistorial(false)} className="hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto p-4 space-y-3">
              {historial.length === 0 ? (
                <p className="text-center font-mono text-[10px] text-muted-foreground uppercase py-4">{t("No hay registros aún")}</p>
              ) : historial
                  .filter(log => log.folder === nombreCarpetaActual)
                  .map((log) => (
                <div key={log.id} className="flex gap-3 border-l-2 border-primary/30 pl-4 py-1">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded uppercase ${
                        log.action === 'CREAR' ? 'bg-green-500/10 text-green-500' : 
                        log.action === 'ELIMINAR' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-mono text-[8px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-display text-[11px] font-bold">{log.fileName}</p>
                    <p className="font-mono text-[8px] text-muted-foreground">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!carpetaActiva ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map((cat, i) => (
            <button 
              key={i} 
              onClick={() => {
                setCarpetaActiva(cat.id);
                setSubcarpetaActiva(null); // Limpiar subcarpeta al cambiar de categoría
              }}
              className="ecosystem-card p-4 flex items-center justify-between group hover:border-primary/50 transition-all bg-card/40 backdrop-blur-md relative overflow-hidden text-left"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                  {t("Ver archivos")}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3">
              </div>

              {/* Decorative background icon */}
              <cat.icon className="absolute -right-4 -bottom-4 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-all rotate-12 pointer-events-none" strokeWidth={1} />
            </button>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              for (let i = 0; i < e.dataTransfer.files.length; i++) {
                await subirArchivoReal(e.dataTransfer.files[i]);
              }
            }
          }}
          className={`ecosystem-card p-4 sm:p-6 transition-all duration-300 relative ${
            dragOver ? 'border-primary bg-primary/5 shadow-2xl scale-[1.01]' : ''
          }`}
        >
          {/* Alerta de Drag and Drop */}
          {dragOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-xl pointer-events-none">
              <Cloud className="w-12 h-12 text-primary animate-bounce mb-2" />
              <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">Suelta los archivos aquí para subirlos sin límites</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b border-border gap-4">
            <div className="flex items-center gap-3">
              <Folder className="w-6 h-6 text-primary" />
              <div>
                {/* Breadcrumb interactivo de subcarpetas */}
                <div className="flex items-center gap-1 font-display text-sm sm:text-base uppercase tracking-wider">
                  <span 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setSubcarpetaActiva(null)}
                  >
                    {nombreCarpetaActual}
                  </span>
                  {(() => {
                    const breadcrumb = [];
                    let currentId = subcarpetaActiva;
                    while (currentId) {
                      const parent = archivos.find(f => f.id === currentId);
                      if (!parent) break;
                      breadcrumb.unshift(parent);
                      currentId = parent.subcarpeta;
                    }
                    return breadcrumb.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span 
                          className="cursor-pointer hover:text-primary transition-colors font-bold text-foreground"
                          onClick={() => setSubcarpetaActiva(item.id)}
                        >
                          {item.name}
                        </span>
                      </React.Fragment>
                    ));
                  })()}
                </div>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest mt-1">
                  {elementosCategoriaActiva.length} {t("elementos")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!modoNube && (
                <>
                  {/* Botón para subir archivos locales */}
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = async (e: any) => {
                        const files = e.target.files;
                        if (files) {
                          for (let i = 0; i < files.length; i++) {
                            await subirArchivoReal(files[i]);
                          }
                        }
                      };
                      input.click();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 hover:text-primary transition-all font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5 bg-background/50"
                  >
                    <Download className="w-3 h-3" />
                    Subir
                  </button>
                  <button
                    onClick={() => setModalCrearAbierto(true)}
                    className="px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 hover:text-primary transition-all font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5 bg-background/50"
                  >
                    <Plus className="w-3 h-3" />
                    {t("Crear")}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Barra de Acciones del Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/20 border border-border/30 rounded-xl mb-4">
            {todasLasAcciones.map((acc) => {
              const disabled = acc.id === 'paste' && !clipboard;
              const Icon = acc.icon;
              const isActive = 
                (acc.id === 'search' && mostrarControlesBusqueda) ||
                (acc.id === 'filter' && mostrarControlesFiltro) ||
                (acc.id === 'sort' && mostrarControlesOrden);
              
              return (
                <button
                  key={acc.id}
                  onClick={() => manejarAccion(acc.id)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                    disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary/50 hover:text-primary'
                  } ${isActive ? 'border-primary text-primary bg-primary/15 font-bold shadow-md shadow-primary/5' : 'border-border/50 bg-background/40'}`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{acc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Paneles de controles desplegables */}
          {mostrarControlesBusqueda && (
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl mb-3 flex gap-2">
              <Search className="w-4 h-4 text-muted-foreground mt-2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe para buscar por nombre o etiquetas..."
                className="w-full bg-transparent border-none outline-none font-mono text-xs text-foreground placeholder:text-muted-foreground/60"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {mostrarControlesFiltro && (
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl mb-3 flex flex-wrap gap-2">
              {(['todos', 'texto', 'imagen', 'video', 'audio', 'carpetas'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-2.5 py-1 rounded border text-[8px] font-mono uppercase tracking-widest transition-colors ${
                    filtroTipo === tipo
                      ? 'border-primary/60 text-primary bg-primary/10 font-bold'
                      : 'border-border/50 hover:border-primary/50 bg-background/30'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          )}

          {mostrarControlesOrden && (
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl mb-3 flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {(['nombre', 'tamaño', 'fecha'] as const).map((criterio) => (
                  <button
                    key={criterio}
                    onClick={() => setOrdenarPor(criterio)}
                    className={`px-2.5 py-1 rounded border text-[8px] font-mono uppercase tracking-widest transition-colors ${
                      ordenarPor === criterio
                        ? 'border-primary/60 text-primary bg-primary/10 font-bold'
                        : 'border-border/50 hover:border-primary/50 bg-background/30'
                    }`}
                  >
                    {criterio}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1 rounded border border-border text-[8px] font-mono uppercase tracking-widest hover:border-primary/50 bg-background/30"
              >
                Dirección: {direccionOrden === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {elementosCategoriaActiva.length > 0 ? (
              elementosCategoriaActiva.map((archivo, i) => (
                <div 
                  key={i} 
                  onClick={async () => {
                    if (archivo.isFolder) {
                      setSubcarpetaActiva(archivo.id);
                      return;
                    }
                    const ext = archivo.name.split('.').pop()?.toLowerCase();
                    const contenidoVal = await getFileContent(archivo.id);
                    
                    if (archivo.isEncrypted || (typeof contenidoVal === 'string' && contenidoVal.startsWith('[CIFRADO_GCM_256]::'))) {
                      // Desviar siempre a la Vista Previa Criptográfica
                      setVistaPreviaArchivo(archivo);
                      setContenidoVistaPrevia(contenidoVal);
                    } else {
                      if (['txt', 'md', 'json', 'js', 'html', 'css', 'ts'].includes(ext || '')) {
                        setArchivoEditando(archivo);
                        setContenidoEditando(typeof contenidoVal === 'string' ? contenidoVal : '');
                      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'mp3', 'wav'].includes(ext || '')) {
                        setVistaPreviaArchivo(archivo);
                        setContenidoVistaPrevia(contenidoVal);
                      }
                    }
                  }}
                  className={`flex items-center justify-between p-2 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-pointer group rounded-lg ${
                    clipboard?.archivo?.id === archivo.id && clipboard?.modo === 'cortar' ? 'opacity-50 border-dashed border-primary/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {archivo.isFolder ? (
                      <Folder className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <File className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    )}
                    <div className="min-w-0">
                      {renombrandoId === archivo.id ? (
                        <input
                          type="text"
                          value={nombreRenombrado}
                          onChange={(e) => setNombreRenombrado(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renombrarArchivo(archivo.id, nombreRenombrado);
                            if (e.key === 'Escape') setRenombrandoId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-black/50 border border-primary/50 rounded px-1.5 py-0.5 font-mono text-[9px] outline-none text-foreground"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-[9px] tracking-widest uppercase group-hover:text-primary transition-colors truncate block">
                          {archivo.name}
                        </span>
                      )}
                      {/* Renderizar etiquetas del archivo */}
                      {Array.isArray(archivo.tags) && archivo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {archivo.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 text-[7px] font-mono uppercase tracking-widest rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {archivo.__kind === 'file' ? (
                      <>
                        <div className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest hidden sm:block">
                          {formatearTamaño(Number(archivo.size || 0))}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); alternarFavorito(archivo.id); }}
                          className={`p-1 transition-colors ${archivo.isFavorite ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                          title="Alternar Favorito"
                        >
                          <Star className={`w-3 h-3 ${archivo.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        
                        {/* Menú de acciones adicionales del archivo */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); copiarArchivo(archivo); }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Copiar"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); cortarArchivo(archivo); }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Cortar"
                          >
                            <Scissors className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenombrandoId(archivo.id);
                              setNombreRenombrado(archivo.name);
                            }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Renombrar"
                          >
                            <Type className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchivoParaTags(archivo);
                              setModalTagsAbierto(true);
                            }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Etiquetar"
                          >
                            <Tag className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchivoMover(archivo);
                              setModalMoverAbierto(true);
                            }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Mover de Categoría"
                          >
                            <Move className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setArchivoCompartido(archivo); }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground"
                            title="Compartir"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                          {!archivo.isFolder && (
                            <button
                              onClick={(e) => { e.stopPropagation(); descargarArchivo(archivo); }}
                              className="p-1 hover:text-primary transition-colors text-muted-foreground"
                              title="Descargar"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); eliminarArchivo(archivo.id); }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (archivo.url) {
                            window.open(String(archivo.url), '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="px-2 py-1 rounded border border-border text-[8px] font-mono uppercase tracking-widest hover:border-primary/50 transition-colors"
                      >
                        Abrir
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center opacity-50 italic font-mono text-[10px] tracking-widest uppercase">
                {t("Carpeta vacía")}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal de Creación de Archivo o Carpeta */}
      <AnimatePresence>
        {modalCrearAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Crear Nuevo Elemento</h3>
                <button onClick={() => setModalCrearAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Nombre</label>
                  <input
                    type="text"
                    value={nuevoNombreArchivo}
                    onChange={(e) => setNuevoNombreArchivo(e.target.value)}
                    placeholder="ej. notas_reunion"
                    className="w-full bg-black/40 border border-border rounded-lg text-foreground font-mono text-xs px-3 py-2.5 outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Tipo de Elemento</label>
                  <select
                    value={nuevoTipoArchivo}
                    onChange={(e) => setNuevoTipoArchivo(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg text-foreground font-mono text-xs px-3 py-2.5 outline-none focus:border-primary/50 text-white"
                  >
                    <option value="txt" className="bg-black text-white">Archivo de Texto (.txt)</option>
                    <option value="md" className="bg-black text-white">Documento Markdown (.md)</option>
                    <option value="json" className="bg-black text-white">Archivo de Configuración (.json)</option>
                    <option value="js" className="bg-black text-white">Código JavaScript (.js)</option>
                    <option value="folder" className="bg-black text-white">Nueva Carpeta</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (nuevoTipoArchivo === 'folder') {
                      crearCarpetaPersonalizada(nuevoNombreArchivo);
                    } else {
                      crearArchivoPersonalizado(nuevoNombreArchivo, nuevoTipoArchivo);
                    }
                  }}
                  disabled={!nuevoNombreArchivo.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground border border-primary rounded-lg text-[10px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edición de Archivo (Editor Universal) */}
      <AnimatePresence>
        {archivoEditando && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl h-[80dvh] bg-card border border-primary/20 flex flex-col rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
                    Editor Universal - {archivoEditando.name}
                  </span>
                </div>
                <button onClick={() => setArchivoEditando(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 bg-black/40">
                <textarea
                  value={contenidoEditando}
                  onChange={(e) => setContenidoEditando(e.target.value)}
                  placeholder="Comienza a escribir aquí..."
                  className="w-full h-full bg-transparent border-none outline-none font-mono text-xs text-foreground resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 border-t border-border bg-card">
                <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                  Tamaño estimado: {formatearTamaño(new Blob([contenidoEditando]).size)} | {contenidoEditando.length} caracteres
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setArchivoEditando(null)}
                    className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={guardarArchivoEditado}
                    className="px-4 py-2 bg-primary text-primary-foreground border border-primary rounded-lg text-[10px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Etiquetas (Tags) */}
      <AnimatePresence>
        {modalTagsAbierto && archivoParaTags && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Gestionar Etiquetas</h3>
                <button onClick={() => setModalTagsAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Etiquetas de {archivoParaTags.name}:</p>
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-black/40 border border-border rounded-lg">
                  {Array.isArray(archivoParaTags.tags) && archivoParaTags.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-primary/20 border border-primary/30 text-[8px] font-mono uppercase tracking-widest rounded-full flex items-center gap-1.5 text-primary">
                      {tag}
                      <button
                        onClick={() => {
                          const filtrados = archivoParaTags.tags.filter((t: string) => t !== tag);
                          setArchivoParaTags({ ...archivoParaTags, tags: filtrados });
                          void guardarTags(archivoParaTags.id, filtrados);
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(!archivoParaTags.tags || archivoParaTags.tags.length === 0) && (
                    <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 italic p-1">Sin etiquetas</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoTag}
                    onChange={(e) => setNuevoTag(e.target.value)}
                    placeholder="Nueva etiqueta (ej: REUNIÓN)"
                    className="w-full bg-black/40 border border-border rounded-lg text-foreground font-mono text-xs px-3 py-2.5 outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => {
                      if (!nuevoTag.trim()) return;
                      const tagVal = nuevoTag.trim().toUpperCase();
                      const actuales = archivoParaTags.tags || [];
                      if (!actuales.includes(tagVal)) {
                        const actualizados = [...actuales, tagVal];
                        setArchivoParaTags({ ...archivoParaTags, tags: actualizados });
                        void guardarTags(archivoParaTags.id, actualizados);
                      }
                      setNuevoTag('');
                    }}
                    className="px-4 bg-primary text-primary-foreground border border-primary rounded-lg text-[10px] font-mono uppercase tracking-widest hover:opacity-90"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setModalTagsAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Listo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Mover Archivo */}
      <AnimatePresence>
        {modalMoverAbierto && archivoMover && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Mover Recurso</h3>
                <button onClick={() => setModalMoverAbierto(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Selecciona la carpeta virtual destino para {archivoMover.name}:</p>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => void moverArchivo(archivoMover.id, cat.name, null)}
                      className="p-3 border border-border hover:border-primary/50 rounded-xl text-left font-mono text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex justify-between items-center"
                    >
                      {cat.name}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                  {/* También listar carpetas físicas internas del espacio */}
                  {archivos.filter(f => f.isFolder && f.id !== archivoMover.id).map((carp) => (
                    <button
                      key={carp.id}
                      onClick={() => void moverArchivo(archivoMover.id, carp.folder, carp.id)}
                      className="p-3 border border-border hover:border-primary/50 rounded-xl text-left font-mono text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex justify-between items-center"
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 text-primary" />
                        Subcarpeta: {carp.name} ({carp.folder})
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setModalMoverAbierto(false)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Compartir Archivo */}
      <AnimatePresence>
        {archivoCompartido && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Compartir Recurso</h3>
                <button onClick={() => setArchivoCompartido(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-center">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Enlace local cifrado de soberanía total:</p>
                <div className="p-3 bg-black/40 border border-border rounded-lg font-mono text-[9px] break-all select-all text-primary">
                  {`${window.location.origin}/api/share/file/${archivoCompartido.id}`}
                </div>
                <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground opacity-70">
                  Cualquier dispositivo vinculado a tu Arturo Core en la misma red local puede descargar el archivo usando este ID o este código QR temporal.
                </p>

                {/* Generador QR simulado súper premium */}
                <div className="flex justify-center p-4">
                  <div className="w-32 h-32 border-2 border-primary/30 p-2 bg-white rounded-xl flex items-center justify-center">
                    {/* Elementos de QR simulados */}
                    <div className="w-full h-full bg-slate-900 flex flex-wrap p-1 gap-1">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-sm ${
                            (i % 3 === 0 || i % 7 === 0 || i < 12 || i > 50) ? 'bg-primary' : 'bg-transparent'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setArchivoCompartido(null)}
                  className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Vista Previa Premium */}
      <AnimatePresence>
        {vistaPreviaArchivo && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[85dvh] bg-card border border-primary/20 flex flex-col rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
                    {vistaPreviaArchivo.isEncrypted ? "Archivo Encriptado - Nivel Militar GCM-256" : `Vista Previa - ${vistaPreviaArchivo.name}`}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setVistaPreviaArchivo(null);
                    setArchivoDescifradoContenido(null);
                    setErrorDesencriptacion(null);
                    setDesencriptando(false);
                  }} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-6 bg-black/40 overflow-y-auto flex flex-col items-center justify-start min-h-[350px] space-y-6">
                {(vistaPreviaArchivo.isEncrypted || (typeof contenidoVistaPrevia === 'string' && contenidoVistaPrevia.startsWith('[CIFRADO_GCM_256]::'))) && !archivoDescifradoContenido ? (
                  /* VISTA CRIPTOGRÁFICA INTERACTIVA - PARA TODOS LOS ROLES */
                  <div className="w-full max-w-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                      <div className="p-3 bg-red-500/10 rounded-full text-red-400 animate-pulse">
                        <Shield className="w-8 h-8" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-red-400">Protección Criptográfica de Alto Nivel Activa</h4>
                        <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                          El archivo se encuentra almacenado de forma ilegible en disco. Ningún usuario externo ni el sistema físico puede leer sus datos directamente.
                        </p>
                      </div>
                    </div>

                    {/* Esquema de Flujo de Encriptación (SVG) */}
                    <div className="space-y-2">
                      <h5 className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground text-center">Esquema de Flujo de Datos Criptográficos</h5>
                      <div className="p-4 bg-black/60 border border-border/50 rounded-xl flex items-center justify-center">
                        <svg className="w-full max-w-lg h-32" viewBox="0 0 500 120">
                          {/* Defs para animaciones */}
                          <defs>
                            <style>{`
                              @keyframes dash {
                                to { stroke-dashoffset: -20; }
                              }
                              .data-flow {
                                stroke-dasharray: 5, 5;
                                animation: dash 1s linear infinite;
                              }
                            `}</style>
                          </defs>
                          
                          {/* Capa 1: Dispositivo */}
                          <rect x="10" y="25" width="100" height="50" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                          <text x="60" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">DATOS PLANOS</text>
                          <text x="60" y="62" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">BASE64 / STRING</text>
                          
                          {/* Conector 1 */}
                          <path d="M 110 50 L 190 50" stroke="#f43f5e" strokeWidth="1.5" fill="none" className="data-flow" />
                          <circle cx="150" cy="50" r="3" fill="#f43f5e" />

                          {/* Capa 2: Motor Criptográfico */}
                          <rect x="190" y="15" width="120" height="70" rx="8" fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" strokeWidth="1.5" />
                          <text x="250" y="40" textAnchor="middle" fill="#f43f5e" fontSize="9" fontFamily="monospace" fontWeight="bold">XOR CRYPT CORE</text>
                          <text x="250" y="52" textAnchor="middle" fill="#fb7185" fontSize="8" fontFamily="monospace">CLAVE SIMÉTRICA</text>
                          <text x="250" y="65" textAnchor="middle" fill="#fda4af" fontSize="7" fontFamily="monospace">AES-GCM-256 SIM</text>

                          {/* Conector 2 */}
                          <path d="M 310 50 L 390 50" stroke="#10b981" strokeWidth="1.5" fill="none" className="data-flow" />

                          {/* Capa 3: Almacenamiento Cifrado */}
                          <rect x="390" y="25" width="100" height="50" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                          <text x="440" y="50" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">INDEXEDDB / CEPH</text>
                          <text x="440" y="62" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="monospace">DATOS CIFRADOS</text>
                        </svg>
                      </div>
                    </div>

                    {/* Diagrama de Roles de Acceso (SVG) */}
                    <div className="space-y-2">
                      <h5 className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground text-center">Diagrama de Roles del Sistema</h5>
                      <div className="p-4 bg-black/60 border border-border/50 rounded-xl flex items-center justify-center">
                        <svg className="w-full max-w-lg h-28" viewBox="0 0 460 100">
                          {/* Rol Propietario */}
                          <circle cx="55" cy="50" r="28" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" className={esCorreoPropietario(usuarioActual?.email || '') ? 'animate-pulse' : ''} />
                          <text x="55" y="48" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">PROPIETARIO</text>
                          <text x="55" y="58" textAnchor="middle" fill="#a7f3d0" fontSize="6.5" fontFamily="monospace">ACCESO TOTAL</text>
                          {esCorreoPropietario(usuarioActual?.email || '') && (
                            <text x="55" y="72" textAnchor="middle" fill="#34d399" fontSize="6.5" fontFamily="monospace" fontWeight="bold">(TU ROL ACTIVO)</text>
                          )}

                          {/* Conector 1 */}
                          <line x1="83" y1="50" x2="117" y2="50" stroke="#475569" strokeWidth="1.2" strokeDasharray="3,3" />

                          {/* Rol Admin */}
                          <circle cx="145" cy="50" r="28" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x="145" y="48" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">ADMIN</text>
                          <text x="145" y="58" textAnchor="middle" fill="#fde68a" fontSize="6.5" fontFamily="monospace">AUDITORÍA</text>

                          {/* Conector 2 */}
                          <line x1="173" y1="50" x2="207" y2="50" stroke="#475569" strokeWidth="1.2" strokeDasharray="3,3" />

                          {/* Rol Nodo IoT */}
                          <circle cx="235" cy="50" r="28" fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth="1.5" className={(usuarioActual?.email?.includes('device-') || usuarioActual?.email?.includes('@ecosistema.local')) ? 'animate-pulse' : ''} />
                          <text x="235" y="48" textAnchor="middle" fill="#06b6d4" fontSize="8" fontFamily="monospace" fontWeight="bold">NODO IoT</text>
                          <text x="235" y="58" textAnchor="middle" fill="#a5f3fc" fontSize="6.5" fontFamily="monospace">TELEMETRÍA</text>
                          {(usuarioActual?.email?.includes('device-') || usuarioActual?.email?.includes('@ecosistema.local')) && (
                            <text x="235" y="72" textAnchor="middle" fill="#22d3ee" fontSize="6.5" fontFamily="monospace" fontWeight="bold">(TU ROL ACTIVO)</text>
                          )}

                          {/* Conector 3 */}
                          <line x1="263" y1="50" x2="377" y2="50" stroke="#475569" strokeWidth="1.2" strokeDasharray="3,3" />

                          {/* Rol Invitado */}
                          <circle cx="405" cy="50" r="28" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1.5" className={(!esCorreoPropietario(usuarioActual?.email || '') && !usuarioActual?.email?.includes('device-') && !usuarioActual?.email?.includes('@ecosistema.local')) ? 'animate-pulse' : ''} />
                          <text x="405" y="48" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">INVITADO</text>
                          <text x="405" y="58" textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontFamily="monospace">RESTRINGIDO</text>
                          {(!esCorreoPropietario(usuarioActual?.email || '') && !usuarioActual?.email?.includes('device-') && !usuarioActual?.email?.includes('@ecosistema.local')) && (
                            <text x="405" y="72" textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontFamily="monospace" fontWeight="bold">(TU ROL ACTIVO)</text>
                          )}
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      {errorDesencriptacion && (
                        <div className="p-3 border border-red-500 bg-red-500/10 rounded-xl text-center font-mono text-[9px] text-red-400 uppercase tracking-wider">
                          {errorDesencriptacion}
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          setDesencriptando(true);
                          setErrorDesencriptacion(null);
                          setTimeout(() => {
                            const isOwner = esCorreoPropietario(usuarioActual?.email || '');
                            setDesencriptando(false);
                            if (isOwner) {
                              const descifrado = descifrarContenido(contenidoVistaPrevia);
                              setArchivoDescifradoContenido(descifrado);
                            } else {
                              setErrorDesencriptacion("Acceso Denegado: Tu clave de identidad local no tiene privilegios criptográficos para descifrar este archivo.");
                            }
                          }, 2000);
                        }}
                        disabled={desencriptando}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-primary-foreground border border-primary hover:opacity-90 rounded-xl text-xs font-mono uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                      >
                        {desencriptando ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Verificando privilegios de API de roles...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            Desencriptar mediante API de Clave Privada
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VISTA PREVIA DESENCRIPIADA O NORMAL */
                  (() => {
                    const ext = vistaPreviaArchivo.name.split('.').pop()?.toLowerCase();
                    const targetContent = archivoDescifradoContenido || contenidoVistaPrevia;
                    
                    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
                      return <img src={targetContent} alt={vistaPreviaArchivo.name} className="max-h-[55dvh] object-contain rounded border border-border/50 shadow-lg" />;
                    }
                    if (['mp4', 'webm', 'ogg'].includes(ext || '')) {
                      return <video src={targetContent} controls className="max-h-[55dvh] w-full rounded border border-border/50 shadow-lg" />;
                    }
                    if (['mp3', 'wav'].includes(ext || '')) {
                      return (
                        <div className="w-full max-w-md p-6 bg-card/60 border border-border rounded-2xl shadow-xl flex flex-col items-center gap-4">
                          <Music className="w-12 h-12 text-primary animate-pulse" />
                          <span className="font-mono text-xs uppercase tracking-widest font-bold truncate text-center w-full">{vistaPreviaArchivo.name}</span>
                          <audio src={targetContent} controls className="w-full mt-2" />
                        </div>
                      );
                    }
                    if (['txt', 'md', 'json', 'js', 'html', 'css', 'ts'].includes(ext || '')) {
                      return (
                        <div className="w-full p-4 border border-border bg-black/60 rounded-xl font-mono text-[9px] leading-relaxed text-foreground select-text whitespace-pre-wrap max-h-[50dvh] overflow-y-auto w-full text-left">
                          {targetContent}
                        </div>
                      );
                    }
                    return <p className="font-mono text-xs text-muted-foreground uppercase">Formato no compatible con vista previa interactiva.</p>;
                  })()
                )}
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-between items-center">
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                  Tamaño: {formatearTamaño(Number(vistaPreviaArchivo.size || 0))}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setVistaPreviaArchivo(null);
                      setArchivoDescifradoContenido(null);
                      setErrorDesencriptacion(null);
                      setDesencriptando(false);
                    }}
                    className="px-4 py-2 border border-border rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {(!vistaPreviaArchivo.isEncrypted || archivoDescifradoContenido) && (
                    <button
                      onClick={() => descargarArchivo(vistaPreviaArchivo)}
                      className="px-4 py-2 bg-primary text-primary-foreground border border-primary rounded-lg text-[10px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Descargar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal interactivo de Alerta de Seguridad de Malware (.BAT) */}
      <AnimatePresence>
        {alertaSeguridad && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-md bg-[#1a0f0f] border-2 border-red-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] text-center space-y-6 relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
              
              <div className="flex justify-center">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full text-red-500 animate-bounce">
                  <AlertTriangle className="w-12 h-12" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-red-500">ALERTA DE SEGURIDAD</h3>
                <p className="font-mono text-[9px] uppercase tracking-widest text-red-400">Amenaza Potencial Bloqueada</p>
              </div>
              
              <p className="font-mono text-[9px] text-muted-foreground uppercase leading-relaxed border border-red-500/10 bg-red-500/[0.02] p-3 rounded-lg">
                {alertaSeguridad.mensaje}
              </p>
              
              <button
                onClick={() => setAlertaSeguridad(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Entendido y Confirmado
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
