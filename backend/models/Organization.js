const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer', 'Tester', 'Guest'],
      default: 'Developer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

// Generate unique invite code
organizationSchema.methods.generateInviteCode = function() {
  this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Check if user is member of organization
organizationSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

// Get user's role in organization
organizationSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
  return member ? member.role : null;
};

// Check if user has permission for action based on role hierarchy
organizationSchema.methods.hasPermission = function(userId, requiredRole) {
  const userRole = this.getUserRole(userId);
  if (!userRole) return false;

  const roleHierarchy = {
    'Guest': 1,
    'Tester': 2,
    'Developer': 3,
    'Team Lead': 4,
    'Project Manager': 5,
    'Admin': 6,
    'Super Admin': 7
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('Organization', organizationSchema);
