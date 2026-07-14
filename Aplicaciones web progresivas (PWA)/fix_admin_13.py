import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """function VistaSeguridad({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('SEGURIDAD')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('PROTECCIÓN Y AUDITORÍA')}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <ShieldCheck className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Firewall Activo')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">1.2M Bloqueos / mes</p>
         </div>
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <Key className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Certificados')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">Todos vigentes</p>
         </div>
         <div className="ecosystem-card p-6 border-border/50 flex flex-col items-center text-center">
            <Terminal className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Auditoría')}</h3>
            <p className="text-[8px] text-muted-foreground mt-2 uppercase">Logs íntegros</p>
         </div>
      </div>
      <div className="ecosystem-card p-6 bg-red-500/5 border-red-500/20">
         <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            {t('Ataques Detectados (Últimas 24h)')}
         </h3>
         <div className="space-y-2 opacity-50">
            <p className="text-[8px] font-mono text-red-500/80">09:12:45 | Intento de Inyección SQL | IP: 185.23.XX.XX | BLOQUEADO</p>
            <p className="text-[8px] font-mono text-red-500/80">04:33:12 | Fuerza Bruta Detectada | IP: 91.102.XX.XX | BLOQUEADO</p>
         </div>
      </div>
    </div>
  );
}"""

content = re.sub(r'function VistaSeguridad\(\{ t \}: \{ t: any \}\) \{.*?(?=function VistaDepuracion)', replacement + '\n', content, flags=re.DOTALL)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
