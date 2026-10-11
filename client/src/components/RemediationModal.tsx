import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, CheckCircle, AlertCircle, HelpCircle, ArrowRight, Lightbulb } from 'lucide-react';

export const RemediationModal: React.FC = () => {
  const { activeRemediation, setActiveRemediation, activeLanguage, setActiveLanguage } = useApp();
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [hasSubmittedQuiz, setHasSubmittedQuiz] = useState<boolean>(false);

  if (!activeRemediation) return null;

  const handleClose = () => {
    setActiveRemediation(null);
    setSelectedQuizIdx(null);
    setHasSubmittedQuiz(false);
  };

  const handleQuizSubmit = () => {
    if (selectedQuizIdx !== null) {
      setHasSubmittedQuiz(true);
    }
  };

  const isCorrect = selectedQuizIdx === activeRemediation.quickCheck.correctIndex;

  const memoryCueText =
    activeLanguage === 'ml'
      ? activeRemediation.memoryCue.ml
      : activeLanguage === 'hi'
      ? activeRemediation.memoryCue.hi
      : activeRemediation.memoryCue.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-zinc-200 shadow-modal p-7 sm:p-10 flex flex-col justify-between">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-zinc-200 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                <Lightbulb className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  60-Second Remediation Bite
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 tracking-tight">
                  {activeRemediation.conceptName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Language Switcher */}
              <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200 text-xs font-extrabold">
                <button
                  onClick={() => setActiveLanguage('en')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    activeLanguage === 'en' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setActiveLanguage('hi')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    activeLanguage === 'hi' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setActiveLanguage('ml')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    activeLanguage === 'ml' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500'
                  }`}
                >
                  മലയാളം
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Section 1: 2-Sentence Core Intuition (18-20px) */}
          <div className="mb-6 bg-zinc-50 rounded-3xl p-6 border border-zinc-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Core Intuition (2 Sentences)
            </h4>
            <p className="text-base sm:text-lg text-zinc-900 font-semibold leading-relaxed">
              {activeRemediation.intuition}
            </p>
          </div>

          {/* Section 2: High-Contrast Analogy (18-20px) */}
          <div className="mb-6 bg-emerald-50/60 rounded-3xl p-6 border border-emerald-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2">
              High-Contrast Analogy
            </h4>
            <p className="text-base sm:text-lg text-zinc-900 leading-relaxed font-medium">
              {activeRemediation.analogy}
            </p>
          </div>

          {/* Section 3: Dual-Language Memory Cue */}
          <div className="mb-6 bg-zinc-950 text-white rounded-3xl p-6 shadow-float">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Memory Cue / Mnemonic Anchor
              </h4>
              <span className="text-xs text-zinc-400 font-mono font-bold uppercase">
                {activeLanguage}
              </span>
            </div>
            <p
              className={`text-base sm:text-lg text-zinc-100 font-bold leading-relaxed ${
                activeLanguage === 'ml' ? 'font-malayalam' : ''
              }`}
            >
              "{memoryCueText}"
            </p>
          </div>

          {/* Section 4: Randomized Conceptual Quick-Check (20px questions & options) */}
          <div className="border border-zinc-200 rounded-3xl p-6 sm:p-7 bg-white mb-2 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                Conceptual Quick-Check
              </h4>
              <span className="text-xs text-zinc-500 font-bold bg-zinc-100 px-2.5 py-0.5 rounded-full">
                Must solve to return
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-zinc-950 mb-4 leading-snug">
              {activeRemediation.quickCheck.question}
            </p>

            <div className="space-y-3">
              {activeRemediation.quickCheck.options.map((opt, idx) => {
                const isSelected = selectedQuizIdx === idx;
                let optionStyle = 'border-zinc-200 hover:bg-zinc-50 text-zinc-800';
                if (hasSubmittedQuiz) {
                  if (idx === activeRemediation.quickCheck.correctIndex) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                  } else if (isSelected) {
                    optionStyle = 'border-red-500 bg-red-50 text-red-950';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-dark-900 bg-zinc-50 font-bold shadow-xs';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasSubmittedQuiz}
                    onClick={() => setSelectedQuizIdx(idx)}
                    className={`w-full text-left p-4 rounded-2xl border text-base sm:text-lg transition-all flex items-start gap-3.5 ${optionStyle}`}
                  >
                    <span className="w-7 h-7 rounded-full border border-zinc-300 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {hasSubmittedQuiz && (
              <div className={`mt-4 p-4 rounded-2xl text-sm leading-relaxed ${
                isCorrect ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
              }`}>
                <div className="font-extrabold flex items-center gap-2 mb-1.5 text-base">
                  {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  {isCorrect ? 'Correct Intuition Verified!' : 'Not quite yet:'}
                </div>
                <div>{activeRemediation.quickCheck.explanation}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-zinc-500 font-medium">
            Designed for 60-second recovery
          </span>

          {!hasSubmittedQuiz ? (
            <button
              disabled={selectedQuizIdx === null}
              onClick={handleQuizSubmit}
              className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm sm:text-base font-extrabold px-7 py-3.5 rounded-2xl transition-all shadow-subtle"
            >
              Verify Understanding
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold px-7 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-subtle"
            >
              <span>Return to Practice</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
