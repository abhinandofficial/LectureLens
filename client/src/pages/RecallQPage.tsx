import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useClassContext } from '../context/ClassContext';
import { SlideItem } from '../types';
import {
  RecallQQuestion,
  DeckRecallQPackage,
  StudentRecallQAttempt,
  StudentConceptMastery,
  RemediationBite,
} from '../types/recallQTypes';
import {
  loadDeckRecallQPackage,
  saveDeckRecallQPackage,
  saveStudentAttempt,
  loadStudentAttempts,
  loadStudentMasteryMap,
  computeClassAggregates,
  subscribeToRecallQEvents,
} from '../services/recallQStorage';
import {
  generateDeterministicPackage,
  generateRecallQPackageWithGemini,
} from '../services/recallQGenerator';
import { PRETRAINED_DECK } from '../services/deckStorage';
import { MentalMirrorFeedbackPanel } from '../components/MentalMirrorFeedbackPanel';
import { RemediationBiteCard } from '../components/RemediationBiteCard';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  Layers,
  ArrowRight,
  RotateCcw,
  Users,
  ShieldCheck,
  FileQuestion,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RecallQPage: React.FC = () => {
  const { currentUser, liveSession, activeLanguage } = useApp();
  const { activeSession, joinedClass } = useClassContext();

  const isTeacher = currentUser.role === 'teacher';
  const classCode = isTeacher ? activeSession?.code : joinedClass?.session?.code;

  // Active lecture slides to base questions on
  const activeSlides: SlideItem[] = useMemo(() => {
    if (liveSession.slides && liveSession.slides.length > 0) {
      return liveSession.slides;
    }
    return PRETRAINED_DECK.slides;
  }, [liveSession.slides]);

  const deckId = useMemo(() => {
    // Unique identifier based on first slide title or count
    const firstTitle = activeSlides[0]?.title || 'default';
    return `deck-${activeSlides.length}-${firstTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  }, [activeSlides]);

  const deckName = useMemo(() => {
    return activeSlides === PRETRAINED_DECK.slides
      ? 'Sample Deck (CS201 Graph Traversals)'
      : 'Active Lecture Deck';
  }, [activeSlides]);

  // ── RecallQ Package State ──────────────────────────────────────────────────
  const [qPackage, setQPackage] = useState<DeckRecallQPackage | null>(() => {
    return loadDeckRecallQPackage(deckId, classCode);
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Sync package across tabs or on class/deck change
  useEffect(() => {
    const existing = loadDeckRecallQPackage(deckId, classCode);
    if (existing) {
      setQPackage(existing);
    } else {
      // Seed initial package deterministically if not yet generated
      const initial = generateDeterministicPackage(deckId, deckName, activeSlides);
      // Auto-approve sample deck so students immediately have questions to practise
      if (deckId.includes('5-1Graph')) {
        initial.isPublished = true;
        initial.questions.forEach((q) => (q.status = 'approved'));
      }
      saveDeckRecallQPackage(initial, classCode);
      setQPackage(initial);
    }

    const unsub = subscribeToRecallQEvents((event) => {
      if (event.type === 'recallq_package_updated') {
        const fresh = loadDeckRecallQPackage(deckId, classCode);
        if (fresh) setQPackage(fresh);
      }
    });

    return () => unsub();
  }, [deckId, classCode, deckName, activeSlides]);

  // Teacher generator action
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setGenerationNotice(null);
    try {
      const generated = await generateRecallQPackageWithGemini(deckId, deckName, activeSlides);
      saveDeckRecallQPackage(generated, classCode);
      setQPackage(generated);
      setGenerationNotice('Generated 2 questions per slide with misconception-mapped distractors!');
      setTimeout(() => setGenerationNotice(null), 4000);
    } catch (err: any) {
      console.warn('RecallQ generation exception:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── TEACHER: Review & Approve Actions ─────────────────────────────────────
  const [editingQuestion, setEditingQuestion] = useState<RecallQQuestion | null>(null);
  const [teacherTab, setTeacherTab] = useState<'review' | 'results'>('review');

  const handleApproveQuestion = (qId: string) => {
    if (!qPackage) return;
    const updated = {
      ...qPackage,
      questions: qPackage.questions.map((q) => (q.id === qId ? { ...q, status: 'approved' as const } : q)),
    };
    saveDeckRecallQPackage(updated, classCode);
    setQPackage(updated);
  };

  const handleApproveAllAndPublish = () => {
    if (!qPackage) return;
    const updated: DeckRecallQPackage = {
      ...qPackage,
      isPublished: true,
      questions: qPackage.questions.map((q) => ({ ...q, status: 'approved' as const })),
      remediationBites: qPackage.remediationBites.map((b) => ({ ...b, status: 'approved' as const })),
    };
    saveDeckRecallQPackage(updated, classCode);
    setQPackage(updated);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!qPackage) return;
    const updated = {
      ...qPackage,
      questions: qPackage.questions.filter((q) => q.id !== qId),
    };
    saveDeckRecallQPackage(updated, classCode);
    setQPackage(updated);
  };

  const handleSaveEditedQuestion = () => {
    if (!qPackage || !editingQuestion) return;
    const updated = {
      ...qPackage,
      questions: qPackage.questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)),
    };
    saveDeckRecallQPackage(updated, classCode);
    setQPackage(updated);
    setEditingQuestion(null);
  };

  // ── STUDENT: Practice Arena State ─────────────────────────────────────────
  const [filterSlideIndex, setFilterSlideIndex] = useState<number | 'all'>('all');
  const [filterWeakOnly, setFilterWeakOnly] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(null);
  const [greyedOptionIds, setGreyedOptionIds] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Student Mastery Map
  const [masteryMap, setMasteryMap] = useState<Record<string, StudentConceptMastery>>(() =>
    loadStudentMasteryMap(currentUser.id, classCode)
  );
  const [activeRemediationDismissed, setActiveRemediationDismissed] = useState<Record<string, boolean>>({});

  // Filter approved questions for student practice
  const studentQuestions: RecallQQuestion[] = useMemo(() => {
    if (!qPackage) return [];
    let list = qPackage.questions.filter((q) => q.status === 'approved');

    if (filterSlideIndex !== 'all') {
      list = list.filter((q) => q.slideIndex === filterSlideIndex);
    }

    if (filterWeakOnly) {
      list = list.filter((q) => {
        const m = masteryMap[q.conceptId];
        return m && m.isBottleneck;
      });
    }

    return list;
  }, [qPackage, filterSlideIndex, filterWeakOnly, masteryMap]);

  const activeQuestion: RecallQQuestion | undefined = studentQuestions[currentQuestionIndex];

  // Active bottleneck remediation bite for the current question's concept
  const activeBiteForQuestion = useMemo<RemediationBite | null>(() => {
    if (!activeQuestion || !qPackage) return null;
    const m = masteryMap[activeQuestion.conceptId];
    if (m && m.isBottleneck && !activeRemediationDismissed[activeQuestion.conceptId]) {
      return (
        qPackage.remediationBites.find((b) => b.conceptId === activeQuestion.conceptId) || null
      );
    }
    return null;
  }, [activeQuestion, qPackage, masteryMap, activeRemediationDismissed]);

  const handleOptionClick = (optId: string) => {
    if (submittedOptionId && submittedOptionId === activeQuestion?.correctOptionId) return;
    if (greyedOptionIds.includes(optId)) return;
    setSelectedOptionId(optId);
  };

  const handleStudentSubmitAnswer = () => {
    if (!activeQuestion || !selectedOptionId) return;

    const opt = activeQuestion.options.find((o) => o.id === selectedOptionId);
    const isCorrect = opt?.isCorrect || false;
    setSubmittedOptionId(selectedOptionId);

    // Save attempt and update mastery
    const attempt: StudentRecallQAttempt = {
      id: `att-${Date.now()}`,
      studentId: currentUser.id,
      classCode: classCode || undefined,
      questionId: activeQuestion.id,
      chosenOptionId: selectedOptionId,
      isCorrect,
      misconceptionId: opt?.misconception?.misconceptionId,
      timestamp: new Date().toLocaleTimeString(),
    };

    const { updatedMastery } = saveStudentAttempt(
      attempt,
      activeQuestion.conceptId,
      activeQuestion.conceptName
    );

    setMasteryMap((prev) => ({ ...prev, [activeQuestion.conceptId]: updatedMastery }));
  };

  const handleStudentTryAgain = () => {
    if (submittedOptionId) {
      setGreyedOptionIds((prev) => [...prev, submittedOptionId]);
    }
    setSubmittedOptionId(null);
    setSelectedOptionId(null);
    setRetryCount((prev) => prev + 1);
  };

  const handleStudentNextQuestion = () => {
    setSelectedOptionId(null);
    setSubmittedOptionId(null);
    setGreyedOptionIds([]);
    setRetryCount(0);
    setIsAnswerRevealed(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % Math.max(1, studentQuestions.length));
  };

  // Keyboard accessibility (1-4 selects options, Enter submits)
  useEffect(() => {
    if (isTeacher || !activeQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const opt = activeQuestion.options[idx];
        if (opt && !greyedOptionIds.includes(opt.id)) {
          setSelectedOptionId(opt.id);
        }
      } else if (e.key === 'Enter') {
        if (selectedOptionId && !submittedOptionId) {
          handleStudentSubmitAnswer();
        } else if (submittedOptionId && submittedOptionId === activeQuestion.correctOptionId) {
          handleStudentNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacher, activeQuestion, selectedOptionId, submittedOptionId, greyedOptionIds]);

  // Teacher class aggregates computation
  const classAggregates = useMemo(() => {
    if (!qPackage) return null;
    return computeClassAggregates(classCode, qPackage.questions);
  }, [qPackage, classCode]);

  return (
    <div className="space-y-7 pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-1.5">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>RecallQ Misconception Practice Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            {isTeacher ? 'RecallQ: Question Studio & Cohort Analytics' : 'RecallQ: Mental Mirror Practice Arena'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-3xl">
            {isTeacher
              ? 'Auto-generate deck-aligned practice questions, verify distractor cognitive traps, and publish to students.'
              : 'Practise core lecture invariants with deconstructive Mental Mirror feedback and 60-second remediation bites.'}
          </p>
        </div>

        {/* Source Deck Pill */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-zinc-200 shadow-xs text-xs font-bold text-zinc-700">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[200px]">{deckName}</span>
            <span className="font-mono text-zinc-400">({activeSlides.length} slides)</span>
          </div>

          {!classCode && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black">
              Sample Deck Mode
            </span>
          )}
        </div>
      </div>

      {/* Generation Notification Banner */}
      {generationNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{generationNotice}</span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TEACHER VIEW: Question Generator & Approval Workflow                 */}
      {/* ==================================================================== */}
      {isTeacher && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-zinc-950">
                Lecture Deck Question Package
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {qPackage?.questions.length || 0} questions generated •{' '}
                {qPackage?.questions.filter((q) => q.status === 'approved').length || 0} approved
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black disabled:opacity-40 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isGenerating ? 'Generating...' : 'Generate RecallQ Questions'}</span>
              </button>

              <button
                onClick={handleApproveAllAndPublish}
                disabled={!qPackage || qPackage.questions.length === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve All &amp; Publish to Class</span>
              </button>
            </div>
          </div>

          {/* Teacher Tab Bar */}
          <div className="flex border-b border-zinc-200 gap-3 pt-1">
            <button
              onClick={() => setTeacherTab('review')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                teacherTab === 'review'
                  ? 'border-dark-900 text-zinc-950 font-black'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Review &amp; Approve Questions ({qPackage?.questions.length || 0})</span>
            </button>

            <button
              onClick={() => setTeacherTab('results')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                teacherTab === 'results'
                  ? 'border-dark-900 text-zinc-950 font-black'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Class Performance &amp; Misconceptions</span>
            </button>
          </div>

          {/* Tab 1: Review & Approve */}
          {teacherTab === 'review' && (
            <div className="space-y-4">
              {qPackage?.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-6 rounded-3xl border bg-white shadow-xs space-y-4 transition-all ${
                    q.status === 'approved' ? 'border-zinc-200' : 'border-amber-300 ring-1 ring-amber-300/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                        Slide {q.slideIndex + 1}: {q.slideTitle.slice(0, 30)}...
                      </span>
                      <span className="text-xs uppercase font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {q.difficulty}
                      </span>
                      {q.status === 'pending_review' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          AI-generated, pending review
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Approved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Edit question text"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {q.status !== 'approved' && (
                        <button
                          onClick={() => handleApproveQuestion(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-base font-bold text-zinc-900 leading-relaxed">
                    {q.stem}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                          opt.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : 'border-zinc-200 bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-700">
                            {opt.id.toUpperCase()}
                          </span>
                          {opt.isCorrect ? (
                            <span className="text-emerald-700 font-black">✓ Correct Option</span>
                          ) : (
                            <span className="text-purple-800 font-bold text-[10px]">
                              Trap: {opt.misconception?.misconceptionLabel || 'Misconception'}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-900 font-medium">{opt.text}</p>
                        {opt.misconception && (
                          <p className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-200/50">
                            <strong>Thought Trap:</strong> {opt.misconception.deconstructiveFeedbackEn}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Class Results */}
          {teacherTab === 'results' && classAggregates && (
            <div className="space-y-6">
              {/* Bottleneck Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                    Class Questions
                  </span>
                  <div className="text-3xl font-black text-zinc-900 font-mono">
                    {qPackage?.questions.length || 0}
                  </div>
                  <p className="text-xs text-zinc-500">Across {activeSlides.length} lecture slides</p>
                </div>

                <div className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-600 block">
                    Active Bottleneck Concepts
                  </span>
                  <div className="text-3xl font-black text-red-700 font-mono">
                    {classAggregates.bottleneckConcepts.length}
                  </div>
                  <p className="text-xs text-zinc-500">Concepts with repeated misconception hits</p>
                </div>

                <div className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 block">
                    Students Needing Help
                  </span>
                  <div className="text-3xl font-black text-amber-700 font-mono">
                    {classAggregates.studentsNeedingHelp.length}
                  </div>
                  <p className="text-xs text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Demo cohort data
                    </span>
                  </p>
                </div>
              </div>

              {/* Students Needing Remediation table */}
              <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Students Requiring Conceptual Help</span>
                  </h3>
                  <span className="text-xs font-bold text-zinc-400">Class {classCode || 'Sample'}</span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {classAggregates.studentsNeedingHelp.map((st) => (
                    <div key={st.studentId} className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="font-bold text-zinc-900 text-sm">{st.studentName}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {st.weakConcepts.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]"
                          >
                            ⚠️ {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edit Question Modal */}
          {editingQuestion && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 max-w-xl w-full shadow-float space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-black text-zinc-900">Edit Question &amp; Invariants</h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Question Stem:</label>
                    <textarea
                      value={editingQuestion.stem}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, stem: e.target.value })
                      }
                      rows={3}
                      className="w-full p-3 rounded-xl border border-zinc-300 font-medium text-xs text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Correct Answer Explanation:</label>
                    <input
                      type="text"
                      value={editingQuestion.explanation}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedQuestion}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* STUDENT VIEW: Practice Arena, Mental Mirror & Remediation Bites      */}
      {/* ==================================================================== */}
      {!isTeacher && (
        <div className="space-y-6">
          {/* Active Remediation Bite (Shown when student has a bottleneck on this concept) */}
          {activeBiteForQuestion && (
            <RemediationBiteCard
              bite={activeBiteForQuestion}
              language={activeLanguage === 'ml' ? 'ml' : 'en'}
              onCompleted={() => {
                setActiveRemediationDismissed((prev) => ({
                  ...prev,
                  [activeBiteForQuestion.conceptId]: true,
                }));
              }}
            />
          )}

          {/* Practice Card */}
          {activeQuestion ? (
            <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
              {/* Question metadata & slide reference */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs bg-zinc-100 px-3 py-1 rounded-full text-zinc-700">
                    Question {currentQuestionIndex + 1} of {studentQuestions.length}
                  </span>
                  <span className="font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    From Slide {activeQuestion.slideIndex + 1}: {activeQuestion.slideTitle}
                  </span>
                  <span className="text-xs uppercase font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {activeQuestion.difficulty}
                  </span>

                  {masteryMap[activeQuestion.conceptId]?.isRecovered && (
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Recovered
                    </span>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                  <button
                    onClick={() => setFilterWeakOnly((prev) => !prev)}
                    className={`px-3 py-1 rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                      filterWeakOnly
                        ? 'bg-red-50 text-red-700 border-red-300 font-black'
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Weak Concepts Only</span>
                  </button>
                </div>
              </div>

              {/* Question Stem (Minimum 20px readable font) */}
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 leading-relaxed">
                {activeQuestion.stem}
              </h2>

              {/* 4 Options Grid (Minimum 18px text, keyboard 1-4 accessible) */}
              <div className="space-y-3">
                {activeQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isSubmitted = submittedOptionId !== null;
                  const isCorrect = opt.isCorrect;
                  const isGreyed = greyedOptionIds.includes(opt.id);

                  let cardStyle = 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900';

                  if (isGreyed) {
                    cardStyle = 'border-zinc-200 bg-zinc-100 text-zinc-400 opacity-50 cursor-not-allowed';
                  } else if (isSubmitted) {
                    if (isCorrect && isAnswerRevealed) {
                      cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500';
                    } else if (isSelected) {
                      cardStyle = isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500'
                        : 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-400';
                    }
                  } else if (isSelected) {
                    cardStyle = 'border-zinc-900 bg-zinc-50 text-zinc-950 ring-2 ring-zinc-900';
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.id)}
                      disabled={isGreyed || (isSubmitted && isCorrect)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${cardStyle}`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {oIdx + 1}
                      </span>
                      <p className="text-base sm:text-lg font-bold leading-relaxed">{opt.text}</p>
                    </button>
                  );
                })}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400 font-medium">
                  Press <strong>1-4</strong> to select • <strong>Enter</strong> to submit
                </span>

                <div className="flex items-center gap-3">
                  {!submittedOptionId ? (
                    <button
                      onClick={handleStudentSubmitAnswer}
                      disabled={!selectedOptionId}
                      className="px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-black disabled:opacity-40 text-white font-black text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  ) : submittedOptionId === activeQuestion.correctOptionId || isAnswerRevealed ? (
                    <button
                      onClick={handleStudentNextQuestion}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Correct Feedback Box */}
              {submittedOptionId && submittedOptionId === activeQuestion.correctOptionId && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-1 text-emerald-950 animate-fadeIn">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Correct Analysis!</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium">{activeQuestion.explanation}</p>
                </div>
              )}

              {/* Mental Mirror Diagnostic Feedback (Visible when student picks wrong option) */}
              {submittedOptionId && submittedOptionId !== activeQuestion.correctOptionId && (
                <MentalMirrorFeedbackPanel
                  questionId={activeQuestion.id}
                  chosenOptionId={submittedOptionId}
                  misconception={
                    activeQuestion.options.find((o) => o.id === submittedOptionId)?.misconception
                  }
                  defaultLanguage={activeLanguage === 'ml' ? 'ml' : 'en'}
                  onTryAgain={handleStudentTryAgain}
                  onShowAnswer={() => setIsAnswerRevealed(true)}
                  canShowAnswer={retryCount >= 1}
                />
              )}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="text-lg font-black text-zinc-900">
                {filterWeakOnly ? 'No weak concepts currently detected!' : 'No practice questions approved yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                {filterWeakOnly
                  ? 'All of your concept mastery scores are in healthy standing (> 60%). Great job!'
                  : 'The professor has not yet approved questions for this deck. Switch to the sample deck or check back shortly.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
