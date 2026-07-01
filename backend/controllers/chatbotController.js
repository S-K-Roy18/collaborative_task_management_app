const OpenAI = require('openai');

exports.handleChatbotQuery = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Fallback if API key is not provided or is a placeholder
    if (!apiKey || apiKey === 'sk-placeholder-key' || apiKey === 'your_openai_api_key_here') {
      const userMessage = messages[messages.length - 1].content;
      return res.status(200).json({ 
        success: true, 
        response: `This is a mock AI response! You said: "${userMessage}". \n\n(Note: Please replace 'sk-placeholder-key' in the backend .env with a real OpenAI API key to enable live AI responses.)` 
      });
    }

    // Call OpenAI
    const openai = new OpenAI({ apiKey });
    
    // Create a system prompt to give the AI context about the app
    const systemMessage = {
      role: 'system',
      content: 'You are an incredibly helpful AI assistant embedded within a collaborative task management web application. Your goal is to help users manage tasks, provide productivity tips, and answer questions concisely and politely.'
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or gpt-3.5-turbo
      messages: [systemMessage, ...messages],
      max_tokens: 500,
    });

    const botResponse = completion.choices[0].message.content;

    res.status(200).json({ success: true, response: botResponse });
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Check if it's an OpenAI API error
    if (error.status) {
      return res.status(error.status).json({ 
        success: false, 
        error: error.error?.message || error.message || 'OpenAI API Error' 
      });
    }

    res.status(500).json({ success: false, error: 'Failed to generate AI response' });
  }
};
