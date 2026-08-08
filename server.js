const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Servir les fichiers de la page web (index.html)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion des joueurs
const players = {};

io.on('connection', (socket) => {
    socket.emit('current_players', players);

    socket.on('update_position', (data) => {
        players[socket.id] = { lat: data.lat, lng: data.lng };
        io.emit('player_moved', { id: socket.id, lat: data.lat, lng: data.lng });
    });

    socket.on('leave_game', () => {
        delete players[socket.id];
        io.emit('player_left', socket.id);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('player_left', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
