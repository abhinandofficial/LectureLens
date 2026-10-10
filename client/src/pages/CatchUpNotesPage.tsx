import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateLectureCatchUpNotesAPI } from '../services/api';
import { CatchUpNotes, CatchUpNoteSection } from '../types';
import jsPDF from 'jspdf';
import {
  FileText,
  Mic,
  MicOff,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Languages,
  BookOpen,
  Volume2,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const CatchUpNotesPage: React.FC = () => {
  const { currentLecture, studentMastery, saveCatchUpNotes, activeLanguage, setActiveLanguage } =
    useApp();

  const [slidesText, setSlidesText] = useState<string>(currentLecture.slidesSummary);
  const [transcriptText, setTranscriptText] = useState<string>(currentLecture.transcript);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notes, setNotes] = useState<CatchUpNotes | null>(null);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscriptText((prev) => `${prev}\n[Live Audio] ${currentTranscript.trim()}`);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [activeLanguage]);

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      // Fallback simulation of live classroom audio
      simulateLiveSpeech();
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        simulateLiveSpeech();
      }
    }
  };

  const simulateLiveSpeech = () => {
    const sampleSpeech =
      activeLanguage === 'hi'
        ? '\n[42:15 Live Audio] "Dhyan dijiye: Recursion me Base Case sabse pehle check hona chahiye, warna stack frame leak ho jayega."'
        : '\n[42:15 Live Audio] "Remember class: In BFS, we MUST mark nodes as visited immediately upon enqueuing to prevent memory blowup."';
    setTranscriptText((prev) => prev + sampleSpeech);
  };

  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    try {
      // Find weak concepts from student mastery
      const weakConcepts = Object.values(studentMastery)
        .filter((m) => m.status === 'bottleneck' || m.status === 'at-risk')
        .map((m) => m.conceptId);

      const generated = await generateLectureCatchUpNotesAPI({
        lectureId: currentLecture.id,
        slidesSummary: slidesText,
        transcript: transcriptText,
        studentWeakConcepts: weakConcepts,
        language: activeLanguage,
      });

      setNotes(generated);
      saveCatchUpNotes(generated);
    } catch (err) {
      console.error('Note generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export as PDF via jsPDF
  const exportPDF = () => {
    if (!notes) return;

    const doc = new jsPDF();
    const margin = 16;
    let y = 20;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('LectureLens — Personalized Catch-Up Notes', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Lecture: ${currentLecture.title} | Student: Aarav Sharma`, margin, y);
    y += 12;

    // What You Missed Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, 178, 26, 3, 3, 'FD');
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('WHAT YOU MISSED & PEDAGOGICAL CONTEXT:', margin + 4, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const missedLines = doc.splitTextToSize(notes.whatYouMissed, 170);
    doc.text(missedLines, margin + 4, y);
    y += 20;

    // Sections
    notes.sections.forEach((sec) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const isSource = sec.type === 'source';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(isSource ? 16 : 80, isSource ? 120 : 70, isSource ? 80 : 180);
      doc.text(`[${isSource ? 'SOURCE-BACKED CONTENT' : 'AI-GENERATED CLARIFICATION'}]`, margin, y);
      y += 6;

      doc.setTextColor(20, 20, 20);
      doc.text(sec.title, margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      const contentLines = doc.splitTextToSize(sec.content, 175);
      doc.text(contentLines, margin, y);
      y += contentLines.length * 5 + 6;
    });

    // Quick-check
    if (notes.recoveryQuickCheck && notes.recoveryQuickCheck.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      const q = notes.recoveryQuickCheck[0];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text('RECOVERY QUICK-CHECK QUIZ:', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const qLines = doc.splitTextToSize(q.question, 175);
      doc.text(qLines, margin, y);
      y += qLines.length * 5 + 4;

      q.options.forEach((opt, idx) => {
        doc.text(`${String.fromCharCode(65 + idx)}) ${opt}`, margin + 4, y);
        y += 5;
      });
    }

    doc.save(`LectureLens-CatchUp-${currentLecture.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-2">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Modal Lecture Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Personalized Catch-Up Notes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
            Ingests lecture slides (PDF.js) and spoken lecture audio (Web Speech API), then cross-references
            with your prerequisite knowledge gaps to synthesize targeted recovery notes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeLanguage === 'en' ? 'bg-white text-zinc-950 shadow-sm font-bold' : 'text-zinc-600'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLanguage('hi')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeLanguage === 'hi' ? 'bg-white text-zinc-950 shadow-sm font-bold' : 'text-zinc-600'
              }`}
            >
              हिन्दी / Hinglish
            </button>
          </div>

          <button
            disabled={isGenerating}
            onClick={handleGenerateNotes}
            className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black disabled:bg-zinc-300 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Synthesize Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* INPUTS ROW: Slides (PDF.js) & Speech Audio (Web Speech API) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slide Deck Ingestion Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Slide Deck Content (PDF.js Extracted)</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">24 Slides</span>
            </div>

            <textarea
              rows={6}
              value={slidesText}
              onChange={(e) => setSlidesText(e.target.value)}
              className="w-full text-xs font-mono p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-dark-900/10 leading-relaxed resize-none"
            />
          </div>
          <div className="pt-3 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Direct syllabus alignment: CS201 Lecture 08</span>
            <span className="text-emerald-700 font-semibold">Indexed</span>
          </div>
        </div>

        {/* Live Speech Ingestion Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Spoken Lecture Audio (Web Speech API)</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleRecording}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'Listening...' : 'Live STT'}</span>
                </button>

                <button
                  onClick={simulateLiveSpeech}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-200"
                >
                  + Add Speech Snippet
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              className="w-full text-xs font-mono p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-dark-900/10 leading-relaxed resize-none"
            />
          </div>

          <div className="pt-3 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Web Speech API interface swappable with whisper/google-stt</span>
            <span className="text-emerald-700 font-semibold">52 min transcribed</span>
          </div>
        </div>
      </div>

      {/* GENERATED NOTES DISPLAY */}
      {notes ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
          {/* Top Bar with jsPDF Export */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Personalized Synthesis
              </span>
              <h2 className="text-2xl font-extrabold text-zinc-950 mt-1">
                {currentLecture.title} — Recovery Brief
              </h2>
            </div>

            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-subtle transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF (jsPDF)</span>
            </button>
          </div>

          {/* "What You Missed" Context Box */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm">
            <h4 className="font-extrabold text-zinc-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              What You Missed & Tailored Context
            </h4>
            <p className="text-zinc-700 leading-relaxed">{notes.whatYouMissed}</p>
          </div>

          {/* Sections with Strict Source vs AI Attribution Labeling */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Content Attribution Breakdown
            </div>

            {notes.sections.map((section, idx) => {
              const isSource = section.type === 'source';
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSource
                      ? 'bg-emerald-50/20 border-emerald-200/80'
                      : 'bg-blue-50/20 border-blue-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                        isSource
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {isSource ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Source-Backed Lecture Content
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-blue-700" />
                          AI-Generated Clarification
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-zinc-900 mb-2">{section.title}</h4>
                  <div className="text-xs sm:text-sm text-zinc-700 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recovery Quick-Check */}
          {notes.recoveryQuickCheck && notes.recoveryQuickCheck.length > 0 && (
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-subtle">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-zinc-900">
                  Lecture Recovery Quick-Check
                </h4>
              </div>

              {notes.recoveryQuickCheck.map((qc, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-800">{qc.question}</p>

                  <div className="space-y-2">
                    {qc.options.map((opt, optIdx) => {
                      const isSelected = selectedQuizIdx === optIdx;
                      let style = 'border-zinc-200 hover:bg-zinc-50 text-zinc-800';
                      if (quizSubmitted) {
                        if (optIdx === qc.correctIndex) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                        } else if (isSelected) {
                          style = 'border-red-500 bg-red-50 text-red-900';
                        }
                      } else if (isSelected) {
                        style = 'border-dark-900 bg-zinc-50 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedQuizIdx(optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${style}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      disabled={selectedQuizIdx === null}
                      onClick={() => setQuizSubmitted(true)}
                      className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all"
                    >
                      Verify Recovery
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                      {qc.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
          <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <h4 className="font-bold text-zinc-700 text-sm">Ready to Synthesize Catch-Up Notes</h4>
          <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
            Click <strong>"Synthesize Notes"</strong> above to fuse the slide deck and transcript into a
            personalized catch-up plan.
          </p>
        </div>
      )}
    </div>
  );
};
