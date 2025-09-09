const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all tasks in a workspace
router.get('/workspace/:workspaceId', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

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
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
    });
  }
});

// Create a new task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, assignees, dueDate, priority, status, subtasks, workspaceId } = req.body;
    const userId = req.user.id;

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
      workspace: workspaceId,
      createdBy: userId,
    });

    await task.save();

    // Populate the created task
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
});

// Get a specific task
router.get('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

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
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task',
    });
  }
});

// Update a task
router.put('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
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

    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
});

// Delete a task
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

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

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
});

// Upload files for a task
router.post('/:taskId/upload', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

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
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
    });
  }
});

// Delete an attachment from a task
router.delete('/:taskId/attachment/:filename', authenticate, async (req, res) => {
  try {
    const { taskId, filename } = req.params;
    const userId = req.user.id;

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
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
    });
  }
});

// Add a comment to a task
router.post('/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

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

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: task.comments[task.comments.length - 1],
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
});

// Delete a comment from a task
router.delete('/:taskId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user.id;

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

    // Find the comment
    const commentIndex = task.comments.findIndex(comment => comment._id.toString() === commentId);
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

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
    });
  }
});

module.exports = router;
