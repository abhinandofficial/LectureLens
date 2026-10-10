import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMentalMirrorExplanation } from '../services/api';
import { MentalMirrorFeedback, Question, MCQOption } from '../types';
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

  // Filter questions for the selected concept
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

    // If incorrect, invoke Mental Mirror
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

  const handleLanguageToggle = async (newLang: 'en' | 'hi') => {
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
    <div className="space-y-6">
      {/* Top Header & Concept Selector */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-2">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mental Mirror Diagnostic Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              Diagnostic Practice Arena
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Select an option to test your mental model. Wrong answers trigger counterexample paradoxes.
            </p>
          </div>

          {/* Bilingual Toggle */}
          <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start md:self-auto">
            <span className="text-xs text-zinc-500 pl-2 font-medium flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" /> Language:
            </span>
            <button
              onClick={() => handleLanguageToggle('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeLanguage === 'en'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageToggle('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeLanguage === 'hi'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              हिन्दी / Hinglish
            </button>
          </div>
        </div>

        {/* Concept Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {concepts.map((c) => {
            const isSelected = c.id === selectedConceptId;
            const m = studentMastery[c.id];
            return (
              <button
                key={c.id}
                onClick={() => handleSelectConcept(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-dark-900 text-white border-dark-900 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: MCQ Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {currentQuestion ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Concept: {activeConcept?.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  {activeBite && (
                    <button
                      onClick={() => setActiveRemediation(activeBite)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 fill-red-500" />
                      <span>60s Intuition Bite</span>
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-relaxed mb-6">
                  {currentQuestion.text}
                </h3>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOptionId === option.id;
                    let optionStyle =
                      'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 text-zinc-800';

                    if (isSubmitted) {
                      if (option.isCorrect) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-sm';
                      } else if (isSelected && !option.isCorrect) {
                        optionStyle =
                          'border-red-500 bg-red-50/80 text-red-950 font-medium shadow-sm';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-dark-900 bg-zinc-50 font-semibold shadow-subtle';
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isSubmitted}
                        onClick={() => handleOptionClick(option.id)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition-all flex items-start gap-3.5 ${optionStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
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
              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between mt-6">
                <span className="text-xs text-zinc-400">
                  Question {currentQuestionIndex + 1} of {conceptQuestions.length || 1}
                </span>

                {!isSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleSubmitAnswer}
                    className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-subtle transition-all"
                  >
                    Submit & Evaluate Model
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRetryQuestion}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    {conceptQuestions.length > 1 && (
                      <button
                        onClick={handleNextQuestion}
                        className="inline-flex items-center gap-1.5 bg-dark-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center mb-4 shadow-subtle">
                <BrainCircuit className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-extrabold text-base text-zinc-900 mb-1">
                Mental Mirror Standing By
              </h4>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mb-4">
                When you make an error, Mental Mirror analyzes the cognitive trap behind that option
                and provides a counterexample to break the flawed rule.
              </p>
              <div className="text-[11px] font-semibold text-zinc-400 bg-white px-3 py-1.5 rounded-full border border-zinc-200">
                Supports English & हिन्दी / Hinglish
              </div>
            </div>
          ) : isCorrect ? (
            /* Correct Answer Celebration */
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  Accurate Mental Model
                </div>
                <h3 className="text-2xl font-black text-zinc-950 mb-3">
                  You nailed the invariant!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed mb-6">
                  {currentQuestion?.explanationSnippet ||
                    'Your reasoning accurately aligns with hardware memory constraints and computational invariants.'}
                </p>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-subtle text-xs space-y-2">
                  <div className="font-bold text-zinc-900 flex items-center justify-between">
                    <span>Ebbinghaus Memory Stability:</span>
                    <span className="text-emerald-600 font-mono font-bold">+1.6× Boost</span>
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    Next scheduled decay review postponed by ~3.2 days.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-200/60 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <span>Continue Practice</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Mental Mirror Active Diagnosis */
            <div className="bg-white border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-float flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-extrabold text-xs uppercase tracking-wider text-red-600">
                      Mental Mirror Diagnostic
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {mirrorFeedback?.isCached ? '⚡ Cached Reasoning' : 'Evaluated'}
                  </span>
                </div>

                {isLoadingMirror ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-zinc-500">Deconstructing your reasoning trap...</p>
                  </div>
                ) : mirrorFeedback ? (
                  <div className="space-y-4">
                    {/* The Flawed Rule */}
                    <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200 text-xs">
                      <h5 className="font-bold text-red-800 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        The Reasoning Trap
                      </h5>
                      <p className="text-zinc-800 leading-relaxed font-medium">
                        {mirrorFeedback.trapReasoning}
                      </p>
                    </div>

                    {/* Counterexample Paradox */}
                    <div className="p-3.5 rounded-2xl bg-zinc-900 text-white text-xs shadow-sm">
                      <h5 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Counterexample / Paradox Scenario
                      </h5>
                      <p className="text-zinc-200 leading-relaxed font-mono text-[11px]">
                        {mirrorFeedback.counterexample}
                      </p>
                      {mirrorFeedback.paradoxScenario && (
                        <p className="text-zinc-400 text-[11px] mt-2 pt-2 border-t border-zinc-800">
                          {mirrorFeedback.paradoxScenario}
                        </p>
                      )}
                    </div>

                    {/* Corrective Guidance */}
                    <div className="text-xs text-zinc-600">
                      <strong className="text-zinc-900">Corrective Invariant: </strong>
                      {mirrorFeedback.correctiveGuidance}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* 1-Click Launch 60s Remediation Bite */}
              {activeBite && (
                <div className="pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => setActiveRemediation(activeBite)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-2xl shadow-subtle transition-all flex items-center justify-center gap-2"
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
