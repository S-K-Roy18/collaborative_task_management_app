const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  action: { type: String, required: true }, // e.g. 'created', 'updated', 'deleted', 'commented'
  details: { type: String }, // optional more info about action
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
