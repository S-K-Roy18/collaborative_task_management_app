const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// Configure multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf|doc|docx|txt|csv|xls|xlsx|zip/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // allow any file type since it's a general task manager
    return cb(null, true);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max size
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// @route   POST /api/upload
// @desc    Upload a single file
// @access  Private
router.post('/', protect, upload.any(), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploadedFile = req.files[0];

  res.status(200).json({
    success: true,
    file: {
      url: `/uploads/${uploadedFile.filename}`,
      name: uploadedFile.originalname,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype
    }
  });
});

module.exports = router;
