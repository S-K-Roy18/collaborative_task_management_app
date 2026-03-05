'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    joinedAt: string;
  }>;
  userRole: string;
  inviteCode: string;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export default function WorkspaceDashboardPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || undefined;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });
  const [error, setError] = useState('');
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setError('Workspace ID is missing');
      return;
    }
    const fetchWorkspace = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('User not authenticated');
          return;
        }
        const res = await fetch(`/api/workspace/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setWorkspace(data.workspace);
        } else {
          setError(data.message || 'Failed to load workspace');
        }
      } catch (err) {
        setError('An error occurred while fetching workspace');
      }
    };

    const fetchTaskStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`/api/task/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const tasks = data.tasks;
          const now = new Date();
          const stats: TaskStats = {
            total: tasks.length,
            todo: tasks.filter((t: any) => t.status === 'todo').length,
            inProgress: tasks.filter((t: any) => t.status === 'in-progress').length,
            done: tasks.filter((t: any) => t.status === 'done').length,
            overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
          };
          setTaskStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch task stats:', err);
      }
    };

    fetchWorkspace();
    fetchTaskStats();
  }, [workspaceId]);

  let copyTimeout: NodeJS.Timeout | null = null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(workspace!.inviteCode);
      setShowCopiedNotification(true);
      // Clear any existing timeout to avoid multiple timers
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
      copyTimeout = setTimeout(() => setShowCopiedNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  {workspace.name}
                </h1>
                <p className="text-emerald-600 font-medium">{workspace.description || 'Collaborative workspace for team productivity'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">Active Workspace</span>
              </div>
              <span className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm font-semibold shadow-md">
                {workspace.userRole}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to your Workspace!</h2>
                    <p className="text-emerald-600">Manage tasks, collaborate with your team, and boost productivity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href={`/workspace/tasks?workspaceId=${workspaceId}`}
                  className="group p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">List View</h3>
                      <p className="text-white/80 text-xs">Task list</p>
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/workspace/tasks/kanban?workspaceId=${workspaceId}`}
                  className="group p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl text-white hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Kanban</h3>
                      <p className="text-white/80 text-xs">Drag & drop</p>
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/workspace/tasks/calendar?workspaceId=${workspaceId}`}
                  className="group p-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl text-white hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Calendar</h3>
                      <p className="text-white/80 text-xs">Due dates</p>
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/workspace/tasks/create?workspaceId=${workspaceId}`}
                  className="group p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl text-white hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Create</h3>
                      <p className="text-white/80 text-xs">Add task</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Workspace Stats with Charts */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Task Analytics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200/50 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-gray-700 mb-1">{taskStats.total}</div>
                  <div className="text-gray-600 font-medium text-sm">Total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200/50 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-yellow-700 mb-1">{taskStats.todo}</div>
                  <div className="text-yellow-600 font-medium text-sm">To Do</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{taskStats.inProgress}</div>
                  <div className="text-blue-600 font-medium text-sm">In Progress</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-green-700 mb-1">{taskStats.done}</div>
                  <div className="text-green-600 font-medium text-sm">Done</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200/50 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-red-700 mb-1">{taskStats.overdue}</div>
                  <div className="text-red-600 font-medium text-sm">Overdue</div>
                </div>
              </div>

              {/* Chart Section */}
              {taskStats.total > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Donut Chart */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Distribution</h3>
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 42 42" className="w-full h-full">
                        <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e5e7eb" strokeWidth="3"></circle>
                        {taskStats.todo > 0 && (
                          <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#eab308" strokeWidth="3" strokeDasharray={`${(taskStats.todo / taskStats.total) * 100} ${100 - (taskStats.todo / taskStats.total) * 100}`} strokeDashoffset="25"></circle>
                        )}
                        {taskStats.inProgress > 0 && (
                          <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${(taskStats.inProgress / taskStats.total) * 100} ${100 - (taskStats.inProgress / taskStats.total) * 100}`} strokeDashoffset={`${25 - (taskStats.todo / taskStats.total) * 100}`}></circle>
                        )}
                        {taskStats.done > 0 && (
                          <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${(taskStats.done / taskStats.total) * 100} ${100 - (taskStats.done / taskStats.total) * 100}`} strokeDashoffset={`${25 - ((taskStats.todo + taskStats.inProgress) / taskStats.total) * 100}`}></circle>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{taskStats.total}</div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-gray-600">To Do ({taskStats.todo})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600">In Progress ({taskStats.inProgress})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Done ({taskStats.done})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Overview</h3>
                    <div className="w-full space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Completed</span>
                          <span className="font-semibold text-green-600">{Math.round((taskStats.done / taskStats.total) * 100)}%</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">In Progress</span>
                          <span className="font-semibold text-blue-600">{Math.round((taskStats.inProgress / taskStats.total) * 100)}%</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500" style={{ width: `${(taskStats.inProgress / taskStats.total) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">To Do</span>
                          <span className="font-semibold text-yellow-600">{Math.round((taskStats.todo / taskStats.total) * 100)}%</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500" style={{ width: `${(taskStats.todo / taskStats.total) * 100}%` }}></div>
                        </div>
                      </div>
                      {taskStats.overdue > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Overdue</span>
                            <span className="font-semibold text-red-600">{Math.round((taskStats.overdue / taskStats.total) * 100)}%</span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-400 to-pink-500 transition-all duration-500" style={{ width: `${(taskStats.overdue / taskStats.total) * 100}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Simple Progress Bar */}
              {taskStats.total > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Overall Completion Progress</span>
                    <span className="font-bold text-gray-700">{Math.round((taskStats.done / taskStats.total) * 100)}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500" style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Members */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Team Members ({workspace.members.length})
              </h2>
              <div className="space-y-4">
                {workspace.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 border border-emerald-100/50">
                    <div className="relative">
                      <img
                        src={member.avatar || '/default-avatar.png'}
                        alt={member.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-emerald-600 truncate">{member.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'admin'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Code */}
            {workspace.userRole === 'admin' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM12 8.25v4.5l2.25 1.5" />
                    </svg>
                    Invite Code
                  </h2>
                  <div className="bg-gradient-to-br from-gray-50 to-emerald-50 p-6 rounded-2xl border border-emerald-200/50">
                    <div className="bg-white p-4 rounded-xl shadow-inner">
                      <p className="font-mono text-lg text-center text-gray-800 select-all break-all font-bold">
                        {workspace.inviteCode}
                      </p>
                    </div>
                    <p className="mt-4 text-sm text-emerald-600 text-center font-medium">
                      Share this code to invite new members
                    </p>
                    <button
                      onClick={handleCopyCode}
                      className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
                    >
                      📋 Copy Code
                    </button>

                    {/* Code Copied Notification */}
                    {showCopiedNotification && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg transform animate-fade-in-up">
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold">Code copied to clipboard!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Decorative Element */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Boost Productivity</h3>
                <p className="text-white/90">Collaborate efficiently with your team</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
