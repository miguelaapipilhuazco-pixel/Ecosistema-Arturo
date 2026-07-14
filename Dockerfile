# Usa una imagen base oficial de Node.js v20
FROM node:20-slim

# Instalar dependencias básicas necesarias
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Crear y configurar el directorio de trabajo
WORKDIR /app

# Copiar todo el contenido del repositorio
COPY . .

# Cambiar al directorio de la PWA
WORKDIR /app/Aplicaciones web progresivas (PWA)

# Instalar las dependencias de node
RUN npm install

# Construir la aplicación web estática (React/Vite)
RUN npm run build

# Configurar variables de entorno requeridas por Hugging Face Spaces
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# Iniciar el servidor
CMD ["npx", "tsx", "server.ts"]
