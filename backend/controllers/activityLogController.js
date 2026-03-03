const ActivityLog = require('../models/ActivityLog');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get activity logs for a task
// @route   GET /api/activitylog/task/:taskId
// @access  Private
exports.getTaskActivityLogs = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const logs = await ActivityLog.find({ task: taskId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      activityLogs: logs,
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    next(new AppError('Failed to get activity logs', 500));
  }
};
