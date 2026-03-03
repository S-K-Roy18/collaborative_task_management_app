const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create new workspace
// @route   POST /api/workspace/create
// @access  Private
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return next(new AppError('Workspace name is required', 400));
    }

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
    next(new AppError('Failed to create workspace', 500));
  }
};

// @desc    Get all workspaces for current user
// @route   GET /api/workspace/my-workspaces
// @access  Private
exports.getMyWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: 'workspaces.workspace',
      select: 'name description owner members',
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const workspaces = user.workspaces
      .filter(ws => ws.workspace !== null)
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
    next(new AppError('Failed to get workspaces', 500));
  }
};

// @desc    Join workspace by invite code
// @route   POST /api/workspace/join/:inviteCode
// @access  Private
exports.joinWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findOne({ inviteCode });

    if (!workspace) {
      return next(new AppError('Invalid invite code', 404));
    }

    // Check if user is already a member
    if (workspace.isMember(userId)) {
      return next(new AppError('You are already a member of this workspace', 400));
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
    next(new AppError('Failed to join workspace', 500));
  }
};

// @desc    Get workspace by ID
// @route   GET /api/workspace/:workspaceId
// @access  Private
exports.getWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if user is a member
    const isMember = workspace.isMember(userId);

    if (!isMember) {
      return next(new AppError('Access denied', 403));
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
    next(new AppError('Failed to get workspace', 500));
  }
};

// @desc    Update workspace settings
// @route   PUT /api/workspace/:workspaceId/settings
// @access  Private (Admin only)
exports.updateWorkspaceSettings = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { name, description, settings } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return next(new AppError('Admin access required', 403));
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
    next(new AppError('Failed to update workspace', 500));
  }
};

// @desc    Regenerate invite code
// @route   POST /api/workspace/:workspaceId/regenerate-code
// @access  Private (Admin only)
exports.regenerateInviteCode = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return next(new AppError('Admin access required', 403));
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
    next(new AppError('Failed to regenerate invite code', 500));
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspace/:id
// @access  Private (Owner only)
exports.deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if requester is owner
    if (workspace.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this workspace', 403));
    }

    // Remove workspace references from all users
    await User.updateMany(
      { 'workspaces.workspace': req.params.id },
      { $pull: { workspaces: { workspace: req.params.id } } }
    );

    await workspace.deleteOne();

    res.json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    next(new AppError('Failed to delete workspace', 500));
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspace/:workspaceId/members/:memberId
// @access  Private (Admin only)
exports.removeMember = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return next(new AppError('Admin access required', 403));
    }

    // Cannot remove owner
    if (memberId === workspace.owner.toString()) {
      return next(new AppError('Cannot remove workspace owner', 400));
    }

    // Remove member from workspace
    workspace.members = workspace.members.filter(
      member => member.user.toString() !== memberId
    );
    await workspace.save();

    // Remove workspace from user's list
    await User.findByIdAndUpdate(memberId, {
      $pull: { workspaces: { workspace: workspaceId } }
    });

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    next(new AppError('Failed to remove member', 500));
  }
};

// @desc    Update member role
// @route   PUT /api/workspace/:workspaceId/members/:memberId
// @access  Private (Admin only)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    // Check if user is admin
    if (!workspace.hasPermission(userId, 'admin')) {
      return next(new AppError('Admin access required', 403));
    }

    // Cannot change owner's role
    if (memberId === workspace.owner.toString()) {
      return next(new AppError('Cannot change workspace owner role', 400));
    }

    // Update member role
    const member = workspace.members.find(
      member => member.user.toString() === memberId
    );

    if (!member) {
      return next(new AppError('Member not found', 404));
    }

    member.role = role;
    await workspace.save();

    // Update role in user's workspaces
    await User.findByIdAndUpdate(memberId, {
      $set: { 'workspaces.$[elem].role': role }
    },
    {
      arrayFilters: [{ 'elem.workspace': workspaceId }]
    });

    res.json({
      success: true,
      message: 'Member role updated successfully',
      member: {
        id: member.user,
        role: member.role,
      },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    next(new AppError('Failed to update member role', 500));
  }
};
