# Backend Restructuring TODO

## Phase 1: Fix Foundation

### Step 1: Clean Project Structure
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
