const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/workspace/create
// @desc    Create new workspace
// @access  Private
router.post('/create', authenticate, workspaceController.createWorkspace);

// @route   GET /api/workspace/my-workspaces
// @desc    Get all workspaces for current user
// @access  Private
router.get('/my-workspaces', authenticate, workspaceController.getMyWorkspaces);

// @route   POST /api/workspace/join/:inviteCode
// @desc    Join workspace by invite code
// @access  Private
router.post('/join/:inviteCode', authenticate, workspaceController.joinWorkspace);

// @route   GET /api/workspace/:workspaceId
// @desc    Get workspace by ID
// @access  Private
router.get('/:workspaceId', authenticate, workspaceController.getWorkspace);

// @route   PUT /api/workspace/:workspaceId/settings
// @desc    Update workspace settings
// @access  Private (Admin only)
router.put('/:workspaceId/settings', authenticate, workspaceController.updateWorkspaceSettings);

// @route   POST /api/workspace/:workspaceId/regenerate-code
// @desc    Regenerate invite code
// @access  Private (Admin only)
router.post('/:workspaceId/regenerate-code', authenticate, workspaceController.regenerateInviteCode);

// @route   DELETE /api/workspace/:id
// @desc    Delete workspace
// @access  Private (Owner only)
router.delete('/:id', authenticate, workspaceController.deleteWorkspace);

// @route   DELETE /api/workspace/:workspaceId/members/:memberId
// @desc    Remove member from workspace
// @access  Private (Admin only)
router.delete('/:workspaceId/members/:memberId', authenticate, workspaceController.removeMember);

// @route   PUT /api/workspace/:workspaceId/members/:memberId
// @desc    Update member role
// @access  Private (Admin only)
router.put('/:workspaceId/members/:memberId', authenticate, workspaceController.updateMemberRole);

module.exports = router;
