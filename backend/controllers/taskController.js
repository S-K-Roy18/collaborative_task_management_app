const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, reporter: req.user._id });
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io && task.workspace) {
      // Fetch populated task to broadcast to clients
      const populatedTask = await Task.findById(task._id).populate('assignees', 'name email avatar');
      io.to(task.workspace.toString()).emit('taskCreated', { task: populatedTask || task });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('assignees', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io && task.workspace) {
      io.to(task.workspace.toString()).emit('taskUpdated', { task });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io && task.workspace) {
      io.to(task.workspace.toString()).emit('taskDeleted', { taskId: task._id.toString() });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTasksByWorkspace = async (req, res) => {
  try {
    const tasks = await Task.find({ workspace: req.params.workspaceId }).populate('assignees', 'name email avatar');
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addAttachment = async (req, res) => {
  try {
    const { url, filename } = req.body;
    if (!url || !filename) {
      return res.status(400).json({ success: false, error: 'URL and filename are required' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { attachments: { url, filename } } },
      { new: true }
    ).populate('assignees', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const io = req.app.get('io');
    if (io && task.workspace) {
      io.to(task.workspace.toString()).emit('taskUpdated', { task });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.removeAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { _id: attachmentId } } },
      { new: true }
    ).populate('assignees', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const io = req.app.get('io');
    if (io && task.workspace) {
      io.to(task.workspace.toString()).emit('taskUpdated', { task });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
