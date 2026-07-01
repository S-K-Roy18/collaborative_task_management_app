require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const taskRoutes = require('./routes/taskRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const chatRoutes = require('./routes/chatRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const commentRoutes = require('./routes/commentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/analytics', analyticsRoutes);
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running smoothly.' });
});

// Pass IO to routes via req.app.get('io') if needed, or separate socket module
app.set('io', io);

// Socket.io integration
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(workspaceId);
  });
  socket.on('leaveWorkspace', (workspaceId) => {
    socket.leave(workspaceId);
  });

  // User-specific room for notifications
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
  });
  socket.on('leaveUserRoom', (userId) => {
    socket.leave(`user_${userId}`);
  });

  // Chat events
  socket.on('joinChatRoom', (roomId) => {
    socket.join(roomId);
  });
  
  socket.on('leaveChatRoom', (roomId) => {
    socket.leave(roomId);
  });

  socket.on('typing', ({ roomId, userId, userName }) => {
    socket.to(roomId).emit('typing', { roomId, userId, userName });
  });

  socket.on('stopTyping', ({ roomId, userId }) => {
    socket.to(roomId).emit('stopTyping', { roomId, userId });
  });

  // Basic presence
  const onlineUsers = new Set();
  socket.on('userActive', ({ userId, workspaceId }) => {
    onlineUsers.add(userId);
    socket.to(workspaceId).emit('onlineUsers', Array.from(onlineUsers));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collaborative-task-manager';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = { app, server, io };
