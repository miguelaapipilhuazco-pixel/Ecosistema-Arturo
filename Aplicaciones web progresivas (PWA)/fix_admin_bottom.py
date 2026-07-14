import re

with open("src/components/sections/AdminCenter.tsx", "r") as f:
    content = f.read()

content = re.sub(r'      </div>\s*</div>\s*</div>\s*\);\s*}\s*switch \(id\) \{', 
                 r'      </div>\n    </div>\n  );\n}\nfunction renderizarSubseccion(id: SubseccionAdmin, t: any) {\n  switch (id) {', 
                 content)

with open("src/components/sections/AdminCenter.tsx", "w") as f:
    f.write(content)
