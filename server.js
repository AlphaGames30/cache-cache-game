const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    socket.on('update_position', (data) => {
        io.emit('player_moved', { id: socket.id, lat: data.lat, lng: data.lng });
    });

    socket.on('leave_game', () => {
        io.emit('player_disconnected', socket.id);
    });

    socket.on('disconnect', () => {
        io.emit('player_disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

