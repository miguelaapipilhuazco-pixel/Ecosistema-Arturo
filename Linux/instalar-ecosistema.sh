#!/usr/bin/env bash
# Instalador interactivo oficial de Ecosistema Arturo para Linux
set -e

COLOR_CYAN="\033[0;36m"
COLOR_GREEN="\033[0;32m"
COLOR_RED="\033[0;31m"
COLOR_NC="\033[0m" # No Color

clear
echo -e "${COLOR_CYAN}===================================================${COLOR_NC}"
echo -e "${COLOR_CYAN}   INSTALADOR NATIVO OFICIAL ECOSISTEMA ARTURO      ${COLOR_NC}"
echo -e "${COLOR_CYAN}===================================================${COLOR_NC}"
echo ""
echo "Este script instalara el Ecosistema Arturo en su sistema local."
echo ""
echo "Ruta de instalacion: ~/.local/share/ecosistema-arturo"
echo ""

read -p "¿Desea continuar con la instalacion? (s/n): " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    echo "Instalacion cancelada."
    exit 0
fi

echo -e "\n[1/4] Creando directorios de instalacion..."
INSTALL_DIR="$HOME/.local/share/ecosistema-arturo"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

echo "[2/4] Copiando archivos de la aplicacion (PWA)..."
# Copiar toda la PWA
SOURCE_DIR="$(dirname "$0")/../Aplicaciones web progresivas (PWA)"
if [ -d "$SOURCE_DIR" ]; then
    cp -r "$SOURCE_DIR" "$INSTALL_DIR/"
else
    echo -e "${COLOR_RED}Error: No se encontraron los archivos origen de la PWA.${COLOR_NC}"
    exit 1
fi

# Copiar lanzador basico
cp "$(dirname "$0")/iniciar-proyecto.sh" "$INSTALL_DIR/iniciar.sh"
chmod +x "$INSTALL_DIR/iniciar.sh"

# Crear enlace simbolico local
ln -sf "$INSTALL_DIR/iniciar.sh" "$BIN_DIR/ecosistema-arturo"

echo "[3/4] Creando acceso directo en el menu de aplicaciones..."
APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"
DESKTOP_FILE="$APPS_DIR/ecosistema-arturo.desktop"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=Ecosistema Arturo
Comment=Plataforma colaborativa soberana
Exec=$INSTALL_DIR/iniciar.sh
Icon=$INSTALL_DIR/Aplicaciones web progresivas (PWA)/public/favicon.ico
Terminal=false
Categories=Utility;Development;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

# Copiar al escritorio si existe la carpeta Desktop
if [ -d "$HOME/Escritorio" ]; then
    cp "$DESKTOP_FILE" "$HOME/Escritorio/"
    chmod +x "$HOME/Escritorio/ecosistema-arturo.desktop"
elif [ -d "$HOME/Desktop" ]; then
    cp "$DESKTOP_FILE" "$HOME/Desktop/"
    chmod +x "$HOME/Desktop/ecosistema-arturo.desktop"
fi

# 4. Crear script de desinstalacion
UNINSTALL_SH="$INSTALL_DIR/desinstalar.sh"
cat <<EOF > "$UNINSTALL_SH"
#!/usr/bin/env bash
echo "==============================================="
echo "  DESINSTALADOR OFICIAL ECOSISTEMA ARTURO      "
echo "==============================================="
read -p "¿Esta seguro de que desea desinstalar? (s/n): " uconfirm
if [[ "\$uconfirm" == "s" || "\$uconfirm" == "S" ]]; then
    echo "Eliminando accesos directos..."
    rm -f "$APPS_DIR/ecosistema-arturo.desktop"
    rm -f "$HOME/Escritorio/ecosistema-arturo.desktop" 2>/dev/null || true
    rm -f "$HOME/Desktop/ecosistema-arturo.desktop" 2>/dev/null || true
    rm -f "$BIN_DIR/ecosistema-arturo"
    echo "Eliminando archivos..."
    rm -rf "$INSTALL_DIR"
    echo "¡Ecosistema Arturo desinstalado correctamente!"
fi
EOF
chmod +x "$UNINSTALL_SH"
ln -sf "$UNINSTALL_SH" "$BIN_DIR/ecosistema-arturo-uninstall"

echo -e "\n${COLOR_GREEN}==================================================="
echo "¡INSTALACION COMPLETADA EXITOSAMENTE!"
echo -e "===================================================${COLOR_NC}"
echo ""
echo "Puede arrancar la aplicacion buscando 'Ecosistema Arturo' en su lanzador de aplicaciones"
echo "o escribiendo 'ecosistema-arturo' en la terminal."
echo ""
read -p "¿Desea iniciar la aplicacion ahora mismo? (s/n): " runnow
if [[ "$runnow" == "s" || "$runnow" == "S" ]]; then
    bash "$INSTALL_DIR/iniciar.sh" &
fi
exit 0
