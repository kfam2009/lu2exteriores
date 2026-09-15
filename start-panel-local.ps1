param(
  [int]$Port = 3000,
  [int]$VmixPort = 8088,
  [string]$VmixHost = "127.0.0.1",
  [int]$EnableRemoteMonitors = 1
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portableNode = Join-Path $root "runtime\node.exe"
$recoveryScript = Join-Path $root "panel-recovery.js"
$node = $null

if (Test-Path -LiteralPath $portableNode -PathType Leaf) {
  $node = $portableNode
} else {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    $node = $nodeCommand.Source
  }
}

if (-not $node) {
  Write-Host "No encontre Node.js." -ForegroundColor Red
  Write-Host "Esta entrega deberia traer runtime\node.exe. Copia la carpeta completa otra vez." -ForegroundColor Yellow
  Read-Host "Presiona Enter para cerrar"
  exit 1
}

$env:PORT = [string]$Port
$env:VMIX_HOST = $VmixHost
$env:VMIX_PORT = [string]$VmixPort
$env:ENABLE_REMOTE_MONITORS = [string]$EnableRemoteMonitors

if (Test-Path -LiteralPath $recoveryScript -PathType Leaf) {
  $recoveryListening = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue
  if (-not $recoveryListening) {
    Start-Process -FilePath $node -ArgumentList 'panel-recovery.js' -WorkingDirectory $root -WindowStyle Hidden
    Start-Sleep -Milliseconds 500
  }
}

Start-Job -ScriptBlock {
  param($PanelPort)
  Start-Sleep -Seconds 2
  Start-Process "http://localhost:$PanelPort"
} -ArgumentList $Port | Out-Null

Write-Host "Panel Radio LU2: http://localhost:$Port" -ForegroundColor Green
Write-Host "API vMix: http://$VmixHost`:$VmixPort/api/" -ForegroundColor Cyan
Write-Host "Node usado: $node" -ForegroundColor DarkGray
Write-Host "Presiona Ctrl+C para cerrar el panel." -ForegroundColor Yellow
Write-Host ""

Set-Location $root
& $node server.js

