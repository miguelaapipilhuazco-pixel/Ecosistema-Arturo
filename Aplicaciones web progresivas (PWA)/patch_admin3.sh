#!/bin/bash
sed -i 's/text-xs sm:text-sm text-foreground/text-\[11px\] text-foreground/g' src/components/sections/AdminCenter.tsx
sed -i 's/text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors mb-1/text-\[11px\] text-foreground group-hover:text-primary transition-colors/g' src/components/sections/AdminCenter.tsx
sed -i 's/text-\[9px\] text-muted-foreground uppercase tracking-\[0.1em\] opacity-40 group-hover:opacity-60 transition-opacity line-clamp-2/text-\[8px\] text-muted-foreground uppercase tracking-\[0.1em\] opacity-60/g' src/components/sections/AdminCenter.tsx
