Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Detectar ruta de la PWA en base a su nivel de carpeta
If fso.FolderExists(scriptDir & "\Aplicaciones web progresivas (PWA)") Then
    appDir = scriptDir & "\Aplicaciones web progresivas (PWA)"
Else
    appDir = fso.GetParentFolderName(scriptDir) & "\Aplicaciones web progresivas (PWA)"
End If

WshShell.CurrentDirectory = appDir

' Liberar puerto 3000 si esta ocupado
WshShell.Run "powershell -NoProfile -WindowStyle Hidden -Command ""$pid3000 = (netstat -ano | Select-String ':3000 ' | Select-String 'LISTENING' | ForEach-Object { ($_ -split '\s+')[-1] }); if ($pid3000) { Stop-Process -Id $pid3000 -Force }""", 0, True

' Esperar un momento
WScript.Sleep 1500

' Iniciar servidor de produccion en silencio
WshShell.Run "node dist/server.cjs", 0, False

' Esperar a que el servidor levante
WScript.Sleep 2000

' Abrir la aplicacion en modo standalone (sin barra de navegacion)
WshShell.Run "msedge --app=http://localhost:3000 --window-size=1280,800", 1, False
