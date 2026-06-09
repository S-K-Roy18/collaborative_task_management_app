const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all chat routes
router.use(authenticate);

// Rooms Management
router.get('/workspace/:workspaceId/rooms', chatController.getWorkspaceRooms);
router.post('/room', chatController.createRoom);

// Message Management
router.get('/room/:roomId/messages', chatController.getRoomMessages);
router.post('/room/:roomId/message', upload.array('files', 5), chatController.sendMessage);

// Message Reactions & Read status
router.post('/message/:messageId/react', chatController.toggleReaction);
router.post('/room/:roomId/read', chatController.markAsRead);

module.exports = router;
