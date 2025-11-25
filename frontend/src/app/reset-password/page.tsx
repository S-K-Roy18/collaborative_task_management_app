'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password has been reset successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-yellow-900/70 to-pink-900/80" />
        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Invalid Reset Link
          </h2>
          <p className="text-center text-gray-700 mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <div className="text-center">
            <Link href="/forgot-password" className="text-red-600 hover:text-pink-600 hover:underline font-semibold">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 animate-bgMove"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=1000&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-yellow-900/70 to-pink-900/80 animate-gradientShift" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-24 left-24 w-16 h-16 bg-white/10 rounded-full animate-float1" />
      <div className="absolute top-36 right-36 w-12 h-12 bg-red-400/20 rounded-full animate-float2" />
      <div className="absolute bottom-36 left-36 w-20 h-20 bg-yellow-400/15 rounded-full animate-float3" />

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 transform transition-transform hover:scale-105 duration-500">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center animate-slideInDown bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform transition-transform hover:scale-105">
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-red-400 focus:border-red-400 transition-all duration-300 bg-white/80 backdrop-blur-sm text-black"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="transform transition-transform hover:scale-105">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-red-400 focus:border-red-400 transition-all duration-300 bg-white/80 backdrop-blur-sm text-black"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        {message && <p className="mt-6 text-center text-sm text-gray-700 bg-white/80 backdrop-blur-sm rounded-lg p-3">{message}</p>}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            Remember your password?{' '}
            <Link href="/login" className="text-red-600 hover:text-pink-600 hover:underline font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bgMove {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(2deg); }
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(360deg); }
        }
        @keyframes slideInDown {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bgMove { animation: bgMove 20s ease-in-out infinite; }
        .animate-gradientShift { animation: gradientShift 8s ease-in-out infinite; }
        .animate-float1 { animation: float1 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float3 10s ease-in-out infinite; }
        .animate-slideInDown { animation: slideInDown 0.8s ease-out; }
      `}</style>
    </div>
  );
}
