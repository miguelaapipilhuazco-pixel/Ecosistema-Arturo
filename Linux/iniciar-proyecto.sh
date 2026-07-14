#!/bin/bash

# ======================================================
# Proyecto Feria de Ciencias — Lanzador Linux
# Siempre usa la version mas reciente del servidor central
# ======================================================

# Ruta de la aplicacion central (relativa a este script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")/Aplicaciones web progresivas (PWA)"

echo "🔬 Proyecto Feria de Ciencias"
echo "================================"
echo "Iniciando desde: $APP_DIR"
echo ""

# Verificar que Node.js este instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instálalo desde https://nodejs.org"
    read -p "Presiona Enter para salir..."
    exit 1
fi

# Liberar puerto 3000 si esta ocupado
PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  Puerto 3000 ocupado por PID $PORT_PID. Liberando..."
    kill -9 "$PORT_PID" 2>/dev/null
    sleep 1
fi

# Cambiar al directorio de la aplicacion
cd "$APP_DIR" || {
    echo "❌ No se encontró la carpeta de la aplicación."
    echo "   Esperada en: $APP_DIR"
    read -p "Presiona Enter para salir..."
    exit 1
}

# Iniciar servidor en segundo plano
echo "🚀 Iniciando servidor de produccion..."
nohup node dist/server.cjs > /tmp/proyecto-feria.log 2>&1 &
SERVER_PID=$!
echo "   Servidor PID: $SERVER_PID"

# Esperar a que el servidor esté listo
sleep 2

# Abrir la aplicacion en el navegador (modo app si es posible)
echo "🌐 Abriendo aplicacion..."
if command -v google-chrome &> /dev/null; then
    google-chrome --app=http://localhost:3000 &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --app=http://localhost:3000 &
elif command -v firefox &> /dev/null; then
    firefox http://localhost:3000 &
else
    xdg-open http://localhost:3000 &
fi

echo ""
echo "✅ Aplicacion iniciada en http://localhost:3000"
echo "   Para detenerla, cierra esta ventana o ejecuta:"
echo "   kill $SERVER_PID"
