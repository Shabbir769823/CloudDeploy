let ioInstance = null;

export const SocketService = {
  init: (io) => {
    ioInstance = io;
    console.log('SocketService initialized with Socket.io instance.');

    io.on('connection', (socket) => {
      console.log(`Socket client connected: ${socket.id}`);

      // Allow clients to join rooms specific to deployments
      socket.on('join:deployment', (deploymentId) => {
        socket.join(deploymentId);
        console.log(`Socket ${socket.id} joined room: ${deploymentId}`);
      });

      // Allow clients to leave deployment rooms
      socket.on('leave:deployment', (deploymentId) => {
        socket.leave(deploymentId);
        console.log(`Socket ${socket.id} left room: ${deploymentId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Socket client disconnected: ${socket.id}`);
      });
    });
  },

  /**
   * Emit real-time build/deploy log to a specific deployment stream
   * @param {string} deploymentId 
   * @param {string} message 
   */
  emitLog: (deploymentId, message) => {
    if (ioInstance) {
      ioInstance.to(deploymentId).emit('log', {
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Emit deployment status change
   * @param {string} deploymentId 
   * @param {string} status 
   */
  emitStatus: (deploymentId, status) => {
    if (ioInstance) {
      ioInstance.to(deploymentId).emit('status', {
        status,
        timestamp: new Date().toISOString()
      });
    }
  }
};
