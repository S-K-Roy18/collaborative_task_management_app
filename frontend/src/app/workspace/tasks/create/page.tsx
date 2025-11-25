'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Subtask {
  title: string;
  completed: boolean;
}

interface Tag {
  name: string;
  color: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [] as string[],
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
    subtasks: [] as Subtask[],
    tags: [] as Tag[],
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace');
      return;
    }

    const fetchWorkspace = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(`/api/workspace/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setMembers(data.workspace.members.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
          })));
        } else {
          setError('Failed to load workspace members');
        }
      } catch (err) {
        setError('An error occurred while fetching workspace');
      }
    };

    fetchWorkspace();
  }, [router, workspaceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({ ...formData, assignees: [...formData.assignees, value] });
    } else {
      setFormData({ ...formData, assignees: formData.assignees.filter(id => id !== value) });
    }
  };

  const addSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { title: '', completed: false }],
    });
  };

  const updateSubtask = (index: number, title: string) => {
    const newSubtasks = [...formData.subtasks];
    newSubtasks[index].title = title;
    setFormData({ ...formData, subtasks: newSubtasks });
  };

  const removeSubtask = (index: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    setFormData({
      ...formData,
      tags: [...formData.tags, { name: '', color: '#007bff' }],
    });
  };

  const updateTag = (index: number, field: keyof Tag, value: string) => {
    const newTags = [...formData.tags];
    newTags[index][field] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          subtasks: formData.subtasks.filter(st => st.title.trim() !== ''),
          tags: formData.tags.filter(tag => tag.name.trim() !== ''),
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/workspace/tasks?workspaceId=${workspaceId}`);
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setError('An error occurred while creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden perspective-1000"
      style={{
        backgroundImage: 'url(/workspace-hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-teal-50/80 to-cyan-100/80"></div>

      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-20 shadow-lg transform translate-z-0 translate-y-0 translate-x-0 rotate-x-0 rotate-y-0 rotate-z-0 scale-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Create New Task
                </h1>
                <p className="text-emerald-600 font-medium">Add a new task to your workspace</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">Task Creation</span>
              </div>
              <button
                onClick={() => router.push(`/workspace/tasks?workspaceId=${workspaceId}`)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                Back to Tasks
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assignees</label>
            <div className="space-y-3">
              {members.map(member => (
                <label key={member.id} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    value={member.id}
                    checked={formData.assignees.includes(member.id)}
                    onChange={handleAssigneeChange}
                    className="mr-3 w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="text-gray-900 font-medium">{member.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({member.email})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
            >
              <option value="todo">📋 To Do</option>
              <option value="in-progress">⚡ In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subtasks</label>
            {formData.subtasks.map((subtask, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={subtask.title}
                  onChange={(e) => updateSubtask(index, e.target.value)}
                  placeholder="Subtask title"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => removeSubtask(index)}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSubtask}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              + Add Subtask
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tags</label>
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex gap-3 mb-3 items-center">
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => updateTag(index, 'name', e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200"
                />
                <input
                  type="color"
                  value={tag.color}
                  onChange={(e) => updateTag(index, 'color', e.target.value)}
                  className="w-12 h-10 p-0 border border-gray-300 rounded-xl shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTag}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              + Add Tag
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/workspace/tasks?workspaceId=${workspaceId}`)}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
