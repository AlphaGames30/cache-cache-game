const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Mémoire du serveur pour stocker les positions
const players = {};

io.on('connection', (socket) => {
    // 1. Envoie toutes les positions actuelles au nouveau joueur qui arrive
    socket.emit('current_players', players);

    // 2. Mettre à jour et diffuser la position d'un joueur
    socket.on('update_position', (data) => {
        players[socket.id] = { lat: data.lat, lng: data.lng };
        io.emit('player_moved', { id: socket.id, lat: data.lat, lng: data.lng });
    });

    // 3. Quand un joueur clique sur "S'enlever du jeu"
    socket.on('leave_game', () => {
        delete players[socket.id];
        io.emit('player_left', socket.id);
    });

    // 4. Quand un joueur ferme l'application
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('player_left', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
