# VRodos Network Runtime

This service hosts generated networked A-Frame clients and provides the EasyRTC/Socket.IO signaling used by the patched Networked-Aframe browser bundle.

## Local Start

```bash
cd services/vrodos-network-runtime
npm install
npm start
```

The default port is `5832`. A different port can be passed as the first argument:

```bash
node server/easyrtc-server.js 5833
```

## ICE/TURN Config

`server/keys.json` is intentionally ignored because it can contain TURN credentials. Use `server/keys.example.json` as the shape, or set `VRODOS_ICE_SERVERS_JSON` to a JSON array or an object with an `iceServers` array.
