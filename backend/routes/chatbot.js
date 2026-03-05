const express = require('express');
const router = express.Router();

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

module.exports = router;

