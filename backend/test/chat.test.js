const request = require('supertest');
const { app, server } = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');

let token;
let userId;
let workspaceId;
let channelId;

beforeAll(async () => {
  // Wait for mongoose connection from app.js if it's currently connecting
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
  } else if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/ctm_app_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  // Create a test user
  const user = new User({
    name: 'Chat Test User',
    email: 'chattestuser@example.com',
    password: 'hashedpassword',
    role: 'user',
  });
  await user.save();
  userId = user._id;

  // Generate JWT token
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

  // Create workspace
  const workspace = new Workspace({
    name: 'Chat Test Workspace',
    description: 'A workspace for testing chat',
    owner: userId,
    members: [{ user: userId, role: 'admin' }],
  });
  workspace.generateInviteCode();
  await workspace.save();
  workspaceId = workspace._id;
});

afterAll(async () => {
  // Clean up database
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await ChatRoom.deleteMany({});
  await ChatMessage.deleteMany({});
  await mongoose.connection.close();
  server.close(); // Close server socket connection
});

describe('Chat API', () => {
  test('Create public channel', async () => {
    const res = await request(app)
      .post('/api/chat/room')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'development-discussion',
        type: 'channel',
        workspaceId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.room.name).toBe('development-discussion');
    expect(res.body.room.type).toBe('channel');
    channelId = res.body.room._id;
  });

  test('Get rooms for workspace', async () => {
    const res = await request(app)
      .get(`/api/chat/workspace/${workspaceId}/rooms`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.rooms)).toBe(true);
    // Should include the default #general channel and our custom 'development-discussion' channel
    expect(res.body.rooms.length).toBeGreaterThanOrEqual(1);
  });

  test('Send a chat message', async () => {
    const res = await request(app)
      .post(`/api/chat/room/${channelId}/message`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Hello, this is a test message!',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toBe('Hello, this is a test message!');
    expect(res.body.message.sender._id.toString()).toBe(userId.toString());
  });

  test('Get room messages history', async () => {
    const res = await request(app)
      .get(`/api/chat/room/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].content).toBe('Hello, this is a test message!');
  });
});
