"use client";

import React, { useEffect } from "react";

interface ChatbotResponseHandlerProps {
  question: string;
  onAnswer: (answer: string) => void;
}

export const ChatbotResponseHandler = ({
  question,
  onAnswer,
}: ChatbotResponseHandlerProps): React.ReactElement | null => {
  useEffect(() => {
    if (!question.trim()) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    let isMounted = true;

    async function fetchChatResponse() {
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

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.message?.content && isMounted) {
          onAnswer(data.message.content);
        } else if (isMounted) {
          onAnswer("Sorry, I couldn't process your question.");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Chatbot fetch error:", error);
          onAnswer("Error communicating with chatbot service.");
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
