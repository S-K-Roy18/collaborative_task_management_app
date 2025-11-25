'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Minimal useSocket stub to avoid a missing-module/type error during development.
// Replace this stub with your actual '../../context/socketContext' implementation when available.
const useSocket = (): { socket: any | null } => ({ socket: null });


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

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekDay(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

export default function CalendarViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Real-time socket updates for tasks
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

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-xl">Loading Calendar View...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex justify-center items-center text-red-600">{error}</div>;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getWeekDay(year, month, 1);

  // Filter tasks for current month only and group by day
  const tasksByDay: Record<number, Task[]> = {};
  tasks.forEach(task => {
    if (!task.dueDate) {
      return;
    }
    const taskDate = new Date(task.dueDate);
    if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
      const day = taskDate.getDate();
      if (!tasksByDay[day]) {
        tasksByDay[day] = [];
      }
      tasksByDay[day].push(task);
    }
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
      <h1 className="text-4xl font-bold mb-8 text-indigo-900 text-center">Calendar View</h1>
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Previous
          </button>
          <h2 className="text-xl font-semibold text-indigo-800">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h2>
          <button onClick={nextMonth} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-indigo-700">
          {daysOfWeek.map(day => (
            <div key={day} className="border-b border-indigo-300 pb-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(firstDay).keys()].map(day => (
            <div key={`empty-prev-${day}`} className="h-24 border p-1 bg-gray-50"></div>
          ))}
          {[...Array(daysInMonth).keys()].map(i => {
            const day = i + 1;
            const dayTasks = tasksByDay[day] || [];
            return (
              <div key={day} className="border min-h-[100px] p-2 bg-gray-50 rounded relative overflow-auto">
                <div className="text-indigo-800 font-semibold mb-1">{day}</div>
                {dayTasks.map(task => (
                  <div key={task._id} className="mb-1 p-1 rounded-md bg-indigo-100 hover:bg-indigo-200 cursor-pointer">
                    <div className="flex justify-between items-center text-xs font-semibold text-indigo-900">
                      <span>{task.title}</span>
                      <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs font-semibold rounded px-1 text-white" style={{ backgroundColor: tag.color }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
