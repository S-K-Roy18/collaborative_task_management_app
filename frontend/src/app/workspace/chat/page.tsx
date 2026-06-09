'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '../../../context/socketContext';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface ChatRoom {
  _id: string;
  name?: string;
  type: 'channel' | 'dm' | 'group';
  members: User[];
  createdBy?: string;
  updatedAt: string;
}

interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

interface Reaction {
  user: {
    _id: string;
    name: string;
  };
  emoji: string;
  _id: string;
}

interface Message {
  _id: string;
  chatRoom: string;
  sender: User;
  content: string;
  attachments: Attachment[];
  reactions: Reaction[];
  createdAt: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '😂', '🎉', '😮', '😢', '🙏'];

function WorkspaceChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { socket } = useSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> name
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [showQuickEmojis, setShowQuickEmojis] = useState(false); // input emojis

  // Room Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'channel' | 'group'>('channel');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user details
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName') || 'You';
    setCurrentUserId(storedUserId);
    setCurrentUserName(storedUserName);
  }, []);

  // Fetch rooms & workspace members
  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace');
      return;
    }

    const fetchWorkspaceData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // 1. Fetch Rooms
        const roomsRes = await fetch(`/api/chat/workspace/${workspaceId}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const roomsData = await roomsRes.json();
        
        if (roomsData.success) {
          setRooms(roomsData.rooms);
          // Set first general channel as active by default if available
          const general = roomsData.rooms.find((r: ChatRoom) => r.type === 'channel' && r.name === 'general');
          if (general) {
            setActiveRoom(general);
          } else if (roomsData.rooms.length > 0) {
            setActiveRoom(roomsData.rooms[0]);
          }
        }

        // 2. Fetch Workspace Details (to get member list)
        const wsRes = await fetch(`/api/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const wsData = await wsRes.json();
        if (wsData.success) {
          setMembers(wsData.workspace.members);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchWorkspaceData();
  }, [workspaceId, router]);

  // Handle active room messages fetch
  useEffect(() => {
    if (!activeRoom) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`/api/chat/room/${activeRoom._id}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          // Scroll to bottom
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeRoom]);

  // Real-time socket integration for chat messaging & presence
  useEffect(() => {
    if (!socket || !workspaceId || !currentUserId) return;

    // Join workspace room and set presence
    socket.emit('joinWorkspace', workspaceId);
    socket.emit('userActive', { userId: currentUserId, workspaceId });

    // Handle online presence
    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(userIds);
    };

    socket.on('onlineUsers', handleOnlineUsers);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      socket.emit('leaveWorkspace', workspaceId);
    };
  }, [socket, workspaceId, currentUserId]);

  // Real-time chat events inside active room
  useEffect(() => {
    if (!socket || !activeRoom || !currentUserId) return;

    // Join active room
    socket.emit('joinChatRoom', activeRoom._id);

    // Mark messages as read
    const markRoomAsRead = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch(`/api/chat/room/${activeRoom._id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    };
    markRoomAsRead();

    // Listeners
    const handleChatMessage = (message: Message) => {
      setMessages(prev => {
        // Prevent duplicate appends if HTTP fallback already added it
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Auto-read received message if in this room
      markRoomAsRead();
    };

    const handleReaction = (data: { messageId: string, reactions: Reaction[] }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
      ));
    };

    const handleTyping = (data: { roomId: string, userName: string, userId: string }) => {
      if (data.roomId === activeRoom._id && data.userId !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName }));
      }
    };

    const handleStopTyping = (data: { roomId: string, userId: string }) => {
      if (data.roomId === activeRoom._id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      }
    };

    const handleRoomCreated = (newRoom: ChatRoom) => {
      setRooms(prev => {
        if (prev.some(r => r._id === newRoom._id)) return prev;
        return [...prev, newRoom];
      });
    };

    socket.on('chatMessage', handleChatMessage);
    socket.on('messageReaction', handleReaction);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('roomCreated', handleRoomCreated);

    return () => {
      socket.off('chatMessage', handleChatMessage);
      socket.off('messageReaction', handleReaction);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('roomCreated', handleRoomCreated);
      socket.emit('leaveChatRoom', activeRoom._id);
    };
  }, [socket, activeRoom, currentUserId]);

  // Handle typing triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!socket || !activeRoom) return;

    // Emit typing event
    socket.emit('typing', { roomId: activeRoom._id, userName: currentUserName });

    // Throttle typing timeout to stop indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId: activeRoom._id });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFiles) || !activeRoom) return;

    if (socket) {
      socket.emit('stopTyping', { roomId: activeRoom._id });
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      if (messageInput.trim()) {
        formData.append('content', messageInput.trim());
      }
      if (selectedFiles) {
        Array.from(selectedFiles).forEach(file => {
          formData.append('files', file);
        });
      }

      const res = await fetch(`/api/chat/room/${activeRoom._id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // Sockets will broadcast this message to the channel, but let's clear input
        setMessageInput('');
        setSelectedFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (err) {
      alert('An error occurred while sending message');
    } finally {
      setUploading(false);
    }
  };

  // Add emoji reaction to message
  const handleAddReaction = async (messageId: string, emoji: string) => {
    setShowEmojiPicker(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/chat/message/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      const data = await res.json();
      if (!data.success) {
        alert('Failed to react to message');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start DM with member
  const handleStartDM = async (memberId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'dm',
          recipientId: memberId,
          workspaceId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRooms(prev => {
          if (prev.some(r => r._id === data.room._id)) return prev;
          return [...prev, data.room];
        });
        setActiveRoom(data.room);
      }
    } catch (err) {
      alert('Failed to initialize DM');
    }
  };

  // Create channel / group room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreatingRoom(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        name: newRoomName.trim(),
        type: newRoomType,
        workspaceId,
        members: newRoomType === 'group' ? selectedGroupMembers : [],
      };

      const res = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setRooms(prev => [...prev, data.room]);
        setActiveRoom(data.room);
        setShowCreateModal(false);
        setNewRoomName('');
        setSelectedGroupMembers([]);
      } else {
        alert(data.message || 'Failed to create chat room');
      }
    } catch (err) {
      alert('Error creating chat room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Helper to get channel/room headers
  const getRoomName = (room: ChatRoom) => {
    if (room.type === 'channel') {
      return `#${room.name}`;
    }
    if (room.type === 'dm') {
      const otherUser = room.members.find(m => m._id !== currentUserId);
      return otherUser ? otherUser.name : 'Direct Message';
    }
    return room.name || 'Group Chat';
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'dm') {
      const otherUser = room.members.find(m => m._id !== currentUserId);
      return otherUser?.avatar || '';
    }
    return '';
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  return (
    <div
      className="min-h-screen bg-blend-overlay bg-black/50 flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
          linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)
        `,
      }}
    >
      {/* Header bar */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 py-4 px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          >
            ☰
          </button>
          <Link
            href={`/workspace/dashboard?workspaceId=${workspaceId}`}
            className="flex items-center space-x-3 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold text-lg hidden sm:inline">Back to Dashboard</span>
          </Link>
        </div>
        <h1 className="text-xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Workspace Messenger
        </h1>
        <div className="flex items-center space-x-3 text-sm text-gray-400">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
          <span>Live Sync Active</span>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Left */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'
          } md:translate-x-0 md:w-80 bg-slate-950/40 backdrop-blur-md border-r border-slate-800/60 flex flex-col transition-all duration-300 shrink-0 z-10`}
        >
          {/* Create Channel Trigger */}
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Conversations</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center hover:bg-indigo-600/50 hover:text-white transition-all transform active:scale-95"
              title="New Channel"
            >
              +
            </button>
          </div>

          {/* Rooms scroll area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Channels */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase">Channels</h3>
              <div className="space-y-1">
                {rooms
                  .filter(r => r.type === 'channel')
                  .map(room => (
                    <button
                      key={room._id}
                      onClick={() => {
                        setActiveRoom(room);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-2.5 rounded-xl text-left transition-all ${
                        activeRoom?._id === room._id
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white font-medium shadow-md border-l-4 border-indigo-500'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <span className="mr-3 text-lg opacity-70">#</span>
                      <span className="truncate">{room.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Direct Messages */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase">Direct Messages</h3>
              <div className="space-y-1">
                {rooms
                  .filter(r => r.type === 'dm')
                  .map(room => {
                    const otherUser = room.members.find(m => m._id !== currentUserId);
                    if (!otherUser) return null;
                    const online = isUserOnline(otherUser._id);
                    return (
                      <button
                        key={room._id}
                        onClick={() => {
                          setActiveRoom(room);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2.5 rounded-xl text-left transition-all ${
                          activeRoom?._id === room._id
                            ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white font-medium shadow-md border-l-4 border-indigo-500'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <div className="relative mr-3 shrink-0">
                          <img
                            src={otherUser.avatar || '/default-avatar.png'}
                            alt={otherUser.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                              online ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          ></span>
                        </div>
                        <span className="truncate">{otherUser.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </aside>

        {/* Messaging Central Container */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/20">
          {activeRoom ? (
            <>
              {/* Active Room Title */}
              <div className="bg-slate-900/60 backdrop-blur-md px-6 py-4 border-b border-slate-800/50 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  {activeRoom.type === 'dm' ? (
                    <img
                      src={getRoomAvatar(activeRoom) || '/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-600/30 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-lg">
                      #
                    </div>
                  )}
                  <div>
                    <h2 className="text-white font-bold text-lg">{getRoomName(activeRoom)}</h2>
                    <p className="text-xs text-gray-400">
                      {activeRoom.type === 'channel'
                        ? 'Workspace Channel'
                        : activeRoom.type === 'dm'
                        ? isUserOnline(activeRoom.members.find(m => m._id !== currentUserId)?._id || '')
                          ? 'Online'
                          : 'Offline'
                        : 'Group Chat'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col scrollbar-thin">
                {loadingMessages ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    Loading chat messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-65 p-6">
                    <span className="text-5xl mb-4">💬</span>
                    <h3 className="text-white font-bold text-lg">No Messages Yet</h3>
                    <p className="text-slate-400 text-sm max-w-sm mt-1">
                      Send a message to start the conversation in {getRoomName(activeRoom)}.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSelf = msg.sender._id === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-3 group/msg ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <img
                          src={msg.sender.avatar || '/default-avatar.png'}
                          alt={msg.sender.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-800 shadow-md"
                        />

                        {/* Content bubble block */}
                        <div className={`flex flex-col max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
                          {/* Sender details */}
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-sm text-slate-200">{msg.sender.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Bubble content */}
                          <div
                            className={`p-3.5 rounded-2xl relative shadow-md ${
                              isSelf
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/50'
                            }`}
                          >
                            {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {msg.attachments.map((att, i) => {
                                  const isImg = /jpeg|jpg|png|gif/i.test(att.mimetype);
                                  const attachmentUrl = att.path.startsWith('http://') || att.path.startsWith('https://')
                                    ? att.path
                                    : `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${att.path}`;
                                  return isImg ? (
                                    <div key={i} className="rounded-lg overflow-hidden border border-slate-700 max-w-xs shadow">
                                      <img
                                        src={attachmentUrl}
                                        alt={att.originalName}
                                        className="w-full h-auto object-cover max-h-48 cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => window.open(attachmentUrl)}
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      key={i}
                                      href={attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg text-xs hover:bg-slate-900/80 border border-slate-700/40 text-indigo-300 font-medium"
                                    >
                                      📎 {att.originalName} ({Math.round(att.size / 1024)} KB)
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {/* Reactions display */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(
                                  msg.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                ).map(([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(msg._id, emoji)}
                                    className="px-2 py-0.5 bg-slate-900/40 rounded-full border border-slate-700 text-xs flex items-center gap-1 hover:border-slate-500 text-slate-300"
                                  >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Hover action menu (Reaction Drawer trigger) */}
                          <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center space-x-1.5 mt-1">
                            <button
                              onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                              className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs flex items-center justify-center hover:bg-slate-700 text-gray-300"
                              title="React to message"
                            >
                              😊
                            </button>

                            {showEmojiPicker === msg._id && (
                              <div className="absolute z-30 bg-slate-950 border border-slate-800 rounded-full p-1 shadow-2xl flex gap-1 animate-fade-in-up">
                                {EMOJI_OPTIONS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(msg._id, emoji)}
                                    className="w-7 h-7 text-sm flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicators */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="px-6 py-1.5 bg-transparent text-xs text-slate-400 italic shrink-0 flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <span>
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                  </span>
                </div>
              )}

              {/* Message Composer area */}
              <div className="p-4 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-md shrink-0">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="flex gap-3 items-end">
                    {/* Add File trigger */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-11 h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl flex items-center justify-center text-xl text-indigo-400 transition-all shrink-0 active:scale-95 shadow-md"
                      title="Attach Files"
                      disabled={uploading}
                    >
                      📎
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="hidden"
                    />

                    {/* Text Input */}
                    <div className="flex-1 relative bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner flex items-center">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder={`Message ${getRoomName(activeRoom)}...`}
                        className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                        disabled={uploading}
                      />

                      {/* Input Emoji selector */}
                      <button
                        type="button"
                        onClick={() => setShowQuickEmojis(!showQuickEmojis)}
                        className="p-3 text-lg opacity-60 hover:opacity-100 transition-opacity"
                      >
                        😊
                      </button>

                      {showQuickEmojis && (
                        <div className="absolute right-0 bottom-14 z-30 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 shadow-2xl grid grid-cols-4 gap-1.5 animate-fade-in-up">
                          {EMOJI_OPTIONS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setMessageInput(prev => prev + emoji);
                                setShowQuickEmojis(false);
                              }}
                              className="w-8 h-8 text-base flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={uploading || (!messageInput.trim() && !selectedFiles)}
                      className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {uploading ? 'Sending...' : 'Send'}
                    </button>
                  </div>

                  {/* Selected files feedback bar */}
                  {selectedFiles && (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
                      {Array.from(selectedFiles).map((file, i) => (
                        <div key={i} className="px-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-xs text-slate-300 flex items-center gap-2">
                          <span>📄 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(null)}
                            className="text-red-400 font-bold hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-65">
              <span className="text-6xl mb-4">💬</span>
              <h3 className="text-white font-bold text-xl">Select a Room</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-1">
                Choose a channel or member from the sidebar to start collaborating.
              </p>
            </div>
          )}
        </main>

        {/* Right Members Sidebar (Desktop only) */}
        <aside className="hidden lg:flex w-72 bg-slate-950/20 backdrop-blur-md border-l border-slate-800/60 flex-col shrink-0">
          <div className="p-4 border-b border-slate-800/50">
            <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Online Members</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {members.map(member => {
              const online = isUserOnline(member._id);
              if (member._id === currentUserId) return null; // hide self
              return (
                <div
                  key={member._id}
                  onClick={() => handleStartDM(member._id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 hover:bg-indigo-950/20 border border-slate-800/60 hover:border-indigo-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar || '/default-avatar.png'}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                          online ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      ></span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 text-sm truncate max-w-[120px]">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[120px]">{member.email}</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    DM
                  </button>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Creation Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl transform scale-100 transition-all">
            <h3 className="text-2xl font-bold text-white mb-6">Create Conversation</h3>
            
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Conversation Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRoomType('channel')}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all border ${
                      newRoomType === 'channel'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Public Channel
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomType('group')}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all border ${
                      newRoomType === 'group'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Private Group
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={newRoomType === 'channel' ? 'e.g. general' : 'e.g. Project Alpha Sync'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Group member selector */}
              {newRoomType === 'group' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Group Members
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-2 border border-slate-800/60 rounded-xl p-3 bg-slate-950">
                    {members
                      .filter(m => m._id !== currentUserId)
                      .map(member => (
                        <label key={member._id} className="flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedGroupMembers.includes(member._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroupMembers(prev => [...prev, member._id]);
                              } else {
                                setSelectedGroupMembers(prev => prev.filter(id => id !== member._id));
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                          />
                          <span>{member.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom || !newRoomName.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                >
                  {creatingRoom ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceChatPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-xl animate-pulse">
        Loading Chat...
      </div>
    }>
      <WorkspaceChatPage />
    </Suspense>
  );
}
