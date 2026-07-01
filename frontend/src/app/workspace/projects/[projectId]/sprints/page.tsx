'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '../../../../../context/socketContext';

interface Sprint {
  _id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed';
}

interface Task {
  _id: string;
  title: string;
  status: string;
  sprint?: string; // ID of sprint if assigned
}

export default function SprintPlanningPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const [projectId, setProjectId] = useState<string>('');

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // New sprint form
  const [showCreate, setShowCreate] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '', goal: '', startDate: '', endDate: ''
  });

  useEffect(() => {
    params.then(p => setProjectId(p.projectId));
  }, [params]);

  useEffect(() => {
    if (!projectId || !workspaceId) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        // Fetch sprints
        const sprintRes = await fetch(`/api/sprints/project/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sprintData = await sprintRes.json();
        if (sprintData.success) {
          setSprints(sprintData.sprints);
        }

        // Fetch backlog tasks (tasks in workspace that belong to project)
        const tasksRes = await fetch(`/api/task/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasksData = await tasksRes.json();
        if (tasksData.success) {
          // Filter tasks that belong to this project
          setTasks(tasksData.tasks.filter((t: any) => t.project === projectId));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, workspaceId, router]);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sprints/project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newSprint, workspace: workspaceId })
      });
      const data = await res.json();
      if (data.success) {
        setSprints([...sprints, data.sprint]);
        setShowCreate(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const assignTaskToSprint = async (taskId: string, sprintId: string | null) => {
    try {
      const token = localStorage.getItem('token');
      // We will use existing task update endpoint
      await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sprint: sprintId })
      });
      
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, sprint: sprintId || undefined } : t));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading Sprints...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sprint Planning</h1>
          <p className="text-indigo-200">Organize your backlog into executable sprints.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {showCreate ? 'Cancel' : 'Create Sprint'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-8">
          <form onSubmit={handleCreateSprint} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sprint Name</label>
              <input type="text" required value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Goal</label>
              <input type="text" value={newSprint.goal} onChange={e => setNewSprint({...newSprint, goal: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Start Date</label>
              <input type="date" required value={newSprint.startDate} onChange={e => setNewSprint({...newSprint, startDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">End Date</label>
              <input type="date" required value={newSprint.endDate} onChange={e => setNewSprint({...newSprint, endDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div className="col-span-2">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium">Start Planning</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {sprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprint === sprint._id);
            return (
              <div key={sprint._id} className="bg-slate-900/50 border border-indigo-500/20 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-slate-900 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">{sprint.name}</h3>
                    <p className="text-sm text-slate-400">{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sprint.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-300'}`}>
                    {sprint.status}
                  </span>
                </div>
                <div className="p-4 min-h-[100px]" onDragOver={e => e.preventDefault()} onDrop={(e) => {
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) assignTaskToSprint(taskId, sprint._id);
                }}>
                  {sprintTasks.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-sm">Drag tasks here</p>
                  ) : (
                    <div className="space-y-2">
                      {sprintTasks.map(task => (
                        <div key={task._id} draggable onDragStart={e => e.dataTransfer.setData('taskId', task._id)} className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-move hover:border-indigo-500 transition flex justify-between">
                          <span className="text-white text-sm">{task.title}</span>
                          <button onClick={() => assignTaskToSprint(task._id, null)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Backlog */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[calc(100vh-120px)]">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">Backlog</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2" onDragOver={e => e.preventDefault()} onDrop={(e) => {
            const taskId = e.dataTransfer.getData('taskId');
            if (taskId) assignTaskToSprint(taskId, null);
          }}>
            {tasks.filter(t => !t.sprint).map(task => (
              <div key={task._id} draggable onDragStart={e => e.dataTransfer.setData('taskId', task._id)} className="bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-move hover:border-indigo-500 transition">
                <span className="text-white text-sm">{task.title}</span>
              </div>
            ))}
            {tasks.filter(t => !t.sprint).length === 0 && (
              <p className="text-slate-500 text-center py-8 text-sm">Backlog is empty</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
