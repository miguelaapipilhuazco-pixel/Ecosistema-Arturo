Set WshShell = CreateObject("WScript.Shell")

' Detener el proceso de Node.js en el puerto 3000
WshShell.Run "powershell -NoProfile -WindowStyle Hidden -Command ""$pid3000 = (netstat -ano | Select-String ':3000 ' | Select-String 'LISTENING' | ForEach-Object { ($_ -split '\s+')[-1] }); if ($pid3000) { Stop-Process -Id $pid3000 -Force; Write-Host 'Servidor detenido.' } else { Write-Host 'No habia servidor activo.' }""", 0, True
