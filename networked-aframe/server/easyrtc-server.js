'use strict';

// Load required modules
const http = require("http");                 // http server core module
const path = require("path");
const express = require("express");           // web framework external module
const easyrtc = require("open-easyrtc");      // EasyRTC external module
const fs = require('fs');

// Get port dynamically.
const args = process.argv;

// Get port from arguments or default to 5832
const port = args[2] ? args[2] : 5832;

// Turn servers are needed for mobile devices in public networks
let rawdata = fs.readFileSync(path.resolve(__dirname) + '/keys.json');
let myIceServers = JSON.parse(rawdata);

// Set process name
process.title = "networked-aframe-server-" +port;

// Setup and configure Express http server.
const app = express();

app.use(express.static(path.resolve(__dirname, "..", "out")));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// Serve the example and build the bundle in development.
if (process.env.NODE_ENV === "development") {
    const webpackMiddleware = require("webpack-dev-middleware");
    const webpack = require("webpack");
    const config = require("../webpack.config");

    app.use(
        webpackMiddleware(webpack(config), {
            publicPath: "/"
        })
    );
}

// Start Express http server
const webServer = http.createServer(app);

const socketServer = require("socket.io")(webServer, {
    origins: [
        'http://localhost:'+port,
        'https://vrodos-multiplaying.iti.gr/',
        'https://vrexpo-multi.iti.gr/',
        '*:*'
    ],
});


easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", (socket, easyrtcid, msg, socketCallback, callback) => {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, (err, connectionObj) => {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", (connectionObj, roomName, roomParameter, callback) => {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
easyrtc.listen(app, socketServer, null, (err, rtcRef) => {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});


// Listen on port
webServer.listen(parseInt(port), () => {
    console.log("listening on port:" + port);
});


