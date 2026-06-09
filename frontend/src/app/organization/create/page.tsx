'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Organization created successfully!');
        router.push('/organization');
      } else {
        alert(data.message || 'Failed to create organization');
      }
    } catch (err) {
      alert('An error occurred while creating organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#4f46e5,transparent_45%)] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#9333ea,transparent_45%)] opacity-35" />

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-4xl block mb-2">🏢</span>
            <h1 className="text-3xl font-extrabold text-white">New Organization</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Start collaborating by creating a fresh organization container.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Organization Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corporation, Team Titan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-indigo-300/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Description</label>
              <textarea
                placeholder="Briefly describe the purpose of this organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-indigo-300/40"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/organization"
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center shadow transition active:scale-95"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
