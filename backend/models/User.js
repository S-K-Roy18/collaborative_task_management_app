const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // optional if using OAuth
  googleId: { type: String },
  githubId: { type: String },
  profilePicture: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  department: { type: String, default: '' },
  contactInformation: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  timezone: { type: String, default: 'UTC' },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },
  role: { type: String, enum: ['Super Admin', 'Admin', 'User'], default: 'User' },
  isActive: { type: Boolean, default: true },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  refreshToken: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
