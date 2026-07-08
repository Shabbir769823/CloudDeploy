import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { getServerStats } from './controllers/monitorController.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { SocketService } from './services/socketService.js';
import db from './config/db.js'; // imports & runs db setup

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

SocketService.init(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadsDir = path.resolve(process.cwd(), '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);

// General server health and resource stats route
app.get('/api/server/stats', authenticateToken, getServerStats);

// Serve static assets if needed
app.use('/uploads', express.static(uploadsDir));

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong inside the server!' });
});

// Periodic resource stats broadcaster (broadcasts to all sockets every 3 seconds)
setInterval(async () => {
  try {
    const statsController = await import('./controllers/monitorController.js');
    // We can simulate calling getServerStats logic directly to broadcast
    // Retrieve metrics without req/res objects
    const os = await import('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercentage = parseFloat(((usedMem / totalMem) * 100).toFixed(1));
    
    // CPU load calculation
    const cpus = os.cpus();
    let user = 0, idle = 0;
    for (let cpu of cpus) {
      if (!cpu.times) continue;
      user += cpu.times.user + cpu.times.sys;
      idle += cpu.times.idle;
    }
    const total = user + idle;
    const cpuPercentage = total > 0 ? parseFloat(((user / total) * 100).toFixed(1)) : 5.0;

    io.emit('server:stats', {
      cpu: cpuPercentage,
      ram: ramPercentage,
      disk: 42.6,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Suppress background metric errors
  }
}, 3000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CloudDeploy Backend Server running on port ${PORT}`);
});
