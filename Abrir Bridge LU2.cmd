@echo off
cd /d "%~dp0"

set "PANEL_BASE_URL=https://panel-telefederal-cloud.onrender.com/lu2exteriores"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:PANEL_BASE_URL='%PANEL_BASE_URL%'; $env:VMIX_HOST='127.0.0.1'; $env:VMIX_PORT='8088'; if (Test-Path '.\runtime\node.exe') { & '.\runtime\node.exe' '.\bridge-client.js' } else { node '.\bridge-client.js' }"
pause
