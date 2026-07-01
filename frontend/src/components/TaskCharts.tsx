'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function TaskCharts({ tasks }: { tasks: any[] }) {
  if (!tasks) tasks = [];

  const hasTasks = tasks.length > 0;

  // Status Data for Pie Chart
  const statusCounts = { todo: 0, 'in-progress': 0, done: 0 };
  tasks.forEach(t => {
    const s = t.status?.toLowerCase() as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) statusCounts[s]++;
  });

  const pieData = [
    { name: 'To Do', value: statusCounts.todo, color: '#94a3b8' },
    { name: 'In Progress', value: statusCounts['in-progress'], color: '#3b82f6' },
    { name: 'Done', value: statusCounts.done, color: '#10b981' }
  ].filter(d => d.value > 0);

  // Priority Data for Bar Chart
  const priorityCounts = { low: 0, medium: 0, high: 0 };
  tasks.forEach(t => {
    const p = t.priority?.toLowerCase() as keyof typeof priorityCounts;
    if (priorityCounts[p] !== undefined) priorityCounts[p]++;
  });

  const barData = [
    { name: 'Low', count: priorityCounts.low },
    { name: 'Medium', count: priorityCounts.medium },
    { name: 'High', count: priorityCounts.high },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-6">
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Tasks by Status</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {!hasTasks ? (
            <p className="text-gray-400 font-medium italic">Create a task to see analytics</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Tasks by Priority</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {!hasTasks ? (
            <p className="text-gray-400 font-medium italic">Create a task to see analytics</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
