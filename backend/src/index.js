import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import pilotRoutes from './routes/pilots.js';
import caseRoutes from './routes/cases.js';
import messageRoutes from './routes/messages.js';
import mapRoutes from './routes/map.js';
import notificationRoutes from './routes/notifications.js';
import contentRoutes from './routes/content.js';
import adminRoutes from './routes/admin.js';

const app = express();
const httpServer = createServer(app);

// Socket.io for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: [config.frontendUrl, config.railwayUrl, config.corsOrigin].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Global middleware
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// In production (Railway), CORS is flexible since frontend is self-hosted
const corsOrigins = [config.corsOrigin, config.frontendUrl, config.railwayUrl].filter(Boolean);
app.use(cors({
  origin: config.nodeEnv === 'production' ? true : corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/auth', limiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pilots', pilotRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/cases', messageRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: config.nodeEnv,
  });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log(`🟢 WebSocket client connected: ${socket.id}`);

  // Join a case room for real-time chat
  socket.on('join:case', (caseId) => {
    socket.join(`case:${caseId}`);
    console.log(`  → Joined case room: ${caseId}`);
  });

  // Leave a case room
  socket.on('leave:case', (caseId) => {
    socket.leave(`case:${caseId}`);
  });

  // Send message via WebSocket
  socket.on('message:send', async (data) => {
    const { caseId, message } = data;
    io.to(`case:${caseId}`).emit('message:new', message);
  });

  // Map location updates
  socket.on('pilot:location', (data) => {
    // Broadcast to all connected clients
    socket.broadcast.emit('map:update', data);
  });

  // Case status changes
  socket.on('case:status', (data) => {
    io.to(`case:${data.caseId}`).emit('case:updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 WebSocket client disconnected: ${socket.id}`);
  });
});

// Serve built frontend in production
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '../../frontend/dist');

app.use(express.static(frontendDist));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling
app.use(errorHandler);

// Start server
async function start() {
  // Try to initialize database (non-fatal if not available)
  try {
    await initDatabase();
  } catch (err) {
    console.log('⚠️ Running in demo mode (no database connection)');
  }

  httpServer.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║     LPDR Backend API Server                      ║
║     Running on http://localhost:${config.port}       ║
║     Mode: ${config.nodeEnv.padEnd(29)}║
║     WebSocket: Active                            ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

start();
