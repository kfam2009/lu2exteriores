const http = require("http");
const https = require("https");

const PANEL_BASE_URL = (process.env.PANEL_BASE_URL || "").replace(/\/+$/, "");
const VMIX_BRIDGE_SECRET = process.env.VMIX_BRIDGE_SECRET || "";
const VMIX_HOST = process.env.VMIX_HOST || "127.0.0.1";
const VMIX_PORT = Number(process.env.VMIX_PORT || 8088);
const POLL_DELAY_MS = 1200;

if (!PANEL_BASE_URL || !VMIX_BRIDGE_SECRET) {
  console.error("Faltan PANEL_BASE_URL y/o VMIX_BRIDGE_SECRET.");
  console.error("Ejemplo:");
  console.error("  set PANEL_BASE_URL=https://panelgo-cloud.onrender.com/lu2exteriores");
  console.error("  set VMIX_BRIDGE_SECRET=una-clave-larga");
  console.error("  node bridge-client.js");
  process.exit(1);
}

function requestBuffer(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;
    const req = transport.request(
      target,
      {
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeout || 30000
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.on("error", reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function bridgeUrl(path) {
  return `${PANEL_BASE_URL}${path}${path.includes("?") ? "&" : "?"}secret=${encodeURIComponent(VMIX_BRIDGE_SECRET)}`;
}

async function callVmix(commandPath) {
  const vmixUrl = new URL(commandPath, `http://${VMIX_HOST}:${VMIX_PORT}`);
  return requestBuffer(vmixUrl.toString(), { timeout: 8000 });
}

async function postResult(result) {
  const body = JSON.stringify(result);
  await requestBuffer(
    bridgeUrl("/bridge/result"),
    {
      method: "POST",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    body
  );
}

async function pollOnce() {
  const response = await requestBuffer(bridgeUrl("/bridge/poll"), { method: "POST", timeout: 30000 });

  if (response.statusCode === 204) {
    return;
  }

  if (response.statusCode !== 200) {
    throw new Error(`Panel respondio HTTP ${response.statusCode}: ${response.body.toString("utf8")}`);
  }

  const command = JSON.parse(response.body.toString("utf8"));

  try {
    const vmixResponse = await callVmix(command.path);
    await postResult({
      id: command.id,
      statusCode: vmixResponse.statusCode,
      contentType: vmixResponse.headers["content-type"] || "text/xml; charset=utf-8",
      bodyBase64: vmixResponse.body.toString("base64")
    });
  } catch (error) {
    await postResult({
      id: command.id,
      error: error.message || "No pude conectar con vMix"
    });
  }
}

async function run() {
  console.log(`Bridge LU2 conectado a ${PANEL_BASE_URL}`);
  console.log(`vMix local: http://${VMIX_HOST}:${VMIX_PORT}/api/`);

  while (true) {
    try {
      await pollOnce();
    } catch (error) {
      console.error(`[bridge] ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
    }
  }
}

run();
