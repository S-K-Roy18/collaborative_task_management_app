const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    const aiResponse = completion.choices[0].message;

    res.json({ message: aiResponse });
  } catch (error) {
    console.error('OpenAI API error:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

module.exports = router;
