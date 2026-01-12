import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    
    // Direct URL use karein taaki process.env ka panga na ho
    return io("http://localhost:5000", options);
};