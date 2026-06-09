const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

let token;
let userId;
let workspaceId;
let channelId;

beforeAll(async () => {
  // Wait for app.js mongoose connection
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
  }

  // Clear test data
  await User.deleteMany({ email: 'chattestuser@example.com' });
  await ChatRoom.deleteMany({});
  await ChatMessage.deleteMany({});

  // Create a test user
  const user = new User({
    name: 'Chat Test User',
    email: 'chattestuser@example.com',
    password: 'hashedpassword',
    role: 'user',
  });
  await user.save();
  userId = user._id;

  // Generate JWT token using same secret as auth middleware
  token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

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
  // Clean up test data only
  await User.deleteMany({ email: 'chattestuser@example.com' });
  await Workspace.deleteMany({ name: 'Chat Test Workspace' });
  await ChatRoom.deleteMany({});
  await ChatMessage.deleteMany({});
  // Do NOT close mongoose connection
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
  });

  test('Get room messages history', async () => {
    const res = await request(app)
      .get(`/api/chat/room/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(res.body.messages[0].content).toBe('Hello, this is a test message!');
  });
});
