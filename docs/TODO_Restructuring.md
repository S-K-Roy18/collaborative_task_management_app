# Backend Restructuring TODO

## Phase 1: Fix Foundation - COMPLETED

### Step 1: Clean Project Structure - COMPLETED
- [x] Create controllers folder
- [x] Create authController.js
- [x] Create workspaceController.js
- [x] Create taskController.js
- [x] Create activityLogController.js
- [x] Create notificationsController.js
- [x] Add error handling middleware
- [x] Add response formatter middleware
- [x] Refactor routes to use controllers
- [x] Update app.js with new structure
- [x] Fix duplicate signup route in auth.js

### Chatbot Improvements - COMPLETED
- [x] Improved backend chatbot with system prompt (Task Assistant)
- [x] Added better error handling with timeout
- [x] Improved frontend ChatbotResponseHandler
- [x] Added quick suggestions to chatbot UI
- [x] Fixed bug - chatbot no longer triggers on welcome message
- [x] Updated .env.example with OpenAI API key

## New Folder Structure
```
backend/
  controllers/
    authController.js
    workspaceController.js
    taskController.js
    activityLogController.js
    notificationsController.js
  models/
  routes/
  middleware/
    errorHandler.js
    responseFormatter.js
    auth.js (keep)
    upload.js (keep)
  app.js
  .env
