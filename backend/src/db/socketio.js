const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;
const isDev = process.env.NODE_ENV !== 'production';

function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: isDev ? true : (process.env.FRONTEND_URL || 'http://localhost:5000'),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    logger.info('Socket connected', { userId: socket.userId, socketId: socket.id });
    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { userId: socket.userId, reason });
    });
  });

  logger.info('Socket.IO initialised');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}

module.exports = { initIO, getIO };
