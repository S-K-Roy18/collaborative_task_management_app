const Workspace = require('../models/Workspace');

exports.createWorkspace = async (req, res) => {
  try {
    const workspaceData = { 
      ...req.body, 
      members: [{ user: req.user._id, role: 'Project Manager' }]
    };
    const workspace = await Workspace.create(workspaceData);
    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find();
    res.status(200).json({ success: true, data: workspaces });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('members.user', 'name email profilePicture');
    if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });
    res.status(200).json({ success: true, workspace }); // Frontend expects `workspace` instead of `data`

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });
    res.status(200).json({ success: true, data: workspace });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('organization', 'name logo');
    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });
    
    // Check if user is already a member
    if (workspace.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ success: false, error: 'User is already a member of this workspace' });
    }

    workspace.members.push({ user: userId, role: role || 'Developer' });
    await workspace.save();
    
    res.status(200).json({ success: true, workspace });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
