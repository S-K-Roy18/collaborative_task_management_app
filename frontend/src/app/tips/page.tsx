"use client";

import React from 'react';

const tips = [
  "Organize your projects with clear names.",
  "Assign tasks to team members for accountability.",
  "Use tags to categorize and filter tasks easily.",
  "Check notifications regularly for updates.",
  "Communicate effectively through comments on tasks.",
  "Set due dates to keep track of deadlines.",
  "Use the Kanban board for visual task management.",
  "Switch between calendar and list views as needed.",
  "Invite team members to collaborate on projects.",
  "Mark tasks as complete when finished to stay organized.",
];

const TipsPage: React.FC = () => {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Tips for Using the App</h1>
      <ul>
        {tips.map((tip, index) => (
          <li key={index} style={{ margin: '0.5rem 0' }}>
            {tip}
          </li>
        ))}
      </ul>
    </main>
  );
};

export default TipsPage;
