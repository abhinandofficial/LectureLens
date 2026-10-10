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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-2">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ebbinghaus Memory Decay Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Decay-Aware Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
            Concepts decay according to <code>R = e^(-t/S)</code>. When calculated retention falls below{' '}
            {(threshold * 100).toFixed(0)}%, review is triggered with forward-dependent application problems.
          </p>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-subtle transition-all self-start md:self-auto"
        >
          <Sliders className="w-4 h-4 text-zinc-500" />
          <span>Config Calibration</span>
        </button>
      </div>

      {/* Config Drawer / Calibration Box */}
      {showConfig && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 shadow-subtle space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Retention Threshold & Stability Constants
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Formula: R = e^(-t/S)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
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
              <span className="text-[10px] text-zinc-400">
                Lower = longer interval between reminders
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs space-y-1">
              <span className="font-bold text-zinc-800">Stability Boost (Success):</span>
              <div className="text-emerald-700 font-mono font-bold">S_new = S × 1.85</div>
              <div className="text-[10px] text-zinc-400">Multiplied upon correct application</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs space-y-1">
              <span className="font-bold text-zinc-800">Stability Penalty (Error):</span>
              <div className="text-red-700 font-mono font-bold">S_new = max(0.8, S × 0.60)</div>
              <div className="text-[10px] text-zinc-400">Shortens interval on misconception</div>
            </div>
          </div>

          {/* Explicit Calibration & Pedagogical Disclaimer */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Pedagogical Calibration Notice:</strong> The Ebbinghaus retention model is an
              algorithmic approximation for self-paced retrieval practice and depends on individual
              cognitive baseline variation. No specific retention or examination grade outcomes are guaranteed.
            </p>
          </div>
        </div>
      )}

      {/* Main Queue Table / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <span>Concepts Due for Spaced Review</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                {queueItems.length} Due
              </span>
            </h3>
            <span className="text-xs text-zinc-400">Ranked by lowest retention</span>
          </div>

          {queueItems.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-zinc-800 text-base">All Caught Up!</h4>
              <p className="text-xs mt-1">No concepts are currently below the decay threshold.</p>
            </div>
          ) : (
            queueItems.map(({ concept, retention, daysSince }) => {
              const m = studentMastery[concept.id];
              const isSelected = activeReviewConceptId === concept.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => handleStartReview(concept.id)}
                  className={`bg-white border rounded-3xl p-5 shadow-subtle cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-dark-900 ring-2 ring-dark-900/10'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <CircularMasteryRing
                      score={Math.round(retention * 100)}
                      status={m?.status || 'developing'}
                      size={48}
                      strokeWidth={4}
                      showLabel={false}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Tier {concept.tier}
                        </span>
                        {concept.isBottleneck && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Bottleneck
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900">{concept.name}</h4>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                        <span>Last reviewed: {daysSince.toFixed(1)} days ago</span>
                        <span>•</span>
                        <span className="font-mono text-zinc-700">Stability S={m?.stability}d</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-red-600">
                      {(retention * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                      Retention
                    </div>
                    <button className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Forward-Dependent Test
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Tier {activeReviewConcept.tier}
                  </span>
                </div>

                <div className="text-xs font-bold text-zinc-500 mb-1">
                  Reinforcing: {activeReviewConcept.name}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug mb-5">
                  {activeQuestion.text}
                </h3>

                {/* Options */}
                <div className="space-y-2.5">
                  {activeQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    let style = 'border-zinc-200 hover:bg-zinc-50 text-zinc-800';

                    if (reviewSubmitted) {
                      if (opt.isCorrect) {
                        style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                      } else if (isSelected && !opt.isCorrect) {
                        style = 'border-red-500 bg-red-50 text-red-900';
                      }
                    } else if (isSelected) {
                      style = 'border-dark-900 bg-zinc-50 font-semibold';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={reviewSubmitted}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${style}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {reviewSubmitted && (
                  <div className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1 animate-fadeIn">
                    <div className="font-bold text-zinc-900">
                      {activeQuestion.options.find((o) => o.id === selectedOptionId)?.isCorrect
                        ? 'Retention Refreshed!'
                        : 'Decay Accelerated!'}
                    </div>
                    <p className="text-zinc-600">
                      {activeQuestion.explanationSnippet ||
                        'Spaced recall with downstream application solidifies neural pathways against forgetting.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                {!reviewSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleReviewAnswer}
                    className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all"
                  >
                    Submit Review
                  </button>
                ) : (
                  <button
                    onClick={handleFinishReview}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <span>Complete & Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] text-zinc-400">
              <RotateCcw className="w-8 h-8 text-zinc-300 mb-2" />
              <h4 className="font-bold text-zinc-700 text-sm">Select a Concept to Review</h4>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                Click any decayed concept from the left queue to attempt an applied reinforcement problem.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
