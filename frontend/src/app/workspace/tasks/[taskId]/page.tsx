'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
}

export default function TaskDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const workspaceId = searchParams.get('workspaceId');

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  // New state for comments
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Edit task state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
    dueDate: '',
    subtasks: [] as Subtask[],
  });
  const [updatingTask, setUpdatingTask] = useState(false);

  useEffect(() => {
    if (!taskId || !workspaceId) {
      router.push('/workspace');
      return;
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
  }, [router, taskId, workspaceId]);

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
        // Refresh task data to show new attachments
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
        // Reset file input
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
        // Refresh task data to remove deleted attachment
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

  // New handler for adding comment
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
        // Refresh task data to show new comment
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

  // Initialize edit form when task loads
  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        subtasks: [...task.subtasks],
      });
    }
  }, [task]);

  // Handler for starting edit mode
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Handler for canceling edit
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
      });
    }
  };

  // Handler for updating task
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

        {/* Edit Form */}
        {isEditing && (
          <div className="mb-6 bg-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Edit Task</h2>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black resize-none"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'todo' | 'in-progress' | 'done' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Subtasks</label>
                <div className="space-y-2">
                  {editForm.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => {
                          const newSubtasks = [...editForm.subtasks];
                          newSubtasks[index].completed = e.target.checked;
                          setEditForm({ ...editForm, subtasks: newSubtasks });
                        }}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => {
                          const newSubtasks = [...editForm.subtasks];
                          newSubtasks[index].title = e.target.value;
                          setEditForm({ ...editForm, subtasks: newSubtasks });
                        }}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                        placeholder="Subtask title"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSubtasks = editForm.subtasks.filter((_, i) => i !== index);
                          setEditForm({ ...editForm, subtasks: newSubtasks });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        subtasks: [...editForm.subtasks, { title: '', completed: false }]
                      });
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    + Add Subtask
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={updatingTask}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50"
                >
                  {updatingTask ? 'Updating...' : 'Update Task'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Due Date</h2>
          <p className="text-indigo-200">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date set'}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Priority</h2>
          <p className="text-indigo-200 capitalize">{task.priority}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Status</h2>
          <p className="text-indigo-200 capitalize">{task.status}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Subtasks</h2>
          {task.subtasks.length === 0 ? (
            <p className="text-indigo-200">No subtasks added.</p>
          ) : (
            <ul className="list-disc list-inside text-indigo-200">
              {task.subtasks.map((subtask, index) => (
                <li key={index} className={subtask.completed ? 'line-through' : ''}>
                  {subtask.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Attachments</h2>
          {task.attachments && task.attachments.length > 0 ? (
            <div className="space-y-3">
              {task.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{attachment.originalName}</p>
                      <p className="text-indigo-300 text-sm">
                        {(attachment.size / 1024).toFixed(1)} KB • {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${attachment.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.filename)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-200">No attachments uploaded yet.</p>
          )}

          {/* File Upload Form */}
          <div className="mt-4">
            <form onSubmit={handleFileUpload} className="flex gap-4">
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
              />
              <button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Comments</h2>
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4">
              {task.comments.map((comment, index) => (
                <div key={comment._id} className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{comment.author.name}</p>
                      <p className="text-indigo-300 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-indigo-200">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-200">No comments yet.</p>
          )}

          {/* Add Comment Form */}
          <div className="mt-4">
            <form onSubmit={handleAddComment} className="flex gap-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-400 bg-white/80 text-black resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={addingComment || !newComment.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 self-end"
              >
                {addingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={() => router.push(`/workspace/tasks?workspaceId=${workspaceId}`)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
        >
          Back to Task List
        </button>
      </div>
    </div>
  );
}
