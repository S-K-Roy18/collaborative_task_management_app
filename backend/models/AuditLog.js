const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    entity: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['Task', 'Project', 'Milestone', 'Workspace', 'User', 'Comment', 'Attachment']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required']
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // flexible structure for before/after states or custom metadata
      default: {}
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  {
    // Audit logs are typically immutable, so we only need createdAt
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes for querying audit trails efficiently
auditLogSchema.index({ entityId: 1, entity: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
