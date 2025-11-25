'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Hero Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 animate-bgMove"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1920&h=1080&fit=crop&crop=center)',
            filter: 'brightness(0.3) contrast(1.2) saturate(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-purple-900/90 to-indigo-900/95 animate-gradientShift" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full animate-float1 blur-2xl" />
      <div className="absolute top-40 right-32 w-32 h-32 bg-gradient-to-br from-purple-400/25 to-pink-400/15 rounded-full animate-float2 blur-xl" />
      <div className="absolute bottom-32 left-40 w-48 h-48 bg-gradient-to-br from-indigo-400/15 to-blue-400/10 rounded-full animate-float3 blur-2xl" />
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-pink-400/20 to-purple-400/12 rounded-full animate-float4 blur-xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-400/15 to-teal-400/10 rounded-full animate-float5 blur-lg" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-violet-400/18 to-indigo-400/12 rounded-full animate-float6 blur-lg" />

      {/* Geometric Decorative Elements */}
      <div className="absolute top-16 left-16 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
      <div className="absolute top-32 right-24 w-1 h-1 bg-blue-300/50 rounded-full animate-ping" />
      <div className="absolute bottom-24 left-32 w-3 h-3 bg-purple-300/40 rounded-full animate-pulse" />
      <div className="absolute bottom-16 right-16 w-2 h-2 bg-pink-300/50 rounded-full animate-ping" />
      <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-cyan-300/60 rounded-full animate-pulse" />
      <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-emerald-300/40 rounded-full animate-ping" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
        <div className="max-w-7xl mx-auto">


          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Enhanced Left Content */}
            <div className="text-center lg:text-left animate-slideInLeft space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight">
                  Collaborative{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                    Task Management
                  </span>
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mx-auto lg:mx-0"></div>
              </div>

              <p className="text-xl lg:text-2xl text-gray-200 mb-10 leading-relaxed max-w-2xl font-light">
                Experience the future of collaborative work with our intelligent task management platform.
                <span className="text-cyan-300 font-medium"> Streamline workflows, boost efficiency, and achieve more together.</span>
              </p>

              <div className="space-y-4 mb-12">
                <div className="flex items-center justify-center lg:justify-start group">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300 shadow-lg shadow-blue-400/50"></div>
                  <span className="text-lg text-gray-300 group-hover:text-white transition-colors duration-300">Real-time collaboration and progress tracking</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start group">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300 shadow-lg shadow-purple-400/50"></div>
                  <span className="text-lg text-gray-300 group-hover:text-white transition-colors duration-300">Smart task prioritization and deadline management</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start group">
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300 shadow-lg shadow-pink-400/50"></div>
                  <span className="text-lg text-gray-300 group-hover:text-white transition-colors duration-300">Advanced analytics and performance insights</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="group relative bg-gradient-to-r from-blue-500 via-purple-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-blue-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-500 shadow-2xl transform hover:scale-110 hover:shadow-blue-500/50 hover:-translate-y-1"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                </Link>
                <Link
                  href="/login"
                  className="group bg-white/10 backdrop-blur-lg text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-500 shadow-xl transform hover:scale-105 border border-white/30 hover:border-white/50"
                >
                  <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Sign In</span>
                </Link>
              </div>
            </div>

            {/* Enhanced Right Content - Hero Image */}
            <div className="relative animate-slideInRight">
              <div className="relative group">
                {/* Enhanced Glow Effect */}
                <div className="absolute -inset-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

                <img
                  src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=500&fit=crop&crop=center"
                  alt="Modern team collaboration workspace"
                  className="relative w-full h-96 lg:h-[500px] object-cover rounded-3xl shadow-2xl transform group-hover:scale-105 transition-all duration-700 border border-white/10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 rounded-3xl group-hover:from-black/20 transition-all duration-500"></div>

                {/* Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Enhanced Floating Stats Cards */}
              <div className="absolute -bottom-8 -left-8 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-4 border-cyan-300 ring-4 ring-cyan-200/30 transform hover:scale-110 hover:-translate-y-2 transition-all duration-500 animate-float1">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">98%</div>
                    <div className="text-sm font-semibold text-gray-700">Task Completion</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-8 -right-8 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-4 border-purple-300 ring-4 ring-purple-200/30 transform hover:scale-110 hover:-translate-y-2 transition-all duration-500 animate-float2">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">50+</div>
                    <div className="text-sm font-semibold text-gray-700">Active Teams</div>
                  </div>
                </div>
              </div>

              {/* Additional Decorative Elements */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-60"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse opacity-70"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the features that make our task management solution the perfect choice for modern teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop&crop=center"
                  alt="Real-time collaboration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Real-Time Collaboration</h3>
                  <p className="text-gray-200">Work together seamlessly with instant updates and live progress tracking across all team members.</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=400&fit=crop&crop=center"
                  alt="Smart task management"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Smart Task Management</h3>
                  <p className="text-gray-200">AI-powered task prioritization and intelligent deadline management to keep your projects on track.</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=400&fit=crop&crop=center"
                  alt="Advanced analytics"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Advanced Analytics</h3>
                  <p className="text-gray-200">Comprehensive performance insights and detailed reports to optimize your team&apos;s productivity.</p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop&crop=center"
                  alt="Team productivity"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Team Productivity</h3>
                  <p className="text-gray-200">Boost efficiency with streamlined workflows and automated task assignments for maximum output.</p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=400&fit=crop&crop=center"
                  alt="Modern workspace"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Modern Workspace</h3>
                  <p className="text-gray-200">Experience a beautiful, intuitive interface designed for the way modern teams work together.</p>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&h=400&fit=crop&crop=center"
                  alt="Secure collaboration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Secure Collaboration</h3>
                  <p className="text-gray-200">Enterprise-grade security with end-to-end encryption for all your sensitive project data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-20">
          <path
            fill="#ffffff"
            d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          ></path>
        </svg>
      </div>

      <style jsx>{`
        @keyframes bgMove {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(-1deg); }
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          33% { transform: translateY(-6px); }
          66% { transform: translateY(4px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-4px); }
          75% { transform: translateY(6px); }
        }
        @keyframes float5 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.05); }
        }
        @keyframes float6 {
          0%, 100% { transform: translateY(0px) scale(1); }
          33% { transform: translateY(-5px) scale(0.95); }
          66% { transform: translateY(3px) scale(1.02); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(147, 51, 234, 0.8); }
        }
        .animate-bgMove { animation: bgMove 20s ease-in-out infinite; }
        .animate-gradientShift { animation: gradientShift 8s ease-in-out infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease-in-out infinite; }
        .animate-float1 { animation: float1 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float3 10s ease-in-out infinite; }
        .animate-float4 { animation: float4 8s ease-in-out infinite; }
        .animate-float5 { animation: float5 7s ease-in-out infinite; }
        .animate-float6 { animation: float6 9s ease-in-out infinite; }
        .animate-slideInLeft { animation: slideInLeft 1s ease-out; }
        .animate-slideInRight { animation: slideInRight 1s ease-out 0.3s both; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
