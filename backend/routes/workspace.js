const express = require('express');
const jwt = require('jsonwebtoken');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Create workspace
    const workspace = new Workspace({
      name,
      description,
      owner: userId,
      members: [{
        user: userId,
        role: 'admin',
      }],
    });

    // Generate invite code
    workspace.generateInviteCode();
    await workspace.save();

    // Update user's workspaces
    await User.findByIdAndUpdate(userId, {
      $push: {
        workspaces: {
          workspace: workspace._id,
          role: 'admin',
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        inviteCode: workspace.inviteCode,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Create workspace error:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create workspace',
    });
  }
});

router.get('/my-workspaces', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: 'workspaces.workspace',
      select: 'name description owner members',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const workspaces = user.workspaces
      .filter(ws => ws.workspace !== null) // Filter out deleted workspaces
      .map(ws => ({
        id: ws.workspace._id,
        name: ws.workspace.name,
        description: ws.workspace.description,
        role: ws.role,
        memberCount: ws.workspace.members.length,
        isOwner: ws.workspace.owner.toString() === userId,
      }));

    res.json({
      success: true,
      workspaces,
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workspaces',
    });
  }
});

router.post('/join/:inviteCode', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findOne({ inviteCode });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code',
      });
    }

    // Check if user is already a member
    if (workspace.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace',
      });
    }

    // Add user to workspace
    workspace.members.push({
      user: userId,
      role: 'member',
    });
    await workspace.save();

    // Update user's workspaces
    await User.findByIdAndUpdate(userId, {
      $push: {
        workspaces: {
          workspace: workspace._id,
          role: 'member',
        },
      },
    });

    res.json({
      success: true,
      message: 'Successfully joined workspace',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        role: 'member',
      },
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join workspace',
    });
  }
});

// DELETE workspace by ID (only owner can delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    // Check if requester is owner
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this workspace' });
    }

    // Remove workspace references from all users
    await User.updateMany(
      { 'workspaces.workspace': req.params.id },
      { $pull: { workspaces: { workspace: req.params.id } } }
    );

    await workspace.deleteOne();
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:workspaceId', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    console.log('Workspace GET userId:', userId);

    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    console.log('Workspace members:', workspace.members.map(m => m.user._id.toString()));

    // Check if user is a member
    const isMember = workspace.isMember(userId);
    console.log('Is user member:', isMember);

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const userRole = workspace.getUserRole(userId);

    res.json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        owner: workspace.owner,
        members: workspace.members.map(member => ({
          id: member.user._id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
        userRole,
        inviteCode: userRole === 'admin' ? workspace.inviteCode : null,
        settings: workspace.settings,
        createdAt: workspace.createdAt,
      },
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workspace',
    });
  }
});

router.put('/:workspaceId/settings', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { name, description, settings } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Update fields
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };

    await workspace.save();

    res.json({
      success: true,
      message: 'Workspace updated successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        settings: workspace.settings,
      },
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workspace',
    });
  }
});

router.post('/:workspaceId/regenerate-code', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    workspace.generateInviteCode();
    await workspace.save();

    res.json({
      success: true,
      message: 'Invite code regenerated',
      inviteCode: workspace.inviteCode,
    });
  } catch (error) {
    console.error('Regenerate code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate invite code',
    });
  }
});

module.exports = router;
