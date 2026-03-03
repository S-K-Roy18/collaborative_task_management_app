const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(new AppError('Failed to load notifications', 500));
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    next(new AppError('Failed to update notification', 500));
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    next(new AppError('Failed to update notifications', 500));
  }
};
