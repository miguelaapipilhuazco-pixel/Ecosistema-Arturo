import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

# Change the AdminCenter sidebar buttons to be like Espacios
replacement_button = """                <button
                  key={item.id}
                  onClick={() => setSubseccionActiva(item.id as SubseccionAdmin)}
                  className={`
                    px-4 py-2 border rounded flex items-center justify-between group transition-colors w-full bg-card/40 hover:bg-card/30
                    ${subseccionActiva === item.id ? 'border-primary/50' : 'border-border/50 hover:border-primary/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <item.icon className={`w-3 h-3 ${subseccionActiva === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase truncate ${subseccionActiva === item.id ? 'text-primary' : 'text-foreground'}`}>
                      {t(item.label)}
                    </span>
                  </div>
                  <ChevronRight className={`w-3 h-3 ${subseccionActiva === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                </button>"""

content = re.sub(r'<motion\.button[\s\S]*?<\/motion\.button>', replacement_button, content)

# I should also make sure to import ChevronRight
if 'ChevronRight' not in content:
    content = content.replace("import { ", "import { ChevronRight, ")

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)

