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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-zinc-200 shadow-modal p-6 sm:p-8 flex flex-col justify-between">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  60-Second Remediation Bite
                </span>
                <h3 className="text-xl font-extrabold text-zinc-950 mt-1">
                  {activeRemediation.conceptName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveLanguage('en')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    activeLanguage === 'en' ? 'bg-white text-zinc-900 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setActiveLanguage('hi')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    activeLanguage === 'hi' ? 'bg-white text-zinc-900 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  हिन्दी / Hinglish
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section 1: 2-Sentence Core Intuition */}
          <div className="mb-5 bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Core Intuition (2 Sentences)
            </h4>
            <p className="text-sm text-zinc-800 font-medium leading-relaxed">
              {activeRemediation.intuition}
            </p>
          </div>

          {/* Section 2: High-Contrast Analogy */}
          <div className="mb-5 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
              High-Contrast Analogy
            </h4>
            <p className="text-sm text-zinc-800 leading-relaxed">
              {activeRemediation.analogy}
            </p>
          </div>

          {/* Section 3: Dual-Language Memory Cue */}
          <div className="mb-6 bg-zinc-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Memory Cue / Mnemonic
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeLanguage === 'hi' ? 'Hinglish' : 'English'}
              </span>
            </div>
            <p className="text-sm text-zinc-100 font-medium leading-relaxed">
              "{activeLanguage === 'hi' ? activeRemediation.memoryCue.hi : activeRemediation.memoryCue.en}"
            </p>
          </div>

          {/* Section 4: Randomized Conceptual Quick-Check */}
          <div className="border border-zinc-200 rounded-2xl p-4 bg-white mb-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                Conceptual Quick-Check
              </h4>
              <span className="text-[11px] text-zinc-400">Must solve to return</span>
            </div>
            <p className="text-sm font-semibold text-zinc-900 mb-3">
              {activeRemediation.quickCheck.question}
            </p>

            <div className="space-y-2">
              {activeRemediation.quickCheck.options.map((opt, idx) => {
                const isSelected = selectedQuizIdx === idx;
                let optionStyle = 'border-zinc-200 hover:bg-zinc-50 text-zinc-800';
                if (hasSubmittedQuiz) {
                  if (idx === activeRemediation.quickCheck.correctIndex) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'border-red-500 bg-red-50 text-red-900';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-dark-900 bg-zinc-50 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasSubmittedQuiz}
                    onClick={() => setSelectedQuizIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${optionStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {hasSubmittedQuiz && (
              <div className={`mt-3 p-3 rounded-xl text-xs ${
                isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  {isCorrect ? 'Correct Intuition!' : 'Not quite yet:'}
                </div>
                <div>{activeRemediation.quickCheck.explanation}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            Designed for 60-second recovery
          </span>

          {!hasSubmittedQuiz ? (
            <button
              disabled={selectedQuizIdx === null}
              onClick={handleQuizSubmit}
              className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Verify Understanding
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>Return to Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
