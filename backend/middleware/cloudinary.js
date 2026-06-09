const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} else {
  console.warn('Cloudinary warning: Missing configuration in .env. Falling back to local storage.');
}

/**
 * Uploads a local file to Cloudinary and deletes the local copy.
 * @param {string} localFilePath - Path to the local file.
 * @returns {Promise<{secure_url: string, public_id: string, success: boolean}>}
 */
const uploadToCloudinary = async (localFilePath) => {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local file not found at path: ${localFilePath}`);
  }

  if (isConfigured) {
    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'ctm_app',
        resource_type: 'auto', // Auto-detect format (image, raw, video, etc.)
      });
      // Delete the local file after uploading
      fs.unlinkSync(localFilePath);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        success: true
      };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
  } else {
    // Local fallback: return a relative path that can be served by the express.static middleware
    const fileName = path.basename(localFilePath);
    const relativePath = `/uploads/${fileName}`;
    return {
      secure_url: relativePath,
      public_id: 'local_fallback',
      success: true
    };
  }
};

module.exports = {
  uploadToCloudinary,
  isConfigured
};
