const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/project
// @desc    Create a new project
// @access  Private
router.post('/', authenticate, projectController.createProject);

// @route   GET /api/project/workspace/:workspaceId
// @desc    Get all projects in a workspace
// @access  Private
router.get('/workspace/:workspaceId', authenticate, projectController.getWorkspaceProjects);

// @route   GET /api/project/:projectId
// @desc    Get project details
// @access  Private
router.get('/:projectId', authenticate, projectController.getProject);

// @route   PUT /api/project/:projectId
// @desc    Update project details
// @access  Private
router.put('/:projectId', authenticate, projectController.updateProject);

// @route   DELETE /api/project/:projectId
// @desc    Delete project
// @access  Private
router.delete('/:projectId', authenticate, projectController.deleteProject);

// @route   POST /api/project/:projectId/duplicate
// @desc    Duplicate project
// @access  Private
router.post('/:projectId/duplicate', authenticate, projectController.duplicateProject);

module.exports = router;
