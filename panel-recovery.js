const http = require("http");
const path = require("path");
const { execFile, spawn } = require("child_process");

const RECOVERY_PORT = Number(process.env.PANEL_RECOVERY_PORT || 3010);
const PANEL_PORT = Number(process.env.PORT || 3000);
const PANEL_ROOT = __dirname;
const NODE_PATH = path.join(PANEL_ROOT, "runtime", "node.exe");
let restartInProgress = false;

function isAllowedAddress(address = "") {
  const normalized = address.replace(/^::ffff:/, "");
  return normalized === "127.0.0.1"
    || normalized === "::1"
    || normalized.startsWith("172.31.146.");
}

function execFileAsync(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function findPanelPid() {
  const output = await execFileAsync("netstat.exe", ["-ano", "-p", "tcp"]);
  const line = output.split(/\r?\n/).find((item) => {
    const columns = item.trim().split(/\s+/);
    return columns.length >= 5
      && columns[1]?.endsWith(`:${PANEL_PORT}`)
      && columns[3] === "LISTENING";
  });
  return line ? Number(line.trim().split(/\s+/).at(-1)) : null;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function panelResponds() {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${PANEL_PORT}/`, { timeout: 1500 }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

async function restartPanel() {
  const oldPid = await findPanelPid();

  if (oldPid) {
    try {
      await execFileAsync("taskkill.exe", ["/PID", String(oldPid), "/T", "/F"]);
    } catch (error) {
      if (await findPanelPid()) {
        throw new Error(`No pude cerrar el panel PID ${oldPid}.`);
      }
    }
  }

  for (let attempt = 0; attempt < 20 && await findPanelPid(); attempt += 1) {
    await wait(250);
  }

  const child = spawn(NODE_PATH, ["server.js"], {
    cwd: PANEL_ROOT,
    detached: true,
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT: String(PANEL_PORT),
      VMIX_HOST: "127.0.0.1",
      VMIX_PORT: "8088",
      ENABLE_REMOTE_MONITORS: "1"
    }
  });
  child.unref();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    if (await panelResponds()) {
      return { ok: true, previousPid: oldPid, pid: await findPanelPid() };
    }
  }

  throw new Error("El panel no respondió después del reinicio.");
}

function reply(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (!isAllowedAddress(req.socket.remoteAddress)) {
    reply(res, 403, { ok: false, error: "Acceso permitido sólo desde la red local." });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    reply(res, 200, { ok: true, panelResponds: await panelResponds(), restartInProgress });
    return;
  }

  if (req.method === "POST" && req.url === "/restart") {
    if (restartInProgress) {
      reply(res, 409, { ok: false, error: "Ya hay un reinicio en curso." });
      return;
    }

    restartInProgress = true;
    try {
      reply(res, 200, await restartPanel());
    } catch (error) {
      reply(res, 500, { ok: false, error: error.message });
    } finally {
      restartInProgress = false;
    }
    return;
  }

  reply(res, 404, { ok: false, error: "Ruta no encontrada." });
});

server.listen(RECOVERY_PORT, "0.0.0.0", () => {
  console.log(`Recuperador Panel LU2: puerto ${RECOVERY_PORT}`);
});
