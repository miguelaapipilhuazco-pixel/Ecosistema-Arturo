#!/bin/bash

# ======================================================
# Proyecto Feria de Ciencias — Lanzador macOS
# Siempre usa la version mas reciente del servidor central
# ======================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")/Aplicaciones web progresivas (PWA)"

echo "🔬 Proyecto Feria de Ciencias"
echo "================================"

# Verificar que Node.js este instalado
if ! command -v node &> /dev/null; then
    osascript -e 'display alert "Node.js no encontrado" message "Por favor instala Node.js desde https://nodejs.org para usar esta aplicación." as warning'
    exit 1
fi

# Liberar puerto 3000 si esta ocupado
PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  Puerto 3000 ocupado. Liberando..."
    kill -9 "$PORT_PID" 2>/dev/null
    sleep 1
fi

# Cambiar al directorio de la aplicacion
cd "$APP_DIR" || {
    osascript -e 'display alert "Aplicación no encontrada" message "No se encontró la carpeta de la aplicación. Verifica que Ecosistema Arturo esté completo." as warning'
    exit 1
}

# Iniciar servidor en segundo plano
echo "🚀 Iniciando servidor..."
nohup node dist/server.cjs > /tmp/proyecto-feria.log 2>&1 &

# Esperar a que el servidor este listo
sleep 2

# Abrir en Google Chrome modo app, o Safari como fallback
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" --args --app=http://localhost:3000
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "Microsoft Edge" --args --app=http://localhost:3000
else
    # Safari no soporta --app, abrimos normal
    open -a Safari http://localhost:3000
fi

echo "✅ Aplicacion iniciada en http://localhost:3000"
