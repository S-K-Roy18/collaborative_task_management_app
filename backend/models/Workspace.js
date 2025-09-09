const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
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
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  inviteCode: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowInvites: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Generate unique invite code
workspaceSchema.methods.generateInviteCode = function() {
  this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Check if user is member of workspace
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

// Get user's role in workspace
workspaceSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
  return member ? member.role : null;
};

// Check if user has permission for action
workspaceSchema.methods.hasPermission = function(userId, requiredRole) {
  const userRole = this.getUserRole(userId);
  if (!userRole) return false;

  const roleHierarchy = { viewer: 1, member: 2, admin: 3 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('Workspace', workspaceSchema);
