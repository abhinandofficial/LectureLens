import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CircularMasteryRing } from '../components/CircularMasteryRing';
import { Concept, Question } from '../types';
import {
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Info,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Check,
} from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const { concepts, questions, studentMastery, recordReviewAttempt, calculateRetention } = useApp();

  const [threshold, setThreshold] = useState<number>(0.7); // 70% retention cutoff
  const [activeReviewConceptId, setActiveReviewConceptId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Calculate retention and filter concepts
  const queueItems = concepts
    .map((c) => {
      const stats = calculateRetention(c.id);
      return {
        concept: c,
        retention: stats.retention,
        daysSince: stats.daysSince,
        isDue: stats.retention < threshold,
      };
    })
    .filter((item) => item.isDue)
    .sort((a, b) => a.retention - b.retention);

  // Active question for the selected review concept
  const activeReviewConcept = concepts.find((c) => c.id === activeReviewConceptId);
  const activeQuestion = questions.find(
    (q) =>
      q.conceptId === activeReviewConceptId ||
      q.forwardDependentConceptId === activeReviewConceptId
  );

  const handleStartReview = (conceptId: string) => {
    setActiveReviewConceptId(conceptId);
    setSelectedOptionId(null);
    setReviewSubmitted(false);
  };

  const handleReviewAnswer = () => {
    if (!activeQuestion || !selectedOptionId || !activeReviewConceptId) return;
    const opt = activeQuestion.options.find((o) => o.id === selectedOptionId);
    const isSuccess = Boolean(opt?.isCorrect);

    setReviewSubmitted(true);
    recordReviewAttempt(activeReviewConceptId, isSuccess);
  };

  const handleFinishReview = () => {
    setActiveReviewConceptId(null);
    setSelectedOptionId(null);
    setReviewSubmitted(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 mb-3">
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>Ebbinghaus Memory Decay Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            Decay-Aware Review Queue
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 mt-2 max-w-2xl leading-relaxed">
            Concepts decay by <code>R = e^(-t/S)</code>. When retention falls below{' '}
            {(threshold * 100).toFixed(0)}%, review is scheduled using forward-dependent applied problems.
          </p>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-2.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm font-extrabold px-5 py-3 rounded-2xl shadow-subtle transition-all self-start md:self-auto"
        >
          <Sliders className="w-4 h-4 text-zinc-500" />
          <span>Config Calibration</span>
        </button>
      </div>

      {/* Config Drawer / Calibration Box */}
      {showConfig && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-7 shadow-subtle space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-zinc-900 flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-600" />
              Retention Threshold & Stability Constants
            </h3>
            <span className="text-xs sm:text-sm text-zinc-500 font-mono font-bold">Formula: R = e^(-t/S)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-2xl border border-zinc-200">
              <label className="text-sm font-extrabold text-zinc-800 block mb-2">
                Decay Cutoff Threshold: {(threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="0.85"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-dark-900 cursor-pointer"
              />
              <span className="text-xs text-zinc-500 font-medium block mt-1">
                Lower = longer intervals between reminders
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-zinc-200 text-sm space-y-1">
              <span className="font-extrabold text-zinc-900">Stability Boost (Success):</span>
              <div className="text-emerald-700 font-mono font-black text-base">S_new = S × 1.85</div>
              <div className="text-xs text-zinc-500">Multiplied upon correct application</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-zinc-200 text-sm space-y-1">
              <span className="font-extrabold text-zinc-900">Stability Penalty (Error):</span>
              <div className="text-red-700 font-mono font-black text-base">S_new = max(0.8, S × 0.60)</div>
              <div className="text-xs text-zinc-500">Shortens interval on misconception</div>
            </div>
          </div>

          {/* Explicit Calibration & Pedagogical Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Pedagogical Calibration Notice:</strong> The Ebbinghaus retention model is an
              algorithmic approximation for self-paced retrieval practice and depends on individual
              cognitive baseline variation. No specific retention rates or examination grade outcomes are guaranteed.
            </p>
          </div>
        </div>
      )}

      {/* Main Queue Table / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Queue List (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-base sm:text-lg text-zinc-950 flex items-center gap-2.5">
              <span>Concepts Due for Spaced Review</span>
              <span className="text-xs font-mono font-extrabold px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full border border-zinc-300">
                {queueItems.length} Due
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-zinc-500 font-semibold">Ranked by lowest retention</span>
          </div>

          {queueItems.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-14 text-center text-zinc-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-black text-zinc-900 text-xl">All Caught Up!</h4>
              <p className="text-sm mt-1">No concepts are currently below the decay threshold.</p>
            </div>
          ) : (
            queueItems.map(({ concept, retention, daysSince }) => {
              const m = studentMastery[concept.id];
              const isSelected = activeReviewConceptId === concept.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => handleStartReview(concept.id)}
                  className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-subtle cursor-pointer transition-all flex items-center justify-between gap-5 ${
                    isSelected
                      ? 'border-dark-900 ring-4 ring-dark-900/10 scale-[1.01]'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <CircularMasteryRing
                      score={Math.round(retention * 100)}
                      status={m?.status || 'developing'}
                      size={58}
                      strokeWidth={5}
                      showLabel={false}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Tier {concept.tier}
                        </span>
                        {concept.isBottleneck && (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Bottleneck
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-base sm:text-lg text-zinc-950">{concept.name}</h4>
                      <div className="text-xs sm:text-sm text-zinc-500 mt-1 flex flex-wrap items-center gap-3 font-medium">
                        <span>Reviewed {daysSince.toFixed(1)} days ago</span>
                        <span>•</span>
                        <span className="font-mono text-zinc-800 font-bold">Stability S={m?.stability}d</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-red-600">
                      {(retention * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">
                      Retention
                    </div>
                    <button className="mt-2 text-xs sm:text-sm font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <span>Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Review Workspace (5 Cols) */}
        <div className="lg:col-span-5">
          {activeReviewConcept && activeQuestion ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Forward-Dependent Test
                  </span>
                  <span className="text-xs text-zinc-500 font-mono font-bold">
                    Tier {activeReviewConcept.tier}
                  </span>
                </div>

                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Reinforcing Prerequisite: {activeReviewConcept.name}
                </div>
                {/* Question stem (20px) */}
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 leading-snug mb-6">
                  {activeQuestion.text}
                </h3>

                {/* Options (18-20px) */}
                <div className="space-y-3">
                  {activeQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    let style = 'border-zinc-200 hover:bg-zinc-50 text-zinc-800';

                    if (reviewSubmitted) {
                      if (opt.isCorrect) {
                        style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                      } else if (isSelected && !opt.isCorrect) {
                        style = 'border-red-500 bg-red-50 text-red-900';
                      }
                    } else if (isSelected) {
                      style = 'border-dark-900 bg-zinc-50 font-bold';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={reviewSubmitted}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl border text-base sm:text-lg transition-all flex items-start gap-3.5 ${style}`}
                      >
                        <span className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {reviewSubmitted && (
                  <div className="mt-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm space-y-1.5 animate-fadeIn">
                    <div className="font-black text-zinc-950 text-base">
                      {activeQuestion.options.find((o) => o.id === selectedOptionId)?.isCorrect
                        ? 'Retention Refreshed!'
                        : 'Decay Accelerated!'}
                    </div>
                    <p className="text-zinc-700 leading-relaxed">
                      {activeQuestion.explanationSnippet ||
                        'Spaced recall with downstream application solidifies neural pathways against forgetting.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-100 flex justify-end mt-6">
                {!reviewSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleReviewAnswer}
                    className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold text-sm sm:text-base px-7 py-3.5 rounded-2xl transition-all shadow-subtle"
                  >
                    Submit Review
                  </button>
                ) : (
                  <button
                    onClick={handleFinishReview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base px-7 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-subtle"
                  >
                    <span>Complete & Next</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[500px] text-zinc-400">
              <RotateCcw className="w-10 h-10 text-zinc-300 mb-3" />
              <h4 className="font-bold text-zinc-800 text-base">Select a Concept to Review</h4>
              <p className="text-sm max-w-sm mt-2 leading-relaxed">
                Click any decayed concept from the queue to attempt an applied reinforcement problem.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
