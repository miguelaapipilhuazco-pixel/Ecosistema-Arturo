import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """function VistaAlmacenamiento({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
       <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('ALMACENAMIENTO')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('INFRAESTRUCTURA DE DATOS')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Capacidad Global')}</h3>
              <HardDrive className="w-4 h-4 text-primary" />
           </div>
           <div className="space-y-4">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-primary" style={{ width: '65%' }} />
                 <div className="h-full bg-blue-500" style={{ width: '15%' }} />
              </div>
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>650 TB Utilizado</span>
                 <span>1 PB Total</span>
              </div>
           </div>
        </div>
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Estado de Nodos')}</h3>
              <Server className="w-4 h-4 text-primary" />
           </div>
           <div className="grid grid-cols-4 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`h-8 rounded ${i === 7 ? 'bg-orange-500/40 border-orange-500/60' : 'bg-green-500/40 border-green-500/60'} border animate-pulse`} style={{ animationDelay: `${i * 100}ms` }} />
              ))}
           </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {['Replicación', 'Integridad', 'Copias de Seguridad'].map((etiqueta, i) => (
           <div key={i} className="ecosystem-card p-4 border-border/50 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest">{t(etiqueta)}</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
           </div>
         ))}
      </div>
    </div>
  );
}"""

content = re.sub(r'function VistaAlmacenamiento\(\{ t \}: \{ t: any \}\) \{.*?(?=function VistaServidores)', replacement + '\n', content, flags=re.DOTALL)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
