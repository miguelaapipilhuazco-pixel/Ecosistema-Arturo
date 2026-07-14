@echo off
cd /d "C:\Users\Dell\Downloads\Ecosistema Arturo\Aplicaciones web progresivas (PWA)"

:: Liberar puerto 3000 si esta ocupado
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Esperar un momento para liberar el socket
timeout /t 2 /nobreak >nul

:: Iniciar el servidor de produccion
node dist/server.cjs
