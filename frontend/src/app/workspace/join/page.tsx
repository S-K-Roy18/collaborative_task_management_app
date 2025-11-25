'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinWorkspacePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to join a workspace');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/workspace/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Successfully joined workspace!');
        setTimeout(() => {
          router.push('/workspace');
        }, 2000);
      } else {
        setError(data.message || 'Failed to join workspace');
      }
    } catch (err) {
      setError('An error occurred while joining workspace');
    } finally {
      setLoading(false);
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Join Workspace
                </h1>
                <p className="text-emerald-600 font-medium">Enter an invite code to join a team</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/workspace"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                Back to Workspaces
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/50 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Workspace</h2>
            <p className="text-emerald-600">Enter the invite code provided by your team admin</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Invite Code
              </label>

              {/* Invite Code Input with Character Separation */}
              <div className="relative">
                <div className="bg-gradient-to-r from-gray-50 to-emerald-50 p-6 rounded-2xl border-2 border-dashed border-emerald-200">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full bg-transparent border-none outline-none text-center font-bold text-xl tracking-[0.2em] text-gray-800 placeholder:text-gray-400 focus:placeholder:text-transparent transition-all duration-300"
                    placeholder="Enter your invite code"
                    required
                    maxLength={30}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Enter the invite code shared by your team admin
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-medium">
                    {inviteCode.length} characters entered
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || inviteCode.length < 4}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Joining...' : 'Join Workspace'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an invite code?{' '}
              <Link
                href="/workspace/create"
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Create your own workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
