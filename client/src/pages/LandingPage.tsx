import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CircularMasteryRing } from '../components/CircularMasteryRing';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  Play,
  Sparkles,
  GitFork,
  BrainCircuit,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Volume2,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useApp();

  const handleLaunchApp = () => {
    navigate('/app/dashboard');
  };

  const handleLaunchDemo = () => {
    switchRole('student');
    navigate('/app/graph');
  };

  const handleSeeMentalMirror = () => {
    navigate('/app/practice');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Pill-shaped small badge above headline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 mb-8 shadow-subtle hover:border-zinc-300 transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI-Powered Classroom Accessibility & Learning Recovery</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Two-line headline: Line 1 Black, Line 2 Slate */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08] mb-6">
          <span className="text-dark-900 block">Don't just catch up.</span>
          <span className="text-zinc-500 block mt-1">Know what you missed.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl font-normal leading-relaxed mb-10">
          LectureLens diagnoses foundational misconceptions from live lecture speech and slides,
          maps concept prerequisite DAGs, and schedules decay-aware micro-lessons before exams.
        </p>

        {/* Three Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-16">
          {/* Black button */}
          <button
            onClick={handleLaunchApp}
            className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white font-semibold text-base px-6 py-3.5 rounded-2xl shadow-subtle hover:shadow-float hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <span>Launch App</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Emerald button */}
          <button
            onClick={handleLaunchDemo}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base px-6 py-3.5 rounded-2xl shadow-subtle hover:shadow-float hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Demo</span>
          </button>

          {/* Outlined button */}
          <button
            onClick={handleSeeMentalMirror}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-base px-6 py-3.5 rounded-2xl border border-zinc-300 shadow-subtle hover:border-zinc-400 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <span>See How Mental Mirror Works</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

        {/* PRODUCT PREVIEW CARD (Browser Mockup) */}
        <div className="w-full max-w-5xl rounded-3xl border border-zinc-200 bg-zinc-50 p-3 sm:p-5 shadow-float">
          {/* Browser Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 mb-6 px-2">
            {/* Window control dots: Red, Amber, Green */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            </div>

            {/* URL Address Bar */}
            <div className="bg-white border border-zinc-200 rounded-xl px-4 py-1.5 text-xs text-zinc-500 font-mono flex items-center gap-2 w-72 justify-center shadow-subtle">
              <span className="text-zinc-400">https://</span>
              <span className="text-zinc-800 font-medium">lecturelens.app/dashboard</span>
            </div>

            {/* Live Lecture Active Pill */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Lecture Active</span>
            </div>
          </div>

          {/* Inside Browser Content: 3 Concept Cards with Circular Mastery Rings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Card 1: Mastered */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle hover:border-zinc-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tier 1 Foundation
                </span>
                <CircularMasteryRing score={91} status="mastered" size={48} strokeWidth={4} />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Contiguous Arrays & Cache Locality
              </h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">
                O(1) memory index arithmetic, cache line prefetching, dynamic array amortized growth.
              </p>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-emerald-700">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Stability (S=18.5d)
                </span>
                <span className="text-zinc-400">4 Reviews</span>
              </div>
            </div>

            {/* Card 2: Developing */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle hover:border-zinc-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tier 2 Non-Linear
                </span>
                <CircularMasteryRing score={64} status="developing" size={48} strokeWidth={4} />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Hash Tables & Collision Resolution
              </h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">
                Uniform distribution, load factor thresholds, open addressing vs separate chaining.
              </p>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-amber-700">
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Decay Warning (R=68%)
                </span>
                <span className="text-zinc-400">Review Due</span>
              </div>
            </div>

            {/* Card 3: Bottleneck */}
            <div className="bg-white border border-red-200 bg-red-50/20 rounded-2xl p-5 shadow-subtle hover:border-red-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  Critical Bottleneck
                </span>
                <CircularMasteryRing score={38} status="bottleneck" size={48} strokeWidth={4} />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Recursion & Call Stack Trees
              </h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">
                Activation frames, non-linear recurrence branching, and stack frame memory unwinding.
              </p>
              <div className="pt-3 border-t border-red-100 flex items-center justify-between text-xs font-medium text-red-600">
                <span className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Blocks 4 downstream topics
                </span>
                <span className="text-red-700 font-bold underline cursor-pointer" onClick={() => navigate('/app/practice')}>
                  Remediate →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM WE SOLVE SECTION */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Systemic Gap Analysis
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mt-3">
            The Problem We Solve
          </h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto mt-2">
            Why traditional lecture notes leave students failing exams even after re-watching hours of lecture video.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Red-Tinted Card: Standard Lecture Tools */}
          <div className="border border-red-200 bg-red-50/30 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                Standard Lecture Tools
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Passive consumption tools that summarize text without diagnosing why a student is stuck.
              </p>

              <ul className="space-y-4 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base mt-0.5">✕</span>
                  <span><strong>Captions & Generic Transcripts:</strong> Wall-to-wall unstructured text that repeats the confusion without conceptual indexing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base mt-0.5">✕</span>
                  <span><strong>Unweighted Summaries:</strong> Flat bullet points that treat trivial trivia and critical bottleneck prerequisites as equal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base mt-0.5">✕</span>
                  <span><strong>Zero Gap Diagnosis:</strong> Cannot detect that a student failed Binary Search Trees because they misunderstood Memory Pointers 3 weeks ago.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-red-200/60 text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Outcome: False illusion of competence; sudden failure during applied exams.
            </div>
          </div>

          {/* Right Green-Tinted Card: LectureLens */}
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                LectureLens Recovery Platform
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Active diagnostic intelligence with prerequisite DAG mapping and decay-aware reinforcement.
              </p>

              <ul className="space-y-4 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                  <span><strong>DAG Knowledge Graph:</strong> Strict cycle-prevented Kahn prerequisite topology that pinpoints exact upstream stumbling blocks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                  <span><strong>Mental Mirror Engine:</strong> Explains the flawed reasoning behind specific distractors, exposing contradictions with counterexamples.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                  <span><strong>60-Second Remediation & Decay Queues:</strong> High-contrast analogies in English + Hinglish, timed to Ebbinghaus memory curves.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-200/60 text-xs font-medium text-emerald-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Outcome: Precision recovery in under 5 minutes without re-watching 60-minute recordings.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Three-Stage Cognitive Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mt-3">
            How It Works
          </h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto mt-2">
            From raw teacher slides to permanent retention through proactive diagnosis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 01 */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-7 shadow-subtle flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-900 text-white font-mono font-bold text-sm flex items-center justify-center mb-6 shadow-sm">
                01
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Prepare & Ingest
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                Teacher pastes syllabus outlines or uploads lecture slides. Gemini extracts atomic concepts
                and diagnostic MCQs, while the server runs <strong>Kahn's topological sort</strong> to mathematically
                reject cyclic dependencies before publishing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 pt-4 border-t border-zinc-100">
              <GitFork className="w-4 h-4" /> Cycle-Free Topological Graph
            </div>
          </div>

          {/* Card 02 */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-7 shadow-subtle flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-900 text-white font-mono font-bold text-sm flex items-center justify-center mb-6 shadow-sm">
                02
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Mirror & Recover
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                When a student answers an MCQ incorrectly, the <strong>Mental Mirror</strong> engine exposes the flawed
                mental model behind that exact choice using real counterexamples. 60-Second Remediation bites provide punchy
                intuition in English & Hinglish.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 pt-4 border-t border-zinc-100">
              <BrainCircuit className="w-4 h-4" /> Flawed Model Exposer & Counterexamples
            </div>
          </div>

          {/* Card 03 */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-7 shadow-subtle flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-900 text-white font-mono font-bold text-sm flex items-center justify-center mb-6 shadow-sm">
                03
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Decay-Aware Reinforce
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                Concepts decay based on the <strong>Ebbinghaus retention model</strong> (R = e<sup>-t/S</sup>). Stability
                increases on recall. The queue serves forward-dependent challenge questions to ensure concepts are retained
                in downstream applications.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 pt-4 border-t border-zinc-100">
              <RotateCcw className="w-4 h-4" /> Retention Modeling & Spaced Review
            </div>
          </div>
        </div>
      </section>

      {/* MENTAL MIRROR HIGHLIGHT TEASER */}
      <section id="mental-mirror" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-300">
              Mental Mirror in Action
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-900 mt-3">
              Don't just see "Incorrect". See your thinking.
            </h2>
            <p className="text-zinc-600 text-sm mt-2">
              Most platforms mark wrong answers in red and show the textbook solution. LectureLens explains
              the exact cognitive shortcut that tricked your brain.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-2xl mx-auto shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 text-xs text-zinc-500 font-medium">
              <span>Selected Option: <strong>"free() automatically sets pointer to NULL"</strong></span>
              <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Cognitive Trap
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="text-sm">
                <span className="font-semibold text-zinc-900">The Flawed Mental Model: </span>
                <span className="text-zinc-600">You assumed heap memory allocators cleanup variable pointers in compiler stack space automatically.</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-700 font-mono">
                <span className="text-emerald-700 font-semibold">// The Counterexample Paradox:</span><br/>
                int* p = (int*)malloc(4);<br/>
                free(p);<br/>
                printf("%p\n", (void*)p); <span className="text-red-600">// Prints original address! Not 0x0.</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => navigate('/app/practice')}
                className="text-xs font-bold text-dark-900 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                Try the interactive Practice Arena <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BLACK ROUNDED CTA PANEL */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-dark-900 rounded-3xl p-10 sm:p-16 text-center text-white flex flex-col items-center justify-center shadow-float relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 mb-6">
            Instant Demo Ready — No Setup Required
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mb-4 leading-tight">
            Stop losing students to hidden prerequisite gaps.
          </h2>

          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            Pre-loaded with CS201 Data Structures, 12 acyclic concepts, Mental Mirror diagnostic MCQs,
            and Ebbinghaus decay schedules.
          </p>

          <button
            onClick={handleLaunchApp}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-base px-8 py-4 rounded-2xl shadow-subtle hover:scale-105 active:scale-100 transition-all"
          >
            <span>Sign In to Access Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 mt-auto py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-sm text-zinc-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-dark-900 flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
                </svg>
              </div>
              <span className="font-extrabold text-base text-zinc-950">LectureLens</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              AI-powered classroom accessibility and cognitive recovery engine for higher education.
            </p>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">DAG Knowledge Graph</a></li>
              <li><a href="#mental-mirror" className="hover:text-zinc-900 transition-colors">Mental Mirror Engine</a></li>
              <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">60-Second Bites</a></li>
              <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">Ebbinghaus Decay Queue</a></li>
            </ul>
          </div>

          {/* Column 2: Architecture */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wider">Engine Specs</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-zinc-700">Kahn's Topological Sorter</span></li>
              <li><span className="text-zinc-700">Google Gemini 2.5 Flash API</span></li>
              <li><span className="text-zinc-700">Web Speech API Ingestion</span></li>
              <li><span className="text-zinc-700">jsPDF Client Exporter</span></li>
            </ul>
          </div>

          {/* Column 3: Legal & Standards */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wider">Pedagogical Notice</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Retention models and stability calculations are approximations based on cognitive research
              and require individualized calibration. No learning guarantees are implied.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <div>© {new Date().getFullYear()} LectureLens Platform. Built for active classroom accessibility.</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-600 cursor-pointer">Accessibility (WCAG 2.1 AA)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
