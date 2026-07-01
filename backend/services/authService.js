const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'refreshsecret123',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

const register = async (userData) => {
  if (userData.email) {
    userData.email = userData.email.toLowerCase().trim();
  }
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 409;
    throw error;
  }

  const user = new User(userData);
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if (!user.password) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

module.exports = {
  register,
  login,
  generateTokens
};
