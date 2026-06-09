const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, isConfigured } = require('../middleware/cloudinary');

// Mock cloudinary SDK
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn().mockResolvedValue({
          secure_url: 'https://res.cloudinary.com/test_cloud/image/upload/v1234567/ctm_app/test_file.png',
          public_id: 'ctm_app/test_file',
        }),
      },
    },
  };
});

describe('Cloudinary Integration Service', () => {
  const testFilePath = path.join(__dirname, 'test_temp_upload_file.txt');

  beforeEach(() => {
    // Create a dummy file for upload testing
    fs.writeFileSync(testFilePath, 'dummy content for test upload');
  });

  afterEach(() => {
    // Clean up if the file still exists
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    jest.clearAllMocks();
  });

  test('Upload to Cloudinary (Mocked Success)', async () => {
    const cloudinary = require('cloudinary').v2;
    
    // Temporarily force isConfigured check in test scope
    // We import cloudinary.js again or mock the configuration
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      CLOUDINARY_CLOUD_NAME: 'test_cloud',
      CLOUDINARY_API_KEY: 'test_key',
      CLOUDINARY_API_SECRET: 'test_secret',
    };

    // Re-require module to evaluate configuration
    jest.isolateModules(async () => {
      const { uploadToCloudinary: isolatedUpload } = require('../middleware/cloudinary');
      
      const result = await isolatedUpload(testFilePath);

      expect(result.success).toBe(true);
      expect(result.secure_url).toBe('https://res.cloudinary.com/test_cloud/image/upload/v1234567/ctm_app/test_file.png');
      expect(result.public_id).toBe('ctm_app/test_file');
      
      // Local file should be deleted on success
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    process.env = originalEnv;
  });

  test('Local fallback when configuration is missing', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    };

    jest.isolateModules(async () => {
      const { uploadToCloudinary: isolatedUpload, isConfigured: isolatedIsConfigured } = require('../middleware/cloudinary');
      
      expect(isolatedIsConfigured).toBe(false);

      const result = await isolatedUpload(testFilePath);

      expect(result.success).toBe(true);
      expect(result.secure_url).toContain('/uploads/');
      expect(result.public_id).toBe('local_fallback');
      
      // File should NOT be deleted in local fallback since it's saved locally
      expect(fs.existsSync(testFilePath)).toBe(true);
    });

    process.env = originalEnv;
  });

  test('Throws error if file does not exist', async () => {
    const nonExistentPath = path.join(__dirname, 'non_existent_file.txt');
    await expect(uploadToCloudinary(nonExistentPath)).rejects.toThrow();
  });
});
