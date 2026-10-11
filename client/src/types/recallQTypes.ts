/**
 * recallQTypes.ts
 *
 * Types for the RecallQ Auto-Generated Question Engine,
 * Mental Mirror Misconception Engine, and 60-Second Remediation Bites.
 */

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface DistractorMentalMirror {
  misconceptionId: string;
  misconceptionLabel: string;
  deconstructiveFeedbackEn: string;
  deconstructiveFeedbackMl: string;
  deconstructiveFeedbackManglish?: string;
  paradoxScenarioEn: string;
  paradoxScenarioMl: string;
  paradoxScenarioManglish?: string;
  rebuildGuidanceEn: string;
  rebuildGuidanceMl: string;
  rebuildGuidanceManglish?: string;
}

export interface RecallQOption {
  id: string; // 'opt-a', 'opt-b', 'opt-c', 'opt-d'
  text: string;
  isCorrect: boolean;
  misconception?: DistractorMentalMirror;
}

export interface RecallQQuestion {
  id: string;
  deckId: string;
  slideIndex: number;
  slideTitle: string;
  conceptId: string;
  conceptName: string;
  difficulty: QuestionDifficulty;
  isScenario: boolean; // Scenario or application form
  stem: string;
  options: RecallQOption[];
  correctOptionId: string;
  explanation: string;
  status: 'pending_review' | 'approved';
  createdAt: string;
}

export interface ConceptualQuickCheck {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface RemediationBite {
  id: string;
  conceptId: string;
  conceptName: string;
  coreIntuitionEn: string; // 2 concise sentences
  coreIntuitionMl: string;
  coreIntuitionManglish?: string;
  analogyEn: string; // High-contrast analogy
  analogyMl: string;
  analogyManglish?: string;
  dualLanguageAnchorEn: string; // Memory cue / heuristic formula
  dualLanguageAnchorMl: string;
  dualLanguageAnchorManglish?: string;
  quickCheckPool: ConceptualQuickCheck[]; // At least 3 questions in pool
  status: 'pending_review' | 'approved';
}

export interface DeckRecallQPackage {
  deckId: string;
  deckName: string;
  generatedAt: string;
  isPublished: boolean;
  questions: RecallQQuestion[];
  remediationBites: RemediationBite[];
}

export interface StudentRecallQAttempt {
  id: string;
  studentId: string;
  classCode?: string;
  questionId: string;
  chosenOptionId: string;
  isCorrect: boolean;
  misconceptionId?: string;
  timestamp: string;
  latencyMs?: number;
}

export interface StudentConceptMastery {
  conceptId: string;
  conceptName: string;
  correctCount: number;
  wrongCount: number;
  masteryPercent: number; // 0 - 100
  consecutiveWrong: number;
  isBottleneck: boolean;
  isRecovered: boolean;
  lastAttemptedAt: string;
}
