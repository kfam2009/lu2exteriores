@echo off
cd /d "%~dp0"

set "PANEL_BASE_URL=https://panel-telefederal-cloud.onrender.com/lu2exteriores"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\start-bridge-lu2-fixed.ps1"
pause
