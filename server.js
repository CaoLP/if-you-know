/**
 * Created by caolp on 4/21/2016.
 */
var io = require('socket.io');
var http = require('http');
var crypto = require('crypto');

var server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});
// Tell Socket.io to pay attention
io = io.listen(server);

// Tell HTTP Server to begin listening for connections on port 3250
server.listen(3003);

// Sockets object to save game code -> socked associations
var socketCodes = {};

console.log('Server running at http://APP_PRIVATE_IP_ADDRESS:8080/');
// When a client connects...
io.sockets.on('connection', function (socket) {
    // Confirm the connection
    socket.emit("welcome", {});

    // Receive the client device type
    socket.on("device", function (device) {
        // if client is a browser game
        if (device.type == "game") {
            if (device.gameCode) {
                // if game code is valid...
                if (device.gameCode in socketCodes) {
                    // save the game code for controller commands
                    socket.gameCode = device.gameCode;

                    // initialize the controller
                    socket.emit("connected", {});

                    // start the game
                    socketCodes[device.gameCode].emit("connected", {});
                }
                // else game code is invalid,
                //  send fail message and disconnect
                else {
                    socket.emit("fail", {});
                    socket.disconnect();
                }
            } else {
                // Generate a code
                var gameCode = crypto.randomBytes(3).toString('hex');

                // Ensure uniqueness
                while (gameCode in socketCodes) {
                    gameCode = crypto.randomBytes(3).toString('hex');
                }

                // Store game code -> socket association
                socketCodes[gameCode] = io.sockets.sockets[socket.id];
                socket.gameCode = gameCode;

                // Tell game client to initialize
                //  and show the game code to the user
                socket.emit("initialize", gameCode);
            }

        } else if (device.type == "controller") {
            // if game code is valid...
            if (device.gameCode in socketCodes) {
                // save the game code for controller commands
                socket.gameCode = device.gameCode;

                // initialize the controller
                socket.emit("connected", {});

                // start the game
                socketCodes[device.gameCode].emit("connected", {});
            }
            // else game code is invalid,
            //  send fail message and disconnect
            else {
                socket.emit("fail", {});
                socket.disconnect();
            }
        }
    });
    // send answer to game
    socket.on("answer", function (data) {

        if (socket.gameCode && socket.gameCode in socketCodes) {
            console.log(data.answer);
            socketCodes[socket.gameCode].emit("answer", data.answer);
        }
    });
    // send question id to game
    socket.on("question", function (data) {
        console.log(data.question);
        if (socket.gameCode && socket.gameCode in socketCodes) {
            socketCodes[socket.gameCode].emit("question", data.question);
        }
    });
    // send question id to game
    socket.on("closebox", function (data) {
        console.log(data.closebox);
        if (socket.gameCode && socket.gameCode in socketCodes) {
            socketCodes[socket.gameCode].emit("closebox", data.closebox);
        }
    });
});
// When a client disconnects...
io.sockets.on('disconnect', function (socket) {
    console.log("end");
});