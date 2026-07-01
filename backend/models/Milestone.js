const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Milestone name is required'],
      trim: true,
      maxlength: [100, 'Milestone name cannot exceed 100 characters']
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required']
    },
    goals: [
      {
        type: String,
        trim: true
      }
    ],
    duration: {
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
    },
    completionPercentage: {
      type: Number,
      min: [0, 'Completion percentage cannot be less than 0'],
      max: [100, 'Completion percentage cannot be more than 100'],
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for typical project-based queries
milestoneSchema.index({ project: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = Milestone;
