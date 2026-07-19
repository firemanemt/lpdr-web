import { io } from 'socket.io-client';

// In development, Vite proxy forwards to localhost:4000
// In production, same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔗 WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔗 WebSocket disconnected');
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinCaseRoom(caseId) {
  if (socket?.connected) {
    socket.emit('join:case', caseId);
  }
}

export function leaveCaseRoom(caseId) {
  if (socket?.connected) {
    socket.emit('leave:case', caseId);
  }
}

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinCaseRoom,
  leaveCaseRoom,
};
