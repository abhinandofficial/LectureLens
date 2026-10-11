import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMentalMirrorExplanation } from '../services/api';
import { MentalMirrorFeedback, Question, MCQOption, AppLanguage } from '../types';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  ArrowRight,
  RotateCcw,
  Languages,
} from 'lucide-react';

export const PracticeArenaPage: React.FC = () => {
  const {
    concepts,
    questions,
    studentMastery,
    recordPracticeAttempt,
    setActiveRemediation,
    remediationBites,
    activeLanguage,
    setActiveLanguage,
  } = useApp();

  const [selectedConceptId, setSelectedConceptId] = useState<string>('c-rec');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [mirrorFeedback, setMirrorFeedback] = useState<MentalMirrorFeedback | null>(null);
  const [isLoadingMirror, setIsLoadingMirror] = useState<boolean>(false);

  const conceptQuestions = questions.filter((q) => q.conceptId === selectedConceptId);
  const currentQuestion: Question | undefined =
    conceptQuestions[currentQuestionIndex] || questions[0];

  const handleSelectConcept = (cId: string) => {
    setSelectedConceptId(cId);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setMirrorFeedback(null);
  };

  const handleOptionClick = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedOptionId || isSubmitted) return;

    const chosenOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
    if (!chosenOption) return;

    setIsSubmitted(true);
    recordPracticeAttempt(currentQuestion.id, selectedOptionId, chosenOption.isCorrect);

    if (!chosenOption.isCorrect) {
      setIsLoadingMirror(true);
      try {
        const feedback = await getMentalMirrorExplanation(
          currentQuestion.id,
          selectedOptionId,
          currentQuestion.text,
          chosenOption.text,
          activeLanguage
        );
        setMirrorFeedback(feedback);
      } catch (err) {
        console.error('Mental Mirror error:', err);
      } finally {
        setIsLoadingMirror(false);
      }
    }
  };

  const handleLanguageToggle = async (newLang: AppLanguage) => {
    setActiveLanguage(newLang);
    if (isSubmitted && selectedOptionId && currentQuestion) {
      const chosenOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
      if (chosenOption && !chosenOption.isCorrect) {
        setIsLoadingMirror(true);
        try {
          const feedback = await getMentalMirrorExplanation(
            currentQuestion.id,
            selectedOptionId,
            currentQuestion.text,
            chosenOption.text,
            newLang
          );
          setMirrorFeedback(feedback);
        } finally {
          setIsLoadingMirror(false);
        }
      }
    }
  };

  const handleRetryQuestion = () => {
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setMirrorFeedback(null);
  };

  const handleNextQuestion = () => {
    const nextIdx = (currentQuestionIndex + 1) % conceptQuestions.length;
    setCurrentQuestionIndex(nextIdx);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setMirrorFeedback(null);
  };

  const activeConcept = concepts.find((c) => c.id === selectedConceptId);
  const mastery = studentMastery[selectedConceptId];
  const activeBite = remediationBites[selectedConceptId];

  const chosenOption = currentQuestion?.options.find((o) => o.id === selectedOptionId);
  const isCorrect = chosenOption?.isCorrect;

  return (
    <div className="space-y-8">
      {/* Top Header & Concept Selector */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 mb-3">
              <BrainCircuit className="w-4 h-4 text-emerald-600" />
              <span>Mental Mirror Diagnostic Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Diagnostic Practice Arena
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 mt-2">
              Test your mental model against distractors. Misconceptions reveal counterexample paradoxes.
            </p>
          </div>

          {/* Multilingual Toggle */}
          <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-300 self-start md:self-auto shadow-xs">
            <span className="text-xs text-zinc-500 pl-2 font-bold flex items-center gap-1.5">
              <Languages className="w-4 h-4" /> Language:
            </span>
            <button
              onClick={() => handleLanguageToggle('en')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLanguage === 'en'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageToggle('hi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLanguage === 'hi'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageToggle('ml')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLanguage === 'ml'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              മലയാളം
            </button>
          </div>
        </div>

        {/* Concept Selector Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {concepts.map((c) => {
            const isSelected = c.id === selectedConceptId;
            const m = studentMastery[c.id];
            return (
              <button
                key={c.id}
                onClick={() => handleSelectConcept(c.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black shrink-0 transition-all flex items-center gap-2.5 border ${
                  isSelected
                    ? 'bg-dark-900 text-white border-dark-900 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    m?.status === 'mastered'
                      ? 'bg-emerald-500'
                      : m?.status === 'bottleneck'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}
                ></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main MCQ and Mental Mirror Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: MCQ Card & Inline 60s Remediation Bite (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* INLINE 60-SECOND REMEDIATION BITE (Rendered directly above practice when bottleneck detected) */}
          {activeBite && (mastery?.status === 'bottleneck' || activeConcept?.isBottleneck) && (
            <div className="bg-red-50/70 border-2 border-red-300 rounded-3xl p-6 shadow-subtle space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-4 h-4 fill-white" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-700">
                      Bottleneck Detected • 60-Second Remediation Bite
                    </span>
                    <h4 className="text-base font-black text-red-950">
                      {activeBite.conceptName}
                    </h4>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold text-red-800 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                  Mastery: {mastery?.score || 35}%
                </span>
              </div>

              {/* 1. Core Intuition */}
              <div className="p-3.5 bg-white rounded-2xl border border-red-200 text-xs">
                <strong className="block font-black text-zinc-950 mb-1 text-[11px] uppercase tracking-wider text-red-800">
                  1. The Core Intuition (Real-World Justification):
                </strong>
                <p className="text-zinc-800 leading-relaxed font-medium">
                  {activeBite.intuition}
                </p>
              </div>

              {/* 2. High-Contrast Analogy */}
              <div className="p-3.5 bg-white rounded-2xl border border-red-200 text-xs">
                <strong className="block font-black text-zinc-950 mb-1 text-[11px] uppercase tracking-wider text-purple-800">
                  2. High-Contrast Analogy:
                </strong>
                <p className="text-zinc-800 leading-relaxed font-medium">
                  {activeBite.analogy}
                </p>
              </div>

              {/* 3. 10-Second Dual-Language Anchor */}
              <div className="p-3.5 bg-zinc-950 text-white rounded-2xl shadow-inner text-xs space-y-1">
                <strong className="block font-black text-emerald-400 text-[11px] uppercase tracking-wider">
                  3. 10-Second Dual-Language Anchor (Formula / Heuristic):
                </strong>
                <div className="font-mono text-emerald-200">
                  {activeLanguage === 'hi'
                    ? activeBite.memoryCue.hi
                    : activeLanguage === 'ml'
                    ? activeBite.memoryCue.ml
                    : activeBite.memoryCue.en}
                </div>
              </div>
            </div>
          )}

          {currentQuestion ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-10 shadow-subtle flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Topic: {activeConcept?.name}
                    </span>
                    <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  {activeBite && (
                    <button
                      onClick={() => setActiveRemediation(activeBite)}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors"
                    >
                      <Zap className="w-4 h-4 fill-red-500" />
                      <span>Full 60s Bite</span>
                    </button>
                  )}
                </div>

                {/* Question Stem (20px minimum) */}
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 leading-snug mb-8">
                  {activeLanguage === 'hi' && currentQuestion.textHi
                    ? currentQuestion.textHi
                    : activeLanguage === 'ml' && currentQuestion.textMl
                    ? currentQuestion.textMl
                    : currentQuestion.text}
                </h3>

                {/* Options List (18-20px) */}
                <div className="space-y-3.5">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOptionId === option.id;
                    let optionStyle =
                      'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 text-zinc-800';

                    if (isSubmitted) {
                      if (option.isCorrect) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                      } else if (isSelected && !option.isCorrect) {
                        optionStyle =
                          'border-red-500 bg-red-50/80 text-red-950 font-bold shadow-xs';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-dark-900 bg-zinc-50 font-bold shadow-subtle';
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isSubmitted}
                        onClick={() => handleOptionClick(option.id)}
                        className={`w-full text-left p-5 rounded-2xl border text-base sm:text-lg transition-all flex items-start gap-4 ${optionStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full border text-xs sm:text-sm font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected && !isSubmitted
                              ? 'bg-dark-900 text-white border-dark-900'
                              : isSubmitted && option.isCorrect
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : isSubmitted && isSelected && !option.isCorrect
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-zinc-300 text-zinc-600 bg-white'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1 leading-relaxed">{option.text}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Submit / Next Bar */}
              <div className="pt-7 border-t border-zinc-100 flex items-center justify-between mt-8">
                <span className="text-xs sm:text-sm text-zinc-400 font-semibold">
                  Question {currentQuestionIndex + 1} of {conceptQuestions.length || 1}
                </span>

                {!isSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleSubmitAnswer}
                    className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-subtle transition-all"
                  >
                    Submit & Evaluate Model
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRetryQuestion}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-zinc-300 text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry</span>
                    </button>
                    {conceptQuestions.length > 1 && (
                      <button
                        onClick={handleNextQuestion}
                        className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              No questions found for this concept.
            </div>
          )}
        </div>

        {/* Right Column: Mental Mirror Feedback (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!isSubmitted ? (
            /* Idle Guide Card */
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-7 sm:p-10 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center mb-5 shadow-subtle">
                <BrainCircuit className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-black text-lg text-zinc-950 mb-2">
                Mental Mirror Standing By
              </h4>
              <p className="text-sm text-zinc-600 max-w-sm leading-relaxed mb-6">
                When an incorrect option is chosen, Mental Mirror isolates the exact cognitive shortcut
                and shows a concrete counterexample to refute the assumption.
              </p>
              <div className="text-xs font-bold text-zinc-500 bg-white px-3.5 py-2 rounded-full border border-zinc-200 shadow-xs">
                Supports English, हिन्दी & മലയാളം
              </div>
            </div>
          ) : isCorrect ? (
            /* Correct Answer Celebration */
            <div className="bg-emerald-50/50 border border-emerald-300 rounded-3xl p-7 sm:p-10 flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-1.5">
                  Accurate Mental Model
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 mb-4">
                  You nailed the invariant!
                </h3>
                <p className="text-base sm:text-lg text-zinc-700 leading-relaxed mb-8">
                  {currentQuestion?.explanationSnippet ||
                    'Your reasoning accurately aligns with hardware memory constraints and computational invariants.'}
                </p>

                <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-subtle text-sm space-y-2">
                  <div className="font-extrabold text-zinc-900 flex items-center justify-between">
                    <span>Ebbinghaus Memory Stability:</span>
                    <span className="text-emerald-700 font-mono font-black">+1.6× Boost</span>
                  </div>
                  <div className="text-zinc-500 text-xs">
                    Next scheduled decay review postponed by ~3.2 days.
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-emerald-200 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
                >
                  <span>Continue Practice</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Mental Mirror Active Diagnosis */
            <div className="bg-white border-2 border-red-300 rounded-3xl p-7 sm:p-10 shadow-float flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="font-black text-xs uppercase tracking-wider text-red-600">
                      Mental Mirror Diagnostic
                    </span>
                  </div>

                  <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                    mirrorFeedback?.isCached
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}>
                    {mirrorFeedback?.isCached ? '⚡ In-Memory Cache Hit (<0.5ms) • 0 Tokens' : 'Live Diagnosis'}
                  </span>
                </div>

                {isLoadingMirror ? (
                  <div className="py-14 text-center space-y-3">
                    <div className="w-7 h-7 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-semibold text-zinc-600">Deconstructing your reasoning trap...</p>
                  </div>
                ) : mirrorFeedback ? (
                  <div className={`space-y-5 ${activeLanguage === 'ml' ? 'font-malayalam' : ''}`}>
                    {/* The Flawed Rule */}
                    <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 text-sm">
                      <h5 className="font-extrabold text-red-900 mb-1.5 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        The Reasoning Trap
                      </h5>
                      <p className="text-zinc-900 leading-relaxed font-semibold">
                        {mirrorFeedback.trapReasoning}
                      </p>
                    </div>

                    {/* Counterexample Paradox */}
                    <div className="p-4 rounded-2xl bg-zinc-950 text-white text-sm shadow-subtle">
                      <h5 className="font-extrabold text-emerald-400 mb-1.5 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Counterexample / Paradox Scenario
                      </h5>
                      <p className="text-zinc-100 leading-relaxed font-mono text-xs sm:text-sm">
                        {mirrorFeedback.counterexample}
                      </p>
                      {mirrorFeedback.paradoxScenario && (
                        <p className="text-zinc-400 text-xs sm:text-sm mt-2.5 pt-2.5 border-t border-zinc-800">
                          {mirrorFeedback.paradoxScenario}
                        </p>
                      )}
                    </div>

                    {/* Corrective Guidance */}
                    <div className="text-sm sm:text-base text-zinc-700">
                      <strong className="text-zinc-950">Corrective Invariant: </strong>
                      {mirrorFeedback.correctiveGuidance}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* 1-Click Launch 60s Remediation Bite */}
              {activeBite && (
                <div className="pt-6 border-t border-zinc-100">
                  <button
                    onClick={() => setActiveRemediation(activeBite)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base py-3.5 rounded-2xl shadow-subtle transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Open 60-Second Remediation Bite</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
