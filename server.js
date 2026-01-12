const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions'); // Ensure this path is correct

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // 1. Join Room Logic
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // 2. Real-time Code Sync (Fixed)
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        // socket.in(roomId) se sender ke alawa baki sabko code jayega
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // 3. Initial Code Sync (Naye user ke liye)
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // 4. Language Change Broadcast
    socket.on('language-change', ({ roomId, language }) => {
        socket.in(roomId).emit('language-change', { language });
    });

    // 5. Chat Message Logic
    socket.on('send-message', ({ roomId, message, username }) => {
        // io.to(roomId) se pure room ko (sender ko bhi) message milega
        io.to(roomId).emit('receive-message', {
            message,
            username,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // 6. Disconnect Logic
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));