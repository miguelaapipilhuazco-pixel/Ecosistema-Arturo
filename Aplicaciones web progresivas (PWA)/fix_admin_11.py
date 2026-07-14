import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """function VistaServidores({ t }: { t: any }) {
  const [servidores, setServidores] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'servers'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServidores(docs);
    }, (error) => {
       manejarErrorFirestore(error, TipoOperacion.LECTURA, 'servers');
    });
    return () => unsub();
  }, []);

  const manejarActualizarServidor = async (id: string) => {
    try {
      await updateDoc(doc(db, 'servers', id), {
        lastPing: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
       manejarErrorFirestore(e, TipoOperacion.ESCRITURA, `servers/${id}`);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('SERVIDORES')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('NODOS DE PROCESAMIENTO')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {servidores.map((servidor) => (
          <div key={servidor.id} className="ecosystem-card p-6 border-border/50 group hover:border-primary/40 transition-all">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div>
                      <h3 className="text-sm font-bold tracking-widest uppercase">{servidor.name}</h3>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Debian Kernel 6.1</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button
                      onClick={() => manejarActualizarServidor(servidor.id)}
                     className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title={t('Actualizar métricas')}
                   >
                     <RefreshCw className="w-4 h-4 text-muted-foreground" />
                   </button>
                   <div className={`px-2 py-1 rounded text-[7px] font-bold uppercase flex items-center gap-1 ${servidor.status === 'ONLINE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${servidor.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {servidor.status}
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-4">
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">CPU</span>
                   <p className="text-[10px] font-mono">{servidor.status === 'ONLINE' ? `${servidor.cpu}%` : '0%'}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">RAM</span>
                   <p className="text-[10px] font-mono">{servidor.status === 'ONLINE' ? `${servidor.ram} GB` : '0 GB'}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">DISCO</span>
                   <p className="text-[10px] font-mono">{servidor.disk}%</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}"""

content = re.sub(r'function VistaServidores\(\{ t \}: \{ t: any \}\) \{.*?(?=function VistaIA)', replacement + '\n', content, flags=re.DOTALL)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
