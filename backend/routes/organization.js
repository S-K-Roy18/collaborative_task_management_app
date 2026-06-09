const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/organization
// @desc    Create new organization
// @access  Private
router.post('/', authenticate, organizationController.createOrganization);

// @route   POST /api/organization/join
// @desc    Join organization via invite code
// @access  Private
router.post('/join', authenticate, organizationController.joinOrganization);

// @route   GET /api/organization/my-organizations
// @desc    Get all organizations user belongs to
// @access  Private
router.get('/my-organizations', authenticate, organizationController.getMyOrganizations);

// @route   GET /api/organization/:orgId
// @desc    Get specific organization details
// @access  Private
router.get('/:orgId', authenticate, organizationController.getOrganization);

// @route   GET /api/organization/:orgId/members
// @desc    Get members of organization
// @access  Private
router.get('/:orgId/members', authenticate, organizationController.getOrganizationMembers);

// @route   DELETE /api/organization/:orgId/members/:memberUserId
// @desc    Remove a member from organization
// @access  Private
router.delete('/:orgId/members/:memberUserId', authenticate, organizationController.removeMember);

// @route   PUT /api/organization/:orgId/members/:memberUserId/role
// @desc    Update member role in organization
// @access  Private
router.put('/:orgId/members/:memberUserId/role', authenticate, organizationController.updateMemberRole);

module.exports = router;
