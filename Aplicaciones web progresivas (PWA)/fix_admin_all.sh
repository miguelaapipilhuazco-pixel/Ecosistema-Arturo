#!/bin/bash
# Fix line 98
sed -i 's/ACCESO_ROOT_CONCEDIDO/ACCESO_ROOT_CONCEDIDO<\/div><\/div>/g' src/components/sections/AdminCenter.tsx

# Fix line 129
sed -i 's/CENTRO DE ADMINISTRACIÓN"}/CENTRO DE ADMINISTRACIÓN"}<\/p><\/div><\/div><\/div>/g' src/components/sections/AdminCenter.tsx

# Fix bottom part
sed -i '156,158c\    </div>\  );\n}' src/components/sections/AdminCenter.tsx

npm run build
