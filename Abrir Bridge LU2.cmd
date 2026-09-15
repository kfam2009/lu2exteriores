@echo off
cd /d "%~dp0"

set /p PANEL_BASE_URL=URL del panel publicado (ej: https://panelgo-cloud.onrender.com/lu2exteriores): 
if "%PANEL_BASE_URL%"=="" (
  echo No se ingreso URL.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:PANEL_BASE_URL='%PANEL_BASE_URL%'; $env:VMIX_HOST='127.0.0.1'; $env:VMIX_PORT='8088'; if (Test-Path '.\runtime\node.exe') { & '.\runtime\node.exe' '.\bridge-client.js' } else { node '.\bridge-client.js' }"
pause
