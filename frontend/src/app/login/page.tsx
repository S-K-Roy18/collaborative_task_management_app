'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save token to localStorage or cookie
        localStorage.setItem('token', data.token);
        router.push('/workspace');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1000&fit=crop')
          `,
          backgroundSize: '400px 400px, 300px 300px, cover',
          backgroundPosition: '25% 25%, 75% 75%, center',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat'
        }}
      />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-pink-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute top-40 right-32 w-16 h-16 bg-pink-400/20 rounded-full" />
      <div className="absolute bottom-32 left-40 w-24 h-24 bg-blue-400/15 rounded-full" />

      {/* Additional Decorative Elements */}
      <div className="absolute top-16 left-1/4 w-3 h-3 bg-white/40 rounded-full" />
      <div className="absolute top-1/2 right-16 w-2 h-2 bg-white/50 rounded-full" />
      <div className="absolute bottom-20 left-1/2 w-4 h-4 bg-white/30 rounded-full" />

      {/* Main Card with 3D Effect */}
      <div className="relative z-10 perspective-1000">
        <div className="card-3d max-w-md w-full bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 transform-gpu hover:rotate-y-5 transition-transform duration-700">
          <div className="card-face">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center animate-slideInLeft bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="transform transition-transform hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 bg-white/80 text-black backdrop-blur-sm"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="transform transition-transform hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 bg-white/80 text-black backdrop-blur-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-2xl"
              >
                Log In
              </button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-700">
                Don't have an account?{' '}
                <Link href="/signup" className="text-pink-600 hover:text-purple-600 hover:underline font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
              <p className="text-sm">
                <Link href="/forgot-password" className="text-pink-600 hover:text-purple-600 hover:underline font-semibold transition-colors">
                  Forgot Password?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .card-3d {
          transform-style: preserve-3d;
        }
        .card-face {
          backface-visibility: hidden;
        }
        @keyframes bgMove {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(1deg); }
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
        @keyframes bgMove2 {
          0%, 100% { transform: scale(1.05) rotate(-1deg); }
          50% { transform: scale(1.1) rotate(0.5deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(360deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(90deg); }
          50% { transform: translateY(-5px) rotate(180deg); }
          75% { transform: translateY(-15px) rotate(270deg); }
        }
        @keyframes float5 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        @keyframes float6 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(120deg); }
          66% { transform: translateY(8px) rotate(240deg); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-bgMove { animation: bgMove 20s ease-in-out infinite; }
        .animate-bgMove2 { animation: bgMove2 25s ease-in-out infinite; }
        .animate-gradientShift { animation: gradientShift 8s ease-in-out infinite; }
        .animate-float1 { animation: float1 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float3 10s ease-in-out infinite; }
        .animate-float4 { animation: float4 7s ease-in-out infinite; }
        .animate-float5 { animation: float5 9s ease-in-out infinite; }
        .animate-float6 { animation: float6 11s ease-in-out infinite; }
        .animate-slideInLeft { animation: slideInLeft 0.8s ease-out; }
      `}</style>
    </div>
  );
}
