const state = {
  inputs: [],
  active: "",
  preview: "",
  overlays: {},
  activeTab: "cut",
  master: {
    left: 0,
    right: 0,
    muted: false,
    volume: "100"
  },
  zocalos: {}
};

const APP_BASE_PATH = (() => {
  const scriptPath = document.currentScript?.getAttribute("src") || "";
  const scriptUrl = new URL(scriptPath, window.location.href);
  const marker = "/lu2exteriores/";
  const markerIndex = scriptUrl.pathname.indexOf(marker);
  return markerIndex >= 0 ? scriptUrl.pathname.slice(0, markerIndex + marker.length - 1) : "";
})();

function appUrl(path) {
  return `${APP_BASE_PATH}${path}`;
}

const monitorRefreshTimers = new Map();
const zocaloSearchTerms = {};
const previewOverlayInputsBySlot = {};
let isRefreshingState = false;
let lastClockWeatherTemperature = "";
const PREVIEW_MONITOR_URL = "";
const PROGRAM_MONITOR_URL = "";
const rtcMonitors = {
  started: false,
  socket: null,
  pc: null,
  reconnectTimer: null,
  fallbackTimer: null,
  previewStream: null,
  programStream: null,
  streamMap: {},
  viewerId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  lastFrameAt: 0,
  watchdogStarted: false,
  reconnect: null
};
const MAIN_ZOCALO_INPUT = "58";
const MAIN_ZOCALO_OVERLAY_SLOT = "1";
const SYNC_PREVIEW_EXTERNAL3 = false;
const GRAPHICS_TO_PREVIEW = false;
const MULTIVIEW_INPUTS = ["6", "7", "8", "9"];
const MULTIVIEW_BACKGROUND_LAYER = "1";
const MULTIVIEW_BACKGROUND_INPUT = "11";
const MULTIVIEW_LAYER_INDEXES = ["9", "8", "7", "6"];
const MULTIVIEW_CAMERA_INPUTS = ["1", "2", "3", "4", "5"];
const MULTIVIEW_STORAGE_KEY = "multiviewAssignmentsLayers9To6";
const DIRECT_CUTS = [
  { input: "1", label: "Camara 1" },
  { input: "2", label: "Camara 2" },
  { input: "3", label: "Camara 3" },
  { input: "4", label: "Camara 4" },
  { input: "5", label: "Camara 5" },
  { input: "6", label: "2 Camaras" },
  { input: "7", label: "3 Camaras" },
  { input: "8", label: "4 Camaras" },
  { input: "9", label: "5 Camaras" },
  { input: "25", label: "5 camaras mas panelista" },
  { input: "56", label: "Camara Plaza" },
  { input: "34", label: "Video Bahia" },
  { input: "30", label: "Video Horizontal" },
  { input: "31", label: "Video Vertical" },
  { input: "18", label: "LU2 loop" }
];
const DIRECT_OVERLAY_INPUTS = [
  { slot: "1", input: "19" }
];
const LINE_AUDIO_INPUT = "10";
const PUBLI_SCRIPT_NAME = "PUBLI1";
const PUBLI_LIST_INPUT = "45";
const TANDAS_OUTPUT = "4";
const TANDA_INPUTS = ["48", "49", "50", "51", "52", "53", "54", "55"];
const RESET_INPUTS = [
  { input: "1", label: "Reset Camara 1" },
  { input: "2", label: "Reset Camara 2" },
  { input: "3", label: "Reset Camara 3" },
  { input: "4", label: "Reset Camara 4" },
  { input: "5", label: "Reset Camara 5" },
  { input: "56", label: "Reset Camara Plaza" }
];
const VISIBLE_TABS = new Set(["cut", "zocalos", "multiview"]);
const TANDA_BUTTONS = [
  { key: "eti-1", label: "TANDA ESTA TODO INVENTADO 1", input: "48" },
  { key: "eti-2", label: "TANDA ESTA TODO INVENTADO 2", input: "49" },
  { key: "eti-3", label: "TANDA ESTA TODO INVENTADO 3", input: "50" },
  { key: "eti-4", label: "TANDA ESTA TODO INVENTADO 4", input: "51" },
  { key: "panorama-1", label: "TANDA PANORAMA 1", input: "52" },
  { key: "panorama-2", label: "TANDA PANORAMA 2", input: "53" },
  { key: "panorama-3", label: "TANDA PANORAMA 3", input: "54" },
  { key: "panorama-4", label: "TANDA PANORAMA 4", input: "55" }
];
const UTC_OVERLAYS = [
  { input: "45", label: "Tanda LU2 BVC", slot: "4" },
  { input: "46", label: "Tanda Esta Todo Inventado", slot: "4" },
  { input: "47", label: "Tanda Panorama", slot: "4" },
  { input: "48", label: "ETI 01", slot: "4" },
  { input: "49", label: "ETI 02", slot: "4" },
  { input: "50", label: "ETI 03", slot: "4" },
  { input: "51", label: "ETI 04", slot: "4" },
  { input: "52", label: "Panorama 01", slot: "4" },
  { input: "53", label: "Panorama 02", slot: "4" },
  { input: "54", label: "Panorama 03", slot: "4" },
  { input: "55", label: "Panorama 04", slot: "4" }
];
const ZOCALO_DEFAULTS_VERSION = "lu2-principal-sin-referencia-2026-08-25";
const DEFAULT_ZOCALOS = {
  "19": {
    slot: "1",
    selected: 0,
    texts: [
      "PANORAMA",
      "NORMAN FERNÁNDEZ",
      "MÓVIL: DANILO BELLONI",
      "MOVIL: PABLO PASCUAL",
      "DR. OSCAR COLOMBO",
      "MICRO DE OPINIÓN",
      "LA VOZ DEL CAMPO",
      "EL PASE",
      "",
      "FAMILIA COOPERATIVA",
      "",
      "WHATSAPP 291-641-44-42",
      "",
      "LA COCINA DE NATI !",
      "",
      "ABOGADO ALFREDO BERNABEI",
      "SERIES CON GUILLE CRISAFULLI",
      "NUTRICIÓN CON MACARENA ÁLVAREZ",
      "VIAJES LA NUEVA",
      "",
      "LOS NÚMEROS EN PANORAMA",
      "",
      "PRONÓSTICO DEL TIEMPO",
      "DANIEL  \"METEORITO \" DODERO ",
      "",
      "LA VOZ DEL CAMPO",
      "ALEJANDRO CANEPPA",
      "LORENA CARONNA",
      "UNA DEPORTIVA CON VICTOR HUGO",
      "UNA DEPORTIVA ",
      "    UNA DEPORTIVA  CON JUAN CARLOS",
      "",
      "WHATSAPP 291-641-44-42",
      "INFORMATIVO 10HS",
      "TITULOS 10:30 HS",
      "INFORMATIVO 11:00 HS",
      "TITULOS 11:30 HS",
      "",
      "WHATSAPP 291-641-44-42",
      "",
      "VIRGINIA PALACIOS",
      "ESTÁ TODO INVENTADO",
      "",
      "       SERGIO CRIVELLI DESDE EL CONGRESO",
      "",
      "LAS TRES DE LA MAÑANA",
      "INFORMATIVO DE LA ZONA 9:00 HS",
      "",
      "LA MÚSICA DE LOS VIERNES",
      "PANORAMA MÚSICAL",
      "LOS NÚMEROS DE LA SUERTE",
      "",
      "ABOGADO ALFREDO BERNABEI",
      "LICENCIADO CHRISTIAN LEPRÓN ",
      "MICRO CINE CON LUCÍA DÍACOLO",
      "",
      "TÍTULOS EN PANORAMA",
      "PANORAMA PORTUARIO",
      "",
      "ALFREDO BERNABEI TEMAS PREVÍSÍONALES",
      "LUCIANA CARDILLO DESDE MONTE HERMOSO",
      "",
      "Carlos Chesñevar, IA  Los trabajos del futuro",
      "Fran Villafañez - Tecnología",
      "Andrés Cisneros Panorama Internacional",
      "Ricardo Salas desde La Plata",
      "",
      "Leandro Valente, Padres escuelas medias UNS",
      "",
      "Martín Larrea, colegio de Gestores",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "LU2 96 AÑOS !!",
      "",
      "",
      "",
      ""
    ]
  }
};
const ZOCALO_TYPES = [
  {
    id: "lu2-zocalo-1",
    tab: "principal",
    label: "Zocalo principal",
    input: "58",
    overlay: "1",
    lines: 1,
    fields: ["TextBlock1.Text"],
    fieldLabels: ["Zocalo principal"]
  },
  {
    id: "lu2-referencia",
    tab: "principal",
    label: "Referencia",
    input: "57",
    overlay: "2",
    lines: 1,
    fields: ["TextBlock1.Text"],
    fieldLabels: ["Referencia"]
  },
];
const CLOCK_WEATHER_INPUT = "59";
const CLOCK_WEATHER_OVERLAY_SLOT = "3";
const CLOCK_WEATHER_FIELD = "TextBlock1.Text";
const CLOCK_WEATHER_EXTRA_FIELD = "TextBlock2.Text";
const CLOCK_WEATHER_ENABLED = false;
const PROGRAM_NAME_OVERLAY_SLOT = "4";
const PROGRAM_NAME_INPUTS = [
  { input: "73", label: "LECTURA LA NUEVA" },
  { input: "74", label: "EL EXPRESO" },
  { input: "75", label: "LU2 AM FM" },
  { input: "76", label: "LA VOZ DEL CAMPO" },
  { input: "77", label: "INFORME DOS" },
  { input: "60", label: "PANORAMA" },
  { input: "61", label: "ESTA TODO INVENTADO" },
  { input: "62", label: "TODO CAMPO" },
  { input: "63", label: "A LAS CHAPAS" },
  { input: "64", label: "ALLICA Y PRIETA" },
  { input: "65", label: "CIAO ITALIA" },
  { input: "66", label: "DUPLEX" },
  { input: "67", label: "ENTRETIEMPO" },
  { input: "68", label: "HERENCIA CRIOLLA" },
  { input: "69", label: "MÚSICA" },
  { input: "70", label: "NOCHE A NOCHE" },
  { input: "71", label: "NOTICIAS EN COMPAÑÍA" },
  { input: "72", label: "RADIOVISIÓN DEPORTIVA" }
];
const LOGO_INPUT = "141";
const LOGO_FIELD = "Image1.Source";
const LOGO_STORAGE_KEY = "selectedLogoPath";
const LOGO_LIST = [
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\amo viajar_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\bahia hoy_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\despierta_bahia_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\gente de palabra_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\hora de radio_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\hora_pico_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\la mesa dominguera_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\maÃ±anas de campo_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\noche de locura_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\nunca es tarde_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\ingenierowhite_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\peÃ±a_de_homero_logo.png",
  "\\\\Desktop-al37edb\\fotos\\Logos Programas NO BORRAR\\irresponsables_logo.png"
];
const PHOTO_STORAGE_KEY = "lu2PanelistasPhotoList";
const PHOTO_SELECTED_KEY = "selectedLu2PanelistasPhotoIndex";
const PHOTO_TEMPLATE_INPUTS = [
  { input: "23", field: "Image2.Source" }
];
const PHOTO_MULTIVIEW_INPUT = "25";
const PHOTO_MULTIVIEW_LAYER = "6";
const PHOTO_MULTIVIEW_SOURCE = "23";
const PHOTO_OVERLAY_INPUT = "23";
const PHOTO_OVERLAY_SLOT = "4";
const RADIO_MV_LAYOUTS = [
  { input: "6", label: "2 Camaras", layers: ["2", "3"], positions: ["Posicion 1", "Posicion 2"], special: { "3": ["29"] } },
  { input: "7", label: "3 Camaras", layers: ["2", "3", "4"], positions: ["Posicion 1", "Posicion 2", "Posicion 3"], special: {} },
  { input: "8", label: "4 Camaras", layers: ["2", "3", "4", "5"], positions: ["Posicion 1", "Posicion 2", "Posicion 3", "Posicion 4"], special: {} },
  { input: "9", label: "5 Camaras", layers: ["2", "3", "4", "5", "6"], positions: ["Posicion 1", "Posicion 2", "Posicion 3", "Posicion 4", "Posicion 5"], special: {} },
  { input: "25", label: "4 camaras + panelista", layers: ["2", "3", "4", "5"], positions: ["Camara 1", "Camara 2", "Camara 3", "Camara 4"], special: {} }
];
const RADIO_MV_SOURCES = [
  { input: "1", label: "Camara 1" },
  { input: "2", label: "Camara 2" },
  { input: "3", label: "Camara 3" },
  { input: "4", label: "Camara 4" },
  { input: "5", label: "Camara 5" }
];
const RADIO_MV_SPECIAL_SOURCES = {};
const RADIO_MV_SELECTED_KEY = "selectedRadioMultiviewLayout";
const DEFAULT_PHOTO_LIST = [
  "\\\\DESKTOP-EO7FM8K\\Fotos\\pablo pascual.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\danilo belloni.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\virginia palacios.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\crivelli.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\lepron.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\canepa.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\cisneros.png",
  "\\\\DESKTOP-EO7FM8K\\Fotos\\villafanez.png"
];
const DIRECT_THUMB_INPUTS = new Set([]);
const RADIO_LAYOUTS = [
];
const RADIO_BACKGROUND_LAYER = "1";
const RADIO_BACKGROUND_INPUT = "17";
const RADIO_LAYER_INDEXES = ["2", "3", "4", "5", "6"];
const RADIO_CAMERA_INPUTS = ["1", "2", "3", "4", "5"];
const RADIO_STORAGE_KEY = "radioMultiviewAssignments";
let lastExternal3Preview = "";
let selectedRadioLayout = "6";
let selectedZocaloType = "lu2-zocalo-1";
const ZOCALO_PROFILES = [
  { id: "general", label: "GENERAL" },
  { id: "panorama", label: "PANORAMA" },
  { id: "inventado", label: "ESTÁ TODO INVENTADO" },
  { id: "duplex", label: "DUPLEX" },
  { id: "noticias", label: "NOTICIAS EN COMPAÑÍA" }
];
let selectedZocaloTab = localStorage.getItem("lu2.zocalos.activeProfile") || "general";
let zocaloProfiles = {};
let zocaloSaveTimer = null;
let activeZocaloLine = "top";
let selectedZocaloLineIds = {};
let zocaloDrafts = {};
let zocaloNewTexts = {};
let zocaloPanels = {};

const els = {
  programFeed: document.querySelector("#programFeed"),
  previewFeed: document.querySelector("#previewFeed"),
  programFallback: document.querySelector("#programFallback"),
  previewFallback: document.querySelector("#previewFallback"),
  status: document.querySelector("#connectionStatus"),
  logLine: document.querySelector("#logLine"),
  inputCards: [...document.querySelectorAll(".input-card")],
  zocaloBoxes: [...document.querySelectorAll(".zocalo-box")],
  zocaloSubtabs: document.querySelector("#zocaloSubtabs"),
  zocaloBoard: document.querySelector("#zocaloBoard"),
  directGrid: document.querySelector("#directCutGrid"),
  utcOverlayGrid: document.querySelector("#utcOverlayGrid"),
  tandaGrid: document.querySelector("#tandaGrid"),
  programsGrid: document.querySelector("#programsGrid"),
  resetGrid: document.querySelector("#resetGrid"),
  logoList: document.querySelector("#logoList"),
  photoList: document.querySelector("#photoList"),
  photoPathInput: document.querySelector("#photoPathInput"),
  photoAddButton: document.querySelector("#photoAddButton"),
  radioMultiviewLayouts: document.querySelector("#radioMultiviewLayouts"),
  radioMultiviewGrid: document.querySelector("#radioMultiviewGrid"),
  radioMultiviewStatus: document.querySelector("#radioMultiviewStatus"),
  multiviewTarget: document.querySelector("#multiviewTarget"),
  masterMeterLeft: document.querySelector("#masterMeterLeft"),
  masterMeterRight: document.querySelector("#masterMeterRight"),
  masterMeterValue: document.querySelector("#masterMeterValue"),
  multiviewRows: [...document.querySelectorAll(".multiview-row")],
  tabButtons: [...document.querySelectorAll("[data-tab]")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],
  radioLayouts: document.querySelector("#radioLayouts"),
  radioRows: [...document.querySelectorAll(".radio-multiview-row")],
  radioStatus: document.querySelector("#radioTestStatus")
};

function setLog(message) {
  els.logLine.textContent = message;
}

function setStatus(isOnline, text) {
  els.status.textContent = text;
  els.status.classList.toggle("online", isOnline);
  els.status.classList.toggle("offline", !isOnline);
}

function inputLabel(input) {
  return input.getAttribute("title") || input.textContent.trim() || `Input ${input.getAttribute("number")}`;
}

function getInput(inputNumber) {
  return state.inputs.find((input) => input.number === String(inputNumber));
}

function getInputByTitle(title) {
  const normalizedTitle = title.toLowerCase();

  return state.inputs.find((input) => input.title.toLowerCase() === normalizedTitle);
}

function firstTextField(input) {
  return input?.textFields?.[0] || null;
}

function activeMultiviewInput() {
  return MULTIVIEW_INPUTS.includes(state.preview) ? state.preview : "";
}

function readMultiviewAssignments() {
  try {
    const assignments = JSON.parse(localStorage.getItem(MULTIVIEW_STORAGE_KEY) || "{}");
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

function saveMultiviewAssignment(multiviewInput, positionIndex, cameraInput) {
  const assignments = readMultiviewAssignments();
  assignments[multiviewInput] = assignments[multiviewInput] || {};
  assignments[multiviewInput][String(positionIndex)] = String(cameraInput);
  localStorage.setItem(MULTIVIEW_STORAGE_KEY, JSON.stringify(assignments));
}

function setActiveTab(tabName) {
  const activeTab = VISIBLE_TABS.has(tabName) ? tabName : "cut";
  state.activeTab = activeTab;
  els.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === activeTab);
  });

  els.tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== activeTab;
  });

  if (activeTab === "zocalos") {
    renderOverlays();
  }
}

function readRadioAssignments() {
  try {
    const assignments = JSON.parse(localStorage.getItem(RADIO_STORAGE_KEY) || "{}");
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

function saveRadioAssignment(layoutInput, positionIndex, cameraInput) {
  const assignments = readRadioAssignments();
  assignments[layoutInput] = assignments[layoutInput] || {};
  assignments[layoutInput][String(positionIndex)] = String(cameraInput);
  localStorage.setItem(RADIO_STORAGE_KEY, JSON.stringify(assignments));
}

async function callVmix(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(appUrl(`/vmix?${query.toString()}`));

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.text();
}

async function runFunction(functionName, input) {
  const params = { Function: functionName };

  if (input) {
    params.Input = input;
  }

  await callVmix(params);
  setLog(`${functionName}${input ? ` input ${input}` : ""}`);
  await refreshState();
}

function bahiaTimeText() {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

async function bahiaTemperatureText() {
  let weather = null;
  try {
    const response = await fetch(appUrl("/weather/bahia"), { cache: "no-store" });
    if (response.ok) {
      weather = await response.json();
    }
  } catch {}

  if (!weather) {
    const direct = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-38.7196&longitude=-62.2724&current=temperature_2m&timezone=America%2FArgentina%2FBuenos_Aires", { cache: "no-store" });
    if (!direct.ok) {
      throw new Error("No pude leer temperatura de Bahia Blanca.");
    }

    const data = await direct.json();
    weather = { temperature: data.current?.temperature_2m };
  }

  const temperature = Number(weather.temperature);
  if (!Number.isFinite(temperature)) {
    throw new Error("Temperatura invalida.");
  }

  lastClockWeatherTemperature = `${Math.round(temperature)} °C`;
  return lastClockWeatherTemperature;
}

async function updateClockWeatherInput() {
  if (!CLOCK_WEATHER_ENABLED) {
    await clearClockWeatherInput();
    return;
  }

  let temperature = lastClockWeatherTemperature;

  try {
    temperature = await bahiaTemperatureText();
  } catch {}

  const text = [bahiaTimeText(), temperature].filter(Boolean).join("  ");
  await callVmix({
    Function: "SetText",
    Input: CLOCK_WEATHER_INPUT,
    SelectedName: CLOCK_WEATHER_FIELD,
    Value: text
  });
  await callVmix({
    Function: "SetText",
    Input: CLOCK_WEATHER_INPUT,
    SelectedName: CLOCK_WEATHER_EXTRA_FIELD,
    Value: ""
  });
  setLog(`Hora y temperatura actualizadas: ${text}`);
}

async function clearClockWeatherInput() {
  await callVmix({
    Function: "SetText",
    Input: CLOCK_WEATHER_INPUT,
    SelectedName: CLOCK_WEATHER_FIELD,
    Value: ""
  });
  await callVmix({
    Function: "SetText",
    Input: CLOCK_WEATHER_INPUT,
    SelectedName: CLOCK_WEATHER_EXTRA_FIELD,
    Value: ""
  });
  await callVmix({
    Function: `OverlayInput${CLOCK_WEATHER_OVERLAY_SLOT}Out`
  });
  setLog("Hora y temperatura fuera del aire.");
}

async function refreshClockWeatherInput() {
  try {
    await updateClockWeatherInput();
  } catch (error) {
    setLog(error.message || "No pude actualizar hora.");
  }
}

function parseInputs(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const vmix = xml.querySelector("vmix");

  if (!vmix) {
    throw new Error("Respuesta invalida de vMix.");
  }

  state.active = vmix.querySelector("active")?.textContent.trim() || "";
  state.preview = vmix.querySelector("preview")?.textContent.trim() || "";
  state.overlays = Object.fromEntries(
    [...xml.querySelectorAll("overlays > overlay")].map((overlay) => [
      overlay.getAttribute("number"),
      {
        input: overlay.textContent.trim(),
        preview: overlay.getAttribute("preview") === "True"
      }
    ])
  );
  parseMasterMeter(vmix);
  state.inputs = [...xml.querySelectorAll("inputs > input")].map((input) => ({
    key: input.getAttribute("key"),
    number: input.getAttribute("number"),
    type: input.getAttribute("type"),
    title: inputLabel(input),
    textFields: [...input.querySelectorAll("text")].map((text) => ({
      index: text.getAttribute("index"),
      name: text.getAttribute("name"),
      value: text.textContent || ""
    })),
    overlays: [...input.querySelectorAll("overlay")].map((overlay) => ({
      index: overlay.getAttribute("index"),
      key: overlay.getAttribute("key")
    }))
  }));
}

function parseMasterMeter(vmix) {
  const master = vmix.querySelector("audio > master");

  state.master = {
    left: Number(master?.getAttribute("meterF1") || 0),
    right: Number(master?.getAttribute("meterF2") || 0),
    muted: master?.getAttribute("muted") === "True",
    volume: master?.getAttribute("volume") || "100"
  };
}

function meterPercent(value) {
  const linearValue = Math.max(0, Math.min(Number(value) || 0, 1));
  return Math.round(Math.sqrt(linearValue) * 100);
}

function meterDb(value) {
  const linearValue = Math.max(Number(value) || 0, 0.000001);
  return Math.max(-60, Math.round(20 * Math.log10(linearValue)));
}

function renderMasterMeter() {
  if (!els.masterMeterLeft || !els.masterMeterRight || !els.masterMeterValue) {
    return;
  }

  const leftPercent = meterPercent(state.master.left);
  const rightPercent = meterPercent(state.master.right);
  const peak = Math.max(state.master.left, state.master.right);
  const peakDb = meterDb(peak);

  els.masterMeterLeft.style.width = `${leftPercent}%`;
  els.masterMeterRight.style.width = `${rightPercent}%`;
  els.masterMeterLeft.classList.toggle("is-hot", leftPercent >= 86);
  els.masterMeterRight.classList.toggle("is-hot", rightPercent >= 86);
  els.masterMeterLeft.classList.toggle("is-clip", leftPercent >= 97);
  els.masterMeterRight.classList.toggle("is-clip", rightPercent >= 97);
  els.masterMeterValue.textContent = state.master.muted ? "MUTE" : `${peakDb} dB`;
}

function loadMonitorConfig() {
  localStorage.setItem("previewMonitorUrl", PREVIEW_MONITOR_URL);
  state.zocalos = readZocalos();
  zocaloProfiles.general = state.zocalos;
  loadCentralZocalos();
  renderMonitorConfig();
}

function renderMonitorConfig() {
  if (!els.previewFeed || !els.programFeed) {
    return;
  }

  if (window.PANEL_CONFIG?.monitorMode === "webrtc") {
    startRtcMonitors();
    return;
  }

  renderMonitorFeed("preview", PREVIEW_MONITOR_URL);
  renderMonitorFeed("program", PROGRAM_MONITOR_URL);
}

function renderMonitorFeed(kind, url) {
  const feeds = {
    preview: els.previewFeed,
    program: els.programFeed
  };
  const fallbacks = {
    preview: els.previewFallback,
    program: els.programFallback
  };
  const feed = feeds[kind];
  const fallback = fallbacks[kind];
  const previousTimer = monitorRefreshTimers.get(kind);

  if (!feed || !fallback) {
    return;
  }

  if (previousTimer) {
    clearTimeout(previousTimer);
    monitorRefreshTimers.delete(kind);
  }

  feed.innerHTML = "";
  feed.classList.toggle("is-live", Boolean(url));
  fallback.hidden = Boolean(url);

  if (!url) {
    return;
  }

  if (/\.(mjpg|jpg|jpeg|png)($|\?)/i.test(url)) {
    const image = document.createElement("img");
    image.alt = `Monitor ${kind}`;
    let refreshTimeout = null;
    const refreshImage = () => {
      image.src = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    };

    image.addEventListener("load", () => {
      if (!/\.mjpg($|\?)/i.test(url)) {
        refreshTimeout = setTimeout(refreshImage, 650);
        monitorRefreshTimers.set(kind, refreshTimeout);
      }
    });
    image.addEventListener("error", () => {
      refreshTimeout = setTimeout(refreshImage, 1200);
      monitorRefreshTimers.set(kind, refreshTimeout);
    });

    refreshImage();
    feed.appendChild(image);
  } else {
    const frame = document.createElement("iframe");
    frame.title = `Monitor ${kind}`;
    frame.src = url;
    frame.allow = "autoplay; fullscreen";
    frame.referrerPolicy = "no-referrer";
    feed.appendChild(frame);
  }
}

function rtcUrl() {
  const url = new URL(window.PANEL_CONFIG?.rtcPath || "/rtc", window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.search = `?role=viewer&viewerId=${encodeURIComponent(rtcMonitors.viewerId)}`;
  return url.toString();
}

function setMonitorVideo(feed, stream, kind) {
  if (!feed) return;
  let video = feed.querySelector("video");
  if (!video) {
    feed.innerHTML = "";
    video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.title = `Monitor ${kind}`;
    video.addEventListener("timeupdate", () => {
      rtcMonitors.lastFrameAt = Date.now();
    });
    feed.appendChild(video);
  }
  if (video.srcObject !== stream) {
    video.srcObject = stream;
    video.play().catch(() => {});
  }
}

function setRtcStreams(previewStream, programStream) {
  if (previewStream) {
    els.previewFeed.classList.add("is-live");
    els.previewFallback.hidden = true;
    setMonitorVideo(els.previewFeed, previewStream, "preview");
  }
  if (programStream) {
    els.programFeed.classList.add("is-live");
    els.programFallback.hidden = true;
    setMonitorVideo(els.programFeed, programStream, "program");
  }
}

function clearRtcConnection() {
  if (rtcMonitors.fallbackTimer) {
    clearTimeout(rtcMonitors.fallbackTimer);
    rtcMonitors.fallbackTimer = null;
  }
  if (rtcMonitors.socket) {
    rtcMonitors.socket.onclose = null;
    try { rtcMonitors.socket.close(); } catch {}
  }
  if (rtcMonitors.pc) {
    rtcMonitors.pc.onconnectionstatechange = null;
    rtcMonitors.pc.onicecandidate = null;
    rtcMonitors.pc.ontrack = null;
    try { rtcMonitors.pc.close(); } catch {}
  }
  rtcMonitors.socket = null;
  rtcMonitors.pc = null;
}

function startRtcMonitors() {
  if (rtcMonitors.started) return;
  rtcMonitors.started = true;

  if (!rtcMonitors.watchdogStarted) {
    rtcMonitors.watchdogStarted = true;
    setInterval(() => {
      if (document.hidden || !rtcMonitors.pc || rtcMonitors.pc.connectionState !== "connected") return;
      if (Date.now() - rtcMonitors.lastFrameAt < 9000) return;
      rtcMonitors.reconnect?.(500);
    }, 3000);
  }

  const connect = () => {
    clearRtcConnection();
    const socket = new WebSocket(rtcUrl());
    const pc = new RTCPeerConnection({ iceServers: window.PANEL_CONFIG?.iceServers || [] });
    let gotPreviewTrack = false;
    let gotProgramTrack = false;
    rtcMonitors.socket = socket;
    rtcMonitors.pc = pc;
    rtcMonitors.streamMap = {};

    const scheduleReconnect = (delay = 1800) => {
      if (rtcMonitors.reconnectTimer) return;
      rtcMonitors.reconnectTimer = setTimeout(() => {
        rtcMonitors.reconnectTimer = null;
        connect();
      }, delay);
      clearRtcConnection();
    };
    rtcMonitors.reconnect = scheduleReconnect;

    pc.ontrack = (event) => {
      const name = rtcMonitors.streamMap[event.transceiver?.mid] || (Object.keys(rtcMonitors.streamMap).length ? "program" : "preview");
      const stream = event.streams[0] || new MediaStream([event.track]);
      if (name === "preview") {
        gotPreviewTrack = true;
        rtcMonitors.previewStream = stream;
      }
      if (name === "program") {
        gotProgramTrack = true;
        rtcMonitors.programStream = stream;
      }
      rtcMonitors.lastFrameAt = Date.now();
      setRtcStreams(rtcMonitors.previewStream, rtcMonitors.programStream);
      if (gotPreviewTrack && gotProgramTrack && rtcMonitors.fallbackTimer) {
        clearTimeout(rtcMonitors.fallbackTimer);
        rtcMonitors.fallbackTimer = null;
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
      }
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) {
        scheduleReconnect();
      } else if (pc.connectionState === "disconnected") {
        scheduleReconnect(6500);
      }
    };

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "viewer-ready" }));
      rtcMonitors.fallbackTimer = setTimeout(() => {
        if (!gotPreviewTrack || !gotProgramTrack) scheduleReconnect();
      }, 15000);
    });
    socket.addEventListener("message", async (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "publisher-offer") {
        rtcMonitors.streamMap = Object.fromEntries((message.streams || []).map((item) => [item.mid, item.name]));
        await pc.setRemoteDescription(message.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "viewer-answer", answer }));
        return;
      }

      if (message.type === "ice-candidate") {
        await pc.addIceCandidate(message.candidate).catch(() => {});
        return;
      }

      if (message.type === "publisher-offline") {
        scheduleReconnect();
      }
    });
    socket.addEventListener("close", () => scheduleReconnect(2500));
    socket.addEventListener("error", () => scheduleReconnect(2500));
  };

  connect();
}

function renderInputButtons() {
  els.inputCards.forEach((card) => {
    const inputNumber = card.dataset.inputCard;
    const input = getInput(inputNumber);
    const label = card.querySelector("strong");
    const buttons = [...card.querySelectorAll("button")];

    card.classList.toggle("is-preview", inputNumber === state.preview);
    card.classList.toggle("is-active", inputNumber === state.active);
    card.title = input?.title || `Input ${inputNumber}`;

    if (label) {
      label.textContent = input?.title || `Input ${inputNumber}`;
    }

    buttons.forEach((button) => {
      button.disabled = !input;
      button.classList.toggle("is-selected", button.dataset.function === "PreviewInput" && inputNumber === state.preview);
      button.classList.toggle("is-live", button.dataset.function === "ActiveInput" && inputNumber === state.active);
    });
  });
}

function renderDirectCuts() {
  if (!els.directGrid) {
    return;
  }

  const expectedInputs = new Set(DIRECT_CUTS.map((direct) => direct.input));

  [...els.directGrid.querySelectorAll("[data-direct-cut]")].forEach((button) => {
    if (!expectedInputs.has(button.dataset.directCut)) {
      button.remove();
    }
  });

  DIRECT_CUTS.forEach((direct, index) => {
    const input = getInput(direct.input);
    let button = els.directGrid.querySelector(`[data-direct-cut="${direct.input}"]`);
    const hasThumb = DIRECT_THUMB_INPUTS.has(direct.input);

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "direct-button";
      button.dataset.directCut = direct.input;
      els.directGrid.appendChild(button);
    }

    const title = direct.label || input?.title?.replace(/^Offline - /, "") || `Input ${direct.input}`;

    button.classList.toggle("has-thumb", hasThumb);
    button.classList.toggle("is-live", state.active === direct.input);
    button.disabled = !input;
    button.title = index < 10 ? `F${index + 1} - ${title}` : title;

    if (hasThumb) {
      if (!button.querySelector(".direct-thumb")) {
        button.innerHTML = "";
        const image = document.createElement("img");
        image.className = "direct-thumb";
        image.alt = "";
        image.loading = "eager";
        button.append(image);
      }
    } else {
      button.innerHTML = "";
      button.textContent = title;
    }
  });
}

function renderMainZocaloButton() {
  const button = document.querySelector("[data-main-zocalo-toggle]");

  if (!button) {
    return;
  }

  const overlay = state.overlays[MAIN_ZOCALO_OVERLAY_SLOT];
  const isLive = overlay?.input === MAIN_ZOCALO_INPUT && !overlay.preview;
  button.classList.toggle("is-live", isLive);
  button.textContent = isLive ? "ZOCALO ON" : "ZOCALO OFF";
  button.title = "Input 58 - Overlay 1";
}

async function toggleMainZocalo() {
  const overlay = state.overlays[MAIN_ZOCALO_OVERLAY_SLOT];
  const isLive = overlay?.input === MAIN_ZOCALO_INPUT && !overlay.preview;

  await callVmix({
    Function: isLive ? "OverlayInput1Out" : "OverlayInput1In",
    ...(!isLive ? { Input: MAIN_ZOCALO_INPUT } : {})
  });

  setLog(`Zocalo principal: ${isLive ? "OFF" : "ON"}`);
  await refreshState();
}

function renderTandaButtons() {
  if (!els.tandaGrid) {
    return;
  }

  els.tandaGrid.innerHTML = "";

  TANDA_BUTTONS.forEach((tanda) => {
    const input = getInput(tanda.input);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sponsor-button tanda-button";
    button.dataset.tandaStart = tanda.input;
    button.textContent = tanda.label;
    button.title = input?.title || `Input ${tanda.input}`;
    button.disabled = !input;
    els.tandaGrid.appendChild(button);
  });

  const radioButton = document.createElement("button");
  radioButton.type = "button";
  radioButton.className = "sponsor-button tanda-button radio-return-button";
  radioButton.dataset.radioReturn = "";
  radioButton.textContent = "RADIO";
  els.tandaGrid.appendChild(radioButton);
}

function renderProgramButtons() {
  if (!els.programsGrid) {
    return;
  }

  els.programsGrid.innerHTML = "";
  const activeProgramInput = state.overlays[PROGRAM_NAME_OVERLAY_SLOT]?.input || "";

  PROGRAM_NAME_INPUTS.forEach((program) => {
    const input = getInput(program.input);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "program-toggle-button";
    button.classList.toggle("is-live", activeProgramInput === program.input);
    button.dataset.programNameInput = program.input;
    button.disabled = !input;
    button.textContent = program.label;
    button.title = input?.title || `Input ${program.input}`;
    els.programsGrid.appendChild(button);
  });
}

function renderResetButtons() {
  if (!els.resetGrid) {
    return;
  }

  els.resetGrid.innerHTML = "";

  RESET_INPUTS.forEach((reset) => {
    const input = getInput(reset.input);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "sponsor-button reset-button";
    button.dataset.resetInput = reset.input;
    button.textContent = reset.label;
    button.title = input?.title || `Input ${reset.input}`;
    button.disabled = !input;
    els.resetGrid.appendChild(button);
  });
}

function renderUtcOverlays() {
  if (!els.utcOverlayGrid) {
    return;
  }

  els.utcOverlayGrid.innerHTML = "";

  UTC_OVERLAYS.forEach((overlay) => {
    const input = getInput(overlay.input);
    const button = document.createElement("button");
    const title = input?.title?.replace(/^Offline - /, "") || overlay.label;

    button.type = "button";
    button.className = "sponsor-button";
    button.dataset.utcOverlay = overlay.input;
    button.dataset.utcSlot = overlay.slot;
    button.disabled = !input;
    button.title = title;
    button.textContent = title;
    els.utcOverlayGrid.appendChild(button);
  });
}

function logoLabel(path) {
  return path
    .split("\\")
    .pop()
    .replace(/_logo\.png$/i, "")
    .replace(/\.png$/i, "")
    .replace(/_/g, " ");
}

function selectedLogoPath() {
  return localStorage.getItem(LOGO_STORAGE_KEY) || LOGO_LIST[0];
}

function renderLogoList() {
  if (!els.logoList) {
    return;
  }

  const selected = selectedLogoPath();
  els.logoList.innerHTML = "";

  LOGO_LIST.forEach((logoPath) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "logo-list-item";
    item.classList.toggle("is-selected", logoPath === selected);
    item.dataset.logoPath = logoPath;
    item.textContent = logoLabel(logoPath);
    item.title = logoPath;
    els.logoList.appendChild(item);
  });
}

function cleanFilePath(path) {
  return path.replace(/[\u202a-\u202e]/g, "").trim();
}

function photoLabel(path) {
  return cleanFilePath(path).split("\\").pop() || path;
}

function readPhotoList() {
  try {
    const saved = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      return saved.map(cleanFilePath).filter(Boolean);
    }
  } catch {
  }

  return DEFAULT_PHOTO_LIST;
}

function savePhotoList(list) {
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(list));
}

function selectedPhotoIndex(list = readPhotoList()) {
  return Math.max(0, Math.min(Number(localStorage.getItem(PHOTO_SELECTED_KEY) || 0), Math.max(list.length - 1, 0)));
}

function selectedPhotoPath() {
  const list = readPhotoList();
  return list[selectedPhotoIndex(list)] || "";
}

function renderPhotoList() {
  if (!els.photoList) {
    return;
  }

  const list = readPhotoList();
  const selected = selectedPhotoIndex(list);
  els.photoList.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "zocalo-empty";
    empty.textContent = "Sin fotos cargadas.";
    els.photoList.appendChild(empty);
    return;
  }

  list.forEach((path, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "photo-list-item";
    item.classList.toggle("is-selected", index === selected);
    item.dataset.photoIndex = String(index);
    item.textContent = photoLabel(path);
    item.title = path;
    els.photoList.appendChild(item);
  });
}

function selectedRadioMultiviewLayout() {
  const saved = localStorage.getItem(RADIO_MV_SELECTED_KEY);
  return RADIO_MV_LAYOUTS.find((layout) => layout.input === saved) || RADIO_MV_LAYOUTS[0];
}

function radioMultiviewSourcesForLayer(layout, layer) {
  const specialInputs = layout.special[layer] || [];
  const sources = [...RADIO_MV_SOURCES];

  specialInputs.forEach((inputNumber) => {
    sources.push({
      input: inputNumber,
      label: RADIO_MV_SPECIAL_SOURCES[inputNumber] || `Input ${inputNumber}`
    });
  });

  return sources;
}

function multiviewOverlayForLayer(input, layer) {
  const xmlIndex = String(Math.max(Number(layer) - 1, 0));
  return input?.overlays.find((overlay) => overlay.index === xmlIndex)
    || input?.overlays.find((overlay) => overlay.index === String(layer));
}

function renderRadioMultiview() {
  if (!els.radioMultiviewLayouts || !els.radioMultiviewGrid) {
    return;
  }

  if (document.activeElement?.matches("[data-radio-mv-layer]")) {
    return;
  }

  const selectedLayout = selectedRadioMultiviewLayout();
  const target = getInput(selectedLayout.input);

  els.radioMultiviewLayouts.innerHTML = "";
  RADIO_MV_LAYOUTS.forEach((layout) => {
    const input = getInput(layout.input);
    const control = document.createElement("div");
    const name = document.createElement("div");
    const actions = document.createElement("div");
    const previewButton = document.createElement("button");
    const cutButton = document.createElement("button");
    const title = input?.title && input.title.toLowerCase() !== "blank" ? input.title : layout.label;

    control.className = "mv-layout-control";
    control.classList.toggle("is-selected", layout.input === selectedLayout.input);
    control.classList.toggle("is-preview", state.preview === layout.input);
    control.classList.toggle("is-live", state.active === layout.input);

    name.className = "mv-layout-name";
    name.textContent = title;

    actions.className = "mv-layout-actions";

    previewButton.type = "button";
    previewButton.className = "mv-layout-button mv-preview-button";
    previewButton.dataset.radioMvPreview = layout.input;
    previewButton.disabled = !input;
    previewButton.textContent = "Previo";

    cutButton.type = "button";
    cutButton.className = "mv-layout-button mv-cut-button";
    cutButton.dataset.radioMvCut = layout.input;
    cutButton.disabled = !input;
    cutButton.textContent = "Al aire";

    actions.append(previewButton, cutButton);
    control.append(name, actions);
    els.radioMultiviewLayouts.appendChild(control);
  });

  if (els.radioMultiviewStatus) {
    els.radioMultiviewStatus.textContent = target
      ? `Editando: ${target.title}${state.preview === selectedLayout.input ? " (en Preview)" : ""}`
      : "No encuentro ese multiview";
  }

  els.radioMultiviewGrid.innerHTML = "";

  selectedLayout.layers.forEach((layer, index) => {
    const row = document.createElement("div");
    const label = document.createElement("div");
    const select = document.createElement("select");
    const current = document.createElement("small");
    const assignedKey = multiviewOverlayForLayer(target, layer)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);

    row.className = "mv-row";
    label.className = "mv-position-label";
    label.textContent = selectedLayout.positions?.[index] || `Posicion ${index + 1}`;
    label.title = `Layer ${layer}`;
    select.dataset.radioMvLayer = layer;
    select.disabled = !target;

    const sources = radioMultiviewSourcesForLayer(selectedLayout, layer);
    const assignedIsSelectable = assignedInput
      ? sources.some((source) => source.input === assignedInput.number)
      : false;

    sources.forEach((source) => {
      const input = getInput(source.input);
      const option = document.createElement("option");
      option.value = source.input;
      option.textContent = input?.title || source.label;
      option.disabled = !input;
      select.appendChild(option);
    });

    select.value = assignedIsSelectable ? assignedInput.number : "";
    current.textContent = assignedIsSelectable
      ? `Actual: ${assignedInput.title}`
      : "Sin camara asignada";

    row.append(label, select, current);
    els.radioMultiviewGrid.appendChild(row);
  });
}

function refreshDirectSnapshots() {
  if (!els.directGrid) {
    return;
  }

  const availableDirects = DIRECT_CUTS.filter((direct) => DIRECT_THUMB_INPUTS.has(direct.input) && getInput(direct.input));

  if (!availableDirects.length) {
    return;
  }

  availableDirects.forEach((direct) => {
    const button = els.directGrid.querySelector(`[data-direct-cut="${direct.input}"]`);
    const image = button?.querySelector(".direct-thumb");

    if (image) {
      image.src = appUrl(`/snapshot/input/${direct.input}.jpg?t=${Date.now()}`);
    }
  });
}

function renderMultiviewControls() {
  if (!els.multiviewTarget || !els.multiviewRows.length) {
    return;
  }

  const targetNumber = activeMultiviewInput();
  const target = getInput(targetNumber);
  const saved = readMultiviewAssignments()[targetNumber] || {};

  els.multiviewTarget.textContent = target ? `Preview: ${target.title}` : "Preview: no es multiview";

  els.multiviewRows.forEach((row, positionIndex) => {
    const select = row.querySelector("select");
    const current = row.querySelector("small");
    const layerIndex = MULTIVIEW_LAYER_INDEXES[positionIndex];
    const assignedKey = target?.overlays.find((overlay) => overlay.index === layerIndex)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);
    const savedInput = getInput(saved[String(positionIndex)]);
    const selectedInput = savedInput || assignedInput;

    select.innerHTML = "";

    MULTIVIEW_CAMERA_INPUTS.forEach((inputNumber) => {
      const input = getInput(inputNumber);
      const option = document.createElement("option");
      option.value = inputNumber;
      option.textContent = input?.title || `Camara ${inputNumber}`;
      option.disabled = !input;
      select.appendChild(option);
    });

    select.disabled = !target;
    select.value = selectedInput?.number || "";
    current.textContent = selectedInput ? `Actual: ${selectedInput.title}` : "Sin asignar";
  });
}

function renderRadioLayouts() {
  if (!els.radioLayouts) {
    return;
  }

  els.radioLayouts.innerHTML = "";

  RADIO_LAYOUTS.forEach((layout) => {
    const input = radioLayoutInput(layout);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "radio-layout-button";
    button.classList.toggle("is-selected", selectedRadioLayout === layout.input);
    button.classList.toggle("is-preview", state.preview === input?.number);
    button.dataset.radioLayout = layout.input;
    button.textContent = input?.title || layout.label;
    button.disabled = !input;
    els.radioLayouts.appendChild(button);
  });
}

function radioLayoutInput(layout) {
  return getInput(layout.input) || getInputByTitle(layout.title);
}

function selectedRadioLayoutConfig() {
  return RADIO_LAYOUTS.find((item) => item.input === selectedRadioLayout) || RADIO_LAYOUTS[0];
}

function renderRadioTest() {
  if (!RADIO_LAYOUTS.length || !els.radioLayouts) {
    return;
  }

  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);
  const layoutStorageKey = target?.number || layout.input;
  const saved = readRadioAssignments()[layoutStorageKey] || {};

  renderRadioLayouts();

  if (els.radioStatus) {
    els.radioStatus.textContent = target
      ? `Editando: ${target.title}${state.preview === layout.input ? " (en Preview)" : ""}`
      : "No encuentro ese multiview en vMix";
  }

  els.radioRows.forEach((row, positionIndex) => {
    const select = row.querySelector("select");
    const current = row.querySelector("small");
    const layerIndex = RADIO_LAYER_INDEXES[positionIndex];
    const isAvailable = Boolean(target) && positionIndex < layout.positions;
    const assignedKey = target?.overlays.find((overlay) => overlay.index === layerIndex)?.key;
    const assignedInput = state.inputs.find((input) => input.key === assignedKey);
    const savedInput = getInput(saved[String(positionIndex)]);
    const selectedInput = savedInput || assignedInput;

    select.innerHTML = "";

    RADIO_CAMERA_INPUTS.forEach((inputNumber) => {
      const input = getInput(inputNumber);
      const option = document.createElement("option");
      option.value = inputNumber;
      option.textContent = input?.title || `Camara ${inputNumber}`;
      option.disabled = !input;
      select.appendChild(option);
    });

    row.classList.toggle("is-disabled", !isAvailable);
    select.disabled = !isAvailable;
    select.value = selectedInput?.number || "";
    current.textContent = isAvailable
      ? selectedInput ? `Actual: ${selectedInput.title}` : "Sin asignar"
      : "No usado en este multiview";
  });
}

async function selectRadioLayout(layoutInput) {
  if (!RADIO_LAYOUTS.length) {
    return;
  }

  selectedRadioLayout = layoutInput;
  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);

  renderRadioTest();

  if (!target) {
    setLog(`No encuentro ${layout.label}.`);
    return;
  }

  await ensureRadioBackground(target.number);
  await runFunction("PreviewInput", target.number);
}

async function ensureRadioBackground(layoutInput) {
  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: layoutInput,
    Value: `${RADIO_BACKGROUND_LAYER},${RADIO_BACKGROUND_INPUT}`
  });
}

async function updateRadioMultiviewPosition(positionIndex, cameraInput) {
  if (!RADIO_LAYOUTS.length) {
    return;
  }

  const layout = selectedRadioLayoutConfig();
  const target = radioLayoutInput(layout);
  const layerIndex = RADIO_LAYER_INDEXES[positionIndex];

  if (!target || !layerIndex || positionIndex >= layout.positions || !cameraInput) {
    setLog("ElegÃ­ un multiview de la prueba.");
    return;
  }

  await ensureRadioBackground(target.number);

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: target.number,
    Value: `${layerIndex},${cameraInput}`
  });

  saveRadioAssignment(target.number, positionIndex, cameraInput);
  setLog(`${target.title} posicion ${positionIndex + 1}: input ${cameraInput}`);
  await refreshState();
}

async function runDirectCut(inputNumber) {
  const direct = DIRECT_CUTS.find((item) => item.input === String(inputNumber));
  const layout = RADIO_LAYOUTS.find((item) => {
    const input = radioLayoutInput(item);
    return input?.number === inputNumber;
  });

  if (direct?.overlays === "off") {
    await setDirectOverlays(false);
  }

  if (layout) {
    await ensureRadioBackground(inputNumber);
  }

  await callVmix({
    Function: "CutDirect",
    Input: inputNumber
  });

  if (direct?.overlays === "on") {
    await setDirectOverlays(true);
  }

  setLog(`Directo: ${direct?.label || getInput(inputNumber)?.title || `Input ${inputNumber}`}`);
  await refreshState();
}

function normaliseOverlaySlot(slot) {
  const overlaySlot = String(slot || "1");
  return ["1", "2", "3", "4"].includes(overlaySlot) ? overlaySlot : "1";
}

async function previewGraphicInput(inputNumber, slot = "1", label = "Grafica") {
  const overlaySlot = normaliseOverlaySlot(slot);

  await callVmix({
    Function: `PreviewOverlayInput${overlaySlot}`,
    Input: inputNumber
  });

  previewOverlayInputsBySlot[overlaySlot] = inputNumber;
  setLog(`${label} en Preview Overlay ${overlaySlot}: ${getInput(inputNumber)?.title || `Input ${inputNumber}`}`);
}

async function clearPreviewGraphicInput(slot = "1", inputNumber = null, label = "Grafica") {
  const overlaySlot = normaliseOverlaySlot(slot);
  const requestedInput = inputNumber ? String(inputNumber) : "";
  const currentOverlay = state.overlays[overlaySlot] || {};
  const currentPreviewInput = currentOverlay.preview ? currentOverlay.input : "";
  const rememberedInput = previewOverlayInputsBySlot[overlaySlot] || "";
  const targetInput = requestedInput && currentPreviewInput === requestedInput
    ? requestedInput
    : currentPreviewInput || (!requestedInput ? rememberedInput : "");

  if (!targetInput) {
    setLog(`${label}: no hay preview overlay activo en slot ${overlaySlot}.`);
    return;
  }

  await callVmix({
    Function: `PreviewOverlayInput${overlaySlot}`,
    Input: targetInput
  });

  delete previewOverlayInputsBySlot[overlaySlot];
  setLog(`${label} fuera del Preview Overlay ${overlaySlot}.`);
}

async function clearInputFromPreviewMultiview(inputNumber, label = "Grafica") {
  const previewInputNumber = state.preview;
  const previewInput = getInput(previewInputNumber);
  const sourceInput = getInput(inputNumber);

  if (!previewInputNumber || !previewInput || !sourceInput || previewInputNumber === state.active) {
    return;
  }

  const matchingLayers = previewInput.overlays
    .filter((overlay) => overlay.key === sourceInput.key)
    .map((overlay) => Number(overlay.index) + 1)
    .filter(Number.isFinite);

  for (const layer of matchingLayers) {
    await callVmix({
      Function: "SetMultiViewOverlay",
      Input: previewInputNumber,
      Value: `${layer},None`
    });
  }

  if (matchingLayers.length) {
    setLog(`${label} quitado de ${previewInput.title} en Preview.`);
  }
}

function hasProgramOverlays() {
  return Object.values(state.overlays || {}).some((overlay) => overlay.input && !overlay.preview);
}

function hasPreviewOverlays() {
  return Object.values(state.overlays || {}).some((overlay) => overlay.input && overlay.preview);
}

async function clearPreviewOverlaysIfSafe(label = "Grafica") {
  if (!hasPreviewOverlays()) {
    return;
  }

  if (hasProgramOverlays()) {
    setLog(`${label}: no hago limpieza general porque hay overlays en Program.`);
    return;
  }

  await callVmix({
    Function: "OverlayInputAllOff"
  });
  Object.keys(previewOverlayInputsBySlot).forEach((slot) => delete previewOverlayInputsBySlot[slot]);
  setLog(`${label}: preview overlays limpiados.`);
}

async function clearAllOverlays(label = "Overlays") {
  const slotsToClear = ["1", "2", "4", "5", "6", "7", "8"];

  for (const slot of slotsToClear) {
    await callVmix({
      Function: `OverlayInput${slot}Out`
    });
    delete previewOverlayInputsBySlot[slot];
  }

  setLog(`${label}: zocalos fuera.`);
}

async function setDirectOverlays(isOn) {
  for (const overlay of DIRECT_OVERLAY_INPUTS) {
    if (GRAPHICS_TO_PREVIEW && isOn) {
      await previewGraphicInput(overlay.input, overlay.slot, "Overlay");
      continue;
    }

    if (GRAPHICS_TO_PREVIEW && !isOn) {
      await clearPreviewGraphicInput(overlay.slot, overlay.input, "Overlay");
      await callVmix({
        Function: `OverlayInput${overlay.slot}Off`
      });
      await clearPreviewOverlaysIfSafe("Overlay");
      continue;
    }

    await callVmix({
      Function: isOn ? `OverlayInput${overlay.slot}In` : `OverlayInput${overlay.slot}Out`,
      ...(isOn ? { Input: overlay.input } : {})
    });
  }
}

async function updateMultiviewPosition(positionIndex, cameraInput) {
  const targetNumber = activeMultiviewInput();
  const layerIndex = MULTIVIEW_LAYER_INDEXES[positionIndex];

  if (!targetNumber || !layerIndex || !cameraInput) {
    setLog("Pone Dos Camaras, Tres Camaras o 4 Camaras en Preview.");
    return;
  }

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: targetNumber,
    Value: `${MULTIVIEW_BACKGROUND_LAYER},${MULTIVIEW_BACKGROUND_INPUT}`
  });

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: targetNumber,
    Value: `${layerIndex},${cameraInput}`
  });
  saveMultiviewAssignment(targetNumber, positionIndex, cameraInput);
  setLog(`${getInput(targetNumber)?.title || `Input ${targetNumber}`} posicion ${positionIndex + 1}: input ${cameraInput}`);
  await refreshState();
}

function zocaloStorageKey() {
  return "lu2.zocalos.principalOnly";
}

function defaultZocaloLibrary() {
  const texts = DEFAULT_ZOCALOS["19"]?.texts || [];
  return [
    ...texts.map((text, index) => ({
      id: `lu2-z1-top-${String(index + 1).padStart(3, "0")}`,
      type: "lu2-zocalo-1",
      line: "top",
      text
    }))
  ];
}

function normalizeLegacyZocalos(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item && item.type && item.line).map((item) => ({ ...item }));
  }

  if (value && typeof value === "object") {
    const texts = Array.isArray(value["19"]?.texts) ? value["19"].texts : [];
    return texts.map((text, index) => ({
      id: `legacy-lu2-z19-top-${String(index + 1).padStart(3, "0")}`,
      type: "lu2-zocalo-1",
      line: "top",
      text: text || ""
    }));
  }

  return [];
}

function readZocalos() {
  try {
    const saved = normalizeLegacyZocalos(JSON.parse(localStorage.getItem(zocaloStorageKey()) || "[]"));
    const legacy = normalizeLegacyZocalos(JSON.parse(localStorage.getItem("zocaloTextLists") || "{}"));
    const defaults = defaultZocaloLibrary();
    const activeTypes = new Set(ZOCALO_TYPES.map((type) => type.id));
    const seen = new Set();
    const merged = [...saved, ...legacy, ...defaults].filter((item) => {
      if (!activeTypes.has(item.type)) {
        return false;
      }

      const key = `${item.type}:${item.line}:${normalizeSearchText(item.text || "")}:${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    localStorage.setItem(zocaloStorageKey(), JSON.stringify(merged));
    localStorage.setItem("zocaloDefaultsVersion", ZOCALO_DEFAULTS_VERSION);
    return merged;
  } catch {
    const defaults = defaultZocaloLibrary();
    localStorage.setItem(zocaloStorageKey(), JSON.stringify(defaults));
    return defaults;
  }
}

function saveZocalos() {
  localStorage.setItem(zocaloStorageKey(), JSON.stringify(state.zocalos));
  zocaloProfiles[selectedZocaloTab] = state.zocalos;
  clearTimeout(zocaloSaveTimer);
  const profileToSave = selectedZocaloTab;
  const itemsToSave = state.zocalos.map((item) => ({ ...item }));
  zocaloSaveTimer = setTimeout(() => saveCentralZocalos(profileToSave, itemsToSave), 350);
}

async function loadCentralZocalos() {
  try {
    const response = await fetch(appUrl("/data/zocalos"), { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      zocaloProfiles = data.profiles || {};
    } else if (response.status === 404) {
      await saveCentralZocalos();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }

    ZOCALO_PROFILES.forEach((profile) => {
      if (!Array.isArray(zocaloProfiles[profile.id])) {
        zocaloProfiles[profile.id] = (zocaloProfiles.general || state.zocalos).map((item) => ({ ...item }));
      }
    });
    state.zocalos = zocaloProfiles[selectedZocaloTab] || zocaloProfiles.general;
    localStorage.setItem(zocaloStorageKey(), JSON.stringify(state.zocalos));
    renderOverlays();
  } catch (error) {
    setLog(`Zocalos locales activos; no pude sincronizar: ${error.message}`);
  }
}

async function saveCentralZocalos(profile = selectedZocaloTab, items = state.zocalos) {
  try {
    const response = await fetch(appUrl("/data/zocalos"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, items })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    zocaloProfiles = data.profiles || zocaloProfiles;
  } catch (error) {
    setLog(`Los zocalos quedaron guardados en esta PC; fallo la copia central: ${error.message}`);
  }
}

function currentZocaloTypes() {
  return ZOCALO_TYPES;
}

function zocaloKey(typeId, line) {
  return `${typeId}:${line}`;
}

function zocaloLines(type) {
  return type.lines > 1 ? ["top", "bottom"] : ["top"];
}

function zocaloLineLabel(type, line) {
  if (line === "bottom") {
    return type.fieldLabels?.[1] || "Renglon 2";
  }

  return type.fieldLabels?.[0] || "Renglon 1";
}

function selectedZocaloLineId(typeId, line) {
  return selectedZocaloLineIds[zocaloKey(typeId, line)] || "";
}

function setSelectedZocaloLineId(typeId, line, id) {
  selectedZocaloLineIds[zocaloKey(typeId, line)] = id;
}

function textForInput(inputNumber, fieldName) {
  const input = getInput(inputNumber);
  return input?.textFields?.find((text) => text.name === fieldName)?.value || "";
}

function zocaloDraft(type) {
  if (!zocaloDrafts[type.id]) {
    zocaloDrafts[type.id] = {
      top: textForInput(type.input, type.fields[0]),
      bottom: type.lines > 1 ? textForInput(type.input, type.fields[1]) : ""
    };
  }

  return zocaloDrafts[type.id];
}

function zocaloLineItems(type, line, includeLive = true) {
  const fieldName = line === "bottom" ? type.fields[1] : type.fields[0];
  const liveText = textForInput(type.input, fieldName);
  const liveItems = includeLive ? [{ id: `live-${type.id}-${line}`, type: type.id, line, text: liveText, live: true }] : [];

  return [...liveItems, ...state.zocalos.filter((item) => item.type === type.id && item.line === line)];
}

function zocaloOverlaySlot(type) {
  const legacySlot = DEFAULT_ZOCALOS[type.input]?.slot;
  return localStorage.getItem(`lu2.zocaloOverlay.${type.id}`) || legacySlot || type.overlay || "1";
}

function setZocaloOverlaySlot(typeId, slot) {
  localStorage.setItem(`lu2.zocaloOverlay.${typeId}`, String(slot || "1"));
}

function zocaloTitle(item) {
  const text = item.text || "";
  return text.length > 58 ? `${text.slice(0, 58)}...` : text;
}

function captureZocaloFocus() {
  const active = document.activeElement;

  if (!active || !els.zocaloBoard?.contains(active)) {
    return null;
  }

  const match = [
    ["search", "zocaloSearchType", "zocaloSearchLine"],
    ["new", "zocaloNewType", "zocaloNewLine"],
    ["inline", "zocaloInlineType", "zocaloInlineLine"]
  ].find(([, typeKey, lineKey]) => active.dataset[typeKey] && active.dataset[lineKey]);

  if (!match) {
    return null;
  }

  return {
    kind: match[0],
    type: active.dataset[match[1]],
    line: active.dataset[match[2]],
    id: active.dataset.zocaloInlineId || "",
    start: active.selectionStart,
    end: active.selectionEnd
  };
}

function restoreZocaloFocus(snapshot) {
  if (!snapshot || !els.zocaloBoard) {
    return;
  }

  const attr = snapshot.kind === "search" ? "zocalo-search" : snapshot.kind === "inline" ? "zocalo-inline" : "zocalo-new";
  const idSelector = snapshot.kind === "inline" && snapshot.id ? `[data-zocalo-inline-id="${snapshot.id}"]` : "";
  const input = els.zocaloBoard.querySelector(`[data-${attr}-type="${snapshot.type}"][data-${attr}-line="${snapshot.line}"]${idSelector}`);

  if (!input) {
    return;
  }

  input.focus();
  if (typeof input.setSelectionRange === "function" && snapshot.start !== null) {
    input.setSelectionRange(snapshot.start, snapshot.end);
  }
}

function normalizeSearchText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function zocaloTextMatches(text, query) {
  const normalized = normalizeSearchText(text).replace(/\s+/g, " ");
  const compactText = normalized.replace(/\s+/g, " ");
  const compactQuery = query.replace(/\s+/g, " ");

  if (compactText.startsWith(compactQuery) || compactText.includes(compactQuery)) {
    return true;
  }

  const queryWords = compactQuery.split(" ").filter(Boolean);

  return queryWords.every((queryWord) =>
    normalized
      .split(/[\s,.;:()/-]+/)
      .some((word) => word.startsWith(queryWord) || word.includes(queryWord))
  );
}

function renderOverlays() {
  if (!els.zocaloBoard) {
    return;
  }

  const focusSnapshot = captureZocaloFocus();
  const types = currentZocaloTypes();

  if (!types.length) {
    if (els.zocaloSubtabs) {
      els.zocaloSubtabs.innerHTML = "";
    }
    els.zocaloBoard.innerHTML = '<p class="zocalo-empty">No hay zocalos configurados.</p>';
    return;
  }

  if (els.zocaloSubtabs) {
    els.zocaloSubtabs.innerHTML = ZOCALO_PROFILES.map((profile) => `
      <button type="button" class="zocalo-subtab${profile.id === selectedZocaloTab ? " is-active" : ""}" data-zocalo-tab="${profile.id}">${profile.label}</button>
    `).join("");
  }

  els.zocaloBoard.innerHTML = "";
  const programCard = document.createElement("article");
  programCard.className = "zocalo-card program-name-card";
  const actions = document.createElement("div");
  actions.className = "program-name-actions";
  PROGRAM_NAME_INPUTS.filter((program) => ["60", "61"].includes(program.input)).forEach((program) => {
    const input = getInput(program.input);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preview-button";
    button.dataset.programNameInput = program.input;
    button.textContent = program.label;
    button.disabled = !input;
    button.classList.toggle(
      "is-live",
      state.overlays[PROGRAM_NAME_OVERLAY_SLOT]?.input === program.input
    );
    actions.appendChild(button);
  });
  actions.insertAdjacentHTML("beforeend", `
    <button type="button" class="select-format" data-program-name-off="1">OUT</button>
  `);

  programCard.appendChild(actions);
  els.zocaloBoard.appendChild(programCard);

  types.forEach((type) => {
    const input = getInput(type.input);
    const card = document.createElement("article");
    card.className = "zocalo-card";
    card.classList.toggle("is-two-lines", type.lines > 1);
    card.classList.toggle("is-missing", !input);

    const head = document.createElement("div");
    head.className = "zocalo-card-head";

    const headControls = document.createElement("div");
    headControls.className = "aula-head-controls";
    headControls.insertAdjacentHTML("beforeend", `
      <button type="button" class="preview-button" data-send-zocalo="${type.id}">IN</button>
      <button type="button" class="select-format" data-off-zocalo="${type.id}">OUT</button>
      <button type="button" class="air-button" data-clear-zocalo="${type.id}">Quitar</button>
    `);
    head.appendChild(headControls);

    const lineWrap = document.createElement("div");
    lineWrap.className = "aula-lines-wrap";
    lineWrap.classList.toggle("is-two-lines", type.lines > 1);
    zocaloLines(type).forEach((line) => {
      const key = zocaloKey(type.id, line);
      const allItems = zocaloLineItems(type, line, false);

      if (!selectedZocaloLineId(type.id, line) && allItems.length) {
        setSelectedZocaloLineId(type.id, line, allItems[0].id);
        zocaloDraft(type)[line] = allItems[0].text || "";
      }

      const selectedId = selectedZocaloLineId(type.id, line);
      const selectedItem = allItems.find((item) => item.id === selectedId);
      const selectedText = selectedItem ? selectedItem.text || "" : zocaloDraft(type)[line] || "";

      const lineBlock = document.createElement("section");
      lineBlock.className = "aula-line-box";

      const shell = document.createElement("div");
      shell.className = "aula-select-shell";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "aula-selected-title";
      toggle.dataset.zocaloToggle = type.id;
      toggle.dataset.zocaloToggleLine = line;
      const selectedLabel = document.createElement("span");
      selectedLabel.textContent = selectedText;
      const chevron = document.createElement("span");
      chevron.className = "chevron";
      chevron.textContent = "v";
      toggle.append(selectedLabel, chevron);

      const panel = document.createElement("div");
      panel.className = "aula-list-panel";
      panel.hidden = !zocaloPanels[key];
      const list = document.createElement("div");
      list.className = "aula-editable-list";

      if (!allItems.length) {
        const empty = document.createElement("p");
        empty.className = "zocalo-empty";
        empty.textContent = "Sin textos guardados.";
        list.appendChild(empty);
      }

      allItems.forEach((item, index) => {
        const rowWrap = document.createElement("div");
        rowWrap.className = "aula-row-wrap";
        const row = document.createElement("input");
        row.type = "text";
        row.className = "aula-row-input";
        row.classList.toggle("is-selected", item.id === selectedId);
        row.value = item.text || "";
        row.dataset.zocaloInlineType = type.id;
        row.dataset.zocaloInlineLine = line;
        row.dataset.zocaloInlineId = item.id;
        row.dataset.zocaloInlineIndex = String(index);
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "aula-delete-button";
        deleteButton.textContent = "−";
        deleteButton.title = "Eliminar este renglon";
        deleteButton.setAttribute("aria-label", "Eliminar este renglon");
        deleteButton.dataset.deleteZocaloType = type.id;
        deleteButton.dataset.deleteZocaloLine = line;
        deleteButton.dataset.deleteZocaloId = item.id;
        rowWrap.append(row, deleteButton);
        list.appendChild(rowWrap);
      });

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "aula-add-button";
      addButton.textContent = "+";
      addButton.dataset.addZocaloLine = line;
      addButton.dataset.zocaloType = type.id;
      panel.append(list, addButton);
      shell.append(toggle, panel);
      lineBlock.appendChild(shell);
      lineWrap.appendChild(lineBlock);
    });

    card.append(head, lineWrap);
    els.zocaloBoard.appendChild(card);
  });
  restoreZocaloFocus(focusSnapshot);
}

function loadZocaloLineItem(typeId, line, id, overrideText) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    return;
  }

  const item = zocaloLineItems(type, line).find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  const text = overrideText ?? item.text ?? "";
  selectedZocaloType = type.id;
  activeZocaloLine = line;
  setSelectedZocaloLineId(type.id, line, id);
  zocaloDraft(type)[line] = text;
  renderOverlays();
}

function addZocaloLine(typeId, line, text) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    return;
  }

  const item = {
    id: `z-${Date.now()}-${line}-${Math.random().toString(16).slice(2)}`,
    type: type.id,
    line,
    text: text || ""
  };
  const selectedId = selectedZocaloLineId(type.id, line);
  const selectedIndex = state.zocalos.findIndex((entry) => entry.id === selectedId && entry.type === type.id && entry.line === line);
  const firstTypeIndex = state.zocalos.findIndex((entry) => entry.type === type.id && entry.line === line);
  const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : firstTypeIndex >= 0 ? firstTypeIndex : state.zocalos.length;

  state.zocalos.splice(insertIndex, 0, item);
  setSelectedZocaloLineId(type.id, line, item.id);
  zocaloDraft(type)[line] = item.text;
  zocaloNewTexts[zocaloKey(type.id, line)] = "";
  zocaloPanels[zocaloKey(type.id, line)] = true;
  saveZocalos();
  renderOverlays();
  requestAnimationFrame(() => {
    const row = els.zocaloBoard?.querySelector(`[data-zocalo-inline-id="${item.id}"]`);
    row?.focus();
  });
  setLog("Renglon vacio agregado debajo del seleccionado.");
}

function updateZocaloLine(typeId, line, id, text) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type || id.startsWith("live-")) {
    return;
  }

  const existingIndex = state.zocalos.findIndex((entry) => entry.id === id && entry.type === type.id && entry.line === line);
  if (existingIndex < 0) {
    addZocaloLine(typeId, line, text);
    return;
  }

  state.zocalos[existingIndex] = { ...state.zocalos[existingIndex], text: text || "" };
  setSelectedZocaloLineId(type.id, line, id);
  zocaloDraft(type)[line] = text || "";
  saveZocalos();
  renderOverlays();
  setLog(text ? "Renglon actualizado en la lista." : "Renglon guardado vacio.");
}

function updateInlineZocaloText(typeId, line, id, text) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type || id.startsWith("live-")) {
    return;
  }

  const existingIndex = state.zocalos.findIndex((entry) => entry.id === id && entry.type === type.id && entry.line === line);
  if (existingIndex < 0) {
    return;
  }

  state.zocalos[existingIndex] = { ...state.zocalos[existingIndex], text: text || "" };
  if (selectedZocaloLineId(type.id, line) === id) {
    zocaloDraft(type)[line] = text || "";
  }
  saveZocalos();
}

function deleteZocaloLine(typeId, line, id) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  const items = type ? zocaloLineItems(type, line, false) : [];
  const lineIndex = items.findIndex((item) => item.id === id);
  const stateIndex = state.zocalos.findIndex((item) => item.id === id && item.type === typeId && item.line === line);
  if (!type || lineIndex < 0 || stateIndex < 0) {
    return;
  }

  const currentRow = els.zocaloBoard?.querySelector(`[data-zocalo-inline-id="${id}"]`);
  const savedScrollTop = currentRow?.closest(".aula-editable-list")?.scrollTop || 0;
  state.zocalos.splice(stateIndex, 1);
  const remaining = zocaloLineItems(type, line, false);
  const nextItem = remaining[Math.min(lineIndex, remaining.length - 1)];
  setSelectedZocaloLineId(typeId, line, nextItem?.id || "");
  zocaloDraft(type)[line] = nextItem?.text || "";
  zocaloPanels[zocaloKey(typeId, line)] = true;
  saveZocalos();
  renderOverlays();
  requestAnimationFrame(() => {
    const nextRow = nextItem
      ? els.zocaloBoard?.querySelector(`[data-zocalo-inline-id="${nextItem.id}"]`)
      : null;
    const list = nextRow?.closest(".aula-editable-list") || els.zocaloBoard?.querySelector(`[data-zocalo-list-type="${typeId}"][data-zocalo-list-line="${line}"]`);
    if (list) {
      list.scrollTop = savedScrollTop;
    }
    nextRow?.focus({ preventScroll: true });
  });
  setLog("Renglon eliminado; los siguientes subieron una posicion.");
}

function selectInlineZocalo(typeId, line, id, text) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    return;
  }

  selectedZocaloType = type.id;
  activeZocaloLine = line;
  setSelectedZocaloLineId(type.id, line, id);
  zocaloDraft(type)[line] = text || "";
}

function markInlineZocaloSelection(typeId, line, id, text) {
  const rows = els.zocaloBoard?.querySelectorAll(`[data-zocalo-inline-type="${typeId}"][data-zocalo-inline-line="${line}"]`) || [];
  rows.forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.zocaloInlineId === id);
  });

  const title = els.zocaloBoard?.querySelector(`[data-zocalo-toggle="${typeId}"][data-zocalo-toggle-line="${line}"] span:first-child`);
  if (title) {
    title.textContent = text || "";
  }
}

function selectedZocaloText(type, line) {
  const selectedId = selectedZocaloLineId(type.id, line);
  if (!selectedId) {
    return zocaloDraft(type)[line] || "";
  }

  const item = zocaloLineItems(type, line).find((entry) => entry.id === selectedId);
  return item ? item.text || "" : zocaloDraft(type)[line] || "";
}

function clearSelectedZocaloLine(type) {
  const line = activeZocaloLine || "top";
  const selectedId = selectedZocaloLineId(type.id, line);
  const existingIndex = state.zocalos.findIndex((entry) => entry.id === selectedId && entry.type === type.id && entry.line === line);

  if (existingIndex >= 0) {
    state.zocalos[existingIndex] = { ...state.zocalos[existingIndex], text: "" };
    saveZocalos();
  }

  zocaloDraft(type)[line] = "";

  const row = els.zocaloBoard?.querySelector(`[data-zocalo-inline-id="${selectedId}"]`);
  if (row) {
    row.value = "";
    row.classList.add("is-selected");
  }

  const title = els.zocaloBoard?.querySelector(`[data-zocalo-toggle="${type.id}"][data-zocalo-toggle-line="${line}"] span:first-child`);
  if (title) {
    title.textContent = "";
  }
}

async function sendZocalo(typeId) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    throw new Error("No hay zocalo seleccionado.");
  }

  const input = getInput(type.input);
  if (!input) {
    throw new Error("No encuentro ese zocalo en vMix.");
  }

  await callVmix({
    Function: "SetText",
    Input: type.input,
    SelectedName: type.fields[0] || firstTextField(input)?.name || "TextBlock1.Text",
    Value: selectedZocaloText(type, "top")
  });

  if (type.lines > 1) {
    await callVmix({
      Function: "SetText",
      Input: type.input,
      SelectedName: type.fields[1],
      Value: selectedZocaloText(type, "bottom")
    });
  }

  if (GRAPHICS_TO_PREVIEW) {
    await previewGraphicInput(type.input, zocaloOverlaySlot(type), type.label);
  } else {
    await callVmix({
      Function: `OverlayInput${zocaloOverlaySlot(type)}In`,
      Input: type.input
    });
    setLog(`Zocalo enviado: ${input.title}`);
  }
  await refreshState();
}

async function offZocalo(typeId) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    return;
  }

  await clearInputFromPreviewMultiview(type.input, type.label);
  await callVmix({
    Function: `OverlayInput${zocaloOverlaySlot(type)}Out`
  });
  delete previewOverlayInputsBySlot[zocaloOverlaySlot(type)];
  setLog(`${type.label}: fuera.`);
  await refreshState();
}

async function showProgramName(inputNumber) {
  const program = PROGRAM_NAME_INPUTS.find((item) => item.input === String(inputNumber));
  const input = getInput(inputNumber);

  if (!input) {
    setLog(`No encuentro nombre de programa input ${inputNumber}.`);
    return;
  }

  const activeProgram = state.overlays[PROGRAM_NAME_OVERLAY_SLOT];

  if (
    !GRAPHICS_TO_PREVIEW
    && activeProgram?.input === String(inputNumber)
    && !activeProgram.preview
  ) {
    await callVmix({
      Function: `OverlayInput${PROGRAM_NAME_OVERLAY_SLOT}Out`
    });
    setLog(`Nombre del programa: ${program?.label || input.title} fuera.`);
    await refreshState();
    return;
  }

  if (GRAPHICS_TO_PREVIEW) {
    await previewGraphicInput(inputNumber, PROGRAM_NAME_OVERLAY_SLOT, program?.label || "Nombre del programa");
  } else {
    await callVmix({
      Function: `OverlayInput${PROGRAM_NAME_OVERLAY_SLOT}In`,
      Input: inputNumber
    });
    setLog(`Nombre del programa: ${program?.label || input.title}`);
  }

  await refreshState();
}

async function offProgramName() {
  await clearAllOverlays("Nombre del programa");
  await refreshState();
}

async function clearZocalo(typeId) {
  const type = currentZocaloTypes().find((item) => item.id === typeId);
  if (!type) {
    return;
  }

  clearSelectedZocaloLine(type);
  zocaloDrafts[type.id] = { top: "", bottom: "" };
  await callVmix({
    Function: "SetText",
    Input: type.input,
    SelectedName: type.fields[0],
    Value: ""
  });
  if (type.lines > 1) {
    await callVmix({
      Function: "SetText",
      Input: type.input,
      SelectedName: type.fields[1],
      Value: ""
    });
  }
  await offZocalo(type.id);
}

async function callVmixSequence(steps) {
  for (const step of steps) {
    await callVmix(step);
  }
}

async function startTanda(inputNumber) {
  const input = getInput(inputNumber);

  if (!input) {
    setLog(`No encuentro la tanda input ${inputNumber}.`);
    return;
  }

  const steps = [
    { Function: "AudioBusOff", Input: LINE_AUDIO_INPUT, Value: "A" }
  ];

  TANDA_INPUTS.forEach((tandaInput) => {
    steps.push({ Function: "AudioBusOff", Input: tandaInput, Value: "A" });
  });

  steps.push(
    { Function: "AudioBusOn", Input: inputNumber, Value: "A" },
    { Function: "Restart", Input: inputNumber },
    { Function: `SetOutput${TANDAS_OUTPUT}`, Input: inputNumber, Value: "Input" },
    { Function: "Play", Input: inputNumber }
  );

  await callVmixSequence(steps);

  setLog(`Tanda: ${input.title}`);
  await refreshState();
}

async function returnToRadio() {
  const steps = [
    { Function: `SetOutput${TANDAS_OUTPUT}`, Value: "Output" },
    { Function: "AudioBusOn", Input: LINE_AUDIO_INPUT, Value: "A" }
  ];

  TANDA_INPUTS.forEach((inputNumber) => {
    steps.push({ Function: "Restart", Input: inputNumber });
    steps.push({ Function: "AudioBusOff", Input: inputNumber, Value: "A" });
  });

  await callVmixSequence(steps);
  setLog("Radio: Output 4 en Output, linea activa y tandas reseteadas/apagadas.");
  await refreshState();
}

async function resetInput(inputNumber) {
  const input = getInput(inputNumber);

  if (!input) {
    setLog(`No encuentro input ${inputNumber} para reset.`);
    return;
  }

  await callVmix({
    Function: "ResetInput",
    Input: inputNumber
  });
  setLog(`Reset: ${input.title}`);
  await refreshState();
}

async function runUtcOverlay(inputNumber, slot) {
  if (GRAPHICS_TO_PREVIEW) {
    await previewGraphicInput(inputNumber, slot, `Overlay ${slot}`);
    await refreshState();
    return;
  }

  await callVmix({
    Function: `OverlayInput${slot}`,
    Input: inputNumber
  });

  setLog(`Overlay ${slot}: ${getInput(inputNumber)?.title || `Input ${inputNumber}`}`);
  await refreshState();
}

async function turnOffUtcOverlay(slot) {
  if (GRAPHICS_TO_PREVIEW) {
    await clearPreviewGraphicInput(slot, null, `Overlay ${slot}`);
    await callVmix({
      Function: `OverlayInput${slot}Off`
    });
    await clearPreviewOverlaysIfSafe(`Overlay ${slot}`);
    await refreshState();
    return;
  }

  await callVmix({
    Function: `OverlayInput${slot}Out`
  });

  setLog(`Overlay ${slot}: OFF`);
  await refreshState();
}

async function selectLogo(logoPath) {
  localStorage.setItem(LOGO_STORAGE_KEY, logoPath);
  renderLogoList();

  await callVmix({
    Function: "SetImage",
    Input: LOGO_INPUT,
    SelectedName: LOGO_FIELD,
    Value: logoPath
  });

  if (GRAPHICS_TO_PREVIEW) {
    await previewGraphicInput(LOGO_INPUT, "1", "Logo");
  } else {
    setLog(`Logo seleccionado: ${logoLabel(logoPath)}`);
  }
  await refreshState();
}

async function applySelectedPhoto() {
  const photoPath = selectedPhotoPath();

  if (!photoPath) {
    setLog("No hay foto seleccionada.");
    return;
  }

  for (const target of PHOTO_TEMPLATE_INPUTS) {
    await callVmix({
      Function: "SetImage",
      Input: target.input,
      SelectedName: target.field,
      Value: photoPath
    });
  }

  setLog(`Foto aplicada: ${photoLabel(photoPath)}`);
  await refreshState();
}

async function showPhotoInMultiview() {
  await applySelectedPhoto();
  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: PHOTO_MULTIVIEW_INPUT,
    Value: `${PHOTO_MULTIVIEW_LAYER},${PHOTO_MULTIVIEW_SOURCE}`
  });
  setLog(`Foto en ${getInput(PHOTO_MULTIVIEW_INPUT)?.title || `Input ${PHOTO_MULTIVIEW_INPUT}`}`);
  await refreshState();
}

async function previewPanelistPhoto() {
  await applySelectedPhoto();
  await callVmix({
    Function: "PreviewInput",
    Input: PHOTO_OVERLAY_INPUT
  });
  setLog(`Previo: ${getInput(PHOTO_OVERLAY_INPUT)?.title || `Input ${PHOTO_OVERLAY_INPUT}`}`);
  await refreshState();
}

async function togglePhotoOverlay() {
  await applySelectedPhoto();
  await runUtcOverlay(PHOTO_OVERLAY_INPUT, PHOTO_OVERLAY_SLOT);
}

async function updateRadioMultiviewLayer(layer, sourceInput) {
  const layout = selectedRadioMultiviewLayout();
  const target = getInput(layout.input);

  if (!target || !layer || !sourceInput) {
    setLog("Selecciona un multiview y una fuente.");
    return;
  }

  await callVmix({
    Function: "SetMultiViewOverlay",
    Input: target.number,
    Value: `${layer},${sourceInput}`
  });

  setLog(`${target.title} layer ${layer}: ${getInput(sourceInput)?.title || `Input ${sourceInput}`}`);
  await refreshState();
}

async function previewRadioMultiviewLayout(layoutInput) {
  const layout = RADIO_MV_LAYOUTS.find((item) => item.input === layoutInput);
  const target = layout ? getInput(layout.input) : null;

  if (!target) {
    setLog("No encuentro ese multiview en vMix.");
    renderRadioMultiview();
    return;
  }

  localStorage.setItem(RADIO_MV_SELECTED_KEY, target.number);
  renderRadioMultiview();

  await callVmix({
    Function: "PreviewInput",
    Input: target.number
  });

  setLog(`Preview: ${target.title}`);
  await refreshState();
}

async function cutRadioMultiviewLayout(layoutInput) {
  const layout = RADIO_MV_LAYOUTS.find((item) => item.input === layoutInput);
  const target = layout ? getInput(layout.input) : null;

  if (!target) {
    setLog("No encuentro ese multiview en vMix.");
    renderRadioMultiview();
    return;
  }

  localStorage.setItem(RADIO_MV_SELECTED_KEY, target.number);
  renderRadioMultiview();

  await callVmix({
    Function: "CutDirect",
    Input: target.number
  });

  setLog(`Al aire: ${target.title}`);
  await refreshState();
}

function addPhotoPath() {
  const path = cleanFilePath(els.photoPathInput?.value || "");

  if (!path) {
    return;
  }

  const list = readPhotoList();
  list.push(path);
  savePhotoList(list);
  localStorage.setItem(PHOTO_SELECTED_KEY, String(list.length - 1));

  if (els.photoPathInput) {
    els.photoPathInput.value = "";
  }

  renderPhotoList();
}

function removeSelectedPhoto() {
  const list = readPhotoList();
  const index = selectedPhotoIndex(list);

  if (!list.length) {
    return;
  }

  list.splice(index, 1);
  savePhotoList(list);
  localStorage.setItem(PHOTO_SELECTED_KEY, String(Math.max(0, index - 1)));
  renderPhotoList();
}

async function refreshState() {
  if (isRefreshingState) {
    return;
  }

  isRefreshingState = true;

  try {
    const xmlText = await callVmix();
    parseInputs(xmlText);
    if (SYNC_PREVIEW_EXTERNAL3) {
      await syncPreviewExternal3();
    }
    renderMasterMeter();
    renderDirectCuts();
    renderMainZocaloButton();
    renderInputButtons();
    renderMultiviewControls();
    renderRadioTest();
    renderUtcOverlays();
    renderTandaButtons();
    renderProgramButtons();
    renderResetButtons();
    renderLogoList();
    renderPhotoList();
    renderRadioMultiview();
    setStatus(true, "Sistema en Linea");
  } catch (error) {
    setStatus(false, "vMix desconectado");
    setLog(error.message);
  } finally {
    isRefreshingState = false;
  }
}

async function refreshMasterMeter() {
  try {
    const xmlText = await callVmix();
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    const vmix = xml.querySelector("vmix");

    if (!vmix) {
      return;
    }

    parseMasterMeter(vmix);
    renderMasterMeter();
  } catch {
    state.master = { left: 0, right: 0, muted: false, volume: "100" };
    renderMasterMeter();
  }
}

async function syncPreviewExternal3() {
  if (!state.preview || state.preview === lastExternal3Preview) {
    return;
  }

  const previewToRoute = state.preview;
  lastExternal3Preview = previewToRoute;

  try {
    await callVmix({
      Function: "SetOutputExternal3",
      Input: previewToRoute,
      Value: "Input"
    });
    setLog("Preview fluido: External 3 sincronizado.");
  } catch (error) {
    lastExternal3Preview = "";
    setLog(error.message);
  }
}

document.addEventListener("click", async (event) => {
  const mainZocaloToggle = event.target.closest("[data-main-zocalo-toggle]");

  if (mainZocaloToggle) {
    mainZocaloToggle.disabled = true;

    try {
      await toggleMainZocalo();
    } catch (error) {
      setLog(error.message);
    } finally {
      mainZocaloToggle.disabled = false;
    }

    return;
  }

  const directCut = event.target.closest("[data-direct-cut]");

  if (directCut) {
    directCut.disabled = true;

    try {
      await runDirectCut(directCut.dataset.directCut);
    } catch (error) {
      setLog(error.message);
    } finally {
      directCut.disabled = false;
    }

    return;
  }

  const tabButton = event.target.closest("[data-tab]");

  if (tabButton) {
    setActiveTab(tabButton.dataset.tab);
    return;
  }

  const radioLayout = event.target.closest("[data-radio-layout]");

  if (radioLayout) {
    radioLayout.disabled = true;

    try {
      await selectRadioLayout(radioLayout.dataset.radioLayout);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioLayout.disabled = false;
    }

    return;
  }

  const zocaloTab = event.target.closest("[data-zocalo-tab]");

  if (zocaloTab) {
    zocaloProfiles[selectedZocaloTab] = state.zocalos;
    selectedZocaloTab = zocaloTab.dataset.zocaloTab;
    localStorage.setItem("lu2.zocalos.activeProfile", selectedZocaloTab);
    if (!Array.isArray(zocaloProfiles[selectedZocaloTab])) {
      zocaloProfiles[selectedZocaloTab] = (zocaloProfiles.general || state.zocalos).map((item) => ({ ...item }));
    }
    state.zocalos = zocaloProfiles[selectedZocaloTab];
    selectedZocaloLineIds = {};
    zocaloDrafts = {};
    zocaloNewTexts = {};
    zocaloPanels = {};
    selectedZocaloType = currentZocaloTypes()[0]?.id || "";
    renderOverlays();
    return;
  }

  const programNameButton = event.target.closest("[data-program-name-input]");

  if (programNameButton) {
    programNameButton.disabled = true;

    try {
      await showProgramName(programNameButton.dataset.programNameInput);
    } catch (error) {
      setLog(error.message);
    } finally {
      programNameButton.disabled = false;
    }

    return;
  }

  const programNameOff = event.target.closest("[data-program-name-off]");

  if (programNameOff) {
    programNameOff.disabled = true;

    try {
      await offProgramName();
    } catch (error) {
      setLog(error.message);
    } finally {
      programNameOff.disabled = false;
    }

    return;
  }

  const zocaloToggle = event.target.closest("[data-zocalo-toggle]");

  if (zocaloToggle) {
    const key = zocaloKey(zocaloToggle.dataset.zocaloToggle, zocaloToggle.dataset.zocaloToggleLine || "top");
    zocaloPanels[key] = !zocaloPanels[key];
    renderOverlays();
    return;
  }

  const inlineZocalo = event.target.closest("[data-zocalo-inline-type]");

  if (inlineZocalo) {
    selectInlineZocalo(inlineZocalo.dataset.zocaloInlineType, inlineZocalo.dataset.zocaloInlineLine, inlineZocalo.dataset.zocaloInlineId, inlineZocalo.value);
    markInlineZocaloSelection(inlineZocalo.dataset.zocaloInlineType, inlineZocalo.dataset.zocaloInlineLine, inlineZocalo.dataset.zocaloInlineId, inlineZocalo.value);
    return;
  }

  const deleteZocalo = event.target.closest("[data-delete-zocalo-id]");

  if (deleteZocalo) {
    deleteZocaloLine(deleteZocalo.dataset.deleteZocaloType, deleteZocalo.dataset.deleteZocaloLine, deleteZocalo.dataset.deleteZocaloId);
    return;
  }

  const addZocalo = event.target.closest("[data-add-zocalo-line]");

  if (addZocalo) {
    addZocaloLine(addZocalo.dataset.zocaloType, addZocalo.dataset.addZocaloLine, "");
    return;
  }

  const clearZocaloButton = event.target.closest("[data-clear-zocalo]");

  if (clearZocaloButton) {
    clearZocaloButton.disabled = true;

    try {
      await clearZocalo(clearZocaloButton.dataset.clearZocalo);
    } catch (error) {
      setLog(error.message);
    } finally {
      clearZocaloButton.disabled = false;
    }

    return;
  }

  const offZocaloButton = event.target.closest("[data-off-zocalo]");

  if (offZocaloButton) {
    offZocaloButton.disabled = true;

    try {
      await offZocalo(offZocaloButton.dataset.offZocalo);
    } catch (error) {
      setLog(error.message);
    } finally {
      offZocaloButton.disabled = false;
    }

    return;
  }

  const zocaloSend = event.target.closest("[data-send-zocalo]");

  if (zocaloSend) {
    zocaloSend.disabled = true;

    try {
      await sendZocalo(zocaloSend.dataset.sendZocalo);
    } catch (error) {
      setLog(error.message);
    } finally {
      zocaloSend.disabled = false;
    }

    return;
  }

  const tandaStart = event.target.closest("[data-tanda-start]");

  if (tandaStart) {
    tandaStart.disabled = true;

    try {
      await startTanda(tandaStart.dataset.tandaStart);
    } catch (error) {
      setLog(error.message);
    } finally {
      tandaStart.disabled = false;
    }

    return;
  }

  const radioReturn = event.target.closest("[data-radio-return]");

  if (radioReturn) {
    radioReturn.disabled = true;

    try {
      await returnToRadio();
    } catch (error) {
      setLog(error.message);
    } finally {
      radioReturn.disabled = false;
    }

    return;
  }

  const resetButton = event.target.closest("[data-reset-input]");

  if (resetButton) {
    resetButton.disabled = true;

    try {
      await resetInput(resetButton.dataset.resetInput);
    } catch (error) {
      setLog(error.message);
    } finally {
      resetButton.disabled = false;
    }

    return;
  }

  const utcOverlay = event.target.closest("[data-utc-overlay]");

  if (utcOverlay) {
    utcOverlay.disabled = true;

    try {
      await runUtcOverlay(utcOverlay.dataset.utcOverlay, utcOverlay.dataset.utcSlot);
    } catch (error) {
      setLog(error.message);
    } finally {
      utcOverlay.disabled = false;
    }

    return;
  }

  const logoItem = event.target.closest("[data-logo-path]");

  if (logoItem) {
    logoItem.disabled = true;

    try {
      await selectLogo(logoItem.dataset.logoPath);
    } catch (error) {
      setLog(error.message);
    } finally {
      logoItem.disabled = false;
    }

    return;
  }

  const photoItem = event.target.closest("[data-photo-index]");

  if (photoItem) {
    localStorage.setItem(PHOTO_SELECTED_KEY, photoItem.dataset.photoIndex);
    renderPhotoList();

    try {
      await previewPanelistPhoto();
    } catch (error) {
      setLog(error.message);
    }

    return;
  }

  if (event.target.closest("#photoAddButton")) {
    addPhotoPath();
    return;
  }

  const photoAction = event.target.closest("[data-photo-action]");

  if (photoAction) {
    photoAction.disabled = true;

    try {
      const action = photoAction.dataset.photoAction;

      if (action === "apply") {
        await applySelectedPhoto();
      } else if (action === "preview") {
        await previewPanelistPhoto();
      } else if (action === "multiview") {
        await showPhotoInMultiview();
      } else if (action === "overlay") {
        await togglePhotoOverlay();
      } else if (action === "remove") {
        removeSelectedPhoto();
      }
    } catch (error) {
      setLog(error.message);
    } finally {
      photoAction.disabled = false;
    }

    return;
  }

  const radioMvPreview = event.target.closest("[data-radio-mv-preview]");

  if (radioMvPreview) {
    radioMvPreview.disabled = true;

    try {
      await previewRadioMultiviewLayout(radioMvPreview.dataset.radioMvPreview);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvPreview.disabled = false;
    }

    return;
  }

  const radioMvCut = event.target.closest("[data-radio-mv-cut]");

  if (radioMvCut) {
    radioMvCut.disabled = true;

    try {
      await cutRadioMultiviewLayout(radioMvCut.dataset.radioMvCut);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvCut.disabled = false;
    }

    return;
  }

  const utcOverlayOff = event.target.closest("[data-utc-overlay-off]");

  if (utcOverlayOff) {
    utcOverlayOff.disabled = true;

    try {
      await turnOffUtcOverlay(utcOverlayOff.dataset.utcOverlayOff);
    } catch (error) {
      setLog(error.message);
    } finally {
      utcOverlayOff.disabled = false;
    }

    return;
  }

  const button = event.target.closest("[data-function]");

  if (!button) {
    return;
  }

  button.disabled = true;

  try {
    await runFunction(button.dataset.function, button.dataset.input);
  } catch (error) {
    setLog(error.message);
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("input", (event) => {
  const zocaloSearch = event.target.closest("[data-zocalo-search-type]");

  if (zocaloSearch) {
    zocaloSearchTerms[zocaloKey(zocaloSearch.dataset.zocaloSearchType, zocaloSearch.dataset.zocaloSearchLine)] = zocaloSearch.value;
    renderOverlays();
    return;
  }

  const inline = event.target.closest("[data-zocalo-inline-type]");

  if (inline) {
    selectInlineZocalo(inline.dataset.zocaloInlineType, inline.dataset.zocaloInlineLine, inline.dataset.zocaloInlineId, inline.value);
    updateInlineZocaloText(inline.dataset.zocaloInlineType, inline.dataset.zocaloInlineLine, inline.dataset.zocaloInlineId, inline.value);
    markInlineZocaloSelection(inline.dataset.zocaloInlineType, inline.dataset.zocaloInlineLine, inline.dataset.zocaloInlineId, inline.value);
  }
});

document.addEventListener("keydown", async (event) => {
  const photoInput = event.target.closest("#photoPathInput");

  if (photoInput && event.key === "Enter") {
    event.preventDefault();
    addPhotoPath();
    return;
  }

  const inline = event.target.closest("[data-zocalo-inline-type]");

  if (inline && event.key === "Enter") {
    event.preventDefault();
    updateZocaloLine(inline.dataset.zocaloInlineType, inline.dataset.zocaloInlineLine, inline.dataset.zocaloInlineId, inline.value);
    inline.blur();
  }
});

document.addEventListener("change", async (event) => {
  const zocaloSlot = event.target.closest("[data-zocalo-slot-type]");

  if (zocaloSlot) {
    setZocaloOverlaySlot(zocaloSlot.dataset.zocaloSlotType, zocaloSlot.value);
    return;
  }

  const radioMvLayer = event.target.closest("[data-radio-mv-layer]");

  if (radioMvLayer) {
    radioMvLayer.disabled = true;

    try {
      await updateRadioMultiviewLayer(radioMvLayer.dataset.radioMvLayer, radioMvLayer.value);
    } catch (error) {
      setLog(error.message);
    } finally {
      radioMvLayer.disabled = false;
      radioMvLayer.blur();
      renderRadioMultiview();
    }

    return;
  }

  const multiviewSelect = event.target.closest("[data-multiview-position]");

  if (multiviewSelect) {
    multiviewSelect.disabled = true;

    try {
      await updateMultiviewPosition(Number(multiviewSelect.dataset.multiviewPosition), multiviewSelect.value);
    } catch (error) {
      setLog(error.message);
    } finally {
      multiviewSelect.disabled = false;
    }

    return;
  }

  const radioMultiviewSelect = event.target.closest("[data-radio-position]");

  if (!radioMultiviewSelect) {
    return;
  }

  radioMultiviewSelect.disabled = true;

  try {
    await updateRadioMultiviewPosition(Number(radioMultiviewSelect.dataset.radioPosition), radioMultiviewSelect.value);
  } catch (error) {
    setLog(error.message);
  } finally {
    radioMultiviewSelect.disabled = false;
  }
});

let functionKeyBusy = false;

document.addEventListener("keydown", async (event) => {
  const match = event.key.match(/^F([1-9]|10)$/);
  const target = event.target;
  const isEditing = target instanceof HTMLElement && (
    target.matches("input, textarea, select") || target.isContentEditable
  );

  if (!match || isEditing || event.repeat) {
    return;
  }

  const direct = DIRECT_CUTS[Number(match[1]) - 1];

  if (!direct || functionKeyBusy) {
    return;
  }

  event.preventDefault();
  functionKeyBusy = true;

  try {
    await runDirectCut(direct.input);
  } catch (error) {
    setLog(error.message);
  } finally {
    functionKeyBusy = false;
  }
});

loadMonitorConfig();
clearClockWeatherInput().catch((error) => setLog(error.message || "No pude apagar hora y temperatura."));
refreshState();
setInterval(refreshState, 500);
setInterval(refreshDirectSnapshots, 1000);

















