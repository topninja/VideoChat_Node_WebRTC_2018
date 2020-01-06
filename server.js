'use strict';

const express = require('express');
const app = express();


const os = require('os');
const nodeStatic = require('node-static');
const fs = require('fs');

const port = 31000;

var options = {
    key: fs.readFileSync('../ssl/keys/b80c6_3a205_252e417ab3abdab7e84aec8cbcf5e2e6.key'),
    cert: fs.readFileSync('../ssl/certs/theelandating_com_b80c6_3a205_1581267980_1606b2673cfee5a197b2172a70faf554.crt')
};

const https = require('https');
var httpsServer = https.createServer(options, app);

const io = require('socket.io').listen(httpsServer);

// var fileServer = new(nodeStatic.Server)();
// var app = http.createServer(function(req, res) {
//     fileServer.serve(req, res);
//   }).listen(8080);
  

let sockets = [];
let rooms = [];


app.set('view engine', 'ejs');

app.set('views', 'views');
app.use(express.static('public'));

// index page
app.get('/', function (req, res) {
    res.render('index');
});

// text chat page
app.get('/text', function (req, res) {
    res.render('text');
});

// video chat page
app.get('/video', function(req, res) {
    res.render('video');
});

// socket settings
io.on('connection', function (socket) { // a new connection

    let nonFilterAddress = socket.handshake.address;

    sockets.push(socket);
    console.log("connected" + nonFilterAddress);

    let getRoomWithLoneUser = () => {
        for (let room of rooms) {
            if (room.users.length === 1) {
                return room;
            }
        }
        return null;
    };

    let generateRandomRoomId = () => {
        return `room_${Date.now()}`;
    };

    let createRoom = () => {
        return {
            id: generateRandomRoomId(),
            users: []
        };
    };

    let room = getRoomWithLoneUser();
    if (room === null) {
        room = createRoom();
        room.users.push(socket);
        rooms.push(room);

        socket.join(room.id);

        socket.emit('wait');
    } else {
        room.users.push(socket);

        socket.join(room.id);

        io.to(room.id).emit('start_chat');
    }

    socket.on('send_message', function (data) {
        io.to(room.id).emit('broadcast_message', data);
    });

    // convenience function to log server messages on the client
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function(message) {
        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);

        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
        socket.join(room);
        log('Client ID ' + socket.id + ' created room ' + room);
        socket.emit('created', room, socket.id);

        } else if (numClients === 1) {
        log('Client ID ' + socket.id + ' joined room ' + room);
        io.sockets.in(room).emit('join', room);
        socket.join(room);
        socket.emit('joined', room, socket.id);
        io.sockets.in(room).emit('ready');
        } else { // max two clients
        socket.emit('full', room);
        }
    });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
        ifaces[dev].forEach(function(details) {
            if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
            socket.emit('ipaddr', details.address);
            }
        });
        }
    });

    socket.on('bye', function(){
        console.log('received bye');
    });

});


httpsServer.listen(port, () => console.log(`--App is listening on port ${port}!`));

