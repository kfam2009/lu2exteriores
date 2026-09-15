@echo off
setlocal
title Recuperar Panel Radio LU2
set "PANEL_PC=172.31.146.56"

echo Reiniciando solamente el Panel Radio LU2...
curl.exe --silent --show-error --fail --max-time 30 --request POST "http://%PANEL_PC%:3010/restart"
if errorlevel 1 (
  echo.
  echo ERROR: no se pudo ordenar el reinicio desde %PANEL_PC%.
  echo Verifique que ambas computadoras esten en la red local.
  pause
  exit /b 1
)

echo.
echo Panel reiniciado correctamente.
echo Esperando que la pagina quede disponible...

set "PANEL_LISTO="
for /l %%I in (1,1,20) do (
  curl.exe --silent --fail --max-time 2 "http://%PANEL_PC%:3000/" >nul 2>&1
  if not errorlevel 1 (
    set "PANEL_LISTO=1"
    goto :abrir_panel
  )
  timeout /t 1 /nobreak >nul
)

echo ADVERTENCIA: el reinicio termino, pero la pagina todavia no responde.
pause
exit /b 1

:abrir_panel
echo Abriendo Panel Radio LU2...
explorer.exe "http://%PANEL_PC%:3000/"
timeout /t 2 /nobreak >nul
endlocal
