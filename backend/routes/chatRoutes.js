const express = require('express');
const router = express.Router();
const { 
  getWorkspaceRooms, 
  createRoom, 
  getMessages, 
  sendMessage, 
  reactToMessage, 
  markAsRead 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary local storage for now

// Room routes
router.get('/workspace/:workspaceId/rooms', getWorkspaceRooms);
router.post('/workspace/:workspaceId/rooms', createRoom);

// Message routes
router.get('/room/:roomId/messages', getMessages);
router.post('/room/:roomId/message', upload.array('files'), sendMessage);
router.post('/room/:roomId/read', markAsRead);
router.post('/message/:messageId/react', reactToMessage);

module.exports = router;
