const Notification = require('../models/Notification');

/**
 * Creates a notification in the database and emits it via socket.io
 * @param {Object} io - The socket.io instance
 * @param {String} userId - The ID of the user to notify
 * @param {Object} data - Notification data { type, message, workspace, task }
 */
exports.sendNotification = async (io, userId, data) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type: data.type || 'info',
      message: data.message,
      workspace: data.workspace,
      task: data.task
    });

    // Emit real-time event to the specific user's room
    if (io) {
      io.to(`user_${userId}`).emit('newNotification', notification);
    }
    
    return notification;
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
};
