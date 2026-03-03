const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/activitylog/task/:taskId
// @desc    Get activity logs for a task
// @access  Private
router.get('/task/:taskId', authenticate, activityLogController.getTaskActivityLogs);

module.exports = router;
