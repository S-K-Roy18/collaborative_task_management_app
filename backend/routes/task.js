const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/task/workspace/:workspaceId
// @desc    Get all tasks in a workspace
// @access  Private
router.get('/workspace/:workspaceId', authenticate, taskController.getWorkspaceTasks);

// @route   POST /api/task
// @desc    Create a new task
// @access  Private
router.post('/', authenticate, taskController.createTask);

// @route   GET /api/task/:taskId
// @desc    Get a specific task
// @access  Private
router.get('/:taskId', authenticate, taskController.getTask);

// @route   PUT /api/task/:taskId
// @desc    Update a task
// @access  Private
router.put('/:taskId', authenticate, taskController.updateTask);

// @route   DELETE /api/task/:taskId
// @desc    Delete a task
// @access  Private
router.delete('/:taskId', authenticate, taskController.deleteTask);

// @route   POST /api/task/:taskId/upload
// @desc    Upload files for a task
// @access  Private
router.post('/:taskId/upload', authenticate, upload.array('files', 10), async (req, res, next) => {
  // Import here to avoid circular dependency
  const Task = require('../models/Task');
  const Workspace = require('../models/Workspace');
  const { AppError } = require('../middleware/errorHandler');

  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const workspace = await Workspace.findById(task.workspace);
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

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
    next(new AppError('Failed to upload files', 500));
  }
});

// @route   DELETE /api/task/:taskId/attachment/:filename
// @desc    Delete an attachment from a task
// @access  Private
router.delete('/:taskId/attachment/:filename', authenticate, taskController.deleteAttachment);

// @route   POST /api/task/:taskId/comments
// @desc    Add comment to a task
// @access  Private
router.post('/:taskId/comments', authenticate, taskController.addComment);

// @route   DELETE /api/task/:taskId/comments/:commentId
// @desc    Delete comment from a task
// @access  Private
router.delete('/:taskId/comments/:commentId', authenticate, taskController.deleteComment);

module.exports = router;
