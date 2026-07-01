const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required']
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint'
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    dueDate: {
      type: Date
    },
    estimatedTime: {
      type: Number, // Total estimated minutes
      min: 0,
      default: 0
    },
    actualTime: {
      type: Number, // Total actual minutes
      default: 0,
      min: 0
    },
    timeTracking: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: { type: Date, default: Date.now },
      minutes: { type: Number, required: true },
      description: String
    }],
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ],
    status: {
      type: String,
      enum: ['Backlog', 'Todo', 'In Progress', 'Review', 'Testing', 'Done'],
      default: 'Todo'
    },
    checklist: [checklistItemSchema]
  },
  {
    timestamps: true
  }
);

// Indexes to improve query performance
taskSchema.index({ project: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
