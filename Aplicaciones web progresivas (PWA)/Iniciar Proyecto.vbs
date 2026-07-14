Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' 1. Iniciar el servidor node de forma silenciosa
WshShell.Run "node dist/server.cjs", 0, False

' 2. Esperar un instante para que el puerto 3000 se vincule
WScript.Sleep 1500

' 3. Abrir la aplicación en modo standalone (sin barra de navegación ni puerto visible)
WshShell.Run "msedge --app=http://localhost:3000", 1, False
