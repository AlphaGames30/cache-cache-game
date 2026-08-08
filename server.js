const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Augmentation de la limite de taille pour transporter les photos de profil
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7 
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const players = {};

io.on('connection', (socket) => {
    // Transmettre la liste complète des joueurs au nouveau venu
    socket.emit('current_players', players);

    // Mettre à jour la position, le pseudo et l'avatar d'un joueur
    socket.on('update_position', (data) => {
        players[socket.id] = { 
            lat: data.lat, 
            lng: data.lng,
            pseudo: data.pseudo || 'Joueur',
            avatar: data.avatar
        };
        
        io.emit('player_moved', { 
            id: socket.id, 
            lat: data.lat, 
            lng: data.lng,
            pseudo: data.pseudo || 'Joueur',
            avatar: data.avatar
        });
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
