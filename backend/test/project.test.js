const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

let token;
let userId;
let workspaceId;
let projectId;

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
  await Workspace.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // Create test user
  const user = new User({
    name: 'Project User',
    email: 'projectuser@example.com',
    password: 'password123',
    role: 'user',
  });
  await user.save();
  userId = user._id;
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

  // Create test workspace
  const workspace = new Workspace({
    name: 'Project Workspace',
    description: 'A workspace for projects',
    owner: userId,
    members: [{ user: userId, role: 'admin' }],
  });
  workspace.generateInviteCode();
  await workspace.save();
  workspaceId = workspace._id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await mongoose.connection.close();
});

describe('Project API', () => {
  test('Create Project', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Project',
        description: 'Test Project Description',
        workspaceId,
        priority: 'high',
        budget: 10000,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.project.title).toBe('New Project');
    expect(res.body.project.workspace).toBe(workspaceId.toString());

    projectId = res.body.project._id;
  });

  test('Get Workspace Projects', async () => {
    const res = await request(app)
      .get(`/api/project/workspace/${workspaceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.projects.length).toBe(1);
    expect(res.body.projects[0].title).toBe('New Project');
  });

  test('Duplicate Project', async () => {
    // Create a task associated with this project first
    const task = new Task({
      title: 'Task in Project',
      description: 'Some description',
      workspace: workspaceId,
      project: projectId,
      status: 'todo',
      createdBy: userId,
    });
    await task.save();

    const res = await request(app)
      .post(`/api/project/${projectId}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.project.title).toContain('New Project Copy');

    // Verify task is duplicated and associated with the new duplicated project
    const duplicatedProjectId = res.body.project._id;
    const duplicatedTasks = await Task.find({ project: duplicatedProjectId });
    expect(duplicatedTasks.length).toBe(1);
    expect(duplicatedTasks[0].title).toBe('Task in Project');
  });

  test('Delete Project', async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await Project.findById(projectId);
    expect(deleted).toBeNull();
  });
});
