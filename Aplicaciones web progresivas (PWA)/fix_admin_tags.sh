#!/bin/bash
sed -i '158,159d' src/components/sections/AdminCenter.tsx
sed -i '134c\          const Icono = item.icon;\          return (' src/components/sections/AdminCenter.tsx
