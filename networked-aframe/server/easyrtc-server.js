// Load required modules
const http = require("http");                 // http server core module

const path = require("path");
const express = require("express");           // web framework external module
const socketIo = require("socket.io");        // web socket external module
const easyrtc = require("open-easyrtc");      // EasyRTC external module

// Set process name
process.title = "networked-aframe-server";

// Get port or default to 5832
const port = process.env.PORT || 5832;

// Setup and configure Express http server.
const app = express();

// var fs = require('fs');
// var https_options = {
//     key: fs.readFileSync("/path/to/private.key"),
//     cert: fs.readFileSync("/path/to/your_domain_name.crt"),
//     ca: [
//         fs.readFileSync('path/to/CA_root.crt'),
//         fs.readFileSync('path/to/ca_bundle_certificate.crt')
//     ]
// };






// var corsOptions = {
//     origin: '*',
//     optionsSuccessStatus: 200,
// }
// app.use(cors(corsOptions));
// app.use(express.json());





app.use(express.static(path.resolve(__dirname, "..", "examples")));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
//
// app.get('/', function(req, res, next) {
//     // Handle the get for this route
// });
//
// app.post('/', function(req, res, next) {
//     // Handle the post for this route
// });

//
// var whitelist = ['http://127.0.0.1/'];
// var corsOptions = {
//     origin: function (origin, callback) {
//         if (whitelist.indexOf(origin) !== -1) {
//             callback(null, true)
//         } else {
//             callback(new Error('Not allowed by CORS'))
//         }
//     }
// }
//
// app.get('/products/:id', cors(corsOptions), function (req, res, next) {
//     res.json({msg: 'This is CORS-enabled for a whitelisted domain.'})
// })

// app.options('*', (req, res) => {
//     res.writeHead(200, '', {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'OPTIONS',
//     }).end();
// });


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

// Start Socket.io so it attaches itself to Express server
const socketServer = socketIo.listen(webServer, {"log level": 1});
const myIceServers = [
    {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
    }

     // Turn servers are needed for mobile devices in public networks !!!!


    // {"urls":"stun:openrelay.metered.ca:80"},
    // {"urls":"stun.nextcloud.com:443"}
  //  {"urls":"stun:stun1.l.google.com:19302"}
  //{"urls":"stun:stun2.l.google.com:19302"},
  // {
  //   "urls":"turn:[ADDRESS]:[PORT]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // },
  // {
  //   "urls":"turn:[ADDRESS]:[PORT][?transport=tcp]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // }
];
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
webServer.listen(port, () => {
    //console.log('CORS-enabled web server listening on port ' + port);
    console.log("listening on port:" + port);
});

