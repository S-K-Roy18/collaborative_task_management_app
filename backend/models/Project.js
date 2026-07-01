const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required']
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required']
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    startDate: {
      type: Date,
      default: Date.now
    },
    deadline: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    techStack: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Archived', 'On Hold'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes to improve query performance
projectSchema.index({ workspace: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
