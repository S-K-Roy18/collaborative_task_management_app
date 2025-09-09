'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Task {
  _id: string;
  title: string;
  description: string;
  assignees: Array<{
    _id: string;
    name: string;
    email: string;
    avatar: string;
  }>;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  subtasks: Array<{
    title: string;
    completed: boolean;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function TaskListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      } catch (err) {
        setError('An error occurred while fetching tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router, workspaceId]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { 'todo': 1, 'in-progress': 2, 'done': 3 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, priorityFilter, sortBy, sortOrder]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tasks</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/workspace')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 relative overflow-hidden">
      {/* Enhanced Background Images and Patterns */}
      <div className="absolute inset-0">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-3"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '60px 60px'
             }}>
        </div>

        {/* Abstract Shapes Background */}
        <div className="absolute inset-0 opacity-4"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M10 10h20v20H10zM50 10h20v20H50zM10 50h20v20H10zM50 50h20v20H50z' fill='%23059669' fill-opacity='0.05'/%3E%3Cpath d='M30 30h20v20H30zM70 70h20v20H70z' fill='%2300b4d8' fill-opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23a)'/%3E%3C/svg%3E")`,
               backgroundSize: '100px 100px'
             }}>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl opacity-6"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-6"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl opacity-4"></div>

        {/* Flowing Lines Pattern */}
        <div className="absolute inset-0 opacity-2"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='b' patternUnits='userSpaceOnUse' width='200' height='200'%3E%3Cpath d='M0 100c50-50 100 0 200-50M0 150c50-25 100 25 200-25M0 200c50 0 100-50 200 0' stroke='%23059669' stroke-width='1' fill='none' stroke-opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23b)'/%3E%3C/svg%3E")`,
               backgroundSize: '200px 200px'
             }}>
        </div>

        {/* Hexagon Pattern */}
        <div className="absolute inset-0 opacity-3"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='c' patternUnits='userSpaceOnUse' width='80' height='80'%3E%3Cpath d='M20 0l20 10v20L20 30 0 20V10z' fill='%2300b4d8' fill-opacity='0.02'/%3E%3Cpath d='M60 40l20 10v20L60 70 40 60V50z' fill='%23059669' fill-opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23c)'/%3E%3C/svg%3E")`,
               backgroundSize: '80px 80px'
             }}>
        </div>

        {/* Organic Shapes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-300 to-teal-400 rounded-full blur-2xl opacity-4"></div>
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full blur-2xl opacity-3"></div>
        <div className="absolute top-3/4 left-1/3 w-28 h-28 bg-gradient-to-br from-teal-300 to-emerald-400 rounded-full blur-2xl opacity-4"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Workspace Tasks
                </h1>
                <p className="text-emerald-600 font-medium">Manage and track your workspace tasks efficiently</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">Tasks Overview</span>
              </div>
              <Link
                href={`/workspace/dashboard?workspaceId=${workspaceId}`}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Filters and Sorting */}
        {tasks.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8 mb-12 transform hover:scale-[1.02] transition-all duration-300"
               style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-3 transform hover:scale-105 transition-transform duration-200">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg shadow-inner">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-slate-800 drop-shadow-sm">Filter & Sort Tasks</span>
              </div>

              <div className="flex flex-wrap gap-4 items-center flex-1">
                <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-200">
                  <label className="text-sm font-semibold text-slate-900">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-slate-50 to-blue-50 shadow-inner hover:shadow-md transition-all duration-200"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)' }}
                  >
                    <option value="all" className="text-slate-900">All Status</option>
                    <option value="todo" className="text-slate-900">📋 To Do</option>
                    <option value="in-progress" className="text-slate-900">⚡ In Progress</option>
                    <option value="done" className="text-slate-900">✅ Done</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-200">
                  <label className="text-sm font-semibold text-slate-900">Priority:</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-slate-50 to-blue-50 shadow-inner hover:shadow-md transition-all duration-200"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)' }}
                  >
                    <option value="all" className="text-slate-900">All Priority</option>
                    <option value="high" className="text-slate-900">🔴 High</option>
                    <option value="medium" className="text-slate-900">🟡 Medium</option>
                    <option value="low" className="text-slate-900">🟢 Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-200">
                  <label className="text-sm font-semibold text-slate-900">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-slate-50 to-blue-50 shadow-inner hover:shadow-md transition-all duration-200"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)' }}
                  >
                    <option value="createdAt" className="text-slate-900">📅 Created Date</option>
                    <option value="title" className="text-slate-900">📝 Title</option>
                    <option value="priority" className="text-slate-900">⚡ Priority</option>
                    <option value="status" className="text-slate-900">📊 Status</option>
                    <option value="dueDate" className="text-slate-900">⏰ Due Date</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-200">
                  <label className="text-sm font-semibold text-slate-900">Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-slate-50 to-blue-50 shadow-inner hover:shadow-md transition-all duration-200"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)' }}
                  >
                    <option value="desc" className="text-slate-900">⬇️ Newest First</option>
                    <option value="asc" className="text-slate-900">⬆️ Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:ml-auto transform hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 px-5 py-3 rounded-xl shadow-inner border border-blue-200/50"
                     style={{ boxShadow: 'inset 0 2px 6px rgba(59, 130, 246, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                  <span className="text-sm font-bold text-slate-800 drop-shadow-sm">
                    📊 Showing {filteredTasks.length} of {tasks.length} tasks
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200/50 p-16 max-w-4xl mx-auto relative overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                 style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}>
              {/* Enhanced Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full -translate-x-20 -translate-y-20 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full translate-x-16 translate-y-16 blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-teal-300 to-emerald-400 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                {/* Enhanced Icon */}
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-110 transition-all duration-300"
                     style={{ boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2)' }}>
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>

                <h2 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6 drop-shadow-lg">
                  🚀 Ready to Get Started?
                </h2>
                <p className="text-emerald-700 mb-12 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
                  Your workspace is ready for action! Create your first task to begin organizing your projects,
                  tracking progress, and collaborating with your team effectively.
                </p>

                {/* Enhanced Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200/50 shadow-xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 group"
                       style={{ boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                    <h3 className="text-xl font-bold text-emerald-900 mb-3">Organize Tasks</h3>
                    <p className="text-emerald-700 leading-relaxed">Keep track of all your project tasks in one place with powerful filtering and sorting</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-200/50 shadow-xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 group"
                       style={{ boxShadow: '0 10px 25px rgba(20, 184, 166, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👥</div>
                    <h3 className="text-xl font-bold text-teal-900 mb-3">Team Collaboration</h3>
                    <p className="text-teal-700 leading-relaxed">Assign tasks and work together seamlessly with real-time updates and notifications</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-200/50 shadow-xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 group"
                       style={{ boxShadow: '0 10px 25px rgba(6, 182, 212, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                    <h3 className="text-xl font-bold text-cyan-900 mb-3">Track Progress</h3>
                    <p className="text-cyan-700 leading-relaxed">Monitor completion and stay on schedule with detailed progress tracking and insights</p>
                  </div>
                </div>

                {/* Enhanced CTA Button */}
                <Link
                  href={`/workspace/tasks/create?workspaceId=${workspaceId}`}
                  className="inline-flex items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-10 py-5 rounded-2xl hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-2xl transform hover:scale-110 hover:-translate-y-1 font-bold text-lg"
                  style={{ boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4), 0 8px 16px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2)' }}
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Task
                  <span className="text-2xl animate-pulse">✨</span>
                </Link>

                {/* Additional motivational text */}
                <p className="text-emerald-600 mt-8 text-sm font-medium">
                  💡 Tip: Start with a simple task to get familiar with the interface
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => router.push(`/workspace/tasks/${task._id}?workspaceId=${workspaceId}`)}
                className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-6 cursor-pointer hover:shadow-3xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden transform hover:rotate-1"
                style={{
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* 3D Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                     style={{ transform: 'translateZ(10px)' }}></div>

                {/* 3D Shadow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"
                     style={{ transform: 'translateZ(-10px)' }}></div>

                <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
                  {/* Header with title and badges */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-slate-700 transition-colors drop-shadow-sm">
                      {task.title}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0 transform hover:scale-110 transition-transform duration-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${getPriorityColor(task.priority)}`}
                            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}>
                        {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${getStatusColor(task.status)}`}
                            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}>
                        {task.status === 'todo' ? '📋' : task.status === 'in-progress' ? '⚡' : '✅'} {task.status}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Task metadata */}
                  <div className="space-y-4">
                    {/* Assignees and due date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                              key={assignee._id}
                              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl border-2 border-white transform hover:scale-110 transition-transform duration-200"
                              title={assignee.name}
                              style={{
                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                                transform: 'translateZ(15px)'
                              }}
                            >
                              {assignee.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl border-2 border-white transform hover:scale-110 transition-transform duration-200"
                                 style={{
                                   boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                                   transform: 'translateZ(15px)'
                                 }}>
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                        {task.assignees.length > 0 && (
                          <span className="text-sm text-slate-700 font-medium">
                            {task.assignees.length} {task.assignees.length === 1 ? 'assignee' : 'assignees'}
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium transform hover:scale-105 transition-transform duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Subtasks progress */}
                    {task.subtasks.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-inner border border-blue-100/50"
                           style={{ boxShadow: 'inset 0 2px 6px rgba(59, 130, 246, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-800">Progress</span>
                          <span className="text-sm text-slate-700 font-bold">
                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full h-3 shadow-inner"
                             style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                            style={{
                              width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`,
                              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 font-medium">
                          {Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)}% completed
                        </p>
                      </div>
                    )}

                    {/* Created info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-200/50">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created {new Date(task.createdAt).toLocaleDateString()} by {task.createdBy.name}
                    </div>
                  </div>
                </div>

                {/* 3D Hover indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                     style={{ transform: 'translateZ(25px)' }}>
                  <div className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-slate-200/50">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
