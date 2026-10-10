export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  enrollmentNumber?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  instructor: string;
  totalStudents: number;
}

export type ConceptStatus = 'published' | 'pending_review';
export type MasteryTier = 'mastered' | 'developing' | 'at-risk' | 'bottleneck';

export interface Concept {
  id: string;
  courseId: string;
  name: string;
  description: string;
  tier: number; // Depth tier (0 = foundation, 1 = intermediate, etc.)
  isBottleneck: boolean;
  status: ConceptStatus;
  cohortMastery?: number; // 0-100 percentage for teachers
  tags?: string[];
}

export interface PrerequisiteEdge {
  id: string;
  sourceConceptId: string; // Prerequisite
  targetConceptId: string; // Dependent concept
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  misconceptionTag?: string;
  trapReasoning?: string;
}

export interface Question {
  id: string;
  conceptId: string;
  text: string;
  options: MCQOption[];
  difficulty: 'foundational' | 'applied';
  forwardDependentConceptId?: string; // For testing retention in downstream contexts
  explanationSnippet?: string;
}

export interface StudentMastery {
  conceptId: string;
  score: number; // 0 - 100
  stability: number; // In days (S in Ebbinghaus R = e^(-t/S))
  lastReviewedAt: string; // ISO string
  status: MasteryTier;
  consecutiveSuccesses: number;
}

export interface MentalMirrorFeedback {
  questionId: string;
  optionId: string;
  language: 'en' | 'hi';
  trapReasoning: string;
  counterexample: string;
  paradoxScenario: string;
  correctiveGuidance: string;
  isCached?: boolean;
}

export interface RemediationBite {
  conceptId: string;
  conceptName: string;
  intuition: string; // 2-sentence punchy core intuition
  analogy: string; // High-contrast analogy
  memoryCue: {
    en: string;
    hi: string;
  };
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface LectureSession {
  id: string;
  courseId: string;
  title: string;
  date: string;
  slidesSummary: string;
  transcript: string;
  durationMinutes: number;
  slidesCount: number;
}

export interface CatchUpNoteSection {
  title: string;
  type: 'source' | 'ai_clarification';
  content: string;
  linkedConceptIds?: string[];
}

export interface CatchUpNotes {
  id: string;
  lectureId: string;
  userId: string;
  language: 'en' | 'hi';
  whatYouMissed: string;
  sections: CatchUpNoteSection[];
  recoveryQuickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  generatedAt: string;
}

export interface CohortAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averageMastery: number;
  bottleneckConcepts: {
    id: string;
    name: string;
    tier: number;
    averageScore: number;
    atRiskCount: number;
  }[];
  misconceptionHeatmap: {
    tag: string;
    occurrences: number;
    conceptName: string;
    sampleTrap: string;
  }[];
  syllabusDeliveryGap: {
    plannedConcepts: number;
    deliveredConcepts: number;
    missingConcepts: string[];
    transcriptCoveragePct: number;
  };
}
