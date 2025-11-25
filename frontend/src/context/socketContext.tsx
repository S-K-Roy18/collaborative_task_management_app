"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
  currentWorkspace: string | null;
  onTaskCreated: ((task: any) => void) | null;
  onTaskUpdated: ((task: any) => void) | null;
  onTaskDeleted: ((taskId: string) => void) | null;
  onCommentAdded: ((comment: any) => void) | null;
  onCommentDeleted: ((commentId: string) => void) | null;
  setOnTaskCreated: React.Dispatch<React.SetStateAction<((task: any) => void) | null>>;
  setOnTaskUpdated: React.Dispatch<React.SetStateAction<((task: any) => void) | null>>;
  setOnTaskDeleted: React.Dispatch<React.SetStateAction<((taskId: string) => void) | null>>;
  setOnCommentAdded: React.Dispatch<React.SetStateAction<((comment: any) => void) | null>>;
  setOnCommentDeleted: React.Dispatch<React.SetStateAction<((commentId: string) => void) | null>>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinWorkspace: () => {},
  leaveWorkspace: () => {},
  currentWorkspace: null,
  onTaskCreated: null,
  onTaskUpdated: null,
  onTaskDeleted: null,
  onCommentAdded: null,
  onCommentDeleted: null,
  setOnTaskCreated: () => {},
  setOnTaskUpdated: () => {},
  setOnTaskDeleted: () => {},
  setOnCommentAdded: () => {},
  setOnCommentDeleted: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);

  const [onTaskCreated, setOnTaskCreated] = useState<((task: any) => void) | null>(null);
  const [onTaskUpdated, setOnTaskUpdated] = useState<((task: any) => void) | null>(null);
  const [onTaskDeleted, setOnTaskDeleted] = useState<((taskId: string) => void) | null>(null);
  const [onCommentAdded, setOnCommentAdded] = useState<((comment: any) => void) | null>(null);
  const [onCommentDeleted, setOnCommentDeleted] = useState<((commentId: string) => void) | null>(null);

  useEffect(() => {
    const socketIo = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000");

    socketIo.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socketIo.on('taskCreated', (task) => {
      if (onTaskCreated) onTaskCreated(task);
    });

    socketIo.on('taskUpdated', (task) => {
      if (onTaskUpdated) onTaskUpdated(task);
    });

    socketIo.on('taskDeleted', (taskId) => {
      if (onTaskDeleted) onTaskDeleted(taskId);
    });

    socketIo.on('commentAdded', (comment) => {
      if (onCommentAdded) onCommentAdded(comment);
    });

    socketIo.on('commentDeleted', (commentId) => {
      if (onCommentDeleted) onCommentDeleted(commentId);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, onCommentAdded, onCommentDeleted]);

  const joinWorkspace = useCallback((workspaceId: string) => {
    if (socket && workspaceId !== currentWorkspace) {
      // Leave current workspace if any
      if (currentWorkspace) {
        socket.emit('leaveWorkspace', currentWorkspace);
      }

      // Join new workspace
      socket.emit('joinWorkspace', workspaceId);
      setCurrentWorkspace(workspaceId);
      console.log('Joined workspace:', workspaceId);
    }
  }, [socket, currentWorkspace]);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    if (socket && workspaceId === currentWorkspace) {
      socket.emit('leaveWorkspace', workspaceId);
      setCurrentWorkspace(null);
      console.log('Left workspace:', workspaceId);
    }
  }, [socket, currentWorkspace]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        joinWorkspace,
        leaveWorkspace,
        currentWorkspace,
        onTaskCreated,
        onTaskUpdated,
        onTaskDeleted,
        onCommentAdded,
        onCommentDeleted,
        setOnTaskCreated,
        setOnTaskUpdated,
        setOnTaskDeleted,
        setOnCommentAdded,
        setOnCommentDeleted,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
