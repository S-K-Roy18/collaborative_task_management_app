'use client';

import { useEffect, useState, Suspense } from 'react';
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

function TaskDetailsPage() {
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
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);

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

  const handleToggleSubtask = async (index: number) => {
    if (!task) return;
    const updatedSubtasks = task.subtasks.map((st, i) =>
      i === index ? { ...st, completed: !st.completed } : st
    );

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      });

      const data = await res.json();
      if (data.success) {
        setTask(data.task);
      } else {
        alert(data.message || 'Failed to update subtask');
      }
    } catch (error) {
      alert('An error occurred while updating subtask');
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

  const handleGenerateAISubtasks = async () => {
    if (!task) return;
    setGeneratingSubtasks(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/chatbot/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
        }),
      });

      const data = await res.json();

      if (data.success && data.subtasks) {
        const newSubtasks = data.subtasks.map((title: string) => ({
          title,
          completed: false,
        }));

        const mergedSubtasks = [...task.subtasks, ...newSubtasks];

        const updateRes = await fetch(`/api/task/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subtasks: mergedSubtasks }),
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
          setTask(updateData.task);
        } else {
          alert(updateData.message || 'Failed to save generated subtasks');
        }
      } else {
        alert(data.message || 'Failed to generate subtasks with AI');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while generating subtasks');
    } finally {
      setGeneratingSubtasks(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'todo': 'bg-slate-600/50 border border-slate-500/50 text-slate-200',
      'in-progress': 'bg-blue-600/50 border border-blue-500/50 text-blue-200',
      'done': 'bg-emerald-600/50 border border-emerald-500/50 text-emerald-200',
    };
    return styles[status] || styles['todo'];
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      'low': 'bg-green-600/50 border border-green-500/50 text-green-200',
      'medium': 'bg-amber-600/50 border border-amber-500/50 text-amber-200',
      'high': 'bg-rose-600/50 border border-rose-500/50 text-rose-200',
    };
    return styles[priority] || styles['medium'];
  };

  const totalSubtasks = task ? task.subtasks.length : 0;
  const completedSubtasks = task ? task.subtasks.filter(st => st.completed).length : 0;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
        
        {isEditing ? (
          <form onSubmit={handleUpdateTask} className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Edit Task</h2>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Task Title</label>
              <input
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-indigo-950"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'todo' | 'in-progress' | 'done' })}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-indigo-950"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tags edit block */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {editForm.tags.map((tag, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={tag.name}
                      onChange={(e) => {
                        const newTags = [...editForm.tags];
                        newTags[index].name = e.target.value;
                        setEditForm({ ...editForm, tags: newTags });
                      }}
                      placeholder="Tag name"
                      className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="color"
                      value={tag.color}
                      onChange={(e) => {
                        const newTags = [...editForm.tags];
                        newTags[index].color = e.target.value;
                        setEditForm({ ...editForm, tags: newTags });
                      }}
                      className="w-12 h-10 p-0 border border-white/10 rounded-lg bg-transparent cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = editForm.tags.filter((_, i) => i !== index);
                        setEditForm({ ...editForm, tags: newTags });
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {editForm.tags.length === 0 && (
                  <p className="text-indigo-300/40 text-sm">No tags added yet.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, tags: [...editForm.tags, { name: '', color: '#3b82f6' }] })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                + Add Tag
              </button>
            </div>

            {/* Subtasks edit block */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Subtasks</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {editForm.subtasks.map((subtask, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) => {
                        const newSubtasks = [...editForm.subtasks];
                        newSubtasks[index].completed = e.target.checked;
                        setEditForm({ ...editForm, subtasks: newSubtasks });
                      }}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => {
                        const newSubtasks = [...editForm.subtasks];
                        newSubtasks[index].title = e.target.value;
                        setEditForm({ ...editForm, subtasks: newSubtasks });
                      }}
                      placeholder="Subtask title"
                      className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSubtasks = editForm.subtasks.filter((_, i) => i !== index);
                        setEditForm({ ...editForm, subtasks: newSubtasks });
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {editForm.subtasks.length === 0 && (
                  <p className="text-indigo-300/40 text-sm">No subtasks added yet.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, subtasks: [...editForm.subtasks, { title: '', completed: false }] })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                + Add Subtask
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingTask}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow transition"
              >
                {updatingTask ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{task.title}</h1>
                <p className="text-indigo-200 text-lg whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
              </div>
              <button
                onClick={handleStartEdit}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition shadow"
              >
                Edit Task
              </button>
            </div>

            {/* Badges Grid (Priority, Status, Due date) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">Status</span>
                <span className={`self-start px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(task.status)}`}>
                  {task.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">Priority</span>
                <span className={`self-start px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadge(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">Due Date</span>
                <span className="text-white font-medium">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>
            </div>

            {/* Tags section */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Assignees */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">Assignees</h3>
              <div className="flex flex-wrap gap-4">
                {task.assignees && task.assignees.map(assignee => (
                  <div key={assignee._id} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-white text-sm font-semibold">{assignee.name}</div>
                  </div>
                ))}
                {(!task.assignees || task.assignees.length === 0) && (
                  <p className="text-indigo-300/40 text-sm">No assignees assigned to this task.</p>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">Subtasks</h3>
                  <button
                    type="button"
                    onClick={handleGenerateAISubtasks}
                    disabled={generatingSubtasks}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {generatingSubtasks ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Generate with AI
                      </>
                    )}
                  </button>
                </div>
                <span className="text-sm text-indigo-200 font-medium">{completedSubtasks}/{totalSubtasks} Completed</span>
              </div>
              {totalSubtasks > 0 && (
                <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              )}
              <div className="space-y-2.5">
                {task.subtasks && task.subtasks.map((st, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group text-white">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(idx)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className={`transition-all duration-300 ${st.completed ? 'line-through text-indigo-300/40' : 'group-hover:text-indigo-200'}`}>
                      {st.title}
                    </span>
                  </label>
                ))}
                {totalSubtasks === 0 && (
                  <p className="text-indigo-300/40 text-sm">No subtasks defined for this task.</p>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Attachments</h3>
              
              {/* Upload Form */}
              <form onSubmit={handleFileUpload} className="mb-6 flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="block w-full text-sm text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow transition ${
                    uploading || !selectedFiles || selectedFiles.length === 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>

              {/* Attachments List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {task.attachments && task.attachments.map((att, idx) => {
                  const isImg = /jpeg|jpg|png|gif/i.test(att.mimetype);
                  const attachmentUrl = att.path.startsWith('http://') || att.path.startsWith('https://')
                    ? att.path
                    : `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${att.path}`;

                  return (
                    <div key={idx} className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow">
                      {isImg ? (
                        <div className="h-32 w-full overflow-hidden bg-black/25 flex items-center justify-center relative group">
                          <img
                            src={attachmentUrl}
                            alt={att.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(attachmentUrl)}
                              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.filename)}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-black/25 flex flex-col items-center justify-center p-3 relative group">
                          <span className="text-4xl mb-2">📎</span>
                          <span className="text-xs text-center text-white truncate w-full font-medium">{att.originalName}</span>
                          <span className="text-[10px] text-indigo-300">{Math.round(att.size / 1024)} KB</span>
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs"
                            >
                              ⬇️ Download
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.filename)}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-black/10 border-t border-white/5 flex justify-between items-center text-xs text-indigo-200">
                        <span className="truncate flex-1 pr-2">{att.originalName}</span>
                        <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
                {(!task.attachments || task.attachments.length === 0) && (
                  <div className="col-span-full py-8 text-center text-indigo-300/40 text-sm">
                    No attachments uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Comments</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6 flex flex-col gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-indigo-300/50 animate-pulse-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                    className={`px-6 py-2 rounded-xl text-white font-semibold shadow transition ${
                      addingComment || !newComment.trim()
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    }`}
                  >
                    {addingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {task.comments && task.comments.map((comment) => (
                  <div key={comment._id} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-semibold text-white">{comment.author?.name || 'Unknown User'}</span>
                      </div>
                      <span className="text-xs text-indigo-300">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-indigo-100 pl-10 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                ))}
                {(!task.comments || task.comments.length === 0) && (
                  <p className="text-center text-indigo-300/40 text-sm py-4">No comments yet. Start the conversation!</p>
                )}
              </div>
            </div>

            {/* Activity Log Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Activity Log</h2>
              <div className="max-h-64 overflow-y-auto pr-2">
                <ActivityLogList taskId={task._id} />
              </div>
            </div>
          </div>
        )}

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

export default function TaskDetailsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl animate-pulse">Loading task details...</div>
      </div>
    }>
      <TaskDetailsPage />
    </Suspense>
  );
}
