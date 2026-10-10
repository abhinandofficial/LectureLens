import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RemediationModal } from './RemediationModal';
import {
  LayoutDashboard,
  GitFork,
  BrainCircuit,
  RotateCcw,
  FileText,
  BarChart3,
  UploadCloud,
  ChevronLeft,
  UserCheck,
  Shield,
  BookOpen,
  Sparkles,
  Zap,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentUser, switchRole, course, activeLanguage, setActiveLanguage } = useApp();
  const navigate = useNavigate();

  const isTeacher = currentUser.role === 'teacher';

  const studentNavItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/graph', label: 'Knowledge Graph', icon: GitFork },
    { to: '/app/practice', label: 'Mental Mirror Practice', icon: BrainCircuit },
    { to: '/app/review-queue', label: 'Decay Review Queue', icon: RotateCcw },
    { to: '/app/catchup', label: 'Catch-Up Notes & Audio', icon: FileText },
  ];

  const teacherNavItems = [
    { to: '/app/dashboard', label: 'Cohort Overview', icon: LayoutDashboard },
    { to: '/app/analytics', label: 'Cohort Analytics', icon: BarChart3 },
    { to: '/app/syllabus', label: 'Syllabus & Cycle Validator', icon: UploadCloud },
    { to: '/app/graph', label: 'Knowledge Graph (Teacher Mode)', icon: GitFork },
  ];

  const currentNavItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand + Course */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-dark-900 flex items-center justify-center text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-950 hidden sm:inline">
              LectureLens
            </span>
          </Link>

          <div className="h-5 w-[1px] bg-zinc-200"></div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
              {course.code}
            </span>
            <span className="text-sm font-semibold text-zinc-900 hidden md:inline truncate max-w-xs">
              {course.title}
            </span>
          </div>
        </div>

        {/* Right: Controls & Persona */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-2 py-1 rounded-md transition-all ${
                activeLanguage === 'en'
                  ? 'bg-white text-zinc-900 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLanguage('hi')}
              className={`px-2 py-1 rounded-md transition-all ${
                activeLanguage === 'hi'
                  ? 'bg-white text-zinc-900 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Quick Persona Switcher */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs font-medium">
            <button
              onClick={() => switchRole('student')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                !isTeacher ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Student</span>
            </button>
            <button
              onClick={() => switchRole('teacher')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                isTeacher ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Teacher</span>
            </button>
          </div>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-zinc-300 object-cover"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-900 leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-zinc-500 capitalize">{currentUser.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {isTeacher ? 'Teacher Controls' : 'Learning Recovery'}
            </div>

            {currentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-dark-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Info Box in Sidebar */}
          <div className="mt-8 p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-subtle text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isTeacher ? 'Topological Engine' : 'Cognitive Diagnosis'}
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              {isTeacher
                ? 'Gemini syllabus extracts are cycle-verified via Kahn\'s algorithm before publish.'
                : 'Misconceptions are mirrored with counterexamples and scheduled via decay stability.'}
            </p>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global 60s Remediation Modal */}
      <RemediationModal />
    </div>
  );
};
