import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useClassContext } from '../context/ClassContext';
import { ClassSession } from '../services/classSessionStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const CODE_LENGTH = 6;

// ─── Join Form ────────────────────────────────────────────────────────────────

const JoinForm: React.FC = () => {
  const { currentUser } = useApp();
  const { joinByCode, joinedClass } = useClassContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefillCode = (searchParams.get('code') ?? '').toUpperCase().trim();
  const [code, setCode] = useState(prefillCode);
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedSession, setJoinedSession] = useState<ClassSession | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-join if code is prefilled and student is already named
  useEffect(() => {
    if (prefillCode.length === CODE_LENGTH && currentUser.name && !joinedClass) {
      // Don't auto-submit — just prefill; teacher might share link before class starts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [cooldown]);

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== CODE_LENGTH) {
      setError(`Code must be exactly ${CODE_LENGTH} characters.`);
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (cooldown > 0) {
      setError(`Too many failed attempts. Try again in ${cooldown}s.`);
      return;
    }

    setLoading(true);
    const result = joinByCode(code, currentUser.id ?? 'student-demo', displayName.trim());
    setLoading(false);

    if (result.ok) {
      setJoinedSession(result.session);
      // Auto-redirect to Live Classroom after brief success moment
      setTimeout(() => navigate('/app/live-session'), 800);
    } else {
      // Extract cooldown from rate limit message
      const match = result.reason.match(/(\d+)s/);
      if (match) setCooldown(parseInt(match[1], 10));
      setError(result.reason);
    }
  };

  // Already in a class (joined previously and still active)
  if (joinedClass && !joinedSession) {
    return (
      <ConfirmationCard
        session={joinedClass.session}
        onLeave={() => {}}
        isRejoining
      />
    );
  }

  if (joinedSession) {
    return <ConfirmationCard session={joinedSession} onLeave={() => setJoinedSession(null)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Code input */}
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Class Code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="e.g. K7M4QX"
          maxLength={CODE_LENGTH}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full text-center font-mono font-black tracking-[0.5em] text-3xl px-4 py-5 rounded-2xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-300 placeholder:text-base uppercase"
        />
        <p className="text-xs text-zinc-400 mt-1.5 text-center">
          {code.length}/{CODE_LENGTH} characters · Letters and numbers only
        </p>
      </div>

      {/* Display name */}
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Enter your name"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          {cooldown > 0 && (
            <span className="ml-auto flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5" />
              {cooldown}s
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || cooldown > 0 || code.length !== CODE_LENGTH}
        className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-base flex items-center justify-center gap-2 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <LogIn className="w-5 h-5" />
        {loading ? 'Joining…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Join Class'}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        Don't have a code?{' '}
        <span className="font-bold text-zinc-600">Ask your teacher to share it.</span>
      </p>
    </form>
  );
};

// ─── Confirmation Card ────────────────────────────────────────────────────────

interface ConfirmationCardProps {
  session: ClassSession;
  onLeave: () => void;
  isRejoining?: boolean;
}

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ session, onLeave, isRejoining }) => {
  const { currentUser } = useApp();
  const { leaveCurrentClass, joinedClass } = useClassContext();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const handleLeave = () => {
    leaveCurrentClass(currentUser.id ?? 'student-demo');
    onLeave();
  };

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-zinc-900">
            {isRejoining ? 'You\'re in the class!' : 'Joined Successfully!'}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {isRejoining ? 'You already joined this session.' : 'Your teacher can see you in the roster.'}
          </p>
        </div>
      </div>

      {/* Session info */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Class</p>
          <p className="font-black text-zinc-900">{session.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Subject</p>
            <p className="text-sm font-bold text-zinc-700">{session.subject}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Teacher</p>
            <p className="text-sm font-bold text-zinc-700">{session.teacherName}</p>
          </div>
        </div>
        {session.lectureTitle && (
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Lecture</p>
            <p className="text-sm font-bold text-zinc-700">{session.lectureTitle}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Code</p>
          <p className="font-mono font-black text-lg tracking-widest text-zinc-900">{session.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
              session.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {session.status === 'active' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Ended
              </>
            )}
          </span>
        </div>
      </div>

      {/* Navigate to app */}
      {session.status === 'active' && (
        <Link
          to="/app/dashboard"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-700 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {session.status === 'ended' && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          This class session has ended. Contact your teacher for the next session's code.
        </div>
      )}

      {/* Leave class */}
      {joinedClass && (
        <div>
          {confirmLeave ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-red-800">Leave this class? You'll need to re-enter the code to rejoin.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleLeave}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-colors"
                >
                  Yes, Leave
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-colors"
                >
                  Stay
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full py-3 rounded-2xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
            >
              Leave Class
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const JoinClassPage: React.FC = () => {
  const { currentUser } = useApp();
  const { joinedClass } = useClassContext();
  const isStudent = currentUser.role === 'student';

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo + brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Join a Class</h1>
          <p className="text-sm text-zinc-500">Enter the code your teacher shared to join the live session.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle">
          {!isStudent ? (
            /* Teacher trying to join — redirect them */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 flex items-center justify-center">
                <Users className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="font-black text-zinc-700">You're logged in as a teacher.</p>
              <p className="text-sm text-zinc-400">
                Switch to the Student role to join a class, or go to{' '}
                <Link to="/app/class-code" className="text-emerald-600 font-bold hover:underline">
                  Class Code &amp; Roster
                </Link>{' '}
                to create a class for your students.
              </p>
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          ) : (
            <JoinForm />
          )}
        </div>

        {/* Already in app link */}
        <p className="text-center text-xs text-zinc-400">
          Already inside?{' '}
          <Link to="/app/dashboard" className="font-bold text-zinc-600 hover:underline">
            Go to Dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
};
