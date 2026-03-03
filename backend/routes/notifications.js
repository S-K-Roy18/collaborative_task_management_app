const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', authenticate, notificationsController.getNotifications);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, notificationsController.markAllAsRead);

module.exports = router;
