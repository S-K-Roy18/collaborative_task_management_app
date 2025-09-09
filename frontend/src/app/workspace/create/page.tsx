'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); // get JWT token from localStorage
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // add Authorization header
        },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/workspace/dashboard?workspaceId=${data.workspace.id}`);
      } else {
        setError(data.message || 'Failed to create workspace');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 50%, rgba(240, 147, 251, 0.85) 100%),
          url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop&crop=center')
        `,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50"></div>

      <div className="relative z-10 max-w-lg w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Create Workspace</h1>
            <p className="text-indigo-200 text-lg max-w-sm mx-auto leading-relaxed">
              Collaborate with your team by creating a workspace. Manage tasks, deadlines, and activities all in one place.
            </p>
          </div>
          {error && (
            <div className="text-red-400 text-center font-semibold mb-6 bg-red-50/10 backdrop-blur-sm rounded-lg p-3 border border-red-400/20">{error}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-3 text-left">
                Workspace Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-indigo-200 backdrop-blur-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-white font-semibold mb-3 text-left">
                Description (optional)
              </label>
              <textarea
                id="description"
                placeholder="Brief description of the workspace"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-indigo-200 backdrop-blur-sm resize-none"
                rows={4}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Creating Workspace...' : 'Create Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
