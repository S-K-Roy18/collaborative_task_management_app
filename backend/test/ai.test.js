// Mock Gemini SDK before importing the app or routes
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockImplementation(async (prompt) => {
            if (prompt.includes('Break down the following task')) {
              return {
                response: {
                  text: () => JSON.stringify(["Mocked Subtask A", "Mocked Subtask B", "Mocked Subtask C"])
                }
              };
            } else if (prompt.includes('Analyze the following project health data')) {
              return {
                response: {
                  text: () => JSON.stringify([
                    {
                      type: "overload",
                      title: "Mocked Overload Warning",
                      description: "John is overloaded with active tasks.",
                      suggestion: "Delegate tasks.",
                      severity: "medium"
                    }
                  ])
                }
              };
            }
            return {
              response: {
                text: () => "Mocked standard chatbot response."
              }
            };
          })
        })
      };
    })
  };
});

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

let token;
let userId;
let workspaceId;

beforeAll(async () => {
  // Wait for app.js mongoose connection
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
  }

  // Clear collections
  await User.deleteMany({ email: 'aiuser@example.com' });
  await Workspace.deleteMany({ name: 'AI Workspace' });
  await Task.deleteMany({});

  // Create test user
  const user = new User({
    name: 'AI User',
    email: 'aiuser@example.com',
    password: 'password123',
    role: 'user',
  });
  await user.save();
  userId = user._id;
  token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

  // Create test workspace
  const workspace = new Workspace({
    name: 'AI Workspace',
    description: 'A workspace for AI test',
    owner: userId,
    members: [{ user: userId, role: 'admin' }],
  });
  workspace.generateInviteCode();
  await workspace.save();
  workspaceId = workspace._id;

  // Set mock GEMINI key
  process.env.GEMINI_API_KEY = 'mock_key';
});

afterAll(async () => {
  await User.deleteMany({ email: 'aiuser@example.com' });
  await Workspace.deleteMany({ name: 'AI Workspace' });
  await Task.deleteMany({});
  // Do NOT close mongoose connection
});

describe('AI chatbot API', () => {
  test('AI Task Breakdown', async () => {
    const res = await request(app)
      .post('/api/chatbot/breakdown')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Complete Project Report',
        description: 'Need to write and format the final project report for client approval.',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subtasks).toEqual(["Mocked Subtask A", "Mocked Subtask B", "Mocked Subtask C"]);
  });

  test('AI Risk Analysis', async () => {
    // Create an overloaded active task structure
    const task1 = new Task({ title: 'Task 1', workspace: workspaceId, assignees: [userId], status: 'todo', createdBy: userId });
    const task2 = new Task({ title: 'Task 2', workspace: workspaceId, assignees: [userId], status: 'todo', createdBy: userId });
    const task3 = new Task({ title: 'Task 3', workspace: workspaceId, assignees: [userId], status: 'todo', createdBy: userId });
    const task4 = new Task({ title: 'Task 4', workspace: workspaceId, assignees: [userId], status: 'todo', createdBy: userId });
    await Task.insertMany([task1, task2, task3, task4]);

    const res = await request(app)
      .post('/api/chatbot/risks')
      .set('Authorization', `Bearer ${token}`)
      .send({ workspaceId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.risks.length).toBe(1);
    expect(res.body.risks[0].title).toBe('Mocked Overload Warning');
    expect(res.body.risks[0].severity).toBe('medium');
  });
});
