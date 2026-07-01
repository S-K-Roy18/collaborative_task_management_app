const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Get all chat rooms for a workspace that the user is a member of
exports.getWorkspaceRooms = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const rooms = await ChatRoom.find({
      workspace: workspaceId,
      members: req.user._id
    }).populate('members', 'name email avatar').sort('-lastMessageAt');
    
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Create a new chat room (channel or dm)
exports.createRoom = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, type, members } = req.body; // members should be array of user IDs
    
    // Ensure the creator is in the members list
    const roomMembers = [...new Set([...members, req.user._id.toString()])];

    const roomData = {
      name: type === 'dm' ? '' : name,
      type,
      workspace: workspaceId,
      members: roomMembers,
      createdBy: req.user._id
    };

    let room = await ChatRoom.create(roomData);
    room = await room.populate('members', 'name email avatar');

    // Emit event to all members via socket? (Done in frontend or via socket directly)
    const io = req.app.get('io');
    if (io) {
      roomMembers.forEach(memberId => {
        io.to(memberId.toString()).emit('roomCreated', { room });
      });
    }

    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get messages for a specific room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Verify user is in the room
    const room = await ChatRoom.findOne({ _id: roomId, members: req.user._id });
    if (!room) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this room' });
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate('sender', 'name email avatar')
      .populate('reactions.user', 'name')
      .sort('createdAt'); // oldest first for chat

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    const room = await ChatRoom.findOne({ _id: roomId, members: req.user._id });
    if (!room) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Process uploaded files if any
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    let message = await Message.create({
      chatRoom: roomId,
      sender: req.user._id,
      content,
      attachments,
      readBy: [req.user._id]
    });

    message = await message.populate('sender', 'name email avatar');

    // Update room's last message time
    room.lastMessageAt = new Date();
    await room.save();

    // Emit to room
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('chatMessage', message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// React to a message
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    let message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    message = await message.populate('sender', 'name email avatar').populate('reactions.user', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(message.chatRoom.toString()).emit('messageReaction', { messageId, reactions: message.reactions });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Mark room as read
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await Message.updateMany(
      { chatRoom: roomId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
