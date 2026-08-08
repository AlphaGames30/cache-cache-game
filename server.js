const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    // Diffuser la position aux autres
    socket.on('update_position', (data) => {
        io.emit('player_moved', { id: socket.id, lat: data.lat, lng: data.lng });
    });

    // Quand un joueur clique sur "S'enlever du jeu"
    socket.on('leave_game', () => {
        io.emit('player_left', socket.id);
    });

    // Quand un joueur ferme la page
    socket.on('disconnect', () => {
        io.emit('player_left', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
