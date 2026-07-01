const AuditLog = require('../models/AuditLog');

exports.createAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.create(req.body);
    res.status(201).json({ success: true, data: auditLog });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const auditLogs = await AuditLog.find();
    res.status(200).json({ success: true, data: auditLogs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id);
    if (!auditLog) return res.status(404).json({ success: false, error: 'Audit log not found' });
    res.status(200).json({ success: true, data: auditLog });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!auditLog) return res.status(404).json({ success: false, error: 'Audit log not found' });
    res.status(200).json({ success: true, data: auditLog });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findByIdAndDelete(req.params.id);
    if (!auditLog) return res.status(404).json({ success: false, error: 'Audit log not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
