const Organization = require('../models/Organization');

exports.createOrganization = async (req, res) => {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orgData = {
      ...req.body,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Super Admin' }],
      inviteCode
    };
    const organization = await Organization.create(orgData);
    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find();
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('members.user', 'name email avatar');
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndDelete(req.params.id);
    if (!organization) return res.status(404).json({ success: false, error: 'Organization not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMyOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({
      'members.user': req.user._id
    }).populate('owner', 'name email');

    // Backwards compatibility: Auto-generate invite code for existing orgs that don't have one
    let updated = false;
    for (let org of organizations) {
      if (!org.inviteCode) {
        org.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await org.save();
        updated = true;
      }
    }

    res.status(200).json({ success: true, organizations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.joinOrganization = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) return res.status(400).json({ success: false, message: 'Invite code is required' });

    const organization = await Organization.findOne({ inviteCode });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }
    
    // Check if already a member
    const isMember = organization.members.some(member => member.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member' });
    }

    organization.members.push({ user: req.user._id, role: 'Member' });
    await organization.save();

    res.status(200).json({ success: true, message: 'Joined successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
