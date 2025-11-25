"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatbotResponseHandler } from "./ChatbotResponseHandler";

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleUserInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: question }]);
    setIsTyping(true);
    setQuestion("");
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
  }, [messages]);

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
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "30px",
          zIndex: 1000,
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
            width: "320px",
            maxHeight: "400px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              fontWeight: "bold",
              position: "relative",
            }}
          >
            Chatbot
            <button
              aria-label="Close Chatbot"
              onClick={toggleChat}
              style={{
                position: "absolute",
                right: "10px",
                top: "5px",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              fontSize: "14px",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "8px",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    backgroundColor:
                      msg.sender === "user" ? "#0070f3" : "#f1f0f0",
                    color: msg.sender === "user" ? "white" : "black",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isTyping && (
              <div style={{ fontStyle: "italic", color: "#666" }}>Typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleUserInput}
            style={{ display: "flex", borderTop: "1px solid #eee" }}
          >
            <input
              type="text"
              value={question}
              placeholder="Ask me anything..."
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                outline: "none",
                fontSize: "14px",
                borderRadius: "0 0 0 8px",
              }}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping}
              style={{
                padding: "8px 12px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                cursor: isTyping ? "not-allowed" : "pointer",
                borderRadius: "0 0 8px 0",
              }}
            >
              Send
            </button>
          </form>

          {/* Chatbot response handler triggers on new question */}
          <ChatbotResponseHandler
            question={messages.length ? messages[messages.length - 1].text : ""}
            onAnswer={handleAnswer}
          />
        </div>
      )}
    </>
  );
};

export default Chatbot;
