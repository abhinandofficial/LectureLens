/**
 * LateJoinCatchUpPanel.tsx
 *
 * Responsive, interactive Late Join Catch-Up panel for students.
 * - Appears in the unused space beside the live feed on desktop, or as a collapsible card on mobile
 * - Updates live as lecture progresses under "Happening now"
 * - Speech synthesis "Listen" button for 90-second brief
 * - Local language toggle (EN / ML) without mutating global settings
 * - PDF export with clean formatting & answers on the final page
 * - Quick-check questions with interactive feedback
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  FileDown,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowDown,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { LateJoinCatchUpData } from '../types/lateJoinCatchUpTypes';
import { exportLateJoinCatchUpPDF } from '../services/lateJoinPdfExporter';
import { FilteredVoiceChunk } from '../types';

interface LateJoinCatchUpPanelProps {
  data: LateJoinCatchUpData;
  recentLiveChunks: FilteredVoiceChunk[];
  currentSlideIndex: number;
  currentSlideTitle?: string;
  onScrollToLive?: () => void;
  onDismiss?: () => void;
}

export const LateJoinCatchUpPanel: React.FC<LateJoinCatchUpPanelProps> = ({
  data,
  recentLiveChunks,
  currentSlideIndex,
  currentSlideTitle,
  onScrollToLive,
  onDismiss,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelLang, setPanelLang] = useState<'en' | 'ml'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedSlidePreview, setSelectedSlidePreview] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const briefPoints = panelLang === 'ml' ? data.ninetySecondBriefMl : data.ninetySecondBriefEn;

  // Toggle voice reading
  const handleToggleListen = () => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    synthRef.current.cancel();
    const textToRead = briefPoints.join('. ');
    const utterance = new SpeechSynthesisUtterance(textToRead);

    // Pick voice matching language if available
    const voices = synthRef.current.getVoices();
    if (panelLang === 'ml') {
      const mlVoice = voices.find((v) => v.lang.startsWith('ml'));
      if (mlVoice) utterance.voice = mlVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  // Export PDF
  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await exportLateJoinCatchUpPDF({ data, language: panelLang });
    } catch (err) {
      console.error('Failed to export catch-up PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Answer quick check question
  const handleSelectAnswer = (questionId: string, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optIdx }));
  };

  // Live incoming updates since catch-up generated
  const liveIncoming = useMemo(() => {
    return recentLiveChunks.slice(-3);
  }, [recentLiveChunks]);

  if (isCollapsed) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 flex items-center justify-between shadow-subtle transition-all">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-amber-950">
            Late Join Catch-Up ({data.missedMinutesCount} mins missed)
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
        >
          <span>Open Catch-Up</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50/70 to-white border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-subtle space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-200/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                {panelLang === 'ml' ? 'വൈകി ചേർന്ന വിദ്യാർത്ഥി' : 'Late Join Catch-Up'}
              </span>
              <span className="text-xs text-amber-900 font-bold">
                {data.missedFromFormatted} – {data.missedToFormatted}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  data.generatorMode === 'ai'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {data.generatorMode === 'ai' ? 'Summary: AI' : 'Summary: Basic (Extractive)'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-amber-950 mt-1">
              {panelLang === 'ml'
                ? `നിങ്ങൾ ${data.missedMinutesCount} മിനിറ്റ് വൈകിയാണ് ചേർന്നത്. നഷ്ടപ്പെട്ടവ ഇതാ:`
                : `You joined ${data.missedMinutesCount} minutes late. Here's what you missed`}
            </h2>
          </div>
        </div>

        {/* Right Header Controls: Lang toggle, Listen, PDF, Sync to live, Close */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Panel Language Toggle */}
          <div className="flex items-center bg-amber-100/80 p-0.5 rounded-xl border border-amber-300 text-xs font-black">
            <button
              onClick={() => setPanelLang('en')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                panelLang === 'en' ? 'bg-white text-zinc-950 shadow-xs' : 'text-amber-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setPanelLang('ml')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                panelLang === 'ml' ? 'bg-white text-zinc-950 shadow-xs' : 'text-amber-800'
              }`}
            >
              മലയാളം
            </button>
          </div>

          {/* Optional Speech Listen Button */}
          {hasSpeechSynthesis && (
            <button
              onClick={handleToggleListen}
              className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
              }`}
              title={isSpeaking ? 'Stop listening' : 'Listen to 90-second brief'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
              <span className="hidden md:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}

          {/* Download PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Download catch-up PDF"
          >
            <FileDown className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          {/* Back to Live button */}
          {onScrollToLive && (
            <button
              onClick={onScrollToLive}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-dark-900 hover:bg-black text-white flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Back to live</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={() => {
              setIsCollapsed(true);
              if (onDismiss) onDismiss();
            }}
            className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
            title="Minimize catch-up panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Personalized Prerequisite Alert */}
      {data.studentPersonalizedAlert && (
        <div className="bg-amber-100/90 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Personalized Prerequisite Alert ({data.studentPersonalizedAlert.weakConceptName}: {data.studentPersonalizedAlert.score}%)
            </span>
            <p className="text-sm font-semibold text-amber-950 leading-relaxed">
              {data.studentPersonalizedAlert.advice}
            </p>
          </div>
        </div>
      )}

      {/* 3. 90-Second Executive Brief */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{panelLang === 'ml' ? '90-സെക്കൻഡ് ചുരുക്കം' : '90-Second Brief (Core Takeaways)'}</span>
        </div>
        <ul className="space-y-1.5 text-sm sm:text-base text-zinc-800 font-medium leading-relaxed pl-1">
          {briefPoints.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-600 font-black mt-1">•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Slides Covered with Interactive Inspector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-zinc-500" />
            <span>
              {panelLang === 'ml'
                ? `നഷ്ടപ്പെട്ട സ്ലൈഡുകൾ (${data.missedSlides.length})`
                : `Slides Covered (${data.missedSlides.length})`}
            </span>
          </h3>
          <span className="text-xs text-zinc-500">Tap slide to inspect key points</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.missedSlides.map((s) => {
            const isSelected = selectedSlidePreview === s.slideIndex;
            return (
              <div
                key={s.slideIndex}
                onClick={() => setSelectedSlidePreview(isSelected ? null : s.slideIndex)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-1">
                  <span>Slide {s.slideIndex + 1}</span>
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-950 line-clamp-2">{s.slideTitle}</h4>
                <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                  {s.spokenKeyPoints[0] || s.bullets[0] || 'Core principles'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected slide expanded view */}
        {selectedSlidePreview !== null && (
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-black text-amber-900 uppercase">
                Slide {selectedSlidePreview + 1} Spoken Details
              </span>
              <button
                onClick={() => setSelectedSlidePreview(null)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
            {(() => {
              const slide = data.missedSlides.find((s) => s.slideIndex === selectedSlidePreview);
              if (!slide) return null;
              return (
                <div className="space-y-2 text-sm text-zinc-800">
                  <h4 className="font-black text-base text-zinc-950">{slide.slideTitle}</h4>
                  <div>
                    <strong className="text-xs font-bold text-zinc-500 block mb-1">Teacher Spoke:</strong>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                      {slide.spokenKeyPoints.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 5. Key Concepts & Teacher Emphasis Flagged */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Concepts */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs space-y-2">
          <span className="text-xs font-black text-zinc-700 uppercase tracking-wider block">
            {panelLang === 'ml' ? 'പ്രധാന ആശയങ്ങൾ' : 'Key Concepts Introduced'}
          </span>
          <div className="flex flex-wrap gap-2">
            {data.keyConcepts.map((c) => (
              <div
                key={c.conceptId}
                className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-0.5"
              >
                <div className="font-black text-zinc-900 flex items-center gap-1.5">
                  <span>{c.conceptName}</span>
                  {c.isWeakForStudent && (
                    <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded font-bold">Weak</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-600">
                  {panelLang === 'ml' ? c.oneLineDefinitionMl : c.oneLineDefinitionEn}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Flagged as Important */}
        <div className="bg-red-50/50 rounded-2xl p-4 border border-red-200/80 shadow-xs space-y-2">
          <span className="text-xs font-black text-red-800 uppercase tracking-wider block">
            {panelLang === 'ml' ? '📌 അധ്യാപകൻ എടുത്തുപറഞ്ഞത്' : '📌 Teacher Flagged as Important'}
          </span>
          <ul className="space-y-1.5 text-xs sm:text-sm text-red-950 font-medium">
            {data.teacherFlaggedImportant.slice(0, 3).map((f, fIdx) => (
              <li key={fIdx} className="bg-white/80 p-2.5 rounded-xl border border-red-200/60 leading-relaxed">
                "{f}"
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 6. Where We Are Now (Rejoin the flow) & Happening Now live stream */}
      <div className="bg-dark-900 text-white rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Where We Are Now (Rejoin Live Stream)
            </span>
          </div>
          <span className="text-xs font-bold text-zinc-300">
            Current Slide: Slide {currentSlideIndex + 1} ({currentSlideTitle || data.whereWeAreNow.currentSlideTitle})
          </span>
        </div>

        {/* Real-time happening now incoming stream */}
        <div className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
            Happening Now (Updating Live):
          </span>
          {liveIncoming.length === 0 ? (
            <p className="italic text-zinc-400">Listening to live instructor audio stream...</p>
          ) : (
            <div className="space-y-1">
              {liveIncoming.map((c) => (
                <div key={c.id} className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/60 text-zinc-200">
                  <span className="text-emerald-400 font-mono text-xs mr-2">{c.timestamp}</span>
                  <span>{c.filteredSpeech || c.rawSpeech}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Quick-Check on Missed Content */}
      {data.quickCheckQuestions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {panelLang === 'ml'
                  ? 'ക്വിക്ക്-ചെക്ക് (നഷ്ടപ്പെട്ട ഭാഗം പരിശോധിക്കുക)'
                  : 'Quick Check: Test Missed Concepts'}
              </span>
            </h3>
            <span className="text-xs text-zinc-500 font-medium">2-3 Rapid Questions</span>
          </div>

          <div className="space-y-3.5">
            {data.quickCheckQuestions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <div key={q.id} className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <p className="text-sm font-bold text-zinc-900">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                            isOptionSelected
                              ? isCorrect
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                                : 'bg-red-100 border-red-500 text-red-950 font-bold'
                              : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
                          }`}
                        >
                          <span className="font-mono font-bold mr-1.5">{String.fromCharCode(65 + optIdx)})</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-red-50 text-red-900 border border-red-200'
                      }`}
                    >
                      <strong className="block mb-0.5">{isCorrect ? '✓ Correct!' : '✗ Review this point:'}</strong>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
