@echo off
setlocal enabledelayedexpansion
title Detener Proyecto Feria de Ciencias
cd /d "%~dp0"

if exist .server.pid (
    set /p PID=<.server.pid
    echo Deteniendo el servidor del proyecto (PID !PID!)...
    taskkill /F /PID !PID! >nul 2>&1
    del .server.pid >nul 2>&1
    echo Servidor detenido con exito.
) else (
    echo El servidor no parece estar en ejecucion (no se encontro .server.pid).
)
timeout /t 3 >nul
