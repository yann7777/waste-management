const socketIo = require('socket.io');

let io;

exports.init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3001",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log("Utilisateur connecté:", socket.id);

        // Rejoindre une salle de chat
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Utilisateur ${socket.id} a rejoint la salle ${room}`);
        });

        // Quitter une salle de chat
        socket.on('leave_room', (room) => {
            socket.leave(room);
            console.log(`Utilisateur ${socket.id} a quitté la salle ${room}`);
        });

        socket.on('disconnect', () => {
            console.log("Utilisateur déconnecté:", socket.id);
        });
    });

    return io;
};

exports.getIo = () => {
    if (!io) {
        throw new Error("Socket.io non initialisé")
    }
    return io;
};