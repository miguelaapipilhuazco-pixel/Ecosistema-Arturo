import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """function VistaIA({ t }: { t: any }) {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end border-b border-border/50 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase">{t('INTELIGENCIA ARTIFICIAL')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-3 font-mono opacity-60">{t('MODELOS Y ENTRENAMIENTO')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Llama 3 8B')}</h3>
              <Cpu className="w-4 h-4 text-primary" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>Uso CPU</span>
                 <span>78%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-primary" style={{ width: '78%' }} />
              </div>
           </div>
        </div>

        <div className="ecosystem-card p-6 border-border/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Qwen 1.5')}</h3>
              <Cpu className="w-4 h-4 text-blue-500" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between text-[8px] font-mono opacity-60 uppercase">
                 <span>Uso CPU</span>
                 <span>42%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                 <div className="h-full bg-blue-500" style={{ width: '42%' }} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}"""

content = re.sub(r'function VistaIA\(\{ t \}: \{ t: any \}\) \{.*?(?=function VistaSeguridad)', replacement + '\n', content, flags=re.DOTALL)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
