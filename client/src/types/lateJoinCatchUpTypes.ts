/**
 * lateJoinCatchUpTypes.ts
 *
 * Types for the Late Join Catch-Up feature in LectureLens.
 */

import { SlideItem } from './index';

export interface MissedSlideSummary {
  slideIndex: number;
  slideTitle: string;
  bullets: string[];
  spokenKeyPoints: string[];
}

export interface MissedConceptSummary {
  conceptId: string;
  conceptName: string;
  oneLineDefinitionEn: string;
  oneLineDefinitionMl: string;
  prerequisiteWarning?: string;
  isWeakForStudent?: boolean;
  studentMasteryScore?: number;
}

export interface LateJoinQuickCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LateJoinCatchUpData {
  classCode: string;
  className: string;
  studentName: string;
  missedFromFormatted: string; // e.g. "00:00"
  missedToFormatted: string;   // e.g. "12:04"
  missedMinutesCount: number;  // e.g. 12
  ninetySecondBriefEn: string[];
  ninetySecondBriefMl: string[];
  missedSlides: MissedSlideSummary[];
  keyConcepts: MissedConceptSummary[];
  whereWeAreNow: {
    currentSlideIndex: number;
    currentSlideTitle: string;
    currentTopic: string;
  };
  teacherFlaggedImportant: string[]; // Quotes flagged as important/exam/remember
  answeredDoubts: {
    question: string;
    answer?: string;
  }[];
  studentPersonalizedAlert?: {
    weakConceptName: string;
    score: number;
    advice: string;
  };
  quickCheckQuestions: LateJoinQuickCheckQuestion[];
  transcriptDigest: string; // cleaned text of missed portion
  generatorMode: 'ai' | 'basic';
  generatedAt: string;
}
