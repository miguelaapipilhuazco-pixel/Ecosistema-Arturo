@echo off
:: Forzar codificación UTF-8 para evitar fallos con caracteres especiales
chcp 65001 > nul

title Vincular Ecosistema Arturo con GitHub
color 0B
cls

echo ===================================================
echo   VINCULAR PROYECTO LOCAL CON TU REPOSITORIO GITHUB
echo ===================================================
echo.
echo Este script configurará y vinculará tu repositorio
echo local con tu cuenta de GitHub de forma automática.
echo.

:: Asegurarnos de que estamos en la carpeta correcta
cd /d "%~dp0"

echo [1/3] Limpiando conexiones anteriores de Git...
git remote remove origin >nul 2>&1

echo [2/3] Vinculando con el repositorio de miguelaapipilhuazco-pixel...
git remote add origin https://github.com/miguelaapipilhuazco-pixel/Ecosistema-Arturo.git
git branch -M main

echo [3/3] Subiendo y vinculando la rama principal (main)...
echo.
echo Presiona una tecla para iniciar la subida. Si GitHub te pide
echo autenticarte en tu navegador, inicia sesión para completar el proceso.
echo.
pause

git push -u origin main

echo.
echo ===================================================
echo   PROCESO COMPLETADO
echo ===================================================
echo.
echo Tu proyecto local y GitHub están vinculados y actualizados.
echo A partir de ahora, puedes usar "Subir Cambios a GitHub.bat"
echo para actualizar tu repositorio con un solo clic.
echo.
pause
