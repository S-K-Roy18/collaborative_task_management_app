const Milestone = require('../models/Milestone');

exports.createMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.create(req.body);
    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find();
    res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ success: false, error: 'Milestone not found' });
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!milestone) return res.status(404).json({ success: false, error: 'Milestone not found' });
    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndDelete(req.params.id);
    if (!milestone) return res.status(404).json({ success: false, error: 'Milestone not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
