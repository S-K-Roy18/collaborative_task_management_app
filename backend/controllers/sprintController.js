const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

// Get all sprints for a project
exports.getSprintsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const sprints = await Sprint.find({ project: projectId }).sort('startDate');
    res.status(200).json({ success: true, sprints });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Create a new sprint
exports.createSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, workspace } = req.body;
    const { projectId } = req.params;

    const sprint = await Sprint.create({
      name,
      goal,
      project: projectId,
      workspace,
      startDate,
      endDate
    });

    res.status(201).json({ success: true, sprint });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update sprint
exports.updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findByIdAndUpdate(req.params.sprintId, req.body, { new: true, runValidators: true });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }
    res.status(200).json({ success: true, sprint });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete sprint
exports.deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findByIdAndDelete(req.params.sprintId);
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }
    // Remove sprint reference from all tasks
    await Task.updateMany({ sprint: req.params.sprintId }, { $unset: { sprint: 1 } });
    
    res.status(200).json({ success: true, message: 'Sprint deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
