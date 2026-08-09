const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7 
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const rooms = {};

// Générer un code à 12 chiffres
function generate12DigitCode() {
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

io.on('connection', (socket) => {

    // Créer une partie
    socket.on('create_room', (data) => {
        const roomCode = generate12DigitCode();
        rooms[roomCode] = {
            host: socket.id,
            timer: 120,
            interval: null,
            players: {}
        };

        socket.join(roomCode);
        socket.roomCode = roomCode;

        rooms[roomCode].players[socket.id] = {
            pseudo: data.pseudo,
            avatar: data.avatar,
            role: data.role || 'Souris',
            lat: null,
            lng: null
        };

        // Lancer le timer de 120 secondes
        rooms[roomCode].interval = setInterval(() => {
            if (rooms[roomCode]) {
                rooms[roomCode].timer--;
                io.to(roomCode).emit('timer_update', rooms[roomCode].timer);

                if (rooms[roomCode].timer <= 0) {
                    clearInterval(rooms[roomCode].interval);
                    io.to(roomCode).emit('start_game_auto');
                }
            }
        }, 1000);

        socket.emit('room_created', { roomCode, isHost: true });
        io.to(roomCode).emit('players_update', rooms[roomCode].players);
    });

    // Rejoindre une partie
    socket.on('join_room', (data) => {
        const room = rooms[data.roomCode];
        if (!room) {
            return socket.emit('error_msg', 'Code de partie invalide.');
        }

        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;

        room.players[socket.id] = {
            pseudo: data.pseudo,
            avatar: data.avatar,
            role: data.role || 'Souris',
            lat: null,
            lng: null
        };

        socket.emit('room_joined', { roomCode: data.roomCode, timer: room.timer, isHost: false });
        io.to(data.roomCode).emit('players_update', room.players);
    });

    // Changer de camp (Chat / Souris)
    socket.on('change_role', (role) => {
        const room = rooms[socket.roomCode];
        if (room && room.players[socket.id]) {
            room.players[socket.id].role = role;
            io.to(socket.roomCode).emit('players_update', room.players);
        }
    });

    // Lancer la partie avant la fin du chrono
    socket.on('launch_game', () => {
        const room = rooms[socket.roomCode];
        if (room) {
            if (room.interval) clearInterval(room.interval);
            io.to(socket.roomCode).emit('game_started');
        }
    });

    // Mise à jour position GPS
    socket.on('update_position', (data) => {
        const room = rooms[socket.roomCode];
        if (room && room.players[socket.id]) {
            room.players[socket.id].lat = data.lat;
            room.players[socket.id].lng = data.lng;

            io.to(socket.roomCode).emit('player_moved', {
                id: socket.id,
                lat: data.lat,
                lng: data.lng,
                pseudo: room.players[socket.id].pseudo,
                avatar: room.players[socket.id].avatar,
                role: room.players[socket.id].role
            });
        }
    });

    // Quitter
    socket.on('disconnect', () => {
        const room = rooms[socket.roomCode];
        if (room) {
            delete room.players[socket.id];
            io.to(socket.roomCode).emit('player_left', socket.id);
            io.to(socket.roomCode).emit('players_update', room.players);

            if (Object.keys(room.players).length === 0) {
                if (room.interval) clearInterval(room.interval);
                delete rooms[socket.roomCode];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
    
