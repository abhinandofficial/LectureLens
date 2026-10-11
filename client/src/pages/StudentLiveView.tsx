/**
 * StudentLiveView.tsx
 *
 * Read-only student view of the teacher's live lecture.
 * Subscribes to classLiveChannel events for the joined class code,
 * and hydrates immediately from localStorage (late-joiner catch-up).
 *
 * Rendered by LiveLectureStudioPage when currentUser.role === 'student'.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mic,
  Radio,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  ArrowRight,
  Volume2,
  Sparkles,
  Hash,
  WifiOff,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useClassContext } from '../context/ClassContext';
import { useApp } from '../context/AppContext';
import {
  getLiveState,
  subscribeLiveChannel,
  LiveState,
  LiveChannelEvent,
} from '../services/classLiveChannel';
import { FilteredVoiceChunk, RecordingStatus } from '../types';
import { LateJoinCatchUpPanel } from '../components/LateJoinCatchUpPanel';
import { LateJoinCatchUpData } from '../types/lateJoinCatchUpTypes';
import { generateLateJoinCatchUp } from '../services/lateJoinCatchUpGenerator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Empty state — student has not joined any class ───────────────────────────

const NoClassState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
    <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
      <Hash className="w-8 h-8 text-zinc-400" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-black text-zinc-800">
        Join a class to see the live lecture
      </h2>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto">
        Ask your teacher for the 6-character class code and enter it below to connect to
        the live session.
      </p>
    </div>
    <Link
      to="/app/join-class"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-700 transition-colors"
    >
      <Hash className="w-4 h-4" />
      Join Class
      <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

// ─── Waiting state — teacher hasn't started yet ───────────────────────────────

const WaitingState: React.FC<{ sessionName: string }> = ({ sessionName }) => (
  <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
    <div className="relative w-16 h-16">
      <div className="w-16 h-16 rounded-full border-4 border-zinc-200 animate-ping absolute inset-0 opacity-30" />
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <Radio className="w-7 h-7 text-emerald-500" />
      </div>
    </div>
    <div className="space-y-1">
      <h2 className="text-lg font-black text-zinc-800">
        Waiting for the teacher to start the lecture…
      </h2>
      <p className="text-sm text-zinc-500">{sessionName}</p>
      <p className="text-xs text-zinc-400 mt-1">
        The stream will begin automatically when the teacher starts recording.
      </p>
    </div>
    <div className="flex items-center gap-1.5">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  </div>
);

// ─── Class-ended state ────────────────────────────────────────────────────────

const ClassEndedBanner: React.FC = () => (
  <div className="flex items-center gap-3 p-4 bg-zinc-100 border border-zinc-300 rounded-2xl text-sm text-zinc-700 font-bold">
    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 shrink-0" />
    Class has ended. The transcript and notes below are preserved for your catch-up.
  </div>
);

// ─── Reconnecting banner ──────────────────────────────────────────────────────

const ReconnectingBanner: React.FC = () => (
  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold animate-pulse">
    <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
    Reconnecting… catching up on any missed lines.
  </div>
);

// ─── Recording status badge ───────────────────────────────────────────────────

const StatusBadge: React.FC<{
  status: RecordingStatus;
  elapsedSeconds: number;
  classEnded: boolean;
}> = ({ status, elapsedSeconds, classEnded }) => {
  if (classEnded) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-300 text-zinc-700">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
        <span className="text-sm font-black uppercase tracking-wider">CLASS ENDED</span>
      </div>
    );
  }
  if (status === 'recording') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="text-sm font-black uppercase tracking-wider">RECORDING</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 font-mono font-black text-base text-zinc-900">
          <Clock className="w-4 h-4 text-zinc-500" />
          {fmt(elapsedSeconds)}
        </div>
      </div>
    );
  }
  if (status === 'paused') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-sm font-black uppercase tracking-wider">PAUSED</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 font-mono font-bold text-base text-zinc-700">
          <Clock className="w-4 h-4 text-zinc-400" />
          {fmt(elapsedSeconds)}
        </div>
      </div>
    );
  }
  if (status === 'stopped') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-300 text-zinc-700">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
        <span className="text-sm font-black uppercase tracking-wider">SESSION ENDED</span>
        <div className="font-mono font-bold text-zinc-500 ml-1">{fmt(elapsedSeconds)}</div>
      </div>
    );
  }
  // idle / requesting_permission
  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-500">
      <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
      <span className="text-sm font-bold">Waiting for teacher to start…</span>
    </div>
  );
};

// ─── Slide panel ──────────────────────────────────────────────────────────────

const SlidePanel: React.FC<{
  slideIndex: number;
  slides?: import('../types').SlideItem[];
  deckTitle?: string;
}> = ({ slideIndex, slides: customSlides, deckTitle }) => {
  const { liveSession } = useApp();
  const slides = (customSlides && customSlides.length > 0) ? customSlides : liveSession.slides;
  const slide = slides[slideIndex] || slides[0];

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Active Slide {deckTitle ? `• ${deckTitle}` : ''}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
          Slide {slideIndex + 1} / {slides.length}
        </span>
      </div>

      <div className="bg-zinc-900 text-white rounded-3xl p-7 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-black">
            {deckTitle ? deckTitle.toUpperCase() : 'CS201 • LECTURE 14'}
          </span>
          <span className="text-xs text-zinc-400 font-mono font-bold">
            SLIDE #{slide?.slideNumber ?? slideIndex + 1} OF {slides.length}
          </span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight">{slide?.title}</h2>
        <ul className="space-y-3 text-base text-zinc-200 pt-3">
          {slide?.bullets.map((bullet: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-emerald-400 font-black mt-1">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        {slide?.codeSnippet && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono block mb-2">
              Code:
            </span>
            <pre className="bg-zinc-950 p-4 rounded-2xl text-xs font-mono text-emerald-300 overflow-x-auto border border-zinc-800">
              <code>{slide.codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Slide thumbnail strip — read-only */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slides.map((s: any, idx: number) => (
          <div
            key={s.slideNumber || idx}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border shrink-0 text-left ${
              idx === slideIndex
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-zinc-50 text-zinc-500 border-zinc-200'
            }`}
          >
            <span className="block font-mono text-[10px] opacity-75">#{s.slideNumber || idx + 1}</span>
            <span className="truncate max-w-[130px] block">{s.title.slice(0, 22)}…</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Transcript feed ──────────────────────────────────────────────────────────

const TranscriptFeed: React.FC<{
  chunks: FilteredVoiceChunk[];
  interimText: string;
  status: RecordingStatus;
  classEnded: boolean;
}> = ({ chunks, interimText, status, classEnded }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chunks, interimText]);

  const totalFillers = useMemo(
    () => chunks.reduce((a, c) => a + (c.fillerWordsRemoved?.length ?? 0), 0),
    [chunks]
  );

  return (
    <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
            Live Teacher Voice Filter Feed
            {status === 'recording' && !classEnded && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                LIVE
              </span>
            )}
            {status === 'paused' && !classEnded && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                PAUSED
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1 rounded-full border border-zinc-200">
            {chunks.length} sentences
          </span>
          <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
            {totalFillers} fillers stripped
          </span>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        className="overflow-y-auto min-h-[320px] max-h-[480px] pr-2 space-y-3.5 scroll-smooth"
      >
        {/* Empty — waiting for teacher */}
        {chunks.length === 0 && !interimText && status !== 'recording' && !classEnded && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500">
              Transcript will appear here when the teacher starts speaking.
            </p>
          </div>
        )}

        {/* Listening placeholder */}
        {chunks.length === 0 && !interimText && status === 'recording' && (
          <div className="py-14 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 h-8">
              {[0, 100, 200].map((d) => (
                <span
                  key={d}
                  className="w-2 rounded-full bg-red-500 animate-bounce"
                  style={{ height: d === 100 ? '32px' : '20px', animationDelay: `${d}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-zinc-500">Listening for teacher voice…</p>
          </div>
        )}

        {/* Paused notice */}
        {status === 'paused' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800">
            ⏸ Recording paused. Existing transcript lines preserved.
          </div>
        )}

        {/* Chunks */}
        {chunks.map((chunk) => (
          <div
            key={chunk.id}
            className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                  {chunk.timestamp}
                </span>
                <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Slide {chunk.slideIndex}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                  chunk.category === 'pitfall_warning'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : chunk.category === 'analogy'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : chunk.category === 'off_slide'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {chunk.category === 'off_slide' ? 'Off-Slide / Added' : chunk.category.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                ✓ Filtered Speech:
              </span>
              <p className="text-lg font-bold text-zinc-950 leading-relaxed">
                {chunk.filteredSpeech}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Raw transcript:
              </span>
              <p className="text-zinc-600 italic">"{chunk.rawSpeech}"</p>
              {chunk.fillerWordsRemoved && chunk.fillerWordsRemoved.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-zinc-400 font-semibold">
                    Removed ({chunk.fillerWordsRemoved.length}):
                  </span>
                  {chunk.fillerWordsRemoved.map((f, i) => (
                    <span
                      key={i}
                      className="bg-amber-50 text-amber-800 border border-amber-200 line-through px-2 py-0.5 rounded-md font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Interim (partial) result */}
        {interimText && (
          <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-zinc-500 animate-pulse space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Speaking (live)…
            </div>
            <p className="text-lg font-medium italic text-zinc-700">"{interimText}"</p>
          </div>
        )}

        {/* Ended notice */}
        {(status === 'stopped' || classEnded) && (
          <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl text-center text-xs font-bold text-zinc-700">
            {classEnded ? '🏁 Class ended. All' : '⏹ Session ended.'} {chunks.length} sentences
            saved.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Master notes panel ───────────────────────────────────────────────────────

const NotesPanel: React.FC<{ notes: LiveState['masterNotes']; chunks: FilteredVoiceChunk[] }> = ({
  notes,
  chunks,
}) => {
  const exportPDF = () => {
    if (!notes) return;
    const doc = new jsPDF();
    const margin = 16;
    let y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('LectureLens — Master Lecture Synthesis', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Student export • ${new Date().toLocaleDateString()}`, margin, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(20);
    const splitOv = doc.splitTextToSize(notes.overview, 170);
    doc.text(splitOv, margin, y);
    y += 18;
    notes.slideAndSpeechAlignment.slice(0, 3).forEach((sec) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Slide ${sec.slideNumber}: ${sec.slideTitle}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      sec.slidePoints.forEach((pt) => {
        doc.text(`• ${pt}`, margin + 4, y);
        y += 5;
      });
      y += 4;
    });
    doc.save('LectureLens-StudentNotes.pdf');
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-black text-zinc-950">Synthesized Master Lecture Notes</h2>
        </div>
        {notes && (
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        )}
      </div>

      {!notes && chunks.length === 0 && (
        <div className="py-10 text-center text-zinc-400 text-sm">
          Notes will appear after the teacher generates them.
        </div>
      )}

      {notes && (
        <>
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm text-zinc-800 leading-relaxed">
            <strong className="block font-black text-zinc-950 mb-1">Overview:</strong>
            {notes.overview}
          </div>
          <div className="space-y-5">
            {notes.slideAndSpeechAlignment.map((alignment) => (
              <div
                key={alignment.slideNumber}
                className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-zinc-900">
                    Module {alignment.slideNumber}: {alignment.slideTitle}
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Slide &amp; Audio Synced
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="font-extrabold text-zinc-900 block mb-1">Core Slide Invariants:</span>
                    <ul className="space-y-1 text-zinc-600">
                      {alignment.slidePoints.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-extrabold text-emerald-800 block mb-1">Teacher Spoken:</span>
                    <ul className="space-y-1 text-emerald-950 font-medium">
                      {alignment.teacherSpokenPoints.map((tp, i) => (
                        <li key={i}>✓ {tp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {alignment.keyFormulasOrCode && (
                  <div className="pt-2 border-t border-zinc-100">
                    <pre className="bg-zinc-900 text-emerald-300 p-2.5 rounded-xl text-xs font-mono">
                      <code>{alignment.keyFormulasOrCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="p-5 bg-red-50/60 rounded-2xl border border-red-200 text-xs space-y-2">
              <span className="font-black text-red-900 block text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Detected Exam Pitfalls
              </span>
              {notes.detectedExamPitfalls.map((p, i) => (
                <div key={i} className="text-red-950">• {p}</div>
              ))}
            </div>
            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <span className="font-black text-emerald-900 block text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Takeaways
              </span>
              {notes.keyTakeaways.map((t, i) => (
                <div key={i} className="text-emerald-950">• {t}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StudentLiveView: React.FC = () => {
  const { joinedClass, leaveCurrentClass } = useClassContext();
  const { currentUser, studentMastery, concepts, doubts } = useApp();
  const navigate = useNavigate();
  const liveFeedRef = useRef<HTMLDivElement | null>(null);

  // Local live state (hydrated from localStorage, updated via BroadcastChannel)
  const [liveState, setLiveState] = useState<LiveState>(() =>
    joinedClass ? getLiveState(joinedClass.session.code) : { recordingStatus: 'idle', elapsedSeconds: 0, currentSlideIndex: 0, chunks: [], masterNotes: null, classEnded: false, lastUpdated: 0 }
  );
  const [interimText, setInterimText] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'slides' | 'notes'>('transcript');

  // Late Join Catch-Up State
  const [catchUpData, setCatchUpData] = useState<LateJoinCatchUpData | null>(null);
  const [hasDismissedCatchUp, setHasDismissedCatchUp] = useState(false);
  const hasGeneratedCatchUpRef = useRef(false);

  // Class not ended but we notice via BroadcastChannel
  const [localClassEnded, setLocalClassEnded] = useState(false);
  const lastEventRef = useRef<number>(Date.now());

  // Reconnect detection — if no event in 5s during recording, show reconnecting
  useEffect(() => {
    if (liveState.recordingStatus !== 'recording') {
      setIsReconnecting(false);
      return;
    }
    const interval = setInterval(() => {
      if (Date.now() - lastEventRef.current > 5000) {
        setIsReconnecting(true);
      } else {
        setIsReconnecting(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [liveState.recordingStatus]);

  // Subscribe to live channel when joined class changes
  useEffect(() => {
    if (!joinedClass) return;
    const code = joinedClass.session.code;

    // Hydrate immediately from localStorage (late-joiner catch-up)
    const fresh = getLiveState(code);
    setLiveState(fresh);
    setLocalClassEnded(fresh.classEnded);

    // Subscribe
    const unsub = subscribeLiveChannel(code, (event: LiveChannelEvent) => {
      lastEventRef.current = Date.now();
      setIsReconnecting(false);

      switch (event.type) {
        case 'recording-state':
          setLiveState((prev) => ({
            ...prev,
            recordingStatus: event.status,
            elapsedSeconds: event.elapsedSeconds,
            // Clear chunks on fresh start
            chunks: event.status === 'idle' ? [] : prev.chunks,
          }));
          if (event.status === 'idle') setInterimText('');
          break;

        case 'transcript-interim':
          setInterimText(event.text);
          break;

        case 'transcript-final':
          setInterimText('');
          setLiveState((prev) => {
            if (prev.chunks.find((c) => c.id === event.chunk.id)) return prev;
            return { ...prev, chunks: [...prev.chunks, event.chunk] };
          });
          break;

        case 'slide-change':
          setLiveState((prev) => ({ ...prev, currentSlideIndex: event.slideIndex }));
          break;

        case 'deck-updated':
          setLiveState((prev) => ({
            ...prev,
            slides: event.slides,
            deckTitle: event.deckTitle,
            currentSlideIndex: 0,
          }));
          break;

        case 'notes-updated':
          setLiveState((prev) => ({ ...prev, masterNotes: event.notes }));
          break;

        case 'class-ended':
          setLiveState((prev) => ({ ...prev, classEnded: true, recordingStatus: 'stopped' }));
          setLocalClassEnded(true);
          setInterimText('');
          break;
      }
    });

    return () => {
      unsub();
      setInterimText('');
    };
  }, [joinedClass]);

  // Late Join Catch-Up generation effect
  useEffect(() => {
    if (!joinedClass || hasGeneratedCatchUpRef.current) return;

    const { member, session } = joinedClass;
    const isLate = member.isLate;

    // A student who joins before recording starts (idle & no content): no catch-up
    // A student who joins after class has ended: handled by class-ended view (full notes)
    // A student who joins during recording or has missed range: generate catch-up!
    const isRecordingOrPaused = liveState.recordingStatus === 'recording' || liveState.recordingStatus === 'paused';
    const hasContent = liveState.chunks.length > 0 || liveState.elapsedSeconds > 0;
    const isClassEnded = localClassEnded || liveState.classEnded;

    if ((isLate || (isRecordingOrPaused && hasContent)) && !isClassEnded) {
      hasGeneratedCatchUpRef.current = true;

      // Calculate missed time boundaries
      let fromSec = 0;
      let toSec = liveState.elapsedSeconds > 0 ? liveState.elapsedSeconds : 60;

      if (member.missedFrom && member.missedTo) {
        const fromMs = new Date(member.missedFrom).getTime();
        const toMs = new Date(member.missedTo).getTime();
        const durationSec = Math.max(10, Math.round((toMs - fromMs) / 1000));
        // If rejoining, missed range is from when they left to when they joined
        toSec = Math.min(liveState.elapsedSeconds, durationSec);
        fromSec = Math.max(0, toSec - durationSec);
      }

      generateLateJoinCatchUp({
        classCode: session.code,
        className: session.name || 'CS201 Data Structures',
        studentName: currentUser.name,
        fromSeconds: fromSec,
        toSeconds: toSec,
        chunks: liveState.chunks,
        slides: liveState.slides || [],
        currentSlideIndex: liveState.currentSlideIndex,
        deckTitle: liveState.deckTitle,
        doubts,
        studentMastery,
        concepts,
        deckId: liveState.deckTitle || 'cs201-deck',
        language: 'en',
      }).then((data) => {
        setCatchUpData(data);
      }).catch((err) => {
        console.warn('Late catch-up generation warning:', err);
      });
    }
  }, [joinedClass, liveState.recordingStatus, liveState.chunks.length, localClassEnded, currentUser, studentMastery, concepts, doubts]);


  // Timer tick synced from teacher — student just shows the received elapsedSeconds
  // (the teacher publishes recording-state every second while recording)

  if (!joinedClass) {
    return <NoClassState />;
  }

  const isWaiting =
    !localClassEnded &&
    (liveState.recordingStatus === 'idle' || liveState.recordingStatus === 'requesting_permission');

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Live Classroom Stream &amp; Catch-Up
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Following the professor live.
            {joinedClass.session.name && (
              <span className="ml-1 font-bold text-zinc-700">{joinedClass.session.name}</span>
            )}
            {joinedClass.session.lectureTitle && (
              <span className="ml-1 text-zinc-500">· {joinedClass.session.lectureTitle}</span>
            )}
          </p>
        </div>

        {/* Class chip */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Class {joinedClass.session.code}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-zinc-200 shadow-xs text-xs font-bold text-zinc-700">
            <Layers className="w-4 h-4 text-emerald-600" />
            Slide {liveState.currentSlideIndex + 1}
          </div>
        </div>
      </div>

      {/* Waiting or reconnecting */}
      {isReconnecting && <ReconnectingBanner />}

      {/* Status section */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-subtle">
        <StatusBadge
          status={liveState.recordingStatus}
          elapsedSeconds={liveState.elapsedSeconds}
          classEnded={localClassEnded}
        />
        {localClassEnded && <ClassEndedBanner />}
        {isWaiting && <WaitingState sessionName={joinedClass.session.name} />}
      </div>

      {/* Late Join Catch-Up Panel (Shown automatically when student joins late or rejoins) */}
      {!localClassEnded && !isWaiting && catchUpData && !hasDismissedCatchUp && (
        <LateJoinCatchUpPanel
          data={catchUpData}
          recentLiveChunks={liveState.chunks}
          currentSlideIndex={liveState.currentSlideIndex}
          currentSlideTitle={liveState.slides?.[liveState.currentSlideIndex]?.title}
          onScrollToLive={() => {
            liveFeedRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          onDismiss={() => {
            setHasDismissedCatchUp(true);
          }}
        />
      )}

      {/* Main content — only show when not waiting or has content */}
      {(!isWaiting || liveState.chunks.length > 0 || localClassEnded) && (
        <div ref={liveFeedRef} className="space-y-4">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-200 gap-2 pt-2">
            {(
              [
                { id: 'transcript', label: 'Live Transcript', icon: Volume2 },
                { id: 'slides', label: 'Active Slide', icon: Layers },
                { id: 'notes', label: 'Master Notes', icon: FileText },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === id
                    ? 'border-zinc-900 text-zinc-950 font-black'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'transcript' && (
            <TranscriptFeed
              chunks={liveState.chunks}
              interimText={interimText}
              status={liveState.recordingStatus}
              classEnded={localClassEnded}
            />
          )}
          {activeTab === 'slides' && (
            <SlidePanel
              slideIndex={liveState.currentSlideIndex}
              slides={liveState.slides}
              deckTitle={liveState.deckTitle}
            />
          )}
          {activeTab === 'notes' && (
            <NotesPanel notes={liveState.masterNotes} chunks={liveState.chunks} />
          )}
        </div>
      )}
    </div>
  );
};
