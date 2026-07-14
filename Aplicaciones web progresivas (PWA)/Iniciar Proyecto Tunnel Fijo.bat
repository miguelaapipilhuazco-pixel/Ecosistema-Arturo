@echo off
setlocal
cd /d "%~dp0"
start "Proyecto Tunnel Watchdog" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0keep-proyecto-tunnel.ps1"
echo Watchdog iniciado para https://proyecto.loca.lt/
echo Cierra la ventana de PowerShell del watchdog para detenerlo.
