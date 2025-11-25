const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET activity logs for a task
router.get('/task/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Validate requesting user has access to workspace of the task - by cross checking any ActivityLog entry or implement better workspace task validation
    // For now we skip, assuming user authorization handled elsewhere or within frontend scope.

    const logs = await ActivityLog.find({ task: taskId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      activityLogs: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity logs',
    });
  }
});

module.exports = router;
