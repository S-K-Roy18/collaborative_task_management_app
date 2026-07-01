const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// @route   GET /api/analytics/workspace/:workspaceId
// @desc    Get analytics for a specific workspace
// @access  Private
router.get('/workspace/:workspaceId', protect, analyticsController.getWorkspaceAnalytics);

module.exports = router;
