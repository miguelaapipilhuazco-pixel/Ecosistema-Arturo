#!/bin/bash
# Remove the Icono div block
sed -i '/<div className="p-3 rounded-xl bg-primary\/5/,/<\/div>/d' src/components/sections/AdminCenter.tsx

# Change flex flex-col gap-3 to flex flex-col gap-1
sed -i 's/<div className="relative z-10 flex flex-col gap-3">/<div className="relative z-10 flex flex-col gap-1">/g' src/components/sections/AdminCenter.tsx

# Remove inner <div>
sed -i '149,150s/<div>//' src/components/sections/AdminCenter.tsx
sed -i '154,155s/<\/div>//' src/components/sections/AdminCenter.tsx

