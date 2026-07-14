param(
  [int]$Port = 3000,
  [string]$Subdomain = "proyecto",
  [int]$CheckEverySeconds = 12
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}
$logFile = Join-Path $logDir "proyecto-tunnel.log"

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  $line | Tee-Object -FilePath $logFile -Append
}

function Is-PortListening {
  param([int]$LocalPort)
  try {
    $conn = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction Stop | Select-Object -First 1
    return $null -ne $conn
  } catch {
    return $false
  }
}

function Start-AppServer {
  Write-Log "Iniciando servidor local (npm run dev) en puerto $Port..."
  return Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $root -PassThru
}

function Start-LocalTunnel {
  Write-Log "Iniciando LocalTunnel en https://$Subdomain.loca.lt -> localhost:$Port"
  return Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx --yes localtunnel --port $Port --subdomain $Subdomain --local-host 127.0.0.1" -WorkingDirectory $root -PassThru
}

function Wait-ServerReady {
  param([int]$TimeoutSeconds = 45)
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    if (Is-PortListening -LocalPort $Port) {
      return $true
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

Write-Log "==== Watchdog iniciado ===="
Write-Log "Ruta: $root"
Write-Log "Objetivo publico: https://$Subdomain.loca.lt/"

$appProc = Start-AppServer
if (Wait-ServerReady) {
  Write-Log "Servidor local listo en http://localhost:$Port"
} else {
  Write-Log "Advertencia: el servidor no abrio puerto a tiempo; se seguira monitoreando."
}

$ltProc = Start-LocalTunnel
Write-Log "Tunnel PID: $($ltProc.Id)"

while ($true) {
  Start-Sleep -Seconds $CheckEverySeconds

  if ($appProc.HasExited) {
    Write-Log "Servidor local detenido. Reiniciando..."
    $appProc = Start-AppServer
    [void](Wait-ServerReady)
  }

  if (-not (Is-PortListening -LocalPort $Port)) {
    Write-Log "Puerto $Port no escucha. Reiniciando servidor..."
    try { if (-not $appProc.HasExited) { Stop-Process -Id $appProc.Id -Force } } catch {}
    $appProc = Start-AppServer
    [void](Wait-ServerReady)
  }

  if ($ltProc.HasExited) {
    Write-Log "LocalTunnel se cerro. Reiniciando..."
    $ltProc = Start-LocalTunnel
    continue
  }

  try {
    $health = Invoke-WebRequest -UseBasicParsing -Headers @{ "bypass-tunnel-reminder" = "true" } -Uri "https://$Subdomain.loca.lt/api/health" -TimeoutSec 8
    if ($health.StatusCode -ne 200) {
      Write-Log "Health publico no-200 ($($health.StatusCode)). Reiniciando tunnel..."
      try { Stop-Process -Id $ltProc.Id -Force } catch {}
      $ltProc = Start-LocalTunnel
    }
  } catch {
    Write-Log "Health publico fallo: $($_.Exception.Message). Reiniciando tunnel..."
    try { Stop-Process -Id $ltProc.Id -Force } catch {}
    $ltProc = Start-LocalTunnel
  }
}
