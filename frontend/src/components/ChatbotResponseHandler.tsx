"use client";

import React, { useEffect, useState } from "react";

interface ChatbotResponseHandlerProps {
  question: string;
  onAnswer: (answer: string) => void;
}

export const ChatbotResponseHandler = ({
  question,
  onAnswer,
}: ChatbotResponseHandlerProps): React.ReactElement | null => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!question.trim()) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    let isMounted = true;
    setError(null);

    async function fetchChatResponse() {
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          setError("Request timed out. Please try again.");
          onAnswer("Sorry, the request took too long. Please try again.");
        }
      }, 25000);

      try {
        const response = await fetch(`${backendUrl}/api/chatbot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: question }],
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 503) {
            setError("Chatbot not configured");
            if (isMounted) {
              onAnswer("🤖 Chatbot is not configured yet. Please ask your admin to add the OpenAI API key to enable this feature.");
            }
            return;
          }
          
          if (response.status === 401) {
            setError("Invalid API key");
            if (isMounted) {
              onAnswer("⚠️ There's an issue with the API configuration. Please contact support.");
            }
            return;
          }
          
          if (response.status === 429) {
            setError("Rate limited - Free tier quota exceeded");
            if (isMounted) {
              onAnswer("⏳ Too many requests! You've reached your free tier quota on Gemini API.\n\nFree tier limits:\n- 15 requests per minute\n- Wait 1 minute between requests\n\nTry again in a moment, or consider upgrading to Google AI Studio for higher limits.");
            }
            return;
          }
          
          throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.message?.content && isMounted) {
          onAnswer(data.message.content);
        } else if (isMounted) {
          onAnswer("Sorry, I couldn't process your question. Please try again.");
        }
} catch (err: any) {
        clearTimeout(timeoutId);
        
        if (isMounted) {
          console.error("Chatbot fetch error:", err);
          const errorMessage = err.message || "Unknown error";
          
          if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("network")) {
            setError("Network error - backend may not be running");
            if (isMounted) {
              onAnswer("🔌 Unable to connect to the chatbot. Make sure the backend server is running on port 5000.\n\nTo start the backend: `npm start` in the backend folder");
            }
          } else if (errorMessage.includes("API error")) {
            setError("API error");
            onAnswer("⚠️ There was a problem with the AI service. This might be because:\n\n1. The OpenAI API key is not set in .env\n2. You've reached your API usage limit\n\nCheck your .env file and add: OPENAI_API_KEY=your_api_key_here");
          } else {
            setError(errorMessage);
            onAnswer("❌ " + errorMessage + "\n\nPlease check the console for more details or try again later.");
          }
        }
      }
    }

    fetchChatResponse();

    return () => {
      isMounted = false;
    };
  }, [question, onAnswer]);

  return null;
};

export default ChatbotResponseHandler;
