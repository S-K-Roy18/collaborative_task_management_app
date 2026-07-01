const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user and get tokens
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public (Requires valid refresh token)
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user and clear tokens
// @access  Public (Optionally private depending on implementation, but clears cookies usually)
router.post('/logout', authController.logout);

module.exports = router;
