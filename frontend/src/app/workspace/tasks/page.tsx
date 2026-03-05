'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This page now redirects to the Kanban board for better UX
export default function TaskListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  useEffect(() => {
    if (workspaceId) {
      // Redirect to Kanban board
      router.replace(`/workspace/tasks/kanban?workspaceId=${workspaceId}`);
    } else {
      router.push('/workspace');
    }
  }, [router, workspaceId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Redirecting to Kanban Board...</p>
      </div>
    </div>
  );
}

