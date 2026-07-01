const express = require('express');
const router = express.Router();
const { handleChatbotQuery } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', handleChatbotQuery);

module.exports = router;
