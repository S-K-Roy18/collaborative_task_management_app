const express = require('express');
const router = express.Router();
const { 
  getCommentsByTask, 
  addComment, 
  updateComment, 
  deleteComment 
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/task/:taskId')
  .get(getCommentsByTask)
  .post(addComment);

router.route('/:commentId')
  .put(updateComment)
  .delete(deleteComment);

module.exports = router;
