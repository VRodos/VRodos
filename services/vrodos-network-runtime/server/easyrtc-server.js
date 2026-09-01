// VRodos network runtime server for compiled A-Frame scenes.
const http = require("http");
const path = require("path");
const express = require("express");
const socketIo = require("socket.io");
const easyrtc = require("open-easyrtc");
const fs = require("fs");
const servicePackage = require("../package.json");

const DEFAULT_PORT = 5832;
const port = Number.parseInt(process.argv[2] || process.env.PORT || DEFAULT_PORT, 10) || DEFAULT_PORT;
const pluginRoot = path.resolve(__dirname, "..", "..", "..");
const publishedRoot = path.resolve(
  process.env.VRODOS_PUBLISHED_ROOT || path.resolve(pluginRoot, "..", "..", "uploads", "vrodos", "published")
);

process.title = "vrodos-network-runtime-" + port;

function normalizeIceServersConfig(value, source) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.iceServers)) {
    return value.iceServers;
  }

  console.warn("[VRodos network runtime] Ignoring invalid ICE server config from " + source + ".");
  return null;
}

function parseIceServersJson(raw, source) {
  try {
    return normalizeIceServersConfig(JSON.parse(raw), source);
  } catch (error) {
    console.warn("[VRodos network runtime] Failed to parse ICE server config from " + source + ".", error.message);
    return null;
  }
}

function loadIceServers() {
  const envConfig = process.env.VRODOS_ICE_SERVERS_JSON;
  if (envConfig) {
    const iceServers = parseIceServersJson(envConfig, "VRODOS_ICE_SERVERS_JSON");
    if (iceServers) {
      return iceServers;
    }
  }

  const configPaths = [path.resolve(__dirname, "keys.json")];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    const iceServers = parseIceServersJson(fs.readFileSync(configPath, "utf8"), configPath);
    if (iceServers) {
      return iceServers;
    }
  }

  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ];
}

const app = express();

app.use(function (_req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function packageVersion(packageName) {
  try {
    return require(packageName + "/package.json").version || "unknown";
  } catch (_error) {
    return "unknown";
  }
}

app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: servicePackage.name,
    versions: {
      service: servicePackage.version,
      socketIo: packageVersion("socket.io"),
      easyRtc: packageVersion("open-easyrtc")
    }
  });
});

// Generated clients and their content-addressed media are the only mutable files served here.
app.use("/vrodos-published", express.static(publishedRoot, { fallthrough: false, index: false }));
app.use("/wp-content/uploads/vrodos/published", express.static(publishedRoot, { fallthrough: false, index: false }));

// Preserve generated HTML paths while serving the canonical VRodos asset layout.
app.use("/dist", express.static(path.join(pluginRoot, "assets", "vendor", "networked-aframe", "dist")));
app.use("/js", express.static(path.join(pluginRoot, "assets", "js", "runtime")));
app.use("/css", express.static(path.join(pluginRoot, "assets", "css", "runtime")));
app.use("/img", express.static(path.join(pluginRoot, "assets", "images", "runtime", "img")));
app.use("/media/img", express.static(path.join(pluginRoot, "assets", "images", "runtime", "img")));
app.use("/media", express.static(path.join(pluginRoot, "assets", "models", "runtime")));
app.use("/media", express.static(path.join(pluginRoot, "assets", "media")));
app.use("/assets", express.static(path.join(pluginRoot, "assets")));
app.use(express.static(path.join(pluginRoot, "assets")));
app.use("/wp-content/plugins/VRodos/assets", express.static(path.join(pluginRoot, "assets"), { index: false }));

const webServer = http.createServer(app);
const socketServer = socketIo(webServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

easyrtc.setOption("appIceServers", loadIceServers());
easyrtc.setOption("logLevel", process.env.VRODOS_NETWORK_LOG_LEVEL || "debug");
easyrtc.setOption("demosEnable", false);

easyrtc.events.on("easyrtcAuth", (socket, easyrtcid, msg, socketCallback, callback) => {
  easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, (error, connectionObj) => {
    if (error || !msg.msgData || !msg.msgData.credential || !connectionObj) {
      callback(error, connectionObj);
      return;
    }

    connectionObj.setField("credential", msg.msgData.credential, { isShared: false });
    callback(error, connectionObj);
  });
});

easyrtc.listen(app, socketServer, null, (error, rtcRef) => {
  if (error) {
    console.error("[VRodos network runtime] EasyRTC failed to start.", error);
    return;
  }

  rtcRef.events.on("roomCreate", (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
  });
});

webServer.listen(port, () => {
  console.log("[VRodos network runtime] Listening on port " + port + ".");
});
