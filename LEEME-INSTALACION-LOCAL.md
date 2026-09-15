# Panel Radio LU2 - instalacion local portable

Esta carpeta esta preparada para llevarla a la PC donde corre vMix.
El arranque principal se conecta a vMix local en `127.0.0.1:8088`.

## Requisitos

1. vMix abierto en la misma PC.
2. Web Controller/API activo en vMix: Settings > Web Controller.
3. No hace falta instalar Node.js: esta carpeta trae `runtime/node.exe`.

## Como abrir

Doble click en `Abrir Panel Radio LU2.cmd`.

Luego abrir, si no se abre solo:

```text
http://localhost:3000
```

Para probar desde esta maquina por ZeroTier, usar `Abrir Panel Radio LU2 - ZEROTIER.cmd`.

## Overlays

- Overlay 1: zocalo principal, input 58.
- Overlay 2: referencia, input 57.
- Overlay 3: hora y temperatura, input 59, siempre repuesto por el panel.
- Overlay 4: nombre del programa, inputs 60 y 61.
- Boton OUT: apaga los overlays y vuelve a poner hora y temperatura.

## Archivos incluidos

- `server.js`: servidor local y puente hacia vMix.
- `public/`: interfaz del panel.
- `runtime/node.exe`: Node portable incluido.
- `tools/ffmpeg/`: ffmpeg portable para monitores fluidos.
- `start-panel-local.ps1`: arranque local recomendado.
- `Abrir Panel Radio LU2.cmd`: arranque por doble click contra vMix local.
- `Abrir Panel Radio LU2 - ZEROTIER.cmd`: arranque contra vMix `172.27.79.174`.

## Notas

- Copiar la carpeta completa, incluyendo `runtime`.
- Si el puerto 3000 esta ocupado, ejecutar: `.\start-panel-local.ps1 -Port 3001` y abrir `http://localhost:3001`.
- Para que otros equipos entren al panel por red local, abrir el puerto TCP 3000 en el firewall de Windows.

## Monitores

- Program usa video continuo desde `vMix Video`.
- Preview usa video continuo desde `vMix Video External 2`.
- El panel fija `External 2` como `Preview` con `SetOutputExternal2`.
- No se usa `External 3`, para que funcione en la version vieja de vMix.
