@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-panel-local.ps1" -VmixHost 127.0.0.1
pause
