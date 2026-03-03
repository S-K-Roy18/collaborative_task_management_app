const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

// Helper function to emit real-time updates
const emitTaskUpdate = (io, workspaceId, event, data) => {
  if (io) {
    io.to(workspaceId).emit(event, data);
  }
};

// @desc    Get all tasks in a workspace
// @route   GET /api/task/workspace/:workspaceId
// @access  Private
exports.getWorkspaceTasks = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    // Check if user is member of workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    const tasks = await Task.find({ workspace: workspaceId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    next(new AppError('Failed to get tasks', 500));
  }
};

// @desc    Create a new task
// @route   POST /api/task
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assignees,
      dueDate,
      priority,
      status,
      subtasks,
      tags,
      workspaceId,
    } = req.body;

    const userId = req.user._id;

    // Check if user is member of workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    const task = new Task({
      title,
      description,
      assignees: assignees || [],
      dueDate,
      priority: priority || 'medium',
      status: status || 'todo',
      subtasks: subtasks || [],
      tags: tags || [],
      workspace: workspaceId,
      createdBy: userId,
    });

    await task.save();

    // Populate the created task
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    // Activity logging
    const activity = new ActivityLog({
      user: userId,
      workspace: workspaceId,
      task: task._id,
      action: 'created',
      details: `Task "${task.title}" was created`,
    });
    await activity.save();

    // Create notifications for assignees
    const notifications = task.assignees.map(assigneeId => {
      return new Notification({
        user: assigneeId,
        workspace: workspaceId,
        task: task._id,
        type: 'assignment',
        message: `You have been assigned a new task: "${task.title}"`,
      });
    });
    await Notification.insertMany(notifications);

    // Emit real-time update
    const io = req.app.get('io');
    emitTaskUpdate(io, workspaceId, 'taskCreated', {
      task,
      userId,
      workspaceId,
    });

    // Emit notifications to assignees
    if (io) {
      notifications.forEach(notification => {
        io.to(notification.user.toString()).emit('notification', notification);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    next(new AppError('Failed to create task', 500));
  }
};

// @desc    Get a specific task
// @route   GET /api/task/:taskId
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('workspace', 'name')
      .populate('comments.author', 'name email avatar');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    next(new AppError('Failed to get task', 500));
  }
};

// @desc    Update a task
// @route   PUT /api/task/:taskId
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        task[key] = updates[key];
      }
    });

    await task.save();

    // Populate the updated task
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    // Activity logging
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'updated',
      details: `Task "${task.title}" was updated`,
    });
    await activity.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'taskUpdated', {
      task,
      userId: req.user._id,
      workspaceId: task.workspace.toString(),
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    next(new AppError('Failed to update task', 500));
  }
};

// @desc    Delete a task
// @route   DELETE /api/task/:taskId
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Activity logging before deletion
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'deleted',
      details: `Task "${task.title}" was deleted`,
    });
    await activity.save();

    await task.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'taskDeleted', {
      taskId,
      userId: req.user._id,
      workspaceId: task.workspace.toString(),
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    next(new AppError('Failed to delete task', 500));
  }
};

// @desc    Add comment to a task
// @route   POST /api/task/:taskId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return next(new AppError('Comment content is required', 400));
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    const newComment = {
      content: content.trim(),
      author: userId,
      createdAt: new Date(),
    };

    task.comments.push(newComment);
    await task.save();

    // Populate the comment author
    await task.populate('comments.author', 'name email avatar');

    // Log activity
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'commented',
      details: `Comment added on task "${task.title}".`,
    });
    await activity.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'commentAdded', {
      taskId,
      comment: task.comments[task.comments.length - 1],
      userId: req.user._id,
      workspaceId: task.workspace.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: task.comments[task.comments.length - 1],
    });
  } catch (error) {
    console.error('Add comment error:', error);
    next(new AppError('Failed to add comment', 500));
  }
};

// @desc    Delete comment from a task
// @route   DELETE /api/task/:taskId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Find the comment
    const commentIndex = task.comments.findIndex(
      comment => comment._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return next(new AppError('Comment not found', 404));
    }

    // Check if user is the author of the comment
    if (task.comments[commentIndex].author.toString() !== userId) {
      return next(new AppError('You can only delete your own comments', 403));
    }

    task.comments.splice(commentIndex, 1);
    await task.save();

    // Log activity
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'comment deleted',
      details: `Comment deleted on task "${task.title}".`,
    });
    await activity.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'commentDeleted', {
      taskId,
      commentId,
      userId: req.user._id,
      workspaceId: task.workspace.toString(),
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    next(new AppError('Failed to delete comment', 500));
  }
};

// @desc    Delete an attachment from a task
// @route   DELETE /api/task/:taskId/attachment/:filename
// @access  Private
exports.deleteAttachment = async (req, res, next) => {
  try {
    const { taskId, filename } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Find and remove the attachment
    const attachmentIndex = task.attachments.findIndex(
      att => att.filename === filename
    );
    if (attachmentIndex === -1) {
      return next(new AppError('Attachment not found', 404));
    }

    // Remove file from filesystem
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    task.attachments.splice(attachmentIndex, 1);
    await task.save();

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    next(new AppError('Failed to delete attachment', 500));
  }
};
