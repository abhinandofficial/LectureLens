import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RemediationModal } from './RemediationModal';
import {
  LayoutDashboard,
  GitFork,
  BrainCircuit,
  RotateCcw,
  UploadCloud,
  UserCheck,
  Shield,
  Sparkles,
  HelpCircle,
  Radio,
  LogOut,
  LogIn,
  QrCode,
  Hash,
} from 'lucide-react';
import { useClassContext } from '../context/ClassContext';

export const AppLayout: React.FC = () => {
  const {
    currentUser,
    switchRole,
    course,
    activeLanguage,
    setActiveLanguage,
    logout,
    liveSession,
  } = useApp();
  const { joinedClass } = useClassContext();
  const navigate = useNavigate();

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTeacher = currentUser.role === 'teacher';

  const studentNavItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/live-session', label: 'Live Stream & Catch-Up', icon: Radio },
    { to: '/app/graph', label: 'Knowledge Graph (DAG)', icon: GitFork },
    { to: '/app/practice', label: 'Mental Mirror Practice', icon: BrainCircuit },
    { to: '/app/doubts', label: 'Doubts Portal', icon: HelpCircle },
    { to: '/app/review-queue', label: 'Decay Review Queue', icon: RotateCcw },
    // NEW: Class Code
    { to: '/app/join-class', label: 'Join Class', icon: Hash },
    // NEW: RecallQ
    { to: '/app/recallq', label: 'RecallQ', icon: BrainCircuit },
  ];

  const teacherNavItems = [
    { to: '/app/dashboard', label: 'Cohort Overview', icon: LayoutDashboard },
    { to: '/app/live-session', label: 'Live Studio & PPT Filter', icon: Radio },
    { to: '/app/graph', label: 'Graph (Teacher Heatmap)', icon: GitFork },
    { to: '/app/doubts', label: 'Doubts Moderation', icon: HelpCircle },
    { to: '/app/syllabus', label: 'Syllabus & Kahn Validator', icon: UploadCloud },
    // NEW: Class Code
    { to: '/app/class-code', label: 'Class Code & Roster', icon: QrCode },
    // NEW: RecallQ
    { to: '/app/recallq', label: 'RecallQ Studio', icon: BrainCircuit },
  ];

  const currentNavItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 min-h-16 flex items-center justify-between px-4 sm:px-8 py-2.5">
        {/* Left: Brand + Course */}
        <div className="flex items-center gap-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-dark-900 flex items-center justify-center text-white shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight text-zinc-950 hidden sm:inline">
              LectureLens
            </span>
          </Link>

          <div className="h-5 w-[1px] bg-zinc-200"></div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg border border-zinc-200">
              {course.code}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-800 hidden md:inline truncate max-w-sm">
              {course.title}
            </span>
          </div>

          {/* Global Recording Indicator */}
          {liveSession.recordingStatus === 'recording' && (
            <Link
              to="/app/live-session"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-300 text-red-700 text-xs font-black shadow-xs hover:bg-red-100 transition-colors animate-pulse"
              title="Recording in progress — click to open Live Studio"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span className="tracking-wide">REC</span>
              <span className="font-mono text-zinc-900 font-extrabold">{formatTimer(liveSession.elapsedSeconds)}</span>
            </Link>
          )}

          {liveSession.recordingStatus === 'paused' && (
            <Link
              to="/app/live-session"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold shadow-xs hover:bg-amber-100 transition-colors"
              title="Recording paused — click to open Live Studio"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>PAUSED</span>
              <span className="font-mono text-zinc-700 font-bold">{formatTimer(liveSession.elapsedSeconds)}</span>
            </Link>
          )}

          {/* Student "Class: XXXXXX" chip — shown when student has joined a class */}
          {!isTeacher && joinedClass && joinedClass.session.status === 'active' && (
            <Link
              to="/app/join-class"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-100 transition-colors"
              title={`Joined: ${joinedClass.session.name}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-mono font-black tracking-widest">{joinedClass.session.code}</span>
            </Link>
          )}
        </div>

        {/* Right: Controls & Persona */}
        <div className="flex items-center gap-3">
          {/* Language Toggle with Malayalam */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-2 py-1 rounded-lg transition-all ${
                activeLanguage === 'en'
                  ? 'bg-white text-zinc-950 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLanguage('hi')}
              className={`px-2 py-1 rounded-lg transition-all ${
                activeLanguage === 'hi'
                  ? 'bg-white text-zinc-950 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setActiveLanguage('ml')}
              className={`px-2 py-1 rounded-lg transition-all ${
                activeLanguage === 'ml'
                  ? 'bg-white text-zinc-950 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              മലയാളം
            </button>
          </div>

          {/* Quick Persona Switcher */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => switchRole('student')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                !isTeacher ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Student</span>
            </button>
            <button
              onClick={() => switchRole('teacher')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                isTeacher ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Teacher</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-zinc-200 object-cover"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-900 leading-tight">{currentUser.name}</span>
              <span className="text-[11px] text-zinc-500 capitalize">{currentUser.role}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out or Switch Account"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="px-3 pb-2 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              {isTeacher ? 'Teacher Command' : 'Learning Recovery'}
            </div>

            {currentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm sm:text-base font-extrabold transition-all ${
                      isActive
                        ? 'bg-dark-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Info Box in Sidebar */}
          <div className="mt-8 p-4 rounded-3xl border border-zinc-200 bg-white shadow-subtle text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {isTeacher ? 'Topological Engine' : 'Cognitive Diagnosis'}
            </div>
            <p className="text-zinc-600 leading-relaxed text-xs">
              {isTeacher
                ? "Teacher records lecture mic & PPT. Audio fillers are filtered out and aligned into master notes."
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
