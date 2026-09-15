@echo off
setlocal

set "PANEL_CLOUD_URL=https://panel-telefederal-cloud.onrender.com"
set "BRIDGE_SECRET=tf-6pv5xj4n54oawhaekt81g8mtub2wk1"

echo Abriendo publicador de monitores LU2 Exteriores...
echo Elegir/permitir las fuentes de video de vMix si el navegador lo pregunta.
echo.
start "Publicador Monitores LU2 Exteriores" "%PANEL_CLOUD_URL%/publisher.html?token=%BRIDGE_SECRET%&name=LU2%%20Exteriores&fps=20&previewDevice=vMix%%20Video%%20External%%202&programDevice=vMix%%20Video"
