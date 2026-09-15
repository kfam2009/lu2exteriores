@echo off
cd /d "%~dp0"
set /p VMIX_HOST_ZT=IP ZeroTier de la PC con vMix: 
if "%VMIX_HOST_ZT%"=="" (
  echo No se ingreso IP.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-panel-local.ps1" -VmixHost %VMIX_HOST_ZT%
pause
