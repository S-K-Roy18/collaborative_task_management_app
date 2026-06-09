const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Lazy initialization of Gemini client
let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  }
  return genAI;
};

// Task Assistant system prompt
const SYSTEM_PROMPT = `You are a Task Management Assistant for a collaborative task management app. Your role is to help users with:

1. **Summarizing tasks** - Help users understand what a task is about
2. **Suggesting deadlines** - Recommend realistic due dates based on task complexity
3. **Generating task descriptions** - Create detailed, clear task descriptions
4. **Suggesting priorities** - Recommend priority levels (low, medium, high) based on urgency
5. **Task organization** - Help break down large tasks into subtasks
6. **General productivity tips** - Share best practices for team collaboration

Be concise, helpful, and focus on productivity. If asked about unrelated topics, politely redirect to task management.`;

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'Chatbot service not configured',
        message: 'Please add your Gemini API key to the .env file as GEMINI_API_KEY'
      });
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build conversation history for Gemini
    let prompt = SYSTEM_PROMPT + '\n\n';
    messages.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    prompt += 'Assistant:';

    // Generate response with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = result.response;
      const text = response.text();
      
      res.json({ message: { role: 'assistant', content: text } });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timeout', message: 'The request took too long. Please try again.' });
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Gemini API error:', error.message || error);
    
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(401).json({ error: 'Invalid API key', message: 'Please check your Gemini API key.' });
    }
    if (error.message && error.message.includes('quota')) {
      return res.status(429).json({ error: 'Rate limit', message: 'Too many requests. Please wait a moment.' });
    }
    
    res.status(500).json({ error: 'Failed to fetch AI response', message: 'Something went wrong. Please try again.' });
  }
});

// @route   POST /api/chatbot/breakdown
// @desc    Generate a subtask breakdown for a task
// @access  Private
router.post('/breakdown', authenticate, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'Chatbot service not configured',
        message: 'Please add your Gemini API key to the .env file as GEMINI_API_KEY'
      });
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Break down the following task into a clear, actionable list of subtasks.
Task Title: ${title}
Task Description: ${description || 'No description provided.'}

Respond ONLY with a valid JSON array of strings, where each string represents a subtask title. Do not include markdown formatting or backticks around the JSON. Example:
["Subtask 1", "Subtask 2", "Subtask 3"]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Remove markdown formatting if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    text = text.trim();

    let subtasks;
    try {
      subtasks = JSON.parse(text);
      if (!Array.isArray(subtasks)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini breakdown response:', text);
      // Fallback: split by lines if JSON parsing fails
      subtasks = text.split('\n')
        .map(line => line.replace(/^[-*+\d.\s]+/, '').trim())
        .filter(line => line.length > 0);
    }

    res.json({ success: true, subtasks });
  } catch (error) {
    console.error('AI Breakdown error:', error);
    res.status(500).json({ error: 'Failed to generate subtasks', message: error.message });
  }
});

// @route   POST /api/chatbot/risks
// @desc    Analyze workspace task metadata for risks and return suggestions
// @access  Private
router.post('/risks', authenticate, async (req, res) => {
  try {
    const workspaceId = req.body.workspaceId || req.query.workspaceId;
    const projectId = req.body.projectId || req.query.projectId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if the user is a member of the workspace
    if (!workspace.isMember(req.user._id)) {
      return res.status(403).json({ error: 'Access denied: not a member of this workspace' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'Chatbot service not configured',
        message: 'Please add your Gemini API key to the .env file as GEMINI_API_KEY'
      });
    }

    const query = { workspace: workspaceId };
    if (projectId) {
      query.project = projectId;
    }

    const tasks = await Task.find(query).populate('assignees', 'name email');

    // Analyze tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
    const stuckHighPriority = tasks.filter(t => t.status === 'todo' && t.priority === 'high');

    const userTaskCounts = {};
    tasks.forEach(t => {
      if (t.status !== 'done') {
        t.assignees.forEach(user => {
          const name = user.name;
          userTaskCounts[name] = (userTaskCounts[name] || 0) + 1;
        });
      }
    });

    const overloadedUsers = Object.entries(userTaskCounts)
      .filter(([name, count]) => count > 3)
      .map(([name, count]) => ({ name, count }));

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a project manager assistant. Analyze the following project health data and generate 2-4 critical risk insights.

Active Task analysis:
- Overdue tasks: ${overdueTasks.map(t => `'${t.title}' (due ${t.dueDate.toDateString()})`).join(', ') || 'None'}
- High-priority tasks stuck in 'todo': ${stuckHighPriority.map(t => `'${t.title}'`).join(', ') || 'None'}
- Team members workload (active tasks count): ${overloadedUsers.map(u => `${u.name}: ${u.count} tasks`).join(', ') || 'All members have balanced workloads'}

Respond ONLY with a valid JSON array of objects representing risk insights. Do not include markdown formatting or backticks around the JSON. Use the format:
[
  {
    "type": "overload" | "overdue" | "deadline" | "general",
    "title": "Short title of the risk (e.g. Overloaded Developer)",
    "description": "Short explanation of the risk",
    "suggestion": "Actionable suggestion to resolve this risk",
    "severity": "high" | "medium" | "low"
  }
]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Remove markdown formatting if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    text = text.trim();

    let risks;
    try {
      risks = JSON.parse(text);
      if (!Array.isArray(risks)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini risks response:', text);
      // Fallback static analysis if AI fails
      risks = [];
      if (overdueTasks.length > 0) {
        risks.push({
          type: 'overdue',
          title: `${overdueTasks.length} Overdue Tasks`,
          description: `There are tasks that have missed their due date.`,
          suggestion: `Review and reschedule the tasks: ${overdueTasks.slice(0, 2).map(t => t.title).join(', ')}.`,
          severity: 'high'
        });
      }
      if (overloadedUsers.length > 0) {
        overloadedUsers.forEach(u => {
          risks.push({
            type: 'overload',
            title: `Workload Alert: ${u.name}`,
            description: `${u.name} has ${u.count} active tasks assignees.`,
            suggestion: `Consider delegating some tasks to other team members to prevent burnout.`,
            severity: 'medium'
          });
        });
      }
    }

    res.json({ success: true, risks });
  } catch (error) {
    console.error('AI Risks error:', error);
    res.status(500).json({ error: 'Failed to analyze risks', message: error.message });
  }
});

module.exports = router;

