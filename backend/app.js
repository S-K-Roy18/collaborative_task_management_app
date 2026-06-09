const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit body size

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Apply response formatter middleware
app.use(responseFormatter);

// Logging middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const mongoUri = process.env.NODE_ENV === 'test'
  ? process.env.MONGO_URI || 'mongodb://localhost:27017/test'
  : process.env.MONGO_URI || 'mongodb://localhost:27017/ctm_app';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected to:', mongoUri))
.catch(err => console.log(err));

// Online Presence Tracking structures
const activeUsers = {}; // workspaceId -> Set of userIds
const socketUserMap = {}; // socketId -> { userId, workspaceId }

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user's personal room for notifications
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Client ${socket.id} joined user room: ${userId}`);
  });

  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Client ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('leaveWorkspace', (workspaceId) => {
    socket.leave(workspaceId);
    console.log(`Client ${socket.id} left workspace ${workspaceId}`);
  });

  // Chat Socket Events
  socket.on('joinChatRoom', (roomId) => {
    socket.join(`room:${roomId}`);
    console.log(`Client ${socket.id} joined chat room: ${roomId}`);
  });

  socket.on('leaveChatRoom', (roomId) => {
    socket.leave(`room:${roomId}`);
    console.log(`Client ${socket.id} left chat room: ${roomId}`);
  });

  socket.on('typing', ({ roomId, userName }) => {
    const userInfo = socketUserMap[socket.id];
    const userId = userInfo ? userInfo.userId : null;
    socket.to(`room:${roomId}`).emit('typing', { roomId, userName, userId });
  });

  socket.on('stopTyping', ({ roomId }) => {
    const userInfo = socketUserMap[socket.id];
    const userId = userInfo ? userInfo.userId : null;
    socket.to(`room:${roomId}`).emit('stopTyping', { roomId, userId });
  });

  // Track user active presence in a workspace
  socket.on('userActive', ({ userId, workspaceId }) => {
    socketUserMap[socket.id] = { userId, workspaceId };
    
    if (!activeUsers[workspaceId]) {
      activeUsers[workspaceId] = new Set();
    }
    activeUsers[workspaceId].add(userId);

    // Broadcast the updated online members list to everyone in this workspace
    io.to(workspaceId).emit('onlineUsers', Array.from(activeUsers[workspaceId]));
    console.log(`User ${userId} is online in workspace ${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const userInfo = socketUserMap[socket.id];
    
    if (userInfo) {
      const { userId, workspaceId } = userInfo;
      delete socketUserMap[socket.id];

      // Remove from active list in that workspace
      if (activeUsers[workspaceId]) {
        activeUsers[workspaceId].delete(userId);
        io.to(workspaceId).emit('onlineUsers', Array.from(activeUsers[workspaceId]));
        console.log(`User ${userId} went offline in workspace ${workspaceId}`);
      }
    }
  });
});

// Make io available in routes
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workspaceRoutes = require('./routes/workspace');
app.use('/api/workspace', workspaceRoutes);

const organizationRoutes = require('./routes/organization');
app.use('/api/organization', organizationRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

const projectRoutes = require('./routes/project');
app.use('/api/project', projectRoutes);

const activityLogRoutes = require('./routes/activityLog');
app.use('/api/activitylog', activityLogRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Collaborative Task Management API');
});

// Apply error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

app.app = app;
app.server = server;
app.io = io;

module.exports = app;
