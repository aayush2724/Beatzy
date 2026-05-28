/**
 * Socket.IO singleton — lazy‑initialised and attached to the HTTP server.
 *
 * Usage:
 *   const { initIO, getIO } = require('./socketio');
 *   initIO(httpServer);            // called once in index.js
 *   getIO().to(`user:${id}`).emit('job:progress', payload);
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialise the Socket.IO server.
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Join user‑specific room so we can target events
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

/**
 * Get the running Socket.IO instance.
 * @returns {Server}
 */
function getIO() {
  if (!io) throw new Error('Socket.IO not initialised — call initIO(server) first');
  return io;
}

module.exports = { initIO, getIO };
