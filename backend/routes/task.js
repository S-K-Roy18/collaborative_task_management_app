const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Helper function to emit real-time updates
const emitTaskUpdate = (io, workspaceId, event, data) => {
  if (io) {
    io.to(workspaceId).emit(event, data);
  }
};


// Get all tasks in a workspace
router.get('/workspace/:workspaceId', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!req.user || !req.user._id) {
      console.error('Unauthorized: req.user or req.user._id missing');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user._id;
    console.log(`Workspace Get tasks userId: ${userId}, workspaceId: ${workspaceId}`);

    // Check if user is member of workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    let isMember = false;
    try {
      isMember = workspace.isMember(userId);
    } catch (memErr) {
      console.error('workspace.isMember threw error:', memErr);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
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
    console.error('Get tasks error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
    });
  }
});

// Create a new task

router.post('/', authenticate, async (req, res) => {
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

    if (!req.user || !req.user._id) {
      console.error('Unauthorized: req.user or req.user._id missing');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user._id;

    // Check if user is member of workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
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
    const ActivityLog = require('../models/ActivityLog');
    const Notification = require('../models/Notification');
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

    // Emit real-time update to workspace and notification event to assignees
    const io = req.app.get('io');
    emitTaskUpdate(io, workspaceId, 'taskCreated', {
      task,
      userId,
      workspaceId,
    });

    notifications.forEach(notification => {
      io.to(notification.user.toString()).emit('notification', notification);
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
});

// Get a specific task
router.get('/:taskId', authenticate, async (req, res) => {
  try {
    console.log('Get task handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('workspace', 'name')
      .populate('comments.author', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task',
    });
  }
});

// Update a task
router.put('/:taskId', authenticate, async (req, res) => {
  try {
    console.log('Update task handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
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
    const ActivityLog = require('../models/ActivityLog');
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'updated',
      details: `Task "${task.title}" was updated`,
    });
    await activity.save();

    // Emit real-time update to workspace
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'taskUpdated', {
      task,
      userId: req.user._id,
      workspaceId: task.workspace.toString()
    });


    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
});

// Delete a task
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    console.log('Delete task handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Activity logging before deletion
    const ActivityLog = require('../models/ActivityLog');
    const activity = new ActivityLog({
      user: userId,
      workspace: task.workspace,
      task: task._id,
      action: 'deleted',
      details: `Task "${task.title}" was deleted`,
    });
    await activity.save();

    await task.deleteOne();

    // Emit real-time update to workspace
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'taskDeleted', {
      taskId,
      userId: req.user._id,
      workspaceId: task.workspace.toString()
    });
  } catch (error) {
    console.error('Delete task error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
});

// Upload files for a task
router.post('/:taskId/upload', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    console.log('Upload files handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    // Add uploaded files to task attachments
    const newAttachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
    }));

    task.attachments = [...(task.attachments || []), ...newAttachments];
    await task.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      attachments: newAttachments,
    });
  } catch (error) {
    console.error('Upload error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
    });
  }
});

// Delete an attachment from a task
router.delete('/:taskId/attachment/:filename', authenticate, async (req, res) => {
  try {
    console.log('Delete attachment handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId, filename } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Find and remove the attachment
    const attachmentIndex = task.attachments.findIndex(att => att.filename === filename);
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
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
    console.error('Delete attachment error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
    });
  }
});

router.post('/:taskId/comments', authenticate, async (req, res) => {
  try {
    console.log('Add comment handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
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

    // TODO: Create notifications for mentions in comment (can parse content for @mentions later)

    // Emit real-time update to workspace
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'commentAdded', {
      taskId,
      comment: task.comments[task.comments.length - 1],
      userId: req.user._id,
      workspaceId: task.workspace.toString()
    });



    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: task.comments[task.comments.length - 1],
    });
  } catch (error) {
    console.error('Add comment error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
});

router.delete('/:taskId/comments/:commentId', authenticate, async (req, res) => {
  try {
    console.log('Delete comment handler, req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identification' });
    }
    const taskIdParam = req.params.taskId;
    const commentIdParam = req.params.commentId;
    const userId = req.user._id;

    const task = await Task.findById(taskIdParam);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is member of workspace
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Find the comment
    const commentIndex = task.comments.findIndex(comment => comment._id.toString() === commentIdParam);
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author of the comment
    if (task.comments[commentIndex].author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
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

    // Emit real-time update to workspace
    const io = req.app.get('io');
    emitTaskUpdate(io, task.workspace.toString(), 'commentDeleted', {
      taskId: taskIdParam,
      commentId: commentIdParam,
      userId: req.user._id,
      workspaceId: task.workspace.toString()
    });


    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
    });
  }
});

module.exports = router;
