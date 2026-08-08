const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('Joueur connecté :', socket.id);

    socket.on('update_position', (data) => {
        // Rediffuse le GPS du joueur à TOUS les participants connectés
        io.emit('player_moved', { id: socket.id, lat: data.lat, lng: data.lng });
    });

    socket.on('disconnect', () => {
        console.log('Joueur déconnecté :', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
