import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, UserCheck, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, switchRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAppView = location.pathname.startsWith('/app');

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo Left */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-dark-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-zinc-950 flex items-center gap-1.5">
              LectureLens
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                MVP
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        {!isAppView && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
            <a href="#how-it-works" className="hover:text-zinc-950 transition-colors">
              How it Works
            </a>
            <a href="#mental-mirror" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
              Mental Mirror <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </a>
            <a href="#problem" className="hover:text-zinc-950 transition-colors">
              The Problem
            </a>
            <a href="#for-teachers" className="hover:text-zinc-950 transition-colors">
              For Teachers
            </a>
          </nav>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher for instant testing */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => switchRole('student')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                currentUser.role === 'student'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Switch to Student Persona (Aarav)"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Student
            </button>
            <button
              onClick={() => switchRole('teacher')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                currentUser.role === 'teacher'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Switch to Teacher Persona (Prof. Meera Sen)"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Teacher
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => navigate('/app/dashboard')}
            className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{isAppView ? 'Dashboard' : 'Launch App'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
