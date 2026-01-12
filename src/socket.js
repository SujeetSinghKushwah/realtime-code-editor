import { io } from 'socket.io-client';

const options = {
    'force new connection': true,
    reconnectionAttempts: 'Infinity',
    timeout: 10000,
    transports: ['websocket'],
};

// Agar production (Render) par hai toh wahi URL use karega, 
// nahi toh localhost use karega.
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', options);

export default socket;