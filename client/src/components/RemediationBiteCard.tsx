import React, { useState } from 'react';
import { RemediationBite, ConceptualQuickCheck } from '../types/recallQTypes';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Volume2, ChevronDown, ChevronUp } from 'lucide-react';

interface RemediationBiteCardProps {
  bite: RemediationBite;
  language: 'en' | 'ml' | 'manglish';
  onCompleted: () => void;
}

export const RemediationBiteCard: React.FC<RemediationBiteCardProps> = ({
  bite,
  language,
  onCompleted,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [currentCheckIndex, setCurrentCheckIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [localLang, setLocalLang] = useState<'en' | 'ml' | 'manglish'>(language);

  const currentCheck: ConceptualQuickCheck =
    bite.quickCheckPool[currentCheckIndex % bite.quickCheckPool.length] || bite.quickCheckPool[0];

  const handleOptionSubmit = (idx: number) => {
    setSelectedOption(idx);
    if (idx === currentCheck.correctIndex) {
      setIsPassed(true);
      setShowHint(false);
    } else {
      setShowHint(true);
      // Serve next quick-check question from pool after a delay
      setTimeout(() => {
        setSelectedOption(null);
        setCurrentCheckIndex((prev) => (prev + 1) % bite.quickCheckPool.length);
      }, 2000);
    }
  };

  const getCoreIntuition = () => {
    if (localLang === 'ml') return bite.coreIntuitionMl || bite.coreIntuitionEn;
    if (localLang === 'manglish') return bite.coreIntuitionManglish || bite.coreIntuitionEn;
    return bite.coreIntuitionEn;
  };

  const getAnalogy = () => {
    if (localLang === 'ml') return bite.analogyMl || bite.analogyEn;
    if (localLang === 'manglish') return bite.analogyManglish || bite.analogyEn;
    return bite.analogyEn;
  };

  const getAnchor = () => {
    if (localLang === 'ml') return bite.dualLanguageAnchorMl || bite.dualLanguageAnchorEn;
    if (localLang === 'manglish') return bite.dualLanguageAnchorManglish || bite.dualLanguageAnchorEn;
    return bite.dualLanguageAnchorEn;
  };

  return (
    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 shadow-subtle space-y-5 animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                60-Second Remediation Bite
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black font-mono">
                ~60 SECONDS
              </span>
            </div>
            <h3 className="text-lg font-black text-amber-950 leading-tight">
              Mastering: {bite.conceptName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Micro language toggle */}
          <div className="flex items-center bg-white border border-amber-200 rounded-xl p-0.5 text-xs font-bold">
            <button
              onClick={() => setLocalLang('en')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                localLang === 'en' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocalLang('ml')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                localLang === 'ml' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              മലയാളം
            </button>
            <button
              onClick={() => setLocalLang('manglish')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                localLang === 'manglish' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Manglish
            </button>
          </div>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl text-amber-800 hover:bg-amber-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 text-sm">
          {/* 1. Core Intuition (2 sentences) */}
          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
              1. Core Intuition:
            </span>
            <p className="text-zinc-900 font-bold leading-relaxed">{getCoreIntuition()}</p>
          </div>

          {/* 2. High-contrast analogy */}
          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
              2. High-Contrast Analogy:
            </span>
            <p className="text-zinc-800 leading-relaxed italic">{getAnalogy()}</p>
          </div>

          {/* 3. Dual-language Anchor */}
          <div className="p-3.5 bg-amber-100/70 rounded-2xl border border-amber-200 flex items-center gap-2 text-xs font-black text-amber-950">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Memory Anchor: {getAnchor()}</span>
          </div>

          {/* 4. Conceptual Quick-Check Gate */}
          <div className="p-5 bg-white rounded-2xl border border-amber-300 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                4. Conceptual Quick-Check (Answer to unlock practice):
              </span>
              {isPassed && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Ready!
                </span>
              )}
            </div>

            <p className="font-bold text-zinc-900 text-sm">{currentCheck.question}</p>

            <div className="space-y-2">
              {currentCheck.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentCheck.correctIndex;
                let btnStyle = 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800';

                if (isSelected) {
                  btnStyle = isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-red-400 bg-red-50 text-red-950';
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => !isPassed && handleOptionSubmit(oIdx)}
                    disabled={isPassed}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isSelected && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  </button>
                );
              })}
            </div>

            {showHint && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Hint:</strong> {currentCheck.hint} Serving next question from pool...
                </span>
              </div>
            )}

            {isPassed && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onCompleted}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ready — Back to practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
