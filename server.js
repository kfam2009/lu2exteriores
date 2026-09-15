const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.PORT || 3000);
const PANEL_BASE_PATH = normalizeBasePath(process.env.PANEL_BASE_PATH || "/lu2exteriores");
const VMIX_ACCESS_MODE = process.env.VMIX_ACCESS_MODE || "direct";
const USE_VMIX_BRIDGE = VMIX_ACCESS_MODE === "bridge";
const VMIX_HOST = process.env.VMIX_HOST || "127.0.0.1";
const VMIX_PORT = Number(process.env.VMIX_PORT || 8088);
const IS_REMOTE_VMIX = !["127.0.0.1", "localhost", "::1"].includes(VMIX_HOST.toLowerCase());
const ENABLE_REMOTE_MONITORS = process.env.ENABLE_REMOTE_MONITORS === "1";
const PUBLIC_DIR = path.join(__dirname, "public");
const FFMPEG_PATH = resolveFfmpegPath();
const PREVIEW_SNAPSHOT_PATH = path.join(__dirname, "preview-live.jpg");
const PROGRAM_SNAPSHOT_PATH = path.join(__dirname, "program-live.jpg");
const PROGRAM_OUTPUT_SNAPSHOT_PATH = path.join(__dirname, "program-output-live.jpg");
const INPUT_SNAPSHOT_DIR = path.join(__dirname, "input-snapshots");
const ZOCALO_DATA_PATH = path.join(__dirname, "zocalos-data.json");
const ZOCALO_BACKUP_PATH = path.join(__dirname, "zocalos-data.backup.json");
const SRT_TANDAS_URL = process.env.SRT_TANDAS_URL || "srt://172.31.146.56:10005?mode=caller";
const CLOCK_WEATHER_INPUT = "59";
const CLOCK_WEATHER_OVERLAY_SLOT = "3";
const CLOCK_WEATHER_FIELD = "TextBlock1.Text";
const CLOCK_WEATHER_EXTRA_FIELD = "TextBlock2.Text";
const CLOCK_WEATHER_INTERVAL_MS = 3000;
const PROGRAM_NAME_FIELDS = ["TextBlock1.Text", "TextBlock2.Text"];
const PROGRAM_NAME_DEFAULTS = {
  "60": "PANORAMA",
  "61": "ESTÁ TODO\nINVENTADO",
  "62": "TODO CAMPO",
  "63": "A LAS CHAPAS",
  "64": "ALLICA Y PRIETA",
  "65": "CIAO ITALIA",
  "66": "DUPLEX",
  "67": "ENTRETIEMPO",
  "68": "HERENCIA CRIOLLA",
  "69": "MÚSICA",
  "70": "NOCHE A NOCHE",
  "71": "NOTICIAS EN COMPAÑÍA",
  "72": "RADIOVISIÓN\nDEPORTIVA",
  "73": "LECTURA\nLA NUEVA",
  "74": "EL EXPRESO",
  "75": "LU2 AM FM",
  "76": "LA VOZ DEL CAMPO",
  "77": "INFORME DOS"
};
let lastClockWeatherTemperature = "";
let lastSentClockText = "";
let lastSentTemperatureText = "";
const MONITOR_DEVICES = {
  program: process.env.VMIX_PROGRAM_DEVICE || "vMix Video",
  preview: process.env.VMIX_PREVIEW_DEVICE || "vMix Video External 2"
};
const monitorStreams = new Map();
let bahiaWeatherCache = { at: 0, data: null };
let bridgeCommandId = 0;
let bridgeLastSeenAt = 0;
const bridgeQueue = [];
const bridgePollers = [];
const bridgePending = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function normalizeBasePath(basePath) {
  const normalized = `/${String(basePath || "").trim().replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "" : normalized;
}

function requestPathname(req) {
  return new URL(req.url, `http://${req.headers.host}`).pathname;
}

function pathWithoutPanelBase(pathname) {
  if (!PANEL_BASE_PATH) {
    return pathname;
  }

  if (pathname === PANEL_BASE_PATH) {
    return "/";
  }

  if (pathname.startsWith(`${PANEL_BASE_PATH}/`)) {
    return pathname.slice(PANEL_BASE_PATH.length) || "/";
  }

  return pathname;
}

function resolveFfmpegPath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    path.join(__dirname, "runtime", "ffmpeg.exe"),
    path.join(__dirname, "tools", "ffmpeg.exe"),
    path.join(__dirname, "tools", "ffmpeg", "ffmpeg.exe"),
    "C:\\Program Files\\DownloadHelper CoApp\\ffmpeg.exe",
    "ffmpeg.exe"
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate === "ffmpeg.exe") {
      return true;
    }

    return fs.existsSync(candidate);
  }) || "ffmpeg.exe";
}

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readZocaloData() {
  if (!fs.existsSync(ZOCALO_DATA_PATH)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(ZOCALO_DATA_PATH, "utf8"));
  return data && data.profiles && typeof data.profiles === "object" ? data : null;
}

function writeZocaloData(data) {
  const temporaryPath = `${ZOCALO_DATA_PATH}.tmp`;
  if (fs.existsSync(ZOCALO_DATA_PATH)) {
    fs.copyFileSync(ZOCALO_DATA_PATH, ZOCALO_BACKUP_PATH);
  }
  fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temporaryPath, ZOCALO_DATA_PATH);
}

function readJsonBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("El contenido es demasiado grande."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

async function serveZocalos(req, res) {
  try {
    if (req.method === "GET") {
      const data = readZocaloData();
      send(res, data ? 200 : 404, JSON.stringify(data || { error: "Sin datos centrales" }), "application/json; charset=utf-8");
      return;
    }

    if (req.method !== "PUT") {
      send(res, 405, JSON.stringify({ error: "Metodo no permitido" }), "application/json; charset=utf-8");
      return;
    }

    const body = await readJsonBody(req);
    const allowedProfiles = ["general", "panorama", "inventado", "duplex", "noticias"];
    if (!allowedProfiles.includes(body.profile) || !Array.isArray(body.items)) {
      send(res, 400, JSON.stringify({ error: "Perfil o lista invalida" }), "application/json; charset=utf-8");
      return;
    }

    const cleanItems = body.items
      .filter((item) => item && typeof item === "object" && item.id && item.type && item.line)
      .map((item) => ({ id: String(item.id), type: String(item.type), line: String(item.line), text: String(item.text || "") }));
    let data = readZocaloData();
    if (!data) {
      data = { version: 1, profiles: {} };
      allowedProfiles.forEach((profile) => {
        data.profiles[profile] = cleanItems.map((item) => ({ ...item }));
      });
    }
    data.profiles[body.profile] = cleanItems;
    data.updatedAt = new Date().toISOString();
    writeZocaloData(data);
    send(res, 200, JSON.stringify(data), "application/json; charset=utf-8");
  } catch (error) {
    console.error("Error guardando zocalos:", error.message);
    send(res, 500, JSON.stringify({ error: "No pude guardar los zocalos" }), "application/json; charset=utf-8");
  }
}

function writeLiveMonitorChunk(client, chunk) {
  if (client.destroyed || client.writableEnded || client.lu2WaitingForDrain) {
    return;
  }

  if (!client.write(chunk)) {
    client.lu2WaitingForDrain = true;
    client.once("drain", () => {
      client.lu2WaitingForDrain = false;
    });
  }
}

function getText(url) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https:") ? https : http;
    const request = transport.get(url, { timeout: 5000 }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        resolve(Buffer.concat(chunks).toString("utf8"));
      });
    });

    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Weather timeout"));
    });
    request.on("error", reject);
  });
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

async function getOpenMeteoBahiaWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=-38.7196&longitude=-62.2724&current=temperature_2m,weather_code&timezone=America%2FArgentina%2FBuenos_Aires";
  const weather = await getJson(url);
  const data = {
    temperature: Number(weather.current?.temperature_2m),
    weatherCode: Number(weather.current?.weather_code),
    unit: weather.current_units?.temperature_2m || "°C",
    observedAt: weather.current?.time || "",
    source: "Open-Meteo"
  };

  if (!Number.isFinite(data.temperature)) {
    throw new Error("Temperatura invalida de Open-Meteo");
  }

  return data;
}

async function getMetarBahiaWeather() {
  const url = "https://tgftp.nws.noaa.gov/data/observations/metar/stations/SAZB.TXT";
  const report = await getText(url);
  const lines = report.trim().split(/\r?\n/);
  const temperatureToken = lines.slice(1).join(" ").match(/\b(M?\d{2})\/(M?\d{2})\b/);

  if (!temperatureToken) {
    throw new Error("Temperatura invalida de METAR SAZB");
  }

  const rawTemperature = temperatureToken[1];
  const temperature = Number(rawTemperature.replace(/^M/, "")) * (rawTemperature.startsWith("M") ? -1 : 1);
  return {
    temperature,
    weatherCode: null,
    unit: "°C",
    observedAt: lines[0] || "",
    source: "METAR SAZB"
  };
}

async function fetchBahiaWeather() {
  try {
    return await getOpenMeteoBahiaWeather();
  } catch (primaryError) {
    try {
      return await getMetarBahiaWeather();
    } catch (fallbackError) {
      throw new Error(`Open-Meteo: ${primaryError.message}; METAR: ${fallbackError.message}`);
    }
  }
}

async function serveBahiaWeather(res) {
  const now = Date.now();
  if (bahiaWeatherCache.data && now - bahiaWeatherCache.at < 180000) {
    send(res, 200, JSON.stringify(bahiaWeatherCache.data), "application/json; charset=utf-8");
    return;
  }

  try {
    const data = await fetchBahiaWeather();

    bahiaWeatherCache = { at: now, data };
    send(res, 200, JSON.stringify(data), "application/json; charset=utf-8");
  } catch (error) {
    if (bahiaWeatherCache.data) {
      send(res, 200, JSON.stringify({ ...bahiaWeatherCache.data, stale: true }), "application/json; charset=utf-8");
      return;
    }

    send(res, 502, JSON.stringify({
      error: "No pude obtener temperatura de Bahia Blanca.",
      detail: error.message
    }), "application/json; charset=utf-8");
  }
}

function bahiaTimeText() {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

function decodeXmlText(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textFieldFromInputXml(inputXml, fieldName) {
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(`<text[^>]*name=["']${escapedName}["'][^>]*>([\\s\\S]*?)<\\/text>`);
  return decodeXmlText(inputXml.match(fieldPattern)?.[1] || "").trim();
}

function isClockOrTemperatureText(value = "") {
  const normalized = value.trim();
  return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(normalized)
    || /^-?\d+(?:[.,]\d+)?\s*°\s*C$/i.test(normalized)
    || /^\d{1,2}:\d{2}\s+-?\d+(?:[.,]\d+)?\s*°\s*C$/i.test(normalized);
}

async function enforceClockWeatherFields() {
  try {
    const vmixXml = await getVmixXml();
    const inputPattern = new RegExp(`<input[^>]*number=["']${CLOCK_WEATHER_INPUT}["'][^>]*>([\\s\\S]*?)<\\/input>`);
    const inputXml = vmixXml.match(inputPattern)?.[0] || "";

    if (!inputXml) {
      return;
    }

    const currentClock = textFieldFromInputXml(inputXml, CLOCK_WEATHER_FIELD);
    const currentTemperature = textFieldFromInputXml(inputXml, CLOCK_WEATHER_EXTRA_FIELD);
    const recoveredTemperature =
      currentTemperature.match(/-?\d+(?:[.,]\d+)?\s*°C/)?.[0] ||
      currentClock.match(/-?\d+(?:[.,]\d+)?\s*°C/)?.[0] ||
      lastClockWeatherTemperature;
    const expectedClock = bahiaTimeText();

    if (recoveredTemperature) {
      lastClockWeatherTemperature = recoveredTemperature;
    }

    if (currentClock !== expectedClock) {
      await callVmixApi(`/api/?Function=SetText&Input=${CLOCK_WEATHER_INPUT}&SelectedName=${encodeURIComponent(CLOCK_WEATHER_FIELD)}&Value=${encodeURIComponent(expectedClock)}`);
      lastSentClockText = expectedClock;
    }

    if (lastClockWeatherTemperature && currentTemperature !== lastClockWeatherTemperature) {
      await callVmixApi(`/api/?Function=SetText&Input=${CLOCK_WEATHER_INPUT}&SelectedName=${encodeURIComponent(CLOCK_WEATHER_EXTRA_FIELD)}&Value=${encodeURIComponent(lastClockWeatherTemperature)}`);
      lastSentTemperatureText = lastClockWeatherTemperature;
    }

    for (const [programInput, expectedName] of Object.entries(PROGRAM_NAME_DEFAULTS)) {
      const programPattern = new RegExp(`<input[^>]*number=["']${programInput}["'][^>]*>([\\s\\S]*?)<\\/input>`);
      const programXml = vmixXml.match(programPattern)?.[0] || "";

      if (!programXml) {
        continue;
      }

      for (const fieldName of PROGRAM_NAME_FIELDS) {
        const currentValue = textFieldFromInputXml(programXml, fieldName);

        if (isClockOrTemperatureText(currentValue)) {
          await callVmixApi(`/api/?Function=SetText&Input=${programInput}&SelectedName=${encodeURIComponent(fieldName)}&Value=${encodeURIComponent(expectedName)}`);
        }
      }
    }
  } catch {}
}

async function getBahiaWeatherData() {
  const now = Date.now();
  if (bahiaWeatherCache.data && now - bahiaWeatherCache.at < 180000) {
    return bahiaWeatherCache.data;
  }

  const data = await fetchBahiaWeather();

  bahiaWeatherCache = { at: now, data };
  return data;
}

async function updateClockWeatherInput() {
  let temperature = lastClockWeatherTemperature;

  try {
    const weather = await getBahiaWeatherData();
    const roundedTemperature = Math.round(Number(weather.temperature) * 10) / 10;
    const temperatureText = Number.isInteger(roundedTemperature)
      ? String(roundedTemperature)
      : roundedTemperature.toFixed(1);
    temperature = `${temperatureText} °C`;
    lastClockWeatherTemperature = temperature;
  } catch {}

  const clockText = bahiaTimeText();

  if (clockText !== lastSentClockText) {
    await callVmixApi(`/api/?Function=SetText&Input=${CLOCK_WEATHER_INPUT}&SelectedName=${encodeURIComponent(CLOCK_WEATHER_FIELD)}&Value=${encodeURIComponent(clockText)}`);
    lastSentClockText = clockText;
  }

  if (temperature !== lastSentTemperatureText) {
    await callVmixApi(`/api/?Function=SetText&Input=${CLOCK_WEATHER_INPUT}&SelectedName=${encodeURIComponent(CLOCK_WEATHER_EXTRA_FIELD)}&Value=${encodeURIComponent(temperature)}`);
    lastSentTemperatureText = temperature;
  }

  const vmixXml = await getVmixXml();
  const overlayPattern = new RegExp(`<overlay\\s+number=["']${CLOCK_WEATHER_OVERLAY_SLOT}["'][^>]*>([^<]*)<\\/overlay>`);
  const currentOverlayInput = vmixXml.match(overlayPattern)?.[1]?.trim() || "";

  if (currentOverlayInput !== CLOCK_WEATHER_INPUT) {
    await callVmixApi(`/api/?Function=OverlayInput${CLOCK_WEATHER_OVERLAY_SLOT}In&Input=${CLOCK_WEATHER_INPUT}`);
  }
  console.log(`Hora input ${CLOCK_WEATHER_INPUT}: ${clockText}; temperatura: ${temperature}`);
}

async function initializeVmixState() {
  try {
    await callVmixApi("/api/?Function=SetOutput2&Value=MultiView");
    await callVmixApi("/api/?Function=SetOutput4&Value=Output");
    console.log("Output 2: MultiView; Output 4: Output");
  } catch (error) {
    console.warn(`No pude inicializar Outputs 2 y 4: ${error.message}`);
  }

  try {
    for (const programInput of ["60", "61"]) {
      for (const fieldName of PROGRAM_NAME_FIELDS) {
        await callVmixApi(`/api/?Function=SetText&Input=${programInput}&SelectedName=${encodeURIComponent(fieldName)}&Value=${encodeURIComponent(PROGRAM_NAME_DEFAULTS[programInput])}`);
      }
    }
    console.log("Nombres iniciales corregidos: Input 60 Panorama; Input 61 Esta todo inventado");
  } catch (error) {
    console.warn(`No pude inicializar los nombres 60 y 61: ${error.message}`);
  }

  await refreshClockWeatherInput();
}

async function refreshClockWeatherInput() {
  try {
    await updateClockWeatherInput();
  } catch (error) {
    console.warn(`No pude actualizar hora y temperatura: ${error.message}`);
  }
}

function serveStatic(req, res) {
  const requestPath = pathWithoutPanelBase(requestPathname(req));
  const panelRoutes = new Set([
    PANEL_BASE_PATH,
    `${PANEL_BASE_PATH}/`
  ]);
  const relativePath = requestPath === "/" || panelRoutes.has(requestPathname(req))
    ? "index.html"
    : requestPath.replace(/^\/+/, "");
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath);
    send(res, 200, data, MIME_TYPES[ext] || "application/octet-stream");
  });
}

function bridgeStatusPayload() {
  return {
    mode: VMIX_ACCESS_MODE,
    connected: Boolean(bridgeLastSeenAt && Date.now() - bridgeLastSeenAt < 45000),
    lastSeenAt: bridgeLastSeenAt ? new Date(bridgeLastSeenAt).toISOString() : null,
    queued: bridgeQueue.length,
    pending: bridgePending.size
  };
}

function dispatchBridgeCommands() {
  while (bridgeQueue.length && bridgePollers.length) {
    const command = bridgeQueue.shift();
    const poller = bridgePollers.shift();
    clearTimeout(poller.timer);
    send(poller.res, 200, JSON.stringify(command), "application/json; charset=utf-8");
  }
}

function enqueueBridgeCommand(pathname) {
  return new Promise((resolve, reject) => {
    const id = String(++bridgeCommandId);
    const timeout = setTimeout(() => {
      bridgePending.delete(id);
      reject(new Error("Bridge vMix timeout"));
    }, 12000);

    bridgePending.set(id, { resolve, reject, timeout });
    bridgeQueue.push({ id, path: pathname });
    dispatchBridgeCommands();
  });
}

async function serveBridgePoll(req, res) {
  bridgeLastSeenAt = Date.now();

  if (bridgeQueue.length) {
    const command = bridgeQueue.shift();
    send(res, 200, JSON.stringify(command), "application/json; charset=utf-8");
    return;
  }

  const poller = {
    res,
    timer: setTimeout(() => {
      const index = bridgePollers.indexOf(poller);
      if (index >= 0) {
        bridgePollers.splice(index, 1);
      }
      send(res, 204, "");
    }, 25000)
  };

  bridgePollers.push(poller);
  req.on("close", () => {
    const index = bridgePollers.indexOf(poller);
    if (index >= 0) {
      clearTimeout(poller.timer);
      bridgePollers.splice(index, 1);
    }
  });
}

async function serveBridgeResult(req, res) {
  bridgeLastSeenAt = Date.now();

  try {
    const body = await readJsonBody(req);
    const pending = bridgePending.get(String(body.id || ""));

    if (!pending) {
      send(res, 404, JSON.stringify({ error: "Comando no encontrado" }), "application/json; charset=utf-8");
      return;
    }

    bridgePending.delete(String(body.id));
    clearTimeout(pending.timeout);

    if (body.error) {
      pending.reject(new Error(String(body.error)));
    } else {
      pending.resolve({
        statusCode: Number(body.statusCode || 200),
        contentType: String(body.contentType || "text/xml; charset=utf-8"),
        body: Buffer.from(String(body.bodyBase64 || ""), "base64")
      });
    }

    send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
  } catch (error) {
    send(res, 400, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  }
}

function serveBridgeStatus(req, res) {
  send(res, 200, JSON.stringify(bridgeStatusPayload()), "application/json; charset=utf-8");
}

function proxyVmix(req, res) {
  const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
  const query = incomingUrl.searchParams;
  const functionName = query.get("Function");
  const inputNumber = query.get("Input");
  const selectedName = query.get("SelectedName");
  const value = query.get("Value") || "";

  const isLegacyClockUpdate =
    functionName === "SetText" &&
    (inputNumber === CLOCK_WEATHER_INPUT || inputNumber === "60") &&
    (selectedName === CLOCK_WEATHER_FIELD || selectedName === CLOCK_WEATHER_EXTRA_FIELD) &&
    (/^\d{1,2}:\d{2}(\s+\d+\s*°C)?$/.test(value) || /^\d+\s*°C$/.test(value) || value === "");

  if (isLegacyClockUpdate) {
    send(res, 200, "");
    return;
  }

  if (
    functionName === "SetText" &&
    inputNumber === "60" &&
    (selectedName === "TextBlock1.Text" || selectedName === "TextBlock2.Text") &&
    (/^\d{1,2}:\d{2}(\s+\d+\s*°C)?$/.test(value) || /^\d+\s*°C$/.test(value) || value === "")
  ) {
    query.set("Input", CLOCK_WEATHER_INPUT);
  }

  const vmixPath = `/api/?${query.toString()}`;

  if (USE_VMIX_BRIDGE) {
    enqueueBridgeCommand(vmixPath)
      .then((result) => {
        res.writeHead(result.statusCode, {
          "Content-Type": result.contentType,
          "Cache-Control": "no-store"
        });
        res.end(result.body);
      })
      .catch((error) => {
        send(res, 503, JSON.stringify({
          error: "Bridge vMix no disponible.",
          detail: error.message,
          bridge: bridgeStatusPayload()
        }), "application/json; charset=utf-8");
      });
    return;
  }

  let didRespond = false;

  const sendOnce = (statusCode, body, contentType) => {
    if (didRespond || res.headersSent || res.writableEnded) {
      return;
    }

    didRespond = true;
    send(res, statusCode, body, contentType);
  };

  const proxyReq = http.request(
    {
      host: VMIX_HOST,
      port: VMIX_PORT,
      method: "GET",
      path: vmixPath,
      timeout: 5000
    },
    (proxyRes) => {
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        if (didRespond || res.headersSent || res.writableEnded) {
          return;
        }

        didRespond = true;
        const body = Buffer.concat(chunks);
        res.writeHead(proxyRes.statusCode || 200, {
          "Content-Type": proxyRes.headers["content-type"] || "text/xml; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.end(body);
      });
    }
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    sendOnce(504, "vMix API timeout");
  });

  proxyReq.on("error", () => {
    sendOnce(
      502,
      JSON.stringify({
        error: "No pude conectar con vMix.",
        host: VMIX_HOST,
        port: VMIX_PORT,
        hint: "Verifica que vMix este abierto y que Web Controller / API este activo."
      }),
      "application/json; charset=utf-8"
    );
  });

  proxyReq.end();
}

function getVmixXml() {
  return new Promise((resolve, reject) => {
    const apiReq = http.request(
      {
        host: VMIX_HOST,
        port: VMIX_PORT,
        method: "GET",
        path: "/api/",
        timeout: 5000
      },
      (apiRes) => {
        const chunks = [];
        apiRes.on("data", (chunk) => chunks.push(chunk));
        apiRes.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );

    apiReq.on("timeout", () => {
      apiReq.destroy();
      reject(new Error("vMix API timeout"));
    });
    apiReq.on("error", reject);
    apiReq.end();
  });
}

function callVmixApi(apiPath) {
  return new Promise((resolve, reject) => {
    const apiReq = http.request(
      {
        host: VMIX_HOST,
        port: VMIX_PORT,
        method: "GET",
        path: apiPath,
        timeout: 5000
      },
      (apiRes) => {
        apiRes.resume();
        apiRes.on("end", resolve);
      }
    );

    apiReq.on("timeout", () => {
      apiReq.destroy();
      reject(new Error("vMix API timeout"));
    });
    apiReq.on("error", reject);
    apiReq.end();
  });
}

async function readFileWithRetry(filePath, retries = 8) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return fs.promises.readFile(filePath);
}

async function servePreviewSnapshot(res) {
  try {
    const xml = await getVmixXml();
    const preview = xml.match(/<preview>([^<]+)<\/preview>/)?.[1];

    if (!preview) {
      send(res, 404, "Preview not found");
      return;
    }

    await fs.promises.mkdir(INPUT_SNAPSHOT_DIR, { recursive: true });
    const previewSnapshotPath = path.join(INPUT_SNAPSHOT_DIR, `preview-input-${preview}.jpg`);

    await callVmixApi(`/api/?Function=SnapshotInput&Input=${encodeURIComponent(preview)}&Value=${encodeURIComponent(previewSnapshotPath)}`);
    const image = await readFileWithRetry(previewSnapshotPath, 12);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot de Preview");
  }
}

async function serveProgramSnapshot(res) {
  try {
    await callVmixApi(`/api/?Function=Snapshot&Value=${encodeURIComponent(PROGRAM_OUTPUT_SNAPSHOT_PATH)}`);
    const image = await readFileWithRetry(PROGRAM_OUTPUT_SNAPSHOT_PATH, 12);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot de Program");
  }
}

async function serveInputSnapshot(req, res) {
  try {
    const requestPath = pathWithoutPanelBase(requestPathname(req));
    const inputNumber = requestPath.match(/^\/snapshot\/input\/(\d+)\.jpg$/)?.[1];

    if (!inputNumber) {
      send(res, 404, "Input snapshot not found");
      return;
    }

    await fs.promises.mkdir(INPUT_SNAPSHOT_DIR, { recursive: true });

    const snapshotPath = path.join(INPUT_SNAPSHOT_DIR, `input-${inputNumber}.jpg`);

    await callVmixApi(`/api/?Function=SnapshotInput&Input=${encodeURIComponent(inputNumber)}&Value=${encodeURIComponent(snapshotPath)}`);
    const image = await readFileWithRetry(snapshotPath, 8);

    send(res, 200, image, "image/jpeg");
  } catch (error) {
    send(res, 502, "No pude generar snapshot del input");
  }
}

function ensureVmixExternal() {
  // No tocar salidas de vMix al abrir el panel: la PC de aire define sus External/Output.
}

function streamMonitor(req, res, monitorName) {
  const device = MONITOR_DEVICES[monitorName];

  if (!device) {
    send(res, 404, "Monitor not found");
    return;
  }

  ensureVmixExternal();

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffmpeg",
    "Cache-Control": "no-store",
    "Connection": "close"
  });

  const stream = getSharedMonitorStream(monitorName, device);
  stream.clients.add(res);

  if (stream.lastChunk) {
    writeLiveMonitorChunk(res, stream.lastChunk);
  }

  const removeClient = () => {
    stream.clients.delete(res);
  };

  req.on("close", removeClient);
  res.on("close", removeClient);
}

function getSharedMonitorStream(monitorName, device) {
  const existing = monitorStreams.get(monitorName);

  if (existing && !existing.process.killed) {
    return existing;
  }

  const stream = {
    clients: new Set(),
    lastChunk: null,
    process: spawn(FFMPEG_PATH, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "dshow",
      "-i",
      `video=${device}`,
      "-an",
      "-vf",
      "scale=640:360,fps=25",
      "-c:v",
      "mjpeg",
      "-q:v",
      "5",
      "-f",
      "mpjpeg",
      "pipe:1"
    ])
  };

  stream.process.stdout.on("data", (chunk) => {
    stream.lastChunk = chunk;
    stream.clients.forEach((client) => {
      writeLiveMonitorChunk(client, chunk);
    });
  });

  stream.process.stderr.on("data", (chunk) => {
    console.error(`[${monitorName}] ${chunk}`);
  });

  stream.process.on("error", (error) => {
    monitorStreams.delete(monitorName);
    stream.clients.forEach((client) => {
      if (!client.destroyed) {
        client.end(`No pude iniciar monitor ${monitorName}: ${error.message}`);
      }
    });
  });

  stream.process.on("exit", () => {
    monitorStreams.delete(monitorName);
    stream.clients.forEach((client) => {
      if (!client.destroyed) {
        client.end();
      }
    });
  });

  monitorStreams.set(monitorName, stream);
  return stream;
}

function streamSrtMonitor(req, res) {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffmpeg",
    "Cache-Control": "no-store",
    "Connection": "close"
  });

  const stream = getSharedSrtStream();
  stream.clients.add(res);

  if (stream.lastChunk) {
    writeLiveMonitorChunk(res, stream.lastChunk);
  }

  const removeClient = () => {
    stream.clients.delete(res);
  };

  req.on("close", removeClient);
  res.on("close", removeClient);
}

function getSharedSrtStream() {
  const monitorName = "tandas-srt";
  const existing = monitorStreams.get(monitorName);

  if (existing) {
    return existing;
  }

  const stream = {
    clients: new Set(),
    lastChunk: null,
    lastChunkAt: Date.now(),
    process: null,
    restartTimer: null,
    watchdogTimer: null
  };

  const startSrtProcess = () => {
    if (monitorStreams.get(monitorName) !== stream) {
      return;
    }

    stream.lastChunkAt = Date.now();
    stream.process = spawn(FFMPEG_PATH, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-fflags",
      "nobuffer",
      "-flags",
      "low_delay",
      "-i",
      SRT_TANDAS_URL,
      "-an",
      "-vf",
      "scale=640:360,fps=25",
      "-c:v",
      "mjpeg",
      "-q:v",
      "5",
      "-f",
      "mpjpeg",
      "pipe:1"
    ]);

    stream.process.stdout.on("data", (chunk) => {
      stream.lastChunk = chunk;
      stream.lastChunkAt = Date.now();
      stream.clients.forEach((client) => {
        writeLiveMonitorChunk(client, chunk);
      });
    });

    stream.process.stderr.on("data", (chunk) => {
      console.error(`[${monitorName}] ${chunk}`);
    });

    stream.process.on("error", (error) => {
      console.error(`[${monitorName}] No pude iniciar FFmpeg: ${error.message}`);
    });

    stream.process.on("exit", () => {
      stream.process = null;

      if (monitorStreams.get(monitorName) === stream && stream.clients.size > 0) {
        clearTimeout(stream.restartTimer);
        stream.restartTimer = setTimeout(startSrtProcess, 1000);
        return;
      }

      clearInterval(stream.watchdogTimer);
      monitorStreams.delete(monitorName);
      stream.clients.forEach((client) => {
        if (!client.destroyed) {
          client.end();
        }
      });
    });
  };

  monitorStreams.set(monitorName, stream);
  startSrtProcess();
  stream.watchdogTimer = setInterval(() => {
    if (
      stream.clients.size > 0 &&
      stream.process &&
      !stream.process.killed &&
      Date.now() - stream.lastChunkAt > 12000
    ) {
      console.warn(`[${monitorName}] Sin cuadros durante 12 segundos; reiniciando solo el receptor SRT.`);
      stream.lastChunkAt = Date.now();
      stream.process.kill();
    }
  }, 3000);

  return stream;
}

const server = http.createServer((req, res) => {
  const pathname = pathWithoutPanelBase(requestPathname(req));

  if (pathname === "/data/zocalos") {
    serveZocalos(req, res);
    return;
  }

  if (pathname === "/bridge/poll") {
    serveBridgePoll(req, res);
    return;
  }

  if (pathname === "/bridge/result") {
    serveBridgeResult(req, res);
    return;
  }

  if (pathname === "/bridge/status") {
    serveBridgeStatus(req, res);
    return;
  }

  if (!ENABLE_REMOTE_MONITORS && pathname.startsWith("/monitor/")) {
    send(res, 204, "");
    return;
  }

  if (pathname.startsWith("/monitor/program.mjpg")) {
    streamMonitor(req, res, "program");
    return;
  }

  if (pathname.startsWith("/monitor/program.jpg")) {
    serveProgramSnapshot(res);
    return;
  }

  if (pathname.startsWith("/monitor/preview.jpg")) {
    servePreviewSnapshot(res);
    return;
  }

  if (pathname.startsWith("/monitor/preview.mjpg")) {
    streamMonitor(req, res, "preview");
    return;
  }

  if (pathname.startsWith("/monitor/tandas.mjpg")) {
    streamSrtMonitor(req, res);
    return;
  }
  if (pathname.startsWith("/snapshot/input/")) {
    serveInputSnapshot(req, res);
    return;
  }

  if (pathname.startsWith("/vmix")) {
    proxyVmix(req, res);
    return;
  }

  if (pathname.startsWith("/weather/bahia")) {
    serveBahiaWeather(res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Panel LU2: http://localhost:${PORT}`);
  if (USE_VMIX_BRIDGE) {
    console.log("API vMix: modo bridge local");
    return;
  }

  console.log(`API vMix: http://${VMIX_HOST}:${VMIX_PORT}/api/`);
  setTimeout(initializeVmixState, 1500);
  setTimeout(enforceClockWeatherFields, 500);
  setInterval(enforceClockWeatherFields, 200);
  setInterval(refreshClockWeatherInput, CLOCK_WEATHER_INTERVAL_MS);
});




