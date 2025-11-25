'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '../../../../context/socketContext';

interface Subtask {
  title: string;
  completed: boolean;
}

interface Assignee {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: Assignee;
  createdAt: string;
}

interface ActivityLogEntry {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  details: string;
  createdAt: string;
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
  attachments: Attachment[];
  comments: Comment[];
  createdBy: Assignee;
  createdAt: string;
  tags?: { name: string; color: string }[];
}

export default function TaskDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const workspaceId = searchParams.get('workspaceId');
  const { socket, joinWorkspace, leaveWorkspace } = useSocket();

  const [task, setTask] = useState<Task | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
    dueDate: '',
    subtasks: [] as Subtask[],
    tags: [] as { name: string; color: string }[],
  });
  const [updatingTask, setUpdatingTask] = useState(false);

  useEffect(() => {
    if (!taskId || !workspaceId) {
      router.push('/workspace');
      return;
    }

    if (socket) {
      joinWorkspace(workspaceId);
    }

    const fetchTask = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setTask(data.task);
        } else {
          setError(data.message || 'Failed to load task');
        }
      } catch (err) {
        setError('An error occurred while fetching task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();

    return () => {
      if (socket) {
        leaveWorkspace(workspaceId);
      }
    };
  }, [router, taskId, workspaceId, socket, joinWorkspace, leaveWorkspace]);

  useEffect(() => {
    if (!socket || !taskId) return;

    const handleTaskUpdate = (updatedTask: Task) => {
      if (updatedTask._id === taskId) {
        setTask(updatedTask);
      }
    };

    const handleCommentAdded = (data: { taskId: string; comment: Comment }) => {
      if (data.taskId === taskId && task) {
        setTask({
          ...task,
          comments: [...task.comments, data.comment]
        });
      }
    };

    const handleAttachmentAdded = (data: { taskId: string; attachment: Attachment }) => {
      if (data.taskId === taskId && task) {
        setTask({
          ...task,
          attachments: [...task.attachments, data.attachment]
        });
      }
    };

    const handleAttachmentDeleted = (data: { taskId: string; filename: string }) => {
      if (data.taskId === taskId && task) {
        setTask({
          ...task,
          attachments: task.attachments.filter(att => att.filename !== data.filename)
        });
      }
    };

    socket.on('taskUpdated', handleTaskUpdate);
    socket.on('commentAdded', handleCommentAdded);
    socket.on('attachmentAdded', handleAttachmentAdded);
    socket.on('attachmentDeleted', handleAttachmentDeleted);

    return () => {
      socket.off('taskUpdated', handleTaskUpdate);
      socket.off('commentAdded', handleCommentAdded);
      socket.off('attachmentAdded', handleAttachmentAdded);
      socket.off('attachmentDeleted', handleAttachmentDeleted);
    };
  }, [socket, taskId, task]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch(`/api/task/${taskId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const taskRes = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const taskData = await taskRes.json();
        if (taskData.success) {
          setTask(taskData.task);
        }
        setSelectedFiles(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        alert(data.message || 'Failed to upload files');
      }
    } catch (error) {
      alert('An error occurred while uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/task/${taskId}/attachment/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        const taskRes = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const taskData = await taskRes.json();
        if (taskData.success) {
          setTask(taskData.task);
        }
      } else {
        alert(data.message || 'Failed to delete attachment');
      }
    } catch (error) {
      alert('An error occurred while deleting attachment');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/task/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        const taskRes = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const taskData = await taskRes.json();
        if (taskData.success) {
          setTask(taskData.task);
        }
        setNewComment('');
      } else {
        alert(data.message || 'Failed to add comment');
      }
    } catch (error) {
      alert('An error occurred while adding comment');
    } finally {
      setAddingComment(false);
    }
  };

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        subtasks: [...task.subtasks],
        tags: task.tags ? [...task.tags] : [],
      });
    }
  }, [task]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl">Loading task details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-red-400 text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push(`/workspace/tasks?workspaceId=${workspaceId}`)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        subtasks: [...task.subtasks],
        tags: task.tags ? [...task.tags] : [],
      });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTask(true);

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
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (data.success) {
        setTask(data.task);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to update task');
      }
    } catch (error) {
      alert('An error occurred while updating task');
    } finally {
      setUpdatingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{task.title}</h1>
            <p className="text-indigo-200">{task.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={handleStartEdit}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 ml-4"
          >
            Edit Task
          </button>
        </div>

        {/* Activity Log Section */}
        <div className="mb-6 bg-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h2 className="text-2xl font-semibold text-white mb-4">Activity Log</h2>
          <ActivityLogList taskId={task._id} />
        </div>

        {/* Tags editing UI */}
        {isEditing && (
          <div className="mb-6 bg-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">Tags</h2>
            {editForm.tags.map((tag, index) => (
              <div key={index} className="flex gap-3 mb-3 items-center">
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => {
                    const newTags = [...editForm.tags];
                    newTags[index].name = e.target.value;
                    setEditForm({ ...editForm, tags: newTags });
                  }}
                  placeholder="Tag name"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
                />
                <input
                  type="color"
                  value={tag.color}
                  onChange={(e) => {
                    const newTags = [...editForm.tags];
                    newTags[index].color = e.target.value;
                    setEditForm({ ...editForm, tags: newTags });
                  }}
                  className="w-12 h-10 p-0 border border-gray-300 rounded-xl shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newTags = editForm.tags.filter((_, i) => i !== index);
                    setEditForm({ ...editForm, tags: newTags });
                  }}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, tags: [...editForm.tags, { name: '', color: '#007bff' }] })}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              + Add Tag
            </button>
          </div>
        )}

        {/* The rest of the component as is: assignees, due date, priority, status, subtasks, attachments, comments, etc. */}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Assignees</h2>
          <div className="flex gap-4">
            {task.assignees.map(assignee => (
              <div key={assignee._id} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-white">{assignee.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ...Other page contents remain unchanged */}

      </div>
    </div>
  );
}

interface ActivityLogEntry {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  details: string;
  createdAt: string;
}

const ActivityLogList: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const res = await fetch(`/api/activitylog/task/${taskId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setLogs(data.activityLogs);
        } else {
          console.error('Failed to load activity logs');
        }
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, [taskId]);

  if (loading) {
    return <p className="text-indigo-200">Loading activity logs...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-indigo-200">No activity logs available.</p>;
  }

  return (
    <ul className="space-y-2 text-indigo-200 text-sm">
      {logs.map(log => (
        <li key={log._id}>
          <strong>{log.user.name}</strong> {log.action}: {log.details} <br />
          <small>{new Date(log.createdAt).toLocaleString()}</small>
        </li>
      ))}
    </ul>
  );
};
