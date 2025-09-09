const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');

let token;
let userId;

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect('mongodb://localhost:27017/ctm_app_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user
  const user = new User({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'hashedpassword', // Assume password is hashed
    role: 'user',
  });
  await user.save();
  userId = user._id;

  // Generate JWT token
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
});

afterAll(async () => {
  // Clean up database
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await mongoose.connection.close();
});

describe('Workspace API', () => {
  test('Create workspace', async () => {
    const res = await request(app)
      .post('/api/workspace/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Workspace',
        description: 'A workspace for testing',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.workspace.name).toBe('Test Workspace');
  });

  test('Get my workspaces', async () => {
    const res = await request(app)
      .get('/api/workspace/my-workspaces')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.workspaces)).toBe(true);
  });

  test('Get workspace by ID', async () => {
    // Create workspace first
    const workspace = new Workspace({
      name: 'Workspace for Get',
      description: 'Testing get by ID',
      owner: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    workspace.generateInviteCode();
    await workspace.save();

    const res = await request(app)
      .get(`/api/workspace/${workspace._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.workspace.name).toBe('Workspace for Get');
  });

  // Additional tests for join, update, regenerate code can be added similarly
});
