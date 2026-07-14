import { useState } from 'react';
import { motion } from 'motion/react';
import { Search as SearchIcon, Filter, FileText, Folder, Video, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Buscar({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();
  const [consulta, setConsulta] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  
  const filtros = [
    "Todos", "Nombre", "Fecha", "Tipo", "Etiquetas", "Tamaño", "Persona", "Contenido", "IA", "Voz"
  ];

  const obtenerResultados = () => {
    if (!consulta) return [];
    return [
      { name: `Documento_${consulta}.pdf`, type: 'Documento', icon: FileText, size: '2.4 MB' },
      { name: `Carpeta_${consulta}`, type: 'Carpeta', icon: Folder, size: '--' },
      { name: `Video_${consulta}.mp4`, type: 'Video', icon: Video, size: '1.2 GB' },
      { name: `Imagen_${consulta}.png`, type: 'Imagen', icon: ImageIcon, size: '4.1 MB' },
    ];
  };

  const resultados = obtenerResultados();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-12 pb-12"
    >
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button 
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title={t("Volver")}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">
            {t("BUSCAR")}
          </h1>
          <p className="font-mono text-muted-foreground uppercase text-[10px] tracking-[0.3em] opacity-70">
            {t("BÚSQUEDA INTELIGENTE")}
          </p>
        </div>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-primary" />
        </div>
        <input
          type="text"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 bg-background border border-border text-foreground font-mono uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-inner"
          placeholder="INGRESE PARÁMETROS DE BÚSQUEDA..."
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
           <div className={`font-mono text-[10px] tracking-widest ${consulta ? 'text-primary' : 'text-primary/70 animate-pulse'}`}>
             {consulta ? 'BUSCANDO...' : 'ESPERANDO ENTRADA'}
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filtros Disponibles
        </h3>
        <div className="flex flex-wrap gap-3">
          {filtros.map((filtro, i) => (
            <button 
              key={i} 
              onClick={() => setFiltroActivo(filtro)}
              className={`ecosystem-card px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                filtroActivo === filtro 
                  ? 'bg-primary/20 text-primary border-primary/50' 
                  : 'hover:bg-muted  text-foreground hover:text-primary'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </div>
      
      <div className={`ecosystem-card ${consulta ? 'p-4' : 'p-8 border-dashed'} border-border/50 flex flex-col min-h-[300px] relative overflow-hidden transition-all duration-300`}>
         {!consulta ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--glow)_0%,transparent_70%)]" />
             <span className="font-mono text-sm uppercase tracking-widest z-10 text-muted-foreground">Esperando consulta...</span>
           </div>
         ) : (
           <div className="space-y-2 z-10 w-full">
             <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 px-2">
               Resultados para "{consulta}"
             </div>
             {resultados.map((res, i) => (
               <div key={i} className="ecosystem-card p-3.5 flex items-center justify-between group cursor-pointer bg-card/40 backdrop-blur-md hover:border-primary/50 transition-all relative overflow-hidden mb-2">
                 <div className="relative z-10">
                   <h3 className="font-display font-medium uppercase tracking-[0.2em] text-[11px] text-foreground group-hover:text-primary transition-colors">
                     {res.name}
                   </h3>
                   <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-70">
                     {res.type}
                   </p>
                 </div>
                 <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest relative z-10">
                   {res.size}
                 </div>
                 
               </div>
             ))}
           </div>
         )}
      </div>
    </motion.div>
  );
}
