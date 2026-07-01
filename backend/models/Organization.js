const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  logo: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Super Admin', 'Admin', 'Member', 'Guest'], default: 'Member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  settings: {
    brandingColors: { type: String, default: '#3b82f6' },
    require2FA: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  inviteCode: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
