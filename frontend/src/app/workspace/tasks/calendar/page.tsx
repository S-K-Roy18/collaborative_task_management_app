'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
}

function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace');
      return;
    }

    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch(`/api/task/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
  }, [workspaceId, router]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-indigo-100">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <Link
            href={`/workspace/dashboard?workspaceId=${workspaceId}`}
            className="ml-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="flex-1 text-center py-3 font-semibold text-sm text-indigo-400 tracking-wider uppercase" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="flex bg-indigo-50/50 rounded-t-2xl border-b border-indigo-100">{days}</div>;
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find tasks for this day
        const dayTasks = tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), cloneDay));

        days.push(
          <div
            className={`min-h-[140px] flex-1 border-r border-b border-indigo-50 p-2 transition-all duration-200 ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-50/50 text-gray-400"
                : isSameDay(day, new Date()) 
                  ? "bg-indigo-50/30 text-indigo-700" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            key={day.toString()}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                isSameDay(day, new Date()) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''
              }`}>
                {formattedDate}
              </span>
              {dayTasks.length > 0 && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {dayTasks.length}
                </span>
              )}
            </div>
            
            <div className="space-y-1.5 overflow-y-auto max-h-[90px] pr-1 custom-scrollbar">
              {dayTasks.map(task => (
                <div 
                  key={task._id} 
                  className={`text-xs p-1.5 rounded-md border truncate shadow-sm font-medium ${getPriorityColor(task.priority)} ${task.status === 'done' || task.status === 'Done' ? 'opacity-50 line-through' : ''}`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex w-full" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    
    return <div className="flex-col bg-white rounded-b-2xl border border-indigo-100 shadow-xl overflow-hidden">{rows}</div>;
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-indigo-600 animate-pulse text-xl font-semibold">Loading Calendar...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/50 p-8">
      <div className="max-w-7xl mx-auto">
        {renderHeader()}
        <div className="shadow-2xl shadow-indigo-100/50 rounded-2xl">
          {renderDays()}
          {renderCells()}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}

export default function CalendarPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl">Loading...</div>}>
      <CalendarPage />
    </Suspense>
  );
}
