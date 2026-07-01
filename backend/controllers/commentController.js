const Comment = require('../models/Comment');

// Get comments for a task
exports.getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId, isDeleted: false })
      .populate('author', 'name email profilePicture')
      .populate('mentions', 'name email')
      .sort('createdAt');
      
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, mentions } = req.body;

    let comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
      mentions: mentions || []
    });

    comment = await comment.populate('author', 'name email profilePicture');
    
    // Emit real-time comment event if socket exists
    const io = req.app.get('io');
    if (io) {
      // Broadcast to the task's workspace or specific task room
      io.emit('newComment', { comment });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Ensure author owns comment
    let comment = await Comment.findOne({ _id: commentId, author: req.user._id });
    if (!comment) {
      return res.status(403).json({ success: false, message: 'Not authorized or comment not found' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    comment = await comment.populate('author', 'name email profilePicture');

    res.status(200).json({ success: true, comment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findOne({ _id: commentId, author: req.user._id });
    if (!comment) {
      return res.status(403).json({ success: false, message: 'Not authorized or comment not found' });
    }

    comment.isDeleted = true;
    await comment.save();

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
