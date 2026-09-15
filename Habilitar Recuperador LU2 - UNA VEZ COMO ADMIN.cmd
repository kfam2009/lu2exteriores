@echo off
setlocal
title Habilitar Recuperador Panel LU2

net session >nul 2>&1
if errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

netsh advfirewall firewall delete rule name="LU2 Panel Recovery 3010 LAN" >nul 2>&1
netsh advfirewall firewall add rule name="LU2 Panel Recovery 3010 LAN" dir=in action=allow protocol=TCP localport=3010 remoteip=172.31.146.0/24 profile=any

if errorlevel 1 (
  echo.
  echo ERROR: no se pudo crear la regla del firewall.
  pause
  exit /b 1
)

echo.
echo Recuperador habilitado para la red local 172.31.146.x.
pause
endlocal
