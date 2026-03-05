"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatbotResponseHandler } from "./ChatbotResponseHandler";

const QUICK_SUGGESTIONS = [
  "Help me create a task",
  "Suggest a deadline for a big project",
  "How to prioritize tasks?",
  "Tips for team productivity"
];

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([
    { 
      sender: "bot", 
      text: "👋 Hi! I'm your Task Management Assistant. I can help you with:\n\n• Creating & organizing tasks\n• Suggesting deadlines\n• Prioritizing work\n• Productivity tips\n\nWhat would you like help with?" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleUserInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim() || isTyping) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: question }]);
    setIsTyping(true);
    setQuestion("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isTyping) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: suggestion }]);
    setIsTyping(true);
  };

  const handleAnswer = (answer: string) => {
    setIsTyping(false);
    setMessages((msgs) => [...msgs, { sender: "bot", text: answer }]);
  };

  // Auto scroll to bottom on messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  return (
    <>
      <button
        aria-label="Toggle Chatbot"
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#6366f1",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "28px",
          zIndex: 1000,
          boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.5)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(99, 102, 241, 0.4)";
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "380px",
            maxHeight: "520px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🤖</span>
              <span>Task Assistant</span>
            </div>
            <button
              aria-label="Close Chatbot"
              onClick={toggleChat}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              fontSize: "14px",
              backgroundColor: "#f9fafb",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "12px",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" 
                      ? "16px 16px 4px 16px" 
                      : "16px 16px 16px 4px",
                    backgroundColor: msg.sender === "user" 
                      ? "#6366f1" 
                      : "white",
                    color: msg.sender === "user" ? "white" : "#374151",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    maxWidth: "85%",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 0" }}>
                <div style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: "#6366f1",
                  animation: "pulse 1s infinite"
                }}></div>
                <div style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: "#6366f1",
                  animation: "pulse 1s infinite 0.2s"
                }}></div>
                <div style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: "#6366f1",
                  animation: "pulse 1s infinite 0.4s"
                }}></div>
                <span style={{ marginLeft: "8px", color: "#6b7280", fontSize: "13px" }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {!isTyping && messages.length < 3 && (
            <div style={{ 
              padding: "0 16px 12px", 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px" 
            }}>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "20px",
                    color: "#4b5563",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#6366f1";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.color = "#4b5563";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleUserInput}
            style={{ 
              display: "flex", 
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <input
              type="text"
              value={question}
              placeholder="Type your question..."
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                outline: "none",
                fontSize: "14px",
                borderRadius: "0 0 0 16px",
              }}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !question.trim()}
              style={{
                padding: "14px 20px",
                backgroundColor: isTyping ? "#9ca3af" : "#6366f1",
                color: "white",
                border: "none",
                cursor: isTyping || !question.trim() ? "not-allowed" : "pointer",
                borderRadius: "0 0 16px 0",
                fontWeight: "600",
                transition: "background-color 0.2s",
              }}
            >
              Send
            </button>
          </form>

{/* Only trigger response handler when user sends a message */}
          {messages.length > 0 && messages[messages.length - 1].sender === "user" && (
            <ChatbotResponseHandler
              question={messages[messages.length - 1].text}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      )}

      {/* Inline styles for animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Chatbot;
