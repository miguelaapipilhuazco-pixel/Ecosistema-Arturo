import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

# Fix VistaServidores map
content = content.replace("""                   <div>
                      <h3 className="text-sm font-bold tracking-widest uppercase">{servidor.name}</h3>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Debian Kernel 6.1</p>
                   </div>
                <div className="flex gap-2">""", """                   <div>
                      <h3 className="text-sm font-bold tracking-widest uppercase">{servidor.name}</h3>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Debian Kernel 6.1</p>
                   </div>
                </div>
                <div className="flex gap-2">""")

content = content.replace("""                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">DISCO</span>
                   <p className="text-[10px] font-mono">{servidor.disk}%</p>
                </div>
          </div>
           </div>
        ))}
            </div>
      </div>
  );
}""", """                <div className="space-y-1">
                   <span className="text-[7px] text-muted-foreground uppercase tracking-widest">DISCO</span>
                   <p className="text-[10px] font-mono">{servidor.disk}%</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}""")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

