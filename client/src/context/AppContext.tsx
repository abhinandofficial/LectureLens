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
} from '../data/seedData';

interface AppContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
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
  activeLanguage: 'en' | 'hi';
  setActiveLanguage: (lang: 'en' | 'hi') => void;
  
  // Actions
  addOrUpdateConceptsAndEdges: (newConcepts: Concept[], newEdges: PrerequisiteEdge[]) => void;
  updateConceptStatus: (conceptId: string, status: 'published' | 'pending_review') => void;
  recordPracticeAttempt: (questionId: string, optionId: string, isCorrect: boolean) => void;
  recordReviewAttempt: (conceptId: string, isSuccess: boolean) => void;
  saveCatchUpNotes: (notes: CatchUpNotes) => void;
  calculateRetention: (conceptId: string) => { retention: number; daysSince: number; isDue: boolean };
}

const STUDENT_USER: User = {
  id: 'user-std-1',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@campus.edu',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  enrollmentNumber: 'CS2026-042',
};

const TEACHER_USER: User = {
  id: 'user-tch-1',
  name: 'Prof. Meera Sen',
  email: 'm.sen@university.edu',
  role: 'teacher',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(STUDENT_USER);
  const [concepts, setConcepts] = useState<Concept[]>(DEMO_CONCEPTS);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>(DEMO_EDGES);
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [studentMastery, setStudentMastery] = useState<Record<string, StudentMastery>>(DEMO_STUDENT_MASTERY);
  const [remediationBites, setRemediationBites] = useState<Record<string, RemediationBite>>(DEMO_REMEDIATION_BITES);
  const [activeRemediation, setActiveRemediation] = useState<RemediationBite | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'hi'>('en');
  const [catchUpNotes, setCatchUpNotes] = useState<CatchUpNotes[]>([]);

  const switchRole = (role: UserRole) => {
    if (role === 'student') {
      setCurrentUser(STUDENT_USER);
    } else {
      setCurrentUser(TEACHER_USER);
    }
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
    const now = new Date('2026-10-10T22:30:00.000Z').getTime(); // Current simulation timestamp
    const diffMs = Math.max(0, now - lastDate);
    const daysSince = diffMs / (1000 * 60 * 60 * 24);
    const stability = Math.max(0.5, mastery.stability);
    
    // R = e^(-t / S)
    const retention = Math.exp(-daysSince / stability);
    const isDue = retention < 0.70; // Threshold: under 70% retention triggers review
    
    return { retention, daysSince, isDue };
  };

  // On practice answer
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

    // If incorrect and concept is a bottleneck, auto-trigger remediation bite
    if (!isCorrect) {
      const bite = remediationBites[question.conceptId];
      if (bite) {
        // Trigger bite after a short delay for smooth modal appearance
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
