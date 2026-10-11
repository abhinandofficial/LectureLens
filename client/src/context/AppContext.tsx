import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Course,
  Concept,
  PrerequisiteEdge,
  Question,
  StudentMastery,
  RemediationBite,
  LectureSession,
  CohortAnalytics,
  CatchUpNotes,
  MentalMirrorFeedback,
  AppLanguage,
  DoubtItem,
  SlideItem,
  FilteredVoiceChunk,
  MasterLectureNotes,
  LateArrivalCatchUp,
  LiveLectureSessionState,
  RecordingStatus,
} from '../types';
import {
  DEMO_COURSE,
  DEMO_CONCEPTS,
  DEMO_EDGES,
  DEMO_QUESTIONS,
  DEMO_STUDENT_MASTERY,
  DEMO_REMEDIATION_BITES,
  DEMO_LECTURE,
  DEMO_COHORT_ANALYTICS,
  DEMO_DOUBTS,
  DEMO_SLIDES,
  DEMO_FILTERED_VOICE_CHUNKS,
  DEMO_MASTER_LECTURE_NOTES,
} from '../data/seedData';
import {
  PRELOADED_TEACHER,
  PRELOADED_STUDENT,
  getStoredSession,
  setStoredSession,
  loginWithPreloaded,
  loginWithSupabaseAuth,
  logoutUser,
  isLiveSupabaseConfigured,
} from '../services/supabaseClient';

interface AppContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  loginPreloaded: (role: UserRole) => Promise<User>;
  loginCredentials: (email: string, pass: string) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<void>;
  isSupabaseConnected: boolean;

  course: Course;
  concepts: Concept[];
  edges: PrerequisiteEdge[];
  questions: Question[];
  studentMastery: Record<string, StudentMastery>;
  remediationBites: Record<string, RemediationBite>;
  currentLecture: LectureSession;
  cohortAnalytics: CohortAnalytics;
  catchUpNotes: CatchUpNotes[];
  activeRemediation: RemediationBite | null;
  setActiveRemediation: (bite: RemediationBite | null) => void;
  activeLanguage: AppLanguage;
  setActiveLanguage: (lang: AppLanguage) => void;
  
  // Class doubts portal
  doubts: DoubtItem[];
  addDoubt: (doubt: Omit<DoubtItem, 'id' | 'createdAt' | 'votes'>) => void;
  upvoteDoubt: (doubtId: string) => void;

  // Live Session & Teacher Recording Suite
  liveSession: LiveLectureSessionState;
  startLiveSession: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  endLiveSession: () => void;
  resetLiveSession: () => void;
  setRecordingStatus: (status: RecordingStatus, error?: string) => void;
  setCurrentSlideIndex: (idx: number) => void;
  uploadSlidesDeck: (slides: SlideItem[]) => void;
  addVoiceChunk: (
    rawText: string,
    timestamp?: string,
    slideIdx?: number,
    isDemo?: boolean,
    customAlignmentScore?: number,
    customCategory?: FilteredVoiceChunk['category']
  ) => FilteredVoiceChunk;
  reassignVoiceChunk: (chunkId: string, newSlideIndex: number) => void;
  generateMasterNotes: () => MasterLectureNotes;
  getLateArrivalCatchUp: (arrivalMinute?: number) => LateArrivalCatchUp;

  // Actions
  addOrUpdateConceptsAndEdges: (newConcepts: Concept[], newEdges: PrerequisiteEdge[]) => void;
  updateConceptStatus: (conceptId: string, status: 'published' | 'pending_review') => void;
  recordPracticeAttempt: (questionId: string, optionId: string, isCorrect: boolean) => void;
  recordReviewAttempt: (conceptId: string, isSuccess: boolean) => void;
  saveCatchUpNotes: (notes: CatchUpNotes) => void;
  calculateRetention: (conceptId: string) => { retention: number; daysSince: number; isDue: boolean };
}

const COMMON_FILLERS = [
  'uhm', 'uh', 'um', 'like', 'you know', 'basically', 'actually', 'sort of',
  'kind of', 'right guys', 'so yeah', 'you see', 'literally', 'okay so'
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore persisted session or default to Teacher so they can immediately test starting live session
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = getStoredSession();
    return saved?.user || PRELOADED_TEACHER;
  });

  const [concepts, setConcepts] = useState<Concept[]>(DEMO_CONCEPTS);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>(DEMO_EDGES);
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [studentMastery, setStudentMastery] = useState<Record<string, StudentMastery>>(DEMO_STUDENT_MASTERY);
  const [remediationBites, setRemediationBites] = useState<Record<string, RemediationBite>>(DEMO_REMEDIATION_BITES);
  const [activeRemediation, setActiveRemediation] = useState<RemediationBite | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AppLanguage>('en');
  const [catchUpNotes, setCatchUpNotes] = useState<CatchUpNotes[]>([]);
  const [doubts, setDoubts] = useState<DoubtItem[]>(DEMO_DOUBTS);

  // Live Lecture Suite state
  const [liveSession, setLiveSession] = useState<LiveLectureSessionState>({
    isActive: false, // Idle by default until recording starts
    recordingStatus: 'idle',
    recordingError: undefined,
    elapsedSeconds: 0,
    startedAt: null,
    currentSlideIndex: 0,
    slides: DEMO_SLIDES,
    filteredChunks: [], // Empty initially, populated as teacher speaks or triggers demo audio
    activeSpeaker: 'Prof. Meera Sen',
    masterNotes: null,
  });

  // Running timer: increments elapsedSeconds only while recording
  useEffect(() => {
    if (liveSession.recordingStatus !== 'recording') return;
    const interval = setInterval(() => {
      setLiveSession((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [liveSession.recordingStatus]);

  const switchRole = (role: UserRole) => {
    const targetUser = role === 'student' ? PRELOADED_STUDENT : PRELOADED_TEACHER;
    setCurrentUser(targetUser);
    setStoredSession({
      user: targetUser,
      token: `token-${role}`,
      source: 'preloaded',
    });
  };

  const loginPreloaded = async (role: UserRole) => {
    const user = await loginWithPreloaded(role);
    setCurrentUser(user);
    return user;
  };

  const loginCredentials = async (email: string, pass: string) => {
    const res = await loginWithSupabaseAuth(email, pass);
    if (res.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(PRELOADED_STUDENT);
  };

  // Live session controls
  const setRecordingStatus = (status: RecordingStatus, error?: string) => {
    setLiveSession((prev) => ({
      ...prev,
      recordingStatus: status,
      recordingError: error,
      isActive: status === 'recording' || status === 'paused',
      startedAt: status === 'recording' && !prev.startedAt ? new Date().toISOString() : prev.startedAt,
    }));
  };

  const startLiveSession = () => {
    setLiveSession((prev) => ({
      ...prev,
      isActive: true,
      recordingStatus: 'recording',
      recordingError: undefined,
      startedAt: prev.recordingStatus === 'idle' || prev.recordingStatus === 'stopped' ? new Date().toISOString() : (prev.startedAt || new Date().toISOString()),
      elapsedSeconds: prev.recordingStatus === 'idle' || prev.recordingStatus === 'stopped' ? 0 : prev.elapsedSeconds,
      filteredChunks: prev.recordingStatus === 'idle' || prev.recordingStatus === 'stopped' ? [] : prev.filteredChunks,
    }));
  };

  const pauseRecording = () => {
    setLiveSession((prev) => ({
      ...prev,
      recordingStatus: 'paused',
    }));
  };

  const resumeRecording = () => {
    setLiveSession((prev) => ({
      ...prev,
      isActive: true,
      recordingStatus: 'recording',
      recordingError: undefined,
    }));
  };

  const stopRecording = () => {
    const notes = generateMasterNotes();
    setLiveSession((prev) => ({
      ...prev,
      isActive: false,
      recordingStatus: 'stopped',
      masterNotes: notes,
    }));
  };

  const endLiveSession = stopRecording;

  const resetLiveSession = () => {
    setLiveSession((prev) => ({
      ...prev,
      isActive: false,
      recordingStatus: 'idle',
      recordingError: undefined,
      elapsedSeconds: 0,
      startedAt: null,
      currentSlideIndex: 0,
      filteredChunks: [],
      masterNotes: null,
    }));
  };

  const setCurrentSlideIndex = (idx: number) => {
    setLiveSession((prev) => ({
      ...prev,
      currentSlideIndex: Math.max(0, Math.min(idx, prev.slides.length - 1)),
    }));
  };

  const uploadSlidesDeck = (newSlides: SlideItem[]) => {
    setLiveSession((prev) => ({
      ...prev,
      slides: newSlides,
      currentSlideIndex: 0,
    }));
  };

  // Filter raw speech, strip fillers, evaluate alignment against active slide
  const addVoiceChunk = (
    rawText: string,
    timestamp?: string,
    slideIdx?: number,
    isDemo?: boolean,
    customAlignmentScore?: number,
    customCategory?: FilteredVoiceChunk['category']
  ) => {
    const activeSlideIdx = slideIdx !== undefined ? slideIdx : liveSession.currentSlideIndex;
    const currentSlide = liveSession.slides[activeSlideIdx] || liveSession.slides[0];

    // Filter out verbal fillers
    let filtered = rawText;
    const detectedFillers: string[] = [];

    COMMON_FILLERS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      if (regex.test(filtered)) {
        detectedFillers.push(filler);
        filtered = filtered.replace(regex, '');
      }
    });

    // Clean up punctuation and spacing
    filtered = filtered.replace(/\s{2,}/g, ' ').trim();
    if (filtered.length > 0) {
      filtered = filtered.charAt(0).toUpperCase() + filtered.slice(1);
    }

    // Determine category
    const lower = rawText.toLowerCase();
    let category: FilteredVoiceChunk['category'] = customCategory || 'core_concept';
    if (!customCategory) {
      if (lower.includes('analogy') || lower.includes('like a') || lower.includes('think of') || lower.includes('ripple')) {
        category = 'analogy';
      } else if (lower.includes('trap') || lower.includes('danger') || lower.includes('warning') || lower.includes('exam') || lower.includes('mistake') || lower.includes('explode')) {
        category = 'pitfall_warning';
      } else if (lower.includes('homework') || lower.includes('due date') || lower.includes('attendance')) {
        category = 'administrative';
      }
    }

    // Calculate semantic alignment with active slide
    let alignmentScore = customAlignmentScore;
    if (alignmentScore === undefined) {
      const slideKeywords = [
        (currentSlide?.title || '').toLowerCase(),
        ...((currentSlide?.bullets || []).map((b) => b.toLowerCase())),
      ].join(' ');

      const words = filtered.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matches = words.filter((w) => slideKeywords.includes(w));
      alignmentScore = Math.min(99, Math.max(25, Math.round((matches.length / Math.max(3, words.length)) * 100) + 35));
    }

    const chunk: FilteredVoiceChunk = {
      id: `chunk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timestamp || new Date().toTimeString().slice(3, 8),
      slideIndex: activeSlideIdx + 1,
      rawSpeech: rawText,
      filteredSpeech: filtered,
      fillerWordsRemoved: Array.from(new Set(detectedFillers)),
      category,
      slideAlignmentScore: alignmentScore,
      isDemo: Boolean(isDemo),
    };

    setLiveSession((prev) => ({
      ...prev,
      filteredChunks: [...prev.filteredChunks, chunk],
    }));

    return chunk;
  };

  const reassignVoiceChunk = (chunkId: string, newSlideIndex: number) => {
    setLiveSession((prev) => ({
      ...prev,
      filteredChunks: prev.filteredChunks.map((c) =>
        c.id === chunkId ? { ...c, slideIndex: newSlideIndex } : c
      ),
    }));
  };

  const generateMasterNotes = (): MasterLectureNotes => {
    const slideAndSpeechAlignment = liveSession.slides.map((s, idx) => {
      const matchingChunks = liveSession.filteredChunks.filter(
        (c) => c.slideIndex === idx + 1
      );
      const teacherPoints = matchingChunks.map((c) => c.filteredSpeech).slice(0, 3);
      if (teacherPoints.length === 0) {
        teacherPoints.push(
          `Teacher emphasized ${s.title} and walked through runtime complexity trade-offs.`
        );
      }

      return {
        slideNumber: s.slideNumber,
        slideTitle: s.title,
        slidePoints: s.bullets,
        teacherSpokenPoints: teacherPoints,
        divergenceNotes: `Synthesized from ${matchingChunks.length} verbal explanations during live lecture session.`,
        keyFormulasOrCode: s.codeSnippet,
      };
    });

    const masterNotes: MasterLectureNotes = {
      id: `master-notes-${Date.now()}`,
      lectureId: DEMO_LECTURE.id,
      generatedAt: new Date().toISOString(),
      overview: `Automated synthesis combining ${liveSession.slides.length} slide decks with real-time speech-to-text audio stream (${liveSession.filteredChunks.length} filtered chunks). Redundant verbal fillers filtered out.`,
      slideAndSpeechAlignment,
      keyTakeaways: [
        'Adjacency List is optimal for sparse graphs (O(V+E) memory).',
        'Mark BFS nodes visited upon enqueuing to prevent exponential duplicate queue pushes.',
        'DFS depth is strictly bounded by operating system call-stack frame allocation.',
        'Directed cycles prevent Kahn topological sort from processing all vertices.',
      ],
      detectedExamPitfalls: [
        'Late visited assignment in BFS causing Memory Limit Exceeded (MLE).',
        'Ignoring base case in DFS causing stack frame exhaustion segmentation faults.',
      ],
    };

    setLiveSession((prev) => ({
      ...prev,
      masterNotes,
    }));

    return masterNotes;
  };

  // Late student personalized catch-up engine
  const getLateArrivalCatchUp = (arrivalMinute = 24): LateArrivalCatchUp => {
    const elapsedMinutes = 35; // Simulated elapsed time
    const missedSlideNumbers = liveSession.slides
      .filter((s) => s.slideNumber <= liveSession.currentSlideIndex + 1)
      .map((s) => s.slideNumber);

    // Check student's weak prerequisites from their mastery profile
    const weakPrereqs = Object.values(studentMastery)
      .filter((m) => m.status === 'bottleneck' || m.status === 'at-risk')
      .map((m) => {
        const concept = concepts.find((c) => c.id === m.conceptId);
        return {
          conceptId: m.conceptId,
          conceptName: concept?.name || m.conceptId,
          masteryScore: m.score,
          warning: `This live section directly builds on ${concept?.name}. Your mastery is currently ${m.score}% (${m.status}). Review activation frames before asking DFS questions.`,
        };
      });

    return {
      studentId: currentUser.id,
      arrivalTimeMinutes: arrivalMinute,
      currentLectureTimeMinutes: elapsedMinutes,
      missedSlides: missedSlideNumbers,
      executiveBriefing: `You arrived ${arrivalMinute} minutes into the lecture. Prof. Meera Sen covered Slide 1 through Slide ${liveSession.currentSlideIndex + 1}. The core focus was on Graph Representations (O(V+E) vs O(V²)) and the critical BFS Enqueue-Time Visited Invariant.`,
      personalizedPrerequisiteGap: weakPrereqs,
      actionableNextStep: `Jump directly to Slide ${liveSession.currentSlideIndex + 1} ("${liveSession.slides[liveSession.currentSlideIndex]?.title}") to join the live stream right now.`,
    };
  };

  const addDoubt = (newDoubtData: Omit<DoubtItem, 'id' | 'createdAt' | 'votes'>) => {
    const newDoubt: DoubtItem = {
      ...newDoubtData,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      votes: 1,
    };
    setDoubts((prev) => [newDoubt, ...prev]);
  };

  const upvoteDoubt = (doubtId: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, votes: d.votes + 1 } : d))
    );
  };

  const addOrUpdateConceptsAndEdges = (newConcepts: Concept[], newEdges: PrerequisiteEdge[]) => {
    setConcepts((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      newConcepts.forEach((c) => map.set(c.id, c));
      return Array.from(map.values());
    });
    setEdges((prev) => {
      const existing = new Set(prev.map((e) => `${e.sourceConceptId}->${e.targetConceptId}`));
      const filtered = newEdges.filter((e) => !existing.has(`${e.sourceConceptId}->${e.targetConceptId}`));
      return [...prev, ...filtered];
    });
  };

  const updateConceptStatus = (conceptId: string, status: 'published' | 'pending_review') => {
    setConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, status } : c))
    );
  };

  // Ebbinghaus decay calculation R = e^(-t/S)
  const calculateRetention = (conceptId: string) => {
    const mastery = studentMastery[conceptId];
    if (!mastery) {
      return { retention: 0, daysSince: 0, isDue: true };
    }
    const lastDate = new Date(mastery.lastReviewedAt).getTime();
    const now = new Date('2026-10-10T22:30:00.000Z').getTime();
    const diffMs = Math.max(0, now - lastDate);
    const daysSince = diffMs / (1000 * 60 * 60 * 24);
    const stability = Math.max(0.5, mastery.stability);
    
    // R = e^(-t / S)
    const retention = Math.exp(-daysSince / stability);
    const isDue = retention < 0.70;
    
    return { retention, daysSince, isDue };
  };

  const recordPracticeAttempt = (questionId: string, optionId: string, isCorrect: boolean) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    setStudentMastery((prev) => {
      const current = prev[question.conceptId] || {
        conceptId: question.conceptId,
        score: 50,
        stability: 2.0,
        lastReviewedAt: new Date().toISOString(),
        status: 'developing',
        consecutiveSuccesses: 0,
      };

      let newScore = isCorrect
        ? Math.min(100, current.score + 12)
        : Math.max(10, current.score - 15);
      
      let newStability = isCorrect
        ? current.stability * 1.6
        : Math.max(0.8, current.stability * 0.65);

      let newConsecutive = isCorrect ? current.consecutiveSuccesses + 1 : 0;

      let newStatus: StudentMastery['status'] = 'developing';
      if (newScore >= 80) newStatus = 'mastered';
      else if (newScore < 40) newStatus = 'bottleneck';
      else if (newScore < 60) newStatus = 'at-risk';

      return {
        ...prev,
        [question.conceptId]: {
          ...current,
          score: newScore,
          stability: Number(newStability.toFixed(2)),
          lastReviewedAt: new Date().toISOString(),
          status: newStatus,
          consecutiveSuccesses: newConsecutive,
        },
      };
    });

    if (!isCorrect) {
      const bite = remediationBites[question.conceptId];
      if (bite) {
        setTimeout(() => {
          setActiveRemediation(bite);
        }, 1200);
      }
    }
  };

  const recordReviewAttempt = (conceptId: string, isSuccess: boolean) => {
    setStudentMastery((prev) => {
      const current = prev[conceptId] || {
        conceptId,
        score: 50,
        stability: 2.0,
        lastReviewedAt: new Date().toISOString(),
        status: 'developing',
        consecutiveSuccesses: 0,
      };

      const newStability = isSuccess
        ? current.stability * 1.85
        : Math.max(0.7, current.stability * 0.6);

      const newScore = isSuccess
        ? Math.min(100, current.score + 10)
        : Math.max(10, current.score - 12);

      let newStatus: StudentMastery['status'] = 'developing';
      if (newScore >= 80) newStatus = 'mastered';
      else if (newScore < 40) newStatus = 'bottleneck';
      else if (newScore < 60) newStatus = 'at-risk';

      return {
        ...prev,
        [conceptId]: {
          ...current,
          score: newScore,
          stability: Number(newStability.toFixed(2)),
          lastReviewedAt: new Date().toISOString(),
          status: newStatus,
          consecutiveSuccesses: isSuccess ? current.consecutiveSuccesses + 1 : 0,
        },
      };
    });
  };

  const saveCatchUpNotes = (notes: CatchUpNotes) => {
    setCatchUpNotes((prev) => [notes, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchRole,
        loginPreloaded,
        loginCredentials,
        logout,
        isSupabaseConnected: isLiveSupabaseConfigured,
        course: DEMO_COURSE,
        concepts,
        edges,
        questions,
        studentMastery,
        remediationBites,
        currentLecture: DEMO_LECTURE,
        cohortAnalytics: DEMO_COHORT_ANALYTICS,
        catchUpNotes,
        activeRemediation,
        setActiveRemediation,
        activeLanguage,
        setActiveLanguage,
        doubts,
        addDoubt,
        upvoteDoubt,
        liveSession,
        startLiveSession,
        pauseRecording,
        resumeRecording,
        stopRecording,
        endLiveSession,
        resetLiveSession,
        setRecordingStatus,
        setCurrentSlideIndex,
        uploadSlidesDeck,
        addVoiceChunk,
        reassignVoiceChunk,
        generateMasterNotes,
        getLateArrivalCatchUp,
        addOrUpdateConceptsAndEdges,
        updateConceptStatus,
        recordPracticeAttempt,
        recordReviewAttempt,
        saveCatchUpNotes,
        calculateRetention,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
