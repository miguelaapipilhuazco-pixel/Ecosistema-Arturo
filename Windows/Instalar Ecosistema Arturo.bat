@echo off
:: Forzar codificacion UTF-8 para evitar fallos con acentos y parentesis (PWA)
chcp 65001 > nul

title Instalador Ecosistema Arturo
color 0B
cls

echo ===================================================
echo   BIENVENIDO AL INSTALADOR NATIVO ECOSISTEMA ARTURO
echo ===================================================
echo.
echo Este script instalara el Ecosistema de forma local.
echo.
echo Ruta destino: %%LOCALAPPDATA%%\EcosistemaArturo
echo.
set /p confirm="¿Desea continuar con la instalacion? (S/N): "
if /i "%%confirm%%" neq "S" (
    echo Instalacion cancelada por el usuario.
    pause
    exit
)

echo.
echo [1/4] Creando carpetas de instalacion...
set "INSTALL_DIR=%%LOCALAPPDATA%%\EcosistemaArturo"
if not exist "%%INSTALL_DIR%%" mkdir "%%INSTALL_DIR%%"

:: Resolver la ruta raiz del proyecto de forma absoluta sin dobles puntos
for %%I in ("%%~dp0..") do set "PROJECT_ROOT=%%~fI"

echo.
echo [2/4] Copiando archivos de la aplicacion (PWA)...
echo Origen: "%%PROJECT_ROOT%%\Aplicaciones web progresivas (PWA)"
echo Destino: "%%INSTALL_DIR%%\Aplicaciones web progresivas (PWA)"
echo.

if not exist "%%PROJECT_ROOT%%\Aplicaciones web progresivas (PWA)" (
    color 0C
    echo Error critico: No se encontro la carpeta "Aplicaciones web progresivas (PWA)" en la ruta del proyecto.
    echo Asegurese de no separar este instalador de la carpeta del Ecosistema.
    pause
    exit
)

xcopy /E /I /Y "%%PROJECT_ROOT%%\Aplicaciones web progresivas (PWA)" "%%INSTALL_DIR%%\Aplicaciones web progresivas (PWA)"

echo.
echo [3/4] Copiando lanzadores de Windows...
copy /Y "%%~dp0Iniciar Proyecto Feria.vbs" "%%INSTALL_DIR%%\"
copy /Y "%%~dp0Detener Servidor.vbs" "%%INSTALL_DIR%%\"
copy /Y "%%~dp0ecosistema-arturo.apk" "%%INSTALL_DIR%%\"

echo.
echo [4/4] Creando accesos directos en Escritorio y Menu Inicio...
set "DESKTOP_LNK=%%USERPROFILE%%\Desktop\Ecosistema Arturo.lnk"
set "STARTMENU_LNK=%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Ecosistema Arturo.lnk"
set "UNINSTALL_LNK=%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Desinstalar Ecosistema Arturo.lnk"

:: Crear VBScript temporal para generar accesos directos
set "VBS_SCRIPT=%%TEMP%%\create_shortcuts.vbs"
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%%VBS_SCRIPT%%"
echo Set Shortcut = WshShell.CreateShortcut("%%DESKTOP_LNK%%") >> "%%VBS_SCRIPT%%"
echo Shortcut.TargetPath = "%%INSTALL_DIR%%\Iniciar Proyecto Feria.vbs" >> "%%VBS_SCRIPT%%"
echo Shortcut.WorkingDirectory = "%%INSTALL_DIR%%" >> "%%VBS_SCRIPT%%"
echo Shortcut.Save >> "%%VBS_SCRIPT%%"

echo Set ShortcutMenu = WshShell.CreateShortcut("%%STARTMENU_LNK%%") >> "%%VBS_SCRIPT%%"
echo ShortcutMenu.TargetPath = "%%INSTALL_DIR%%\Iniciar Proyecto Feria.vbs" >> "%%VBS_SCRIPT%%"
echo ShortcutMenu.WorkingDirectory = "%%INSTALL_DIR%%" >> "%%VBS_SCRIPT%%"
echo ShortcutMenu.Save >> "%%VBS_SCRIPT%%"

echo Set ShortcutUn = WshShell.CreateShortcut("%%UNINSTALL_LNK%%") >> "%%VBS_SCRIPT%%"
echo ShortcutUn.TargetPath = "%%INSTALL_DIR%%\Desinstalar.bat" >> "%%VBS_SCRIPT%%"
echo ShortcutUn.WorkingDirectory = "%%INSTALL_DIR%%" >> "%%VBS_SCRIPT%%"
echo ShortcutUn.Save >> "%%VBS_SCRIPT%%"

cscript //nologo "%%VBS_SCRIPT%%"
del "%%VBS_SCRIPT%%"

:: Crear el script de desinstalacion en la carpeta de destino
set "UNINSTALL_BAT=%%INSTALL_DIR%%\Desinstalar.bat"
echo @echo off > "%%UNINSTALL_BAT%%"
echo title Desinstalador Ecosistema Arturo >> "%%UNINSTALL_BAT%%"
echo color 0C >> "%%UNINSTALL_BAT%%"
echo cls >> "%%UNINSTALL_BAT%%"
echo =================================================== >> "%%UNINSTALL_BAT%%"
echo   DESINSTALADOR OFICIAL ECOSISTEMA ARTURO >> "%%UNINSTALL_BAT%%"
echo =================================================== >> "%%UNINSTALL_BAT%%"
echo. >> "%%UNINSTALL_BAT%%"
echo ¿Esta seguro de que desea eliminar el Ecosistema Arturo? >> "%%UNINSTALL_BAT%%"
echo set /p uconfirm="Confirmar (S/N): " >> "%%UNINSTALL_BAT%%"
echo if /i "%%%%uconfirm%%%%" neq "S" exit >> "%%UNINSTALL_BAT%%"
echo. >> "%%UNINSTALL_BAT%%"
echo Eliminando accesos directos... >> "%%UNINSTALL_BAT%%"
echo if exist "%%DESKTOP_LNK%%" del "%%DESKTOP_LNK%%" >> "%%UNINSTALL_BAT%%"
echo if exist "%%STARTMENU_LNK%%" del "%%STARTMENU_LNK%%" >> "%%UNINSTALL_BAT%%"
echo if exist "%%UNINSTALL_LNK%%" del "%%UNINSTALL_LNK%%" >> "%%UNINSTALL_BAT%%"
echo. >> "%%UNINSTALL_BAT%%"
echo Deteniendo el servidor si esta activo... >> "%%UNINSTALL_BAT%%"
echo wscript "%%INSTALL_DIR%%\Detener Servidor.vbs" >> "%%UNINSTALL_BAT%%"
echo timeout /t 1 /nobreak > nul >> "%%UNINSTALL_BAT%%"
echo. >> "%%UNINSTALL_BAT%%"
echo Eliminando archivos del sistema... >> "%%UNINSTALL_BAT%%"
echo start /b cmd /c "timeout /t 1 /nobreak && rd /s /q \"%%INSTALL_DIR%%\"" >> "%%UNINSTALL_BAT%%"
echo. >> "%%UNINSTALL_BAT%%"
echo ¡Ecosistema Arturo desinstalado correctamente! >> "%%UNINSTALL_BAT%%"
echo pause >> "%%UNINSTALL_BAT%%"

echo.
echo ===================================================
echo ¡INSTALACION COMPLETADA EXITOSAMENTE!
echo ===================================================
echo.
echo Se han creado los accesos directos en el Escritorio.
echo.
set /p runnow="¿Desea iniciar Ecosistema Arturo ahora mismo? (S/N): "
if /i "%%runnow%%" == "S" (
    start "" wscript "%%INSTALL_DIR%%\Iniciar Proyecto Feria.vbs"
)
exit
