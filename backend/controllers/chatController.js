const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { uploadToCloudinary } = require('../middleware/cloudinary');

// @desc    Get all channels and direct messages in a workspace for current user
// @route   GET /api/chat/workspace/:workspaceId/rooms
// @access  Private
exports.getWorkspaceRooms = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check workspace membership
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Find channels in this workspace OR DMs/groups where the user is a member
    const rooms = await ChatRoom.find({
      workspace: workspaceId,
      $or: [
        { type: 'channel' },
        { members: userId }
      ]
    })
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name')
    .sort({ type: 1, name: 1 }); // Sort channels first, then by name

    // Add a default #general room if no channels exist
    if (rooms.filter(r => r.type === 'channel').length === 0) {
      const generalRoom = new ChatRoom({
        name: 'general',
        type: 'channel',
        workspace: workspaceId,
        members: workspace.members.map(m => m.user),
        createdBy: workspace.owner,
      });
      await generalRoom.save();
      rooms.push(generalRoom);
    }

    res.json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error('Get workspace rooms error:', error);
    next(new AppError('Failed to retrieve chat rooms', 500));
  }
};

// @desc    Create a new channel, group chat, or start a DM
// @route   POST /api/chat/room
// @access  Private
exports.createRoom = async (req, res, next) => {
  try {
    const { name, type, members, workspaceId, recipientId } = req.body;
    const userId = req.user.id;

    if (!workspaceId) {
      return next(new AppError('Workspace ID is required', 400));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }
    if (!workspace.isMember(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Handle DM creation
    if (type === 'dm') {
      if (!recipientId) {
        return next(new AppError('Recipient user ID is required for direct messages', 400));
      }

      // Check if DM room already exists
      let existingRoom = await ChatRoom.findOne({
        workspace: workspaceId,
        type: 'dm',
        members: { $all: [userId, recipientId], $size: 2 }
      }).populate('members', 'name email avatar');

      if (existingRoom) {
        return res.json({
          success: true,
          message: 'DM room already exists',
          room: existingRoom,
        });
      }

      // Create new DM room
      const newDM = new ChatRoom({
        type: 'dm',
        workspace: workspaceId,
        members: [userId, recipientId],
        createdBy: userId,
      });
      await newDM.save();
      await newDM.populate('members', 'name email avatar');

      return res.status(201).json({
        success: true,
        message: 'DM room created successfully',
        room: newDM,
      });
    }

    // Handle Channel creation
    if (type === 'channel') {
      if (!name) {
        return next(new AppError('Channel name is required', 400));
      }
      
      const channelName = name.trim().toLowerCase().replace(/\s+/g, '-');

      // Check if channel name exists
      const existingChannel = await ChatRoom.findOne({
        workspace: workspaceId,
        type: 'channel',
        name: channelName,
      });

      if (existingChannel) {
        return next(new AppError(`Channel #${channelName} already exists`, 400));
      }

      // Add all workspace members to channel by default
      const channelMembers = workspace.members.map(m => m.user);

      const channel = new ChatRoom({
        name: channelName,
        type: 'channel',
        workspace: workspaceId,
        members: channelMembers,
        createdBy: userId,
      });

      await channel.save();
      await channel.populate('members', 'name email avatar');

      // Broadcast room creation via socket
      const io = req.app.get('io');
      if (io) {
        io.to(workspaceId).emit('roomCreated', channel);
      }

      return res.status(201).json({
        success: true,
        message: 'Channel created successfully',
        room: channel,
      });
    }

    // Handle Group creation
    if (type === 'group') {
      if (!name) {
        return next(new AppError('Group name is required', 400));
      }
      if (!members || !Array.isArray(members) || members.length === 0) {
        return next(new AppError('At least one group member is required', 400));
      }

      const uniqueMembers = Array.from(new Set([userId, ...members]));

      const group = new ChatRoom({
        name: name.trim(),
        type: 'group',
        workspace: workspaceId,
        members: uniqueMembers,
        createdBy: userId,
      });

      await group.save();
      await group.populate('members', 'name email avatar');

      // Notify members via sockets
      const io = req.app.get('io');
      if (io) {
        uniqueMembers.forEach(memberId => {
          io.to(`user:${memberId}`).emit('roomCreated', group);
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Group room created successfully',
        room: group,
      });
    }

    return next(new AppError('Invalid chat room type', 400));
  } catch (error) {
    console.error('Create chat room error:', error);
    next(new AppError('Failed to create chat room', 500));
  }
};

// @desc    Get message history for a specific chat room
// @route   GET /api/chat/room/:roomId/messages
// @access  Private
exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return next(new AppError('Chat room not found', 404));
    }

    // Verify membership
    // Channels are accessible by any workspace member, DMs/groups check explicit list
    if (room.type !== 'channel' && !room.members.includes(userId)) {
      return next(new AppError('Access denied to this chat room', 403));
    }

    // Fetch messages
    const messages = await ChatMessage.find({ chatRoom: roomId })
      .populate('sender', 'name email avatar')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return messages in chronological order for UI
    const sortedMessages = messages.reverse();

    res.json({
      success: true,
      messages: sortedMessages,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    next(new AppError('Failed to retrieve messages', 500));
  }
};

// @desc    Send a message with optional file uploads
// @route   POST /api/chat/room/:roomId/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return next(new AppError('Chat room not found', 404));
    }

    if (room.type !== 'channel' && !room.members.includes(userId)) {
      return next(new AppError('Access denied to this chat room', 403));
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const cloudinaryResult = await uploadToCloudinary(file.path);
        return {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: cloudinaryResult.secure_url,
        };
      });
      const uploadedAttachments = await Promise.all(uploadPromises);
      attachments.push(...uploadedAttachments);
    }

    if (!content && attachments.length === 0) {
      return next(new AppError('Message must have content or attachments', 400));
    }

    const message = new ChatMessage({
      chatRoom: roomId,
      sender: userId,
      content: content ? content.trim() : '',
      attachments,
      readBy: [{ user: userId, readAt: new Date() }],
    });

    await message.save();
    await message.populate('sender', 'name email avatar');

    // Emit event via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${roomId}`).emit('chatMessage', message);
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    next(new AppError('Failed to send message', 500));
  }
};

// @desc    Add or toggle emoji reaction to a message
// @route   POST /api/chat/message/:messageId/react
// @access  Private
exports.toggleReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return next(new AppError('Emoji is required', 400));
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check access to room
    const room = await ChatRoom.findById(message.chatRoom);
    if (room.type !== 'channel' && !room.members.includes(userId)) {
      return next(new AppError('Access denied', 403));
    }

    // Check if user already added this exact emoji reaction
    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove it (toggle off)
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add it
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    await message.populate('reactions.user', 'name');
    await message.populate('sender', 'name email avatar');

    // Emit event
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${message.chatRoom}`).emit('messageReaction', {
        messageId: message._id,
        reactions: message.reactions,
        chatRoom: message.chatRoom,
      });
    }

    res.json({
      success: true,
      reactions: message.reactions,
    });
  } catch (error) {
    console.error('Toggle reaction error:', error);
    next(new AppError('Failed to process reaction', 500));
  }
};

// @desc    Mark room messages as read
// @route   POST /api/chat/room/:roomId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return next(new AppError('Chat room not found', 404));
    }

    // Update all messages in room that sender hasn't read yet
    await ChatMessage.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    res.json({
      success: true,
      message: 'Room marked as read',
    });
  } catch (error) {
    console.error('Mark read error:', error);
    next(new AppError('Failed to update read status', 500));
  }
};
