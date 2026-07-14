import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Filter, Clock, FileText, Globe, Bot, Layers, Trash2, Calendar, ChevronRight, Shield, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, auth, manejarErrorDatos, TipoAccionDatos } from '../../lib/core';
import { collection, onSnapshot, query, where, limit, orderBy } from '../../lib/oss/firestore';
import { useAuthState } from '../../lib/oss/useAuthState';

export default function Historial({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();
  const [usuarioActual] = useAuthState(auth);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  useEffect(() => {
    if (!usuarioActual) return;

    // Queremos unificar varios historiales o al menos mostrar el principal
    // Por ahora nos enfocamos en 'historial_archivos' y 'space_history'
    const colecciones = ['historial_archivos', 'space_history'];
    const desuscriptores: (() => void)[] = [];
    
    let todosLosEventos: any[] = [];

    colecciones.forEach(coleccion => {
      const q = query(
        collection(db, coleccion),
        where("userId", "==", usuarioActual.uid),
        limit(50)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const nuevosEventos = snapshot.docs.map(doc => ({
          id: doc.id,
          source: coleccion,
          ...doc.data()
        }));
        
        // Actualizamos de forma reactiva
        setEventos(prev => {
          const filtrados = prev.filter(e => e.source !== coleccion);
          const combinados = [...filtrados, ...nuevosEventos].sort((a, b) => b.timestamp - a.timestamp);
          return combinados.slice(0, 100);
        });
        setCargando(false);
      }, (error) => {
        manejarErrorDatos(error, TipoAccionDatos.LISTADO, coleccion);
      });
      
      desuscriptores.push(unsub);
    });

    return () => desuscriptores.forEach(u => u());
  }, [usuarioActual]);

  const eventosFiltrados = eventos.filter(evento => {
    const coincideBusqueda = 
      (evento.fileName?.toLowerCase().includes(terminoBusqueda.toLowerCase())) ||
      (evento.action?.toLowerCase().includes(terminoBusqueda.toLowerCase())) ||
      (evento.details?.toLowerCase().includes(terminoBusqueda.toLowerCase()));
    
    const coincideFiltro = filtroTipo === 'todos' || 
      (filtroTipo === 'archivos' && evento.source === 'historial_archivos') ||
      (filtroTipo === 'espacios' && evento.source === 'space_history');

    return coincideBusqueda && coincideFiltro;
  });

  const formatearFecha = (timestamp: number) => {
    const fecha = new Date(timestamp);
    return fecha.toLocaleString();
  };

  const getIconoEvento = (evento: any) => {
    if (evento.source === 'space_history') return <Globe className="w-4 h-4 text-indigo-500" />;
    if (evento.action === 'CREAR') return <FileText className="w-4 h-4 text-green-500" />;
    if (evento.action === 'ELIMINAR') return <Trash2 className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 px-4 sm:px-6">
      {alNavegar && (
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title={t("Volver")}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex flex-col gap-1 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">{t('HISTORIAL')}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-1 font-mono opacity-60">
              {t('REGISTRO DE ACTIVIDADES Y EVENTOS')}
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full shrink-0">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">{t('AUDITANDO')}</span>
          </div>
        </header>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="space-y-6">
          <div className="ecosystem-card p-6 space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">{t('Filtros')}</h3>
             <div className="space-y-2">
                {['todos', 'archivos', 'espacios'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-[9px] uppercase tracking-widest font-mono transition-all ${filtroTipo === tipo ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-primary/10 text-muted-foreground'}`}
                  >
                    {t(tipo)}
                  </button>
                ))}
             </div>
          </div>

          <div className="ecosystem-card p-6 bg-primary/5 border-primary/10">
             <div className="flex items-center gap-3 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h4 className="text-[9px] font-bold uppercase tracking-widest">{t('Integridad')}</h4>
             </div>
             <p className="text-[8px] text-muted-foreground leading-relaxed uppercase">Todos los registros están firmados y almacenados de forma inmutable en el clúster.</p>
          </div>
        </aside>

        <main className="md:col-span-3 space-y-6">
          <div className="ecosystem-card p-3.5 flex items-center gap-4">
            <Search className="w-4 h-4 text-muted-foreground ml-2" />
            <input 
              type="text" 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder={t("BUSCAR EN EL HISTORIAL...")}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] uppercase tracking-widest placeholder:opacity-30"
            />
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {cargando ? (
                <div className="py-20 text-center opacity-30 animate-pulse uppercase tracking-[0.5em] text-xs">
                  {t('Sincronizando registros...')}
                </div>
              ) : eventosFiltrados.length > 0 ? (
                eventosFiltrados.map((evento, index) => (
                  <motion.div
                    key={evento.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="ecosystem-card p-6 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden bg-card/40 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all shrink-0">
                         {getIconoEvento(evento)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{evento.action}</span>
                          <span className="text-[7px] text-muted-foreground uppercase font-mono px-1.5 py-0.5 bg-muted border border-border rounded-md opacity-70">{evento.source.replace('historial_', '')}</span>
                        </div>
                        <h4 className="text-sm font-display font-medium text-foreground tracking-tight group-hover:text-primary transition-colors">{evento.fileName || evento.spaceName || t('Acción del sistema')}</h4>
                        {evento.details && <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-60 uppercase tracking-wider">{evento.details}</p>}
                        <div className="flex items-center gap-4 mt-3">
                           <span className="flex items-center gap-1.5 text-[8px] text-muted-foreground uppercase font-mono opacity-50">
                             <Clock className="w-3 h-3" strokeWidth={1.5} /> 
                             {formatearFecha(evento.timestamp)}
                           </span>
                           {evento.folder && (
                             <span className="flex items-center gap-1.5 text-[8px] text-muted-foreground uppercase font-mono opacity-50">
                               <Layers className="w-3 h-3" strokeWidth={1.5} /> 
                               {evento.folder}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                       <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                    </div>

                    {/* Decorative background icon */}
                    
                  </motion.div>
                ))
              ) : (
                <div className="ecosystem-card py-20 text-center opacity-30 flex flex-col items-center">
                  <History className="w-12 h-12 mb-4" />
                  <p className="uppercase tracking-[0.3em] text-[10px]">{t('No se han encontrado registros en este periodo')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

