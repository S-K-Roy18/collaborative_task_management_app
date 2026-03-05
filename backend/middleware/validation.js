const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
exports.authValidation = {
  signup: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

// Task validation rules
exports.taskValidation = {
  create: [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('workspaceId').isMongoId().withMessage('Valid workspace ID is required'),
  ],
};

// Workspace validation rules
exports.workspaceValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Workspace name is required'),
  ],
  join: [
    body('inviteCode').trim().isLength({ min: 6 }).withMessage('Valid invite code is required'),
  ],
};

