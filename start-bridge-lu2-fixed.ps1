$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Join-Path $root "runtime\node.exe"

if (-not (Test-Path -LiteralPath $node -PathType Leaf)) {
  $node = (Get-Command node -ErrorAction Stop).Source
}

$env:PANEL_BASE_URL = "https://panel-telefederal-cloud.onrender.com/lu2exteriores"
$env:VMIX_HOST = "127.0.0.1"
$env:VMIX_PORT = "8088"

Set-Location $root
while ($true) {
  Write-Host "Iniciando Bridge LU2..."
  & $node ".\bridge-client.js"
  $exitCode = $LASTEXITCODE
  Write-Host "Bridge LU2 se cerro con codigo $exitCode. Reiniciando en 3 segundos..."
  Start-Sleep -Seconds 3
}
