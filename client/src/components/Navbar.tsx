import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, UserCheck, Shield, Radio, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, switchRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAppView = location.pathname.startsWith('/app');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 flex items-center justify-between gap-4">
        {/* Brand Logo Left */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-dark-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl sm:text-2xl tracking-tight text-zinc-950 flex items-center gap-2">
              LectureLens
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                AI Live
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links (matching reference design) */}
        {!isAppView && (
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-zinc-600">
            <a href="#how-it-works" className="hover:text-zinc-950 transition-colors">
              How It Works
            </a>
            <Link to="/app/live-session" className="hover:text-zinc-950 transition-colors flex items-center gap-1.5">
              <span>Live Studio</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </Link>
            <Link to="/app/graph" className="hover:text-zinc-950 transition-colors">
              DAG Engine
            </Link>
            <Link to="/app/practice" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
              Mental Mirror <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
            <a href="#problem" className="hover:text-zinc-950 transition-colors">
              Why LectureLens
            </a>
          </nav>
        )}

        {/* Right Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Role Switcher */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs font-bold">
            <button
              onClick={() => switchRole('student')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentUser.role === 'student'
                  ? 'bg-white text-zinc-950 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Student Persona (Aarav Sharma)"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Student</span>
            </button>
            <button
              onClick={() => switchRole('teacher')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                currentUser.role === 'teacher'
                  ? 'bg-white text-zinc-950 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Teacher Persona (Prof. Meera Sen)"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teacher</span>
            </button>
          </div>

          {/* Sign In Link (matching reference UI) */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-zinc-700 hover:text-zinc-950 px-3 py-2 rounded-2xl hover:bg-zinc-100 transition-colors"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Primary CTA */}
          <button
            onClick={() => navigate('/app/dashboard')}
            className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-2xl transition-all shadow-subtle hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{isAppView ? 'Dashboard' : 'Launch App'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
