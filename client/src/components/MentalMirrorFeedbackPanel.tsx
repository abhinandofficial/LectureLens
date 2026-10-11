import React, { useState } from 'react';
import { DistractorMentalMirror } from '../types/recallQTypes';
import { getCachedMentalMirror } from '../services/mentalMirrorCache';
import { Brain, Zap, RefreshCw, Eye, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface MentalMirrorFeedbackPanelProps {
  questionId: string;
  chosenOptionId: string;
  misconception?: DistractorMentalMirror;
  defaultLanguage: 'en' | 'ml' | 'manglish';
  onTryAgain: () => void;
  onShowAnswer: () => void;
  canShowAnswer: boolean;
}

export const MentalMirrorFeedbackPanel: React.FC<MentalMirrorFeedbackPanelProps> = ({
  questionId,
  chosenOptionId,
  misconception,
  defaultLanguage,
  onTryAgain,
  onShowAnswer,
  canShowAnswer,
}) => {
  const [lang, setLang] = useState<'en' | 'ml' | 'manglish'>(defaultLanguage);

  // Retrieve cached explanation with real measured lookup latency
  const cached = getCachedMentalMirror(questionId, chosenOptionId, misconception, lang);

  return (
    <div className="bg-purple-50/90 border-2 border-purple-300 rounded-3xl p-6 sm:p-7 shadow-subtle space-y-5 animate-fadeIn">
      {/* Header bar with Honest Latency badge and micro language switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                Mental Mirror • Misconception Diagnostic
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-200/80 text-purple-950 font-mono text-[10px] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-700" />
                Served from cache in {cached.lookupLatencyMs} ms
              </span>
            </div>
            <h4 className="text-sm font-bold text-purple-950 mt-0.5">
              Detected Cognitive Trap: <em>{cached.misconceptionLabel}</em>
            </h4>
          </div>
        </div>

        {/* Micro language toggle for the panel only */}
        <div className="flex items-center bg-white border border-purple-200 rounded-xl p-0.5 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-900 hover:text-black'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('ml')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              lang === 'ml' ? 'bg-purple-600 text-white' : 'text-purple-900 hover:text-black'
            }`}
          >
            മലയാളം
          </button>
          <button
            onClick={() => setLang('manglish')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              lang === 'manglish' ? 'bg-purple-600 text-white' : 'text-purple-900 hover:text-black'
            }`}
          >
            Manglish
          </button>
        </div>
      </div>

      {/* 1. Deconstructive feedback */}
      <div className="p-4 bg-white/90 rounded-2xl border border-purple-200 space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">
          1. Deconstructive Feedback (Thought Trap):
        </span>
        <p className="text-zinc-900 text-sm font-medium leading-relaxed">
          {cached.deconstructiveFeedback}
        </p>
      </div>

      {/* 2. Cognitive Dissonance Paradox Scenario (< 30s read) */}
      <div className="p-4 bg-white/90 rounded-2xl border border-purple-200 space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">
          2. Cognitive-Dissonance Scenario (Why this rule breaks):
        </span>
        <p className="text-zinc-800 text-xs sm:text-sm italic leading-relaxed">
          {cached.paradoxScenario}
        </p>
      </div>

      {/* 3. Rebuild Step */}
      <div className="p-4 bg-purple-100/70 rounded-2xl border border-purple-300 space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-950 block">
          3. Rebuild the Model (Correct Invariant):
        </span>
        <p className="text-purple-950 text-xs sm:text-sm font-black leading-relaxed">
          {cached.rebuildGuidance}
        </p>
      </div>

      {/* Action buttons: Try Again / Show Answer */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={onTryAgain}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>

        {canShowAnswer && (
          <button
            onClick={onShowAnswer}
            className="px-4 py-2 rounded-xl bg-white border border-purple-300 text-purple-900 hover:bg-purple-100 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Answer</span>
          </button>
        )}
      </div>
    </div>
  );
};
