"use client";

import React from 'react';

const faqs = [
  {
    question: "How do I sign up?",
    answer: "Click the signup button on the homepage and fill out the registration form.",
  },
  {
    question: "How do I create a project?",
    answer: "Navigate to the Dashboard and click 'Create Project' to start a new project.",
  },
  {
    question: "How do notifications work?",
    answer: "You will get notified when you are assigned tasks, mentioned, or when important changes happen.",
  },
  {
    question: "Can I assign tasks to team members?",
    answer: "Yes, while creating or editing a task, select a team member to assign it to.",
  },
  {
    question: "How do I mark tasks as complete?",
    answer: "Click the checkbox or mark complete button on the task details or list.",
  },
  {
    question: "How can I view project activity?",
    answer: "Go to the project page and review the Activity Log section.",
  },
  {
    question: "What should I do if I don’t understand something?",
    answer: "Try asking the chatbot for help or refer to these FAQs for common questions.",
  },
  {
    question: "Who can I contact for support?",
    answer: "Reach out to your project admin or support team for assistance.",
  },
];

const FAQPage: React.FC = () => {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Frequently Asked Questions</h1>
      {faqs.map(({ question, answer }, idx) => (
        <section key={idx} style={{ marginBottom: '1rem' }}>
          <h3>{question}</h3>
          <p>{answer}</p>
        </section>
      ))}
    </main>
  );
};

export default FAQPage;
