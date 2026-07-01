const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      name, profilePicture, jobTitle, department, contactInformation, bio, skills, timezone, notificationPreferences
    } = req.body;

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (department !== undefined) user.department = department;
    if (contactInformation !== undefined) user.contactInformation = contactInformation;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (timezone) user.timezone = timezone;
    if (notificationPreferences) user.notificationPreferences = notificationPreferences;

    const updatedUser = await user.save();
    
    const userObj = updatedUser.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.twoFactorSecret;

    res.json(userObj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
