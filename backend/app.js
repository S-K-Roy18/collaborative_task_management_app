const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

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
app.use(express.json());

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

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Client ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('leaveWorkspace', (workspaceId) => {
    socket.leave(workspaceId);
    console.log(`Client ${socket.id} left workspace ${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workspaceRoutes = require('./routes/workspace');
app.use('/api/workspace', workspaceRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

const activityLogRoutes = require('./routes/activityLog');
app.use('/api/activitylog', activityLogRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);

app.get('/', (req, res) => {
  res.send('Collaborative Task Management API');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };
