import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Copy,
  Link2,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useClassContext } from '../context/ClassContext';

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatRelative(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Create Class Form ────────────────────────────────────────────────────────

interface CreateFormProps {
  onCreated: () => void;
  hasExisting: boolean;
}

const CreateForm: React.FC<CreateFormProps> = ({ onCreated, hasExisting }) => {
  const { createSession } = useClassContext();
  const [name, setName] = useState('CS201 Data Structures & Algorithms');
  const [subject, setSubject] = useState('Computer Science');
  const [lectureTitle, setLectureTitle] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExisting && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    createSession(name.trim(), subject.trim(), lectureTitle.trim() || undefined);
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {confirmReplace && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold mb-1">You already have an active class.</p>
            <p>Creating a new one will immediately end the existing session. Students in the old class will see "Session ended". Continue?</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Class Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g. CS201 Data Structures & Algorithms"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={60}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g. Computer Science"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Lecture Title <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g. Lecture 7: AVL Trees"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        {confirmReplace ? 'Yes, End Old Class & Create New' : 'Create Class & Generate Code'}
      </button>
      {confirmReplace && (
        <button
          type="button"
          onClick={() => setConfirmReplace(false)}
          className="w-full py-2.5 rounded-2xl border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

// ─── Active Class Card ────────────────────────────────────────────────────────

interface ActiveCardProps {
  onNewClass: () => void;
}

const ActiveCard: React.FC<ActiveCardProps> = ({ onNewClass }) => {
  const { activeSession, roster, endSession, regenCode } = useClassContext();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showRoster, setShowRoster] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Tick for "X ago" labels
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  if (!activeSession) return null;

  const joinLink = `${window.location.origin}/join?code=${activeSession.code}`;

  const copyText = async (text: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-emerald-700 font-black text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Class Active
        </span>
        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Created {formatTime(activeSession.createdAt)}
        </span>
      </div>

      {/* Class name + subject */}
      <div>
        <h2 className="text-xl font-black text-zinc-900">{activeSession.name}</h2>
        <p className="text-sm text-zinc-500 font-medium mt-0.5">
          {activeSession.subject}
          {activeSession.lectureTitle ? ` · ${activeSession.lectureTitle}` : ''}
        </p>
      </div>

      {/* Big code display */}
      <div className="bg-zinc-950 rounded-3xl p-8 flex flex-col items-center gap-5">
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Class Join Code</p>
        <span
          className="text-white font-mono font-black tracking-[0.4em] select-all"
          style={{ fontSize: '3.5rem', lineHeight: 1 }}
        >
          {activeSession.code}
        </span>
        <p className="text-zinc-500 text-xs text-center">
          Share this code or the QR with students to join
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => copyText(activeSession.code, 'code')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-100 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            {copied === 'code' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied === 'code' ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={() => copyText(joinLink, 'link')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-100 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            {copied === 'link' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
            {copied === 'link' ? 'Copied!' : 'Copy Join Link'}
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 p-6 bg-white border border-zinc-200 rounded-3xl">
        <QRCodeSVG value={joinLink} size={160} level="M" includeMargin />
        <p className="text-xs text-zinc-500 font-medium">Scan to open join page</p>
        <p className="text-[11px] text-zinc-400 font-mono break-all text-center">{joinLink}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Students Joined</p>
          <p className="text-3xl font-black text-emerald-700">{roster.length}</p>
        </div>
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
          <p className="text-lg font-black text-zinc-800 capitalize">{activeSession.status}</p>
        </div>
      </div>

      {/* Live Roster */}
      <div className="border border-zinc-200 rounded-3xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 bg-zinc-50 text-sm font-black text-zinc-700 hover:bg-zinc-100 transition-colors"
          onClick={() => setShowRoster((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            Live Roster ({roster.length})
          </span>
          {showRoster ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRoster && (
          <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
            {roster.length === 0 ? (
              <div className="px-5 py-6 text-center text-zinc-400 text-sm">
                No students have joined yet. Share the code above!
              </div>
            ) : (
              roster.map((m) => (
                <div key={m.studentId} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                      {m.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-800">{m.studentName}</span>
                        {m.isLate && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                            Late joiner ({new Date(m.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">{formatRelative(m.joinedAt)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Regenerate */}
        {confirmRegen ? (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-amber-800">
              Regenerate code? The old code <span className="font-mono">{activeSession.code}</span> will immediately stop working.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { regenCode(); setConfirmRegen(false); }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-black text-sm hover:bg-amber-600 transition-colors"
              >
                Yes, regenerate
              </button>
              <button
                onClick={() => setConfirmRegen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRegen(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Code
          </button>
        )}

        {/* End class */}
        {confirmEnd ? (
          <div className="p-4 bg-red-50 border border-red-300 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-red-800">
              End this class? Students will be notified the session has ended and cannot re-join with this code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { endSession(); setConfirmEnd(false); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-colors"
              >
                Yes, End Class
              </button>
              <button
                onClick={() => setConfirmEnd(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmEnd(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 border border-red-300 text-red-700 font-black text-sm hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            End Class
          </button>
        )}

        <button
          onClick={onNewClass}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Class
        </button>
      </div>
    </div>
  );
};

// ─── Ended Class Card ─────────────────────────────────────────────────────────

const EndedCard: React.FC<{ onNewClass: () => void }> = ({ onNewClass }) => (
  <div className="text-center py-10 space-y-4">
    <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 flex items-center justify-center">
      <XCircle className="w-7 h-7 text-zinc-400" />
    </div>
    <div>
      <p className="font-black text-zinc-700 text-lg">No Active Class</p>
      <p className="text-sm text-zinc-400 mt-1">Create a class to generate a join code for students.</p>
    </div>
    <button
      onClick={onNewClass}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-700 transition-colors"
    >
      <PlusCircle className="w-4 h-4" />
      Create Class
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ClassCodePage: React.FC = () => {
  const { currentUser } = useApp();
  const { activeSession } = useClassContext();
  const [showForm, setShowForm] = useState(false);

  // If no session exists yet, show form immediately
  const showingForm = showForm || !activeSession;

  if (currentUser.role !== 'teacher') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="font-black text-zinc-700 text-lg">Teacher view only</p>
        <p className="text-sm text-zinc-400">Switch to the Teacher role to manage class codes.</p>
        <Link to="/app/dashboard" className="inline-block text-sm font-bold text-emerald-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Class Code &amp; Roster</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Generate a unique join code, share it with students, and monitor who has joined in real time.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle">
        {showingForm ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-zinc-900">
                {activeSession ? 'Create New Class' : 'Create Your First Class'}
              </h2>
              {activeSession && (
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm text-zinc-500 hover:text-zinc-900 font-bold"
                >
                  ← Back to active class
                </button>
              )}
            </div>
            <CreateForm
              hasExisting={!!activeSession}
              onCreated={() => setShowForm(false)}
            />
          </div>
        ) : activeSession ? (
          <ActiveCard onNewClass={() => setShowForm(true)} />
        ) : (
          <EndedCard onNewClass={() => setShowForm(true)} />
        )}
      </div>

      {/* Info banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 leading-relaxed">
        <strong>Demo mode:</strong> Class data is stored in your browser's localStorage and synced across
        open tabs via BroadcastChannel. In production, this would use a live database and real-time
        subscriptions (e.g. Supabase Realtime).
      </div>
    </div>
  );
};
