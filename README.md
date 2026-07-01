# Collaborative Task Management Platform (CTM App)

A real-time, multi-tenant collaborative project and task management SaaS platform designed to reduce project tracking overhead, enhance team communication, and automate task planning using AI.

---

## 🚀 Features

### 🏢 1. Organization Portal & RBAC
*   **Multi-Tenancy**: Create and manage organizations with unique invite codes.
*   **Role-Based Access Control (RBAC)**: Custom role hierarchies including `Super Admin`, `Admin`, `Project Manager`, `Team Lead`, `Developer`, `Tester`, and `Guest`.
*   **Granular Permission System**: Enforce secure access checks across organizational routes (e.g. creating workspaces requires at least a `Team Lead` role).

### 📁 2. Project Management & Cloning
*   **Project Workspace**: Organize task cards under dedicated projects inside workspaces.
*   **Project Metrics**: Track priorities, budget allocations, start/end dates, and completion status.
*   **Task-Replicating Project Cloner**: Duplicate existing projects instantly, automatically copying all tasks and workspace details under a new clone.

### 💬 3. Slack-Style Real-Time Chat System
*   **Workspace Channels & DMs**: Host public/private group channels or direct messages (DMs).
*   **Real-Time Sync**: Live typing indicators, active online presence indicators, and instant notification bubbles powered by Socket.io.
*   **Interactive Chat**: Attach multiple files/media, post reactions, and register read receipts.

### ☁️ 4. Cloudinary File Storage
*   **Cloud Persistence**: Pipe all task attachments and chat media through Cloudinary CDN storage.
*   **Frictionless Fallback**: Automatically falls back to saving files locally under `/uploads/` if Cloudinary credentials are not configured, ensuring easy local development.

### 🤖 5. Gemini AI Features
*   **AI Task Breakdown**: Select any task, click **"Generate with AI"**, and Gemini splits the context into a clean, actionable subtask checklist.
*   **AI Workplace Insights**: Analyzes overall workspace health (detecting overdue deadlines, stuck high-priority items, and team members with overload issues) and generates mitigation suggestions.

### 📊 6. Advanced Analytics & Reporting
*   **Workspace Dashboards**: Visualize task distributions, priority breakdowns, and 30-day team velocity using responsive Recharts pie and line charts.
*   **Performance Exporting**: Download live analytics data as CSV reports instantly for external stakeholder updates.

### 🔗 7. Third-Party Integrations (Simulated)
*   **GitHub Sync**: Simulated OAuth flow to effortlessly import GitHub issues and convert them directly into Kanban tasks.
*   **Slack Webhooks**: Simulated integrations dashboard to push real-time task notifications into designated Slack `#channels`.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 15, React 19, Tailwind CSS, TypeScript, Socket.io Client
*   **Backend**: Node.js, Express.js, Socket.io, Mongoose (MongoDB Atlas), Google Generative AI (Gemini SDK), Cloudinary SDK
*   **Testing**: Jest, Supertest

---

## ⚙️ Configuration & Environment Setup

### Backend (.env)
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ctm_app
JWT_SECRET=your_jwt_secret_key_here

# Gemini AI (or OpenAI fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Integration (Optional: falls back to local disc storage if empty)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_SECRET=your-jwt-secret-key-here-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
```

---

## 💻 Installation & Quickstart

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to access the portal.

---

## 🧪 Running Integration Tests

To verify APIs, RBAC bounds, and AI mocks, run the backend Jest tests sequentially:
```bash
cd backend
npx jest test/workspace.test.js test/chat.test.js test/cloudinary.test.js test/organization.test.js test/project.test.js test/ai.test.js --runInBand
```
