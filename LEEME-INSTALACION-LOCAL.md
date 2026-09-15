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

## Bridge para panel publicado

Si el panel se publica en Render/PanelGo, el servidor publicado debe usar:

```text
VMIX_ACCESS_MODE=bridge
PANEL_BASE_PATH=/lu2exteriores
```

En la PC donde corre vMix, abrir `Abrir Bridge LU2.cmd` e ingresar la URL publicada del panel. El bridge toma los comandos del panel publicado y los ejecuta contra vMix local en `127.0.0.1:8088`.

## Overlays

- Overlay 1: zocalo principal, input 58.
- Overlay 2: referencia, input 57.
- Overlay 3: hora y temperatura, input 59, siempre repuesto por el panel.
- Overlay 4: nombre del programa, inputs 60 y 61.
- Boton OUT: apaga los overlays y vuelve a poner hora y temperatura.

## Archivos incluidos

- `server.js`: servidor local y puente hacia vMix.
- `bridge-client.js`: cliente local del bridge para panel publicado.
- `public/`: interfaz del panel.
- `runtime/node.exe`: Node portable incluido.
- `start-panel-local.ps1`: arranque local recomendado.
- `Abrir Panel Radio LU2.cmd`: arranque por doble click contra vMix local.
- `Abrir Bridge LU2.cmd`: arranque del bridge local contra vMix.

## Notas

- Copiar la carpeta completa, incluyendo `runtime`.
- Si el puerto 3000 esta ocupado, ejecutar: `.\start-panel-local.ps1 -Port 3001` y abrir `http://localhost:3001`.
- Para que otros equipos entren al panel por red local, abrir el puerto TCP 3000 en el firewall de Windows.

## Monitores

- Los lugares de Output 2, Program y BVC quedan reservados.
- Por ahora el panel no pide streams ni snapshots de monitores.
- Cuando se defina como usarlos, se conecta esa fuente sin tocar los controles principales.
