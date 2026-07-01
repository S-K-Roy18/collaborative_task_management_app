// collaborative_task_management_app/frontend/src/context/NotificationsContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Notification {
  _id: string;
  user: string;
  type: string;
  message: string;
  workspace?: string;
  task?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      if (id) {
        setUserId(id);
      }
    }
  }, []);

  // Fetch initial notifications
  const refreshNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Setup Socket.io connection
  useEffect(() => {
    if (!userId) return;

    // Dynamically import socket.io-client
    import('socket.io-client').then((module) => {
      const io = module.default;
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('joinUserRoom', userId);
      });

      newSocket.on('newNotification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Use browser Notification API if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification('Task Manager Update', {
            body: notification.message,
            icon: '/icon.png' // optional icon
          });
        }
      });

      return () => {
        newSocket.emit('leaveUserRoom', userId);
        newSocket.disconnect();
      };
    });
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      refreshNotifications();
    }
  }, [userId]);

  // Ask for browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
