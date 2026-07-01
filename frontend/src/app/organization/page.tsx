'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  _id: string;
  name: string;
  description: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    user: string;
    role: string;
  }>;
  inviteCode: string;
}

export default function OrganizationSelectionPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userName, setUserName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/organization/my-organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations);
      } else {
        setError(data.message || 'Failed to load organizations');
      }
    } catch (err) {
      setError('An error occurred while fetching organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.name) {
        setUserName(data.name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchUser();
  }, []);

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || joining) return;

    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/organization/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteCode('');
        alert('Joined organization successfully!');
        fetchOrganizations();
      } else {
        alert(data.message || 'Failed to join organization');
      }
    } catch (err) {
      alert('An error occurred while joining organization');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
        <div className="text-white text-xl animate-pulse font-semibold">Loading your organizations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#4f46e5,transparent_45%)] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#9333ea,transparent_45%)] opacity-35" />
      
      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          {userName && (
            <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-sm font-medium backdrop-blur-md">
              👋 Welcome back, {userName}!
            </div>
          )}
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            Choose Your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Organization</span>
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto">
            Select an existing organization to view workspaces and collaborate with your team, or start a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[500px] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">My Organizations</h2>
              
              {organizations.length === 0 ? (
                <div className="text-center py-12 text-indigo-300/60 font-medium">
                  <span className="text-4xl block mb-3">🏢</span>
                  You are not a member of any organization yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {organizations.map((org) => {
                    const isOwner = org.owner._id === localStorage.getItem('userId');
                    return (
                      <div 
                        key={org._id} 
                        className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 rounded-2xl transition duration-300 shadow"
                      >
                        <div className="mb-4 sm:mb-0">
                          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">{org.name}</h3>
                          <p className="text-sm text-indigo-200/80 line-clamp-2 mt-1">{org.description || 'No description provided'}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-indigo-300/60 mt-3 font-semibold items-center">
                            <span>👥 {org.members.length} Members</span>
                            <span>👑 Owner: {org.owner?.name || 'You'}</span>
                            {org.inviteCode && (
                              <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30">
                                <span className="text-indigo-200">Invite Code:</span>
                                <span className="text-white tracking-widest font-mono bg-black/30 px-2 py-0.5 rounded select-all">{org.inviteCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/workspace?orgId=${org._id}`}
                          className="w-full sm:w-auto text-center px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transform active:scale-95 transition"
                        >
                          Enter Organization
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            {/* Join Form */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Join via Code</h3>
              <p className="text-sm text-indigo-200/80 mb-4">
                Have an invite code? Enter it below to join the organization as a developer.
              </p>
              <form onSubmit={handleJoinOrganization} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-indigo-300/50"
                />
                <button
                  type="submit"
                  disabled={joining || !inviteCode.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition duration-200 transform active:scale-95"
                >
                  {joining ? 'Joining...' : 'Join Organization'}
                </button>
              </form>
            </div>

            {/* Create Link */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition duration-300" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Start Fresh</h3>
                <p className="text-white/80 text-sm mb-6">
                  Create a new organization to set up your team, workspaces, permissions, and start collaborate.
                </p>
                <Link
                  href="/organization/create"
                  className="inline-block w-full text-center py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-slate-50 transition transform active:scale-95 shadow-lg"
                >
                  Create Organization
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
