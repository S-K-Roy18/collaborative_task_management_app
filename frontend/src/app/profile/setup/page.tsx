'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    profilePicture: '',
    jobTitle: '',
    department: '',
    bio: '',
    contactInformation: '',
    timezone: 'UTC',
  });
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray
        }),
      });

      if (res.ok) {
        router.push('/workspace');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Animated Background matching the vibrant aesthetic */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 animate-bgMove"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-blue-900/90 animate-gradientShift" />
      </div>

      <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/10 rounded-full animate-float1 blur-2xl" />
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full animate-float2 blur-xl" />

      <div className="relative z-10 w-full max-w-3xl perspective-1000 p-6">
        <div className="card-3d bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 transform-gpu hover:-translate-y-1 transition-transform duration-500 border border-white/20">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </h2>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Job Title</label>
                <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} 
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all" placeholder="e.g. Senior Developer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} 
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all" placeholder="e.g. Engineering" />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all" placeholder="Tell your team about yourself..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Contact Information</label>
                <input type="text" name="contactInformation" value={formData.contactInformation} onChange={handleChange} 
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all" placeholder="Phone or Skype" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Time Zone</label>
                <select name="timezone" value={formData.timezone} onChange={handleChange} 
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Skills (Comma separated)</label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} 
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-400 transition-all" placeholder="React, Node.js, Project Management" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-lg transform hover:scale-105 hover:shadow-2xl">
              {loading ? 'Saving Profile...' : 'Complete Setup & Continue'}
            </button>
          </form>
        </div>
      </div>
      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .card-3d { transform-style: preserve-3d; }
        @keyframes bgMove { 0%, 100% { transform: scale(1.1) rotate(0deg); } 50% { transform: scale(1.15) rotate(1deg); } }
        @keyframes gradientShift { 0%, 100% { opacity: 0.9; } 50% { opacity: 1; } }
        @keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-120deg); } }
        .animate-bgMove { animation: bgMove 20s ease-in-out infinite; }
        .animate-gradientShift { animation: gradientShift 8s ease-in-out infinite; }
        .animate-float1 { animation: float1 8s ease-in-out infinite; }
        .animate-float2 { animation: float2 9s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
