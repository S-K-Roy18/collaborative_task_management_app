const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

let token;
let userId;

beforeAll(async () => {
  // Wait for app.js mongoose connection
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
  }

  // Clean up before test
  await User.deleteMany({ email: 'testuser@example.com' });
  await Workspace.deleteMany({ name: { $in: ['Test Workspace', 'Workspace for Get', 'Workspace to Delete'] } });

  // Create a test user
  const user = new User({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'hashedpassword',
    role: 'user',
  });
  await user.save();
  userId = user._id;

  // Generate JWT using same secret as auth middleware
  token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({ email: 'testuser@example.com' });
  await Workspace.deleteMany({ owner: userId });
  // Do NOT close mongoose connection
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

  test('Delete workspace', async () => {
    // Create workspace first
    const workspace = new Workspace({
      name: 'Workspace to Delete',
      description: 'Testing delete',
      owner: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    workspace.generateInviteCode();
    await workspace.save();

    const res = await request(app)
      .delete(`/api/workspace/${workspace._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Workspace deleted successfully');

    // Verify workspace is deleted
    const deleted = await Workspace.findById(workspace._id);
    expect(deleted).toBeNull();
  });
});
