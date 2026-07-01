'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Member {
  user: User;
  role: string;
  _id: string;
}

function WorkspaceMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [workspaceMembers, setWorkspaceMembers] = useState<Member[]>([]);
  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      router.push('/workspace');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch workspace to get members and org id
        const wsRes = await fetch(`/api/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const wsData = await wsRes.json();

        if (!wsData.success) {
          setError(wsData.message || 'Failed to load workspace');
          setLoading(false);
          return;
        }

        setWorkspaceMembers(wsData.workspace.members);

        // Fetch org to get all org members
        const orgId = wsData.workspace.organization?._id || wsData.workspace.organization;
        
        if (!orgId) {
           console.error("Workspace has no organization id!");
           setError("Workspace is not linked to an organization.");
           setLoading(false);
           return;
        }

        const orgRes = await fetch(`/api/organization/${orgId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const orgData = await orgRes.json();

        if (orgData.success) {
          setOrgMembers(orgData.organization?.members || orgData.data?.members || []);
        } else {
           console.error("Org fetch failed:", orgData);
        }

      } catch (err) {
        console.error("Fetch Data Error:", err);
        setError('An error occurred while fetching data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, router]);

  const handleAddMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: 'Developer' })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh page to show updated lists
        window.location.reload();
      } else {
        alert(data.message || 'Failed to add member');
      }
    } catch (err) {
      alert('An error occurred while adding member');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl animate-pulse">Loading Members...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">{error}</div>;
  }

  const workspaceMemberIds = new Set(workspaceMembers.map(m => m.user._id || m.user));
  const availableOrgMembers = orgMembers.filter(m => {
      const uId = m.user?._id || m.user;
      return uId && !workspaceMemberIds.has(uId);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workspace Members</h1>
          <Link
            href={`/workspace/dashboard?workspaceId=${workspaceId}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Workspace Members */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Current Members</h2>
            {workspaceMembers.length === 0 ? (
              <p className="text-gray-500">No members found.</p>
            ) : (
              <div className="space-y-4">
                {workspaceMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">{member.user?.email || ''}</p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{member.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add from Organization */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Invite from Organization</h2>
            {availableOrgMembers.length === 0 ? (
              <p className="text-gray-500">All organization members are already in this workspace.</p>
            ) : (
              <div className="space-y-4">
                {availableOrgMembers.map((member, idx) => {
                  const uId = member.user?._id || (typeof member.user === 'string' ? member.user : '');
                  return (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {typeof member.user === 'object' ? member.user?.name : 'User ID: ' + member.user}
                          {member.user?.name ? '' : ' (Unknown)'}
                        </p>
                        <p className="text-sm text-gray-500">{typeof member.user === 'object' ? member.user?.email : ''}</p>
                      </div>
                      <button
                        onClick={() => handleAddMember(uId as string)}
                        disabled={actionLoading === uId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === uId ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceMembersPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
      <WorkspaceMembersPage />
    </Suspense>
  );
}
