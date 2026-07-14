@echo off
:: Forzar codificación UTF-8 para evitar fallos con caracteres especiales
chcp 65001 > nul

title Subir Cambios a GitHub - Ecosistema Arturo
color 0A
cls

echo ===================================================
echo   SUBIR CAMBIOS AUTOMÁTICOS A GITHUB
echo ===================================================
echo.
echo Este script guardará tus cambios locales y los subirá
echo a tu repositorio de GitHub de forma automática.
echo.

:: Asegurarnos de que estamos en la carpeta correcta
cd /d "%~dp0"

echo [1/3] Preparando archivos modificados...
git add .

echo.
set /p msg="Ingresa una descripción del cambio (o presiona Enter para usar 'Actualizacion automatica'): "
if "%msg%"=="" (
    set msg="Actualizacion automatica"
) else (
    :: Envolver el mensaje entre comillas para evitar fallos en Git si tiene espacios
    set msg="%msg%"
)

echo.
echo [2/3] Creando commit: %msg%...
git commit -m %msg%

echo.
echo [3/3] Subiendo cambios a GitHub...
git push

echo.
echo ===================================================
echo   PROCESO COMPLETADO
echo ===================================================
echo.
echo Tus últimos cambios se han subido con éxito a GitHub.
echo.
pause
