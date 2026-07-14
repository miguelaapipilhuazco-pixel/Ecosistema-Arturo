import re
with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

replacement = """                <div className="space-y-1">
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

content = re.sub(r'                <div className="space-y-1">\s*<span className="text-\[7px\] text-muted-foreground uppercase tracking-widest">DISCO</span>\s*<p className="text-\[10px\] font-mono">\{servidor\.disk\}%</p>\s*</div>\s*</div>\s*\)\)}\s*</div>\s*}\s*', replacement + '\n', content)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
