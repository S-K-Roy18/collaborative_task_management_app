'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Lightweight local socket hook stub to avoid needing the missing external module.
// It returns an object with `socket: null` so existing runtime checks (if (!socket) return;) still work.
// If you later add a real socket provider, remove this stub and restore the original import.
export function useSocket() {
  // typed as any to avoid requiring socket.io types in this file
  return { socket: null as any };
}


interface Assignee {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Tag {
  name: string;
  color: string;
}

interface Subtask {
  title: string;
  completed: boolean;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignees: Assignee[];
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  subtasks: Subtask[];
  tags: Tag[];
}

const statuses: Array<'todo' | 'in-progress' | 'done'> = ['todo', 'in-progress', 'done'];

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

export default function KanbanBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch tasks
  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace');
      return;
    }
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const res = await fetch(`/api/task/workspace/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks);
        } else {
          setError(data.message || 'Failed to load tasks');
        }
      } catch {
        setError('An error occurred while fetching tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [workspaceId, router]);

  // Socket real-time updates for tasks
  useEffect(() => {
    if (!socket || !workspaceId) return;

    socket.emit('joinWorkspace', workspaceId);

    const handleTaskCreated = (data: { task: Task }) => {
      setTasks(prev => [data.task, ...prev]);
    };

    const handleTaskUpdated = (data: { task: Task }) => {
      setTasks(prevTasks =>
        prevTasks.map(t => t._id === data.task._id ? data.task : t)
      );
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      setTasks(prevTasks =>
        prevTasks.filter(t => t._id !== data.taskId)
      );
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.emit('leaveWorkspace', workspaceId);
    };
  }, [socket, workspaceId]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update task status');
      }
    } catch {
      alert('An error occurred while updating task status');
    }
  }, [router]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: 'todo' | 'in-progress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== status) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-xl">Loading Kanban Board...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex justify-center items-center text-red-600">{error}</div>;
  }

  // Group tasks by status
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<'todo' | 'in-progress' | 'done', Task[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8 overflow-x-auto">
      <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">Kanban Board</h1>
      <div className="flex gap-6 min-w-[900px]">
        {statuses.map(status => (
          <div
            key={status}
            className="flex-1 bg-white rounded-xl shadow-md p-4 flex flex-col max-h-[75vh] overflow-y-auto"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold text-gray-700 capitalize mb-4">
              {status.replace('-', ' ')}
            </h2>
            {tasksByStatus[status].length === 0 && (
              <p className="text-gray-400 text-sm">No tasks</p>
            )}
            {tasksByStatus[status].map(task => (
              <div
                key={task._id}
                draggable
                onDragStart={(e) => handleDragStart(e, task._id)}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-4 p-4 cursor-grab shadow hover:shadow-lg transition-shadow duration-200"
              >
                <h3 className="font-semibold mb-1 text-indigo-800">{task.title}</h3>
                <p className="text-sm text-indigo-600 mb-2 line-clamp-2">{task.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {task.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-700">
                  <span className={`px-2 py-0.5 rounded ${getPriorityColor(task.priority)} text-white`}>
                    {task.priority}
                  </span>
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
