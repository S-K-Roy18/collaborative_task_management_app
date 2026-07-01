'use client';
import { signIn } from 'next-auth/react';

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
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response (not JSON)');
      }

      if (res.ok) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userId', data.user._id);
        router.push('/organization');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error("Login Exception:", err);
      setError(err.message || 'An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

      <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute top-40 right-32 w-16 h-16 bg-pink-400/20 rounded-full" />
      <div className="absolute bottom-32 left-40 w-24 h-24 bg-blue-400/15 rounded-full" />
      <div className="absolute top-16 left-1/4 w-3 h-3 bg-white/40 rounded-full" />
      <div className="absolute top-1/2 right-16 w-2 h-2 bg-white/50 rounded-full" />
      <div className="absolute bottom-20 left-1/2 w-4 h-4 bg-white/30 rounded-full" />

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
                Don&apos;t have an account?{' '}
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

        {/* Google Sign-In Button */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/workspace/dashboard' })}
              className="mt-4 w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .card-3d { transform-style: preserve-3d; }
        .card-face { backface-visibility: hidden; }
        @keyframes bgMove { 0%, 100% { transform: scale(1.1) rotate(0deg); } 50% { transform: scale(1.15) rotate(1deg); } }
        @keyframes gradientShift { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 33% { transform: translateY(-15px) rotate(120deg); } 66% { transform: translateY(10px) rotate(240deg); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-25px) rotate(360deg); } }
        @keyframes slideInLeft { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideInLeft { animation: slideInLeft 0.8s ease-out; }
      `}</style>
    </div>
  );
}

