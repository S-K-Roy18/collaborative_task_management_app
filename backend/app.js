const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workspaceRoutes = require('./routes/workspace');
app.use('/api/workspace', workspaceRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

app.get('/', (req, res) => {
  res.send('Collaborative Task Management API');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
