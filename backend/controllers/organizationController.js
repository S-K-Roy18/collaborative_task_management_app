const Organization = require('../models/Organization');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create new organization
// @route   POST /api/organization
// @access  Private
exports.createOrganization = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    if (!name) {
      return next(new AppError('Organization name is required', 400));
    }

    const organization = new Organization({
      name,
      description,
      owner: userId,
      members: [{ user: userId, role: 'Super Admin' }],
    });

    organization.generateInviteCode();
    await organization.save();

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization,
    });
  } catch (error) {
    console.error('Create organization error:', error);
    next(new AppError('Failed to create organization', 500));
  }
};

// @desc    Join organization via invite code
// @route   POST /api/organization/join
// @access  Private
exports.joinOrganization = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return next(new AppError('Invite code is required', 400));
    }

    const organization = await Organization.findOne({ inviteCode });
    if (!organization) {
      return next(new AppError('Invalid invite code', 404));
    }

    if (organization.isMember(userId)) {
      return next(new AppError('You are already a member of this organization', 400));
    }

    // Default joined role is Developer
    organization.members.push({ user: userId, role: 'Developer' });
    await organization.save();

    res.json({
      success: true,
      message: 'Joined organization successfully',
      organization,
    });
  } catch (error) {
    console.error('Join organization error:', error);
    next(new AppError('Failed to join organization', 500));
  }
};

// @desc    Get details of a specific organization
// @route   GET /api/organization/:orgId
// @access  Private
exports.getOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user._id;

    const organization = await Organization.findById(orgId).populate('owner', 'name email avatar');
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    if (!organization.isMember(userId)) {
      return next(new AppError('Access denied: not a member of this organization', 403));
    }

    const userRole = organization.getUserRole(userId);

    res.json({
      success: true,
      organization,
      userRole,
    });
  } catch (error) {
    console.error('Get organization error:', error);
    next(new AppError('Failed to fetch organization details', 500));
  }
};

// @desc    Get all organizations the user belongs to
// @route   GET /api/organization/my-organizations
// @access  Private
exports.getMyOrganizations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const organizations = await Organization.find({
      'members.user': userId,
    }).populate('owner', 'name email avatar');

    res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error('Get my organizations error:', error);
    next(new AppError('Failed to fetch user organizations', 500));
  }
};

// @desc    Get list of members in an organization
// @route   GET /api/organization/:orgId/members
// @access  Private
exports.getOrganizationMembers = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user._id;

    const organization = await Organization.findById(orgId).populate('members.user', 'name email avatar');
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    if (!organization.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    res.json({
      success: true,
      members: organization.members,
    });
  } catch (error) {
    console.error('Get organization members error:', error);
    next(new AppError('Failed to fetch members list', 500));
  }
};

// @desc    Remove a member from an organization
// @route   DELETE /api/organization/:orgId/members/:memberUserId
// @access  Private (Admin or Super Admin only)
exports.removeMember = async (req, res, next) => {
  try {
    const { orgId, memberUserId } = req.params;
    const currentUserId = req.user._id;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    // Only Admin or Super Admin can remove members
    if (!organization.hasPermission(currentUserId, 'Admin')) {
      return next(new AppError('Access denied: Admin permissions required', 403));
    }

    // Check if member to remove is the owner or Super Admin
    const memberRole = organization.getUserRole(memberUserId);
    if (memberRole === 'Super Admin' || organization.owner.toString() === memberUserId.toString()) {
      return next(new AppError('Cannot remove organization owner or Super Admin', 400));
    }

    // Remove member
    organization.members = organization.members.filter(
      member => member.user.toString() !== memberUserId.toString()
    );
    await organization.save();

    res.json({
      success: true,
      message: 'Member removed successfully',
      organization,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    next(new AppError('Failed to remove member', 500));
  }
};

// @desc    Update a member's role in the organization
// @route   PUT /api/organization/:orgId/members/:memberUserId/role
// @access  Private (Admin or Super Admin only)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { orgId, memberUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    if (!role) {
      return next(new AppError('Role is required', 400));
    }

    const validRoles = ['Admin', 'Project Manager', 'Team Lead', 'Developer', 'Tester', 'Guest'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    // Only Admin or Super Admin can modify roles
    if (!organization.hasPermission(currentUserId, 'Admin')) {
      return next(new AppError('Access denied: Admin permissions required', 403));
    }

    // Check if targeting the owner
    if (organization.owner.toString() === memberUserId.toString()) {
      return next(new AppError('Cannot modify organization owner role', 400));
    }

    const memberIndex = organization.members.findIndex(
      member => member.user.toString() === memberUserId.toString()
    );

    if (memberIndex === -1) {
      return next(new AppError('User is not a member of this organization', 404));
    }

    organization.members[memberIndex].role = role;
    await organization.save();

    res.json({
      success: true,
      message: 'Member role updated successfully',
      organization,
    });
  } catch (error) {
    console.error('Update role error:', error);
    next(new AppError('Failed to update member role', 500));
  }
};
