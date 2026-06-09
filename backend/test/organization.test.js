const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

let token1;
let token2;
let user1Id;
let user2Id;
let orgId;
let inviteCode;

beforeAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/ctm_app_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  // Clear collections
  await User.deleteMany({});
  await Organization.deleteMany({});

  // Create two test users
  const user1 = new User({
    name: 'User One',
    email: 'user1@example.com',
    password: 'password123',
    role: 'user',
  });
  await user1.save();
  user1Id = user1._id;
  token1 = jwt.sign({ id: user1Id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

  const user2 = new User({
    name: 'User Two',
    email: 'user2@example.com',
    password: 'password123',
    role: 'user',
  });
  await user2.save();
  user2Id = user2._id;
  token2 = jwt.sign({ id: user2Id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await mongoose.connection.close();
});

describe('Organization API', () => {
  test('Create Organization', async () => {
    const res = await request(app)
      .post('/api/organization')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Test Org',
        description: 'An organization for testing',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.organization.name).toBe('Test Org');
    expect(res.body.organization.owner).toBe(user1Id.toString());

    orgId = res.body.organization._id;
    inviteCode = res.body.organization.inviteCode;
  });

  test('Get my organizations', async () => {
    const res = await request(app)
      .get('/api/organization/my-organizations')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.organizations.length).toBe(1);
    expect(res.body.organizations[0].name).toBe('Test Org');
  });

  test('Join Organization', async () => {
    const res = await request(app)
      .post('/api/organization/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.organization.members.some(m => m.user === user2Id.toString() && m.role === 'Developer')).toBe(true);
  });

  test('Update Member Role (Admin Only - fail for developer)', async () => {
    // User 2 (Developer) tries to update role of User 1 (Super Admin) -> Should fail
    const res = await request(app)
      .put(`/api/organization/${orgId}/members/${user1Id}/role`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ role: 'Admin' });

    expect(res.statusCode).toBe(403);
  });

  test('Update Member Role (Super Admin - success)', async () => {
    // User 1 (Super Admin) updates User 2 (Developer) to Admin -> Should succeed
    const res = await request(app)
      .put(`/api/organization/${orgId}/members/${user2Id}/role`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ role: 'Admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
