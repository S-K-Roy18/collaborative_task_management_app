'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  description: string;
  role: string;
  memberCount: number;
  isOwner: boolean;
}

export default function WorkspaceSelectionPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/workspace/my-workspaces', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setWorkspaces(data.workspaces);
        } else {
          setError(data.message || 'Failed to load workspaces');
        }
      } catch (err) {
        setError('An error occurred while fetching workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [router]);

async function deleteWorkspace(id: string) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to delete a workspace.');
      return;
    }
    const res = await fetch(`/api/workspace/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.success) {
      setWorkspaces(workspaces.filter(ws => ws.id !== id));
      alert('Workspace deleted successfully.');
    } else {
      alert(data.message || 'Failed to delete workspace.');
    }
  } catch (error) {
    alert('An error occurred while deleting the workspace.');
  }
}

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="text-white text-xl">Loading your workspaces...</div>
    </div>
  );
}

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-red-400 text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-blend-overlay bg-black/40"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 50%, rgba(240, 147, 251, 0.9) 100%),
          url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=1080&fit=crop&crop=center'),
          url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center'),
          url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&crop=center'),
          url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop&crop=center')
        `,
        backgroundSize: '800px 800px, 600px 600px, 400px 400px, cover, cover, 400px 300px, 400px 300px, 400px 300px',
        backgroundPosition: '20% 80%, 80% 20%, 40% 40%, center, center, 90% 10%, 10% 10%, 80% 80%',
        backgroundAttachment: 'fixed, fixed, fixed, fixed, fixed, fixed, fixed, fixed',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat'
      }}
    >
      {/* Additional overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-md animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-sm animate-bounce" style={{ animationDuration: '4s' }}></div>

      {/* Geometric shapes */}
      <div className="absolute top-1/3 left-20 w-2 h-2 bg-white/30 rounded-full"></div>
      <div className="absolute top-1/2 right-32 w-1 h-1 bg-white/40 rounded-full"></div>
      <div className="absolute bottom-1/3 left-32 w-3 h-3 bg-white/20 rounded-full"></div>
      <div className="absolute bottom-1/2 right-20 w-2 h-2 bg-white/30 rounded-full"></div>
      <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-white/50 rounded-full"></div>
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/25 rounded-full"></div>

      {/* Additional floating elements */}
      <div className="absolute top-60 left-1/3 w-12 h-12 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-sm animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-40 right-1/4 w-8 h-8 bg-gradient-to-r from-rose-400/20 to-pink-400/20 rounded-full blur-md animate-bounce" style={{ animationDuration: '5s' }}></div>
      <div className="absolute top-1/2 left-10 w-6 h-6 bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xs animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-lg rounded-full mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Your Workspaces
          </h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            Welcome back! Choose a workspace to dive into your projects, or create a new one to bring your team together.
          </p>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-16 mb-12 shadow-2xl border border-white/20">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
              <p className="text-indigo-200 mb-10 text-lg max-w-md mx-auto">
                Create your first workspace and start collaborating with your team in a beautiful, organized environment.
              </p>
              <Link
                href="/workspace/create"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Workspace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => router.push(`/workspace/dashboard?workspaceId=${workspace.id}`)}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 cursor-pointer hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl border border-white/20 hover:border-white/30"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                    workspace.role === 'admin'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : workspace.role === 'member'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                  }`}>
                    {workspace.role}
                  </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete workspace "${workspace.name}"?`)) {
                  deleteWorkspace(workspace.id);
                }
              }}
              className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
              title="Delete Workspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newName = prompt('Enter new workspace name:', workspace.name);
                const newDescription = prompt('Enter new workspace description:', workspace.description || '');
                if (newName && newName.trim() !== '' && (newName !== workspace.name || (newDescription !== null && newDescription !== (workspace.description || '')))) {
                  renameWorkspace(workspace.id, newName.trim(), newDescription || '');
                }
              }}
              className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
              title="Edit Workspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-100 transition-colors">
                  {workspace.name}
                </h3>

                <p className="text-indigo-200 mb-6 line-clamp-2 leading-relaxed">
                  {workspace.description || 'A collaborative workspace for your team'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-indigo-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>{workspace.memberCount} members</span>
                  </div>
                  {workspace.isOwner && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>Owner</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/workspace/create"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-10 py-5 rounded-2xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Workspace
            </Link>
            <Link
              href="/workspace/join"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

async function renameWorkspace(workspaceId: string, newName: string, newDescription: string) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to edit a workspace.');
      return;
    }

    const res = await fetch(`/api/workspace/${workspaceId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName,
        description: newDescription
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert('Workspace updated successfully.');
      // Refresh the page or update the UI accordingly
      window.location.reload();
    } else {
      alert(data.message || 'Failed to update workspace.');
    }
  } catch (error) {
    alert('An error occurred while updating the workspace.');
  }
}
