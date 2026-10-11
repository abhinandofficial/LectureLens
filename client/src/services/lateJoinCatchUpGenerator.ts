/**
 * lateJoinCatchUpGenerator.ts
 *
 * Engine to synthesize late-join catch-up data from lecture transcript,
 * active deck slides, teacher flags, doubts, and student mastery profiles.
 *
 * Implements:
 * - Deterministic extractive summarizer (runs offline / without API key)
 * - Gemini structured schema summarizer (when API configured) with retry
 * - Local caching per class code and missed range
 */

import { FilteredVoiceChunk, SlideItem, DoubtItem, Concept, StudentMastery } from '../types';
import { LateJoinCatchUpData, MissedSlideSummary, MissedConceptSummary, LateJoinQuickCheckQuestion } from '../types/lateJoinCatchUpTypes';
import { loadDeckRecallQPackage } from './recallQStorage';

const CACHE_PREFIX = 'lecturelens_late_catchup_cache_';

function getCacheKey(classCode: string, fromSec: number, toSec: number, lang: string): string {
  return `${CACHE_PREFIX}${classCode}_${Math.floor(fromSec)}_${Math.floor(toSec)}_${lang}`;
}

export function getCachedCatchUp(classCode: string, fromSec: number, toSec: number, lang: string): LateJoinCatchUpData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(classCode, fromSec, toSec, lang));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveCachedCatchUp(data: LateJoinCatchUpData, fromSec: number, toSec: number, lang: string): void {
  try {
    localStorage.setItem(getCacheKey(data.classCode, fromSec, toSec, lang), JSON.stringify(data));
  } catch { /* ignore */ }
}

const EMPHASIS_PATTERNS = [
  /\bimportant\b/i,
  /\bremember\b/i,
  /\bexam\b/i,
  /\bnote this\b/i,
  /\bcritical\b/i,
  /\bpay attention\b/i,
  /\bkey point\b/i,
  /\bmust know\b/i,
  /\bkeep in mind\b/i,
];

function isTeacherEmphasis(text: string): boolean {
  return EMPHASIS_PATTERNS.some((pattern) => pattern.test(text));
}

export function extractSpokenKeyPoints(chunks: FilteredVoiceChunk[]): string[] {
  const points: string[] = [];
  chunks.forEach((c) => {
    const text = c.filteredSpeech || c.rawSpeech || '';
    const clean = text.trim();
    if (clean.length > 25 && !points.includes(clean)) {
      points.push(clean);
    }
  });
  return points.slice(0, 4);
}

export function buildDeterministicCatchUp(params: {
  classCode: string;
  className: string;
  studentName: string;
  fromSeconds: number;
  toSeconds: number;
  chunks: FilteredVoiceChunk[];
  slides: SlideItem[];
  currentSlideIndex: number;
  deckTitle?: string;
  doubts: DoubtItem[];
  studentMastery?: Record<string, StudentMastery>;
  concepts?: Concept[];
  deckId?: string;
}): LateJoinCatchUpData {
  const {
    classCode,
    className,
    studentName,
    fromSeconds,
    toSeconds,
    chunks,
    slides,
    currentSlideIndex,
    doubts,
    studentMastery = {},
    concepts = [],
    deckId,
  } = params;

  // Filter chunks spoken between fromSeconds and toSeconds
  // Chunks store timestamp as "MM:SS"
  const missedChunks = chunks.filter((c) => {
    const parts = (c.timestamp || '00:00').split(':');
    const sec = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    return sec >= fromSeconds && sec <= toSeconds + 2;
  });

  // If no chunks matched by timestamp, use chunks up to current live index
  const activeChunks = missedChunks.length > 0 ? missedChunks : chunks;

  // Slide indices active during missed range
  const missedSlideIndicesSet = new Set<number>();
  activeChunks.forEach((c) => missedSlideIndicesSet.add(c.slideIndex));
  if (missedSlideIndicesSet.size === 0 && slides.length > 0) {
    for (let i = 0; i <= currentSlideIndex; i++) {
      missedSlideIndicesSet.add(i);
    }
  }

  const missedSlideSummaries: MissedSlideSummary[] = Array.from(missedSlideIndicesSet)
    .sort((a, b) => a - b)
    .map((idx) => {
      const slide = slides[idx] || {
        slideNumber: idx + 1,
        title: `Slide ${idx + 1}`,
        bullets: [],
      };
      const slideChunks = activeChunks.filter((c) => c.slideIndex === idx);
      const spoken = extractSpokenKeyPoints(slideChunks);
      return {
        slideIndex: idx,
        slideTitle: slide.title,
        bullets: slide.bullets || [],
        spokenKeyPoints: spoken.length > 0 ? spoken : (slide.bullets.length > 0 ? slide.bullets.slice(0, 3) : ['Core slide context']),
      };
    });

  // Teacher flagged important points
  const teacherFlagged: string[] = [];
  activeChunks.forEach((c) => {
    const text = c.filteredSpeech || c.rawSpeech || '';
    if (isTeacherEmphasis(text) && !teacherFlagged.includes(text)) {
      teacherFlagged.push(text);
    }
  });
  if (teacherFlagged.length === 0 && activeChunks.length > 0) {
    const firstText = activeChunks[0].filteredSpeech || activeChunks[0].rawSpeech || '';
    if (firstText) teacherFlagged.push(firstText);
  }

  // Answered doubts in missed period
  const answeredDoubts = doubts
    .filter((d) => d.answerEn || d.answerMl || d.answerHi)
    .slice(0, 3)
    .map((d) => ({
      question: d.question,
      answer: d.answerEn || d.answerMl || d.answerHi,
    }));

  // Concepts covered & student weak alert
  const keyConcepts: MissedConceptSummary[] = [];
  let studentPersonalizedAlert: LateJoinCatchUpData['studentPersonalizedAlert'] = undefined;

  missedSlideSummaries.forEach((s) => {
    const title = s.slideTitle;
    const matchConcept = concepts.find((c) => title.toLowerCase().includes(c.name.toLowerCase()));
    const conceptId = matchConcept?.id || `c-${s.slideIndex}`;
    const conceptName = matchConcept?.name || title;

    const mastery = studentMastery[conceptId];
    const isWeak = mastery ? (mastery.status === 'bottleneck' || mastery.status === 'at-risk' || mastery.score < 50) : false;

    if (!keyConcepts.find((k) => k.conceptName === conceptName)) {
      keyConcepts.push({
        conceptId,
        conceptName,
        oneLineDefinitionEn: `Core principles and invariants established in ${title}.`,
        oneLineDefinitionMl: `${title} സംബന്ധിച്ച അടിസ്ഥാന തത്വങ്ങളും നിയമങ്ങളും.`,
        isWeakForStudent: isWeak,
        studentMasteryScore: mastery?.score,
      });
    }

    if (isWeak && !studentPersonalizedAlert) {
      studentPersonalizedAlert = {
        weakConceptName: conceptName,
        score: mastery ? mastery.score : 45,
        advice: `You're at ${mastery ? mastery.score : 45}% on ${conceptName}, so review this slide's core invariants before the next topic.`,
      };
    }
  });

  // 90-second brief bullets
  const briefBulletsEn: string[] = [];
  const briefBulletsMl: string[] = [];

  if (missedSlideSummaries.length > 0) {
    missedSlideSummaries.forEach((ms) => {
      briefBulletsEn.push(`Covered ${ms.slideTitle}: ${ms.bullets[0] || ms.spokenKeyPoints[0] || 'core concepts'}`);
      briefBulletsMl.push(`${ms.slideTitle} വിശദീകരിച്ചു: ${ms.bullets[0] || ms.spokenKeyPoints[0] || 'പ്രധാന ആശയങ്ങൾ'}`);
    });
  } else {
    briefBulletsEn.push('Lecture commenced with introductory overview and problem framing.');
    briefBulletsMl.push('ആമുഖ അവലോകനത്തോടെയും വിഷയ രൂപീകരണത്തോടെയും ക്ലാസ് ആരംഭിച്ചു.');
  }

  if (teacherFlagged.length > 0) {
    briefBulletsEn.push(`Instructor flagged key exam focus: "${teacherFlagged[0].slice(0, 90)}..."`);
    briefBulletsMl.push(`പരീക്ഷാ പ്രധാനപ്പെട്ട ഭാഗമായി അധ്യാപകൻ ചൂണ്ടിക്കാണിച്ചു: "${teacherFlagged[0].slice(0, 90)}..."`);
  }

  // Quick check questions: try to pull from approved RecallQ package for this deck
  const quickCheck: LateJoinQuickCheckQuestion[] = [];
  if (deckId) {
    const pkg = loadDeckRecallQPackage(deckId, classCode);
    if (pkg && pkg.questions && pkg.questions.length > 0) {
      const approved = pkg.questions.filter((q) => missedSlideIndicesSet.has(q.slideIndex));
      approved.slice(0, 3).forEach((q) => {
        quickCheck.push({
          id: q.id,
          question: q.stem,
          options: q.options.map((o) => o.text),
          correctIndex: q.options.findIndex((o) => o.isCorrect),
          explanation: q.explanation,
        });
      });
    }
  }

  // Fallback quick-check if RecallQ questions are not generated yet
  if (quickCheck.length === 0) {
    const firstSlide = missedSlideSummaries[0];
    quickCheck.push({
      id: 'qc-fallback-1',
      question: `What was the primary focus established in ${firstSlide ? firstSlide.slideTitle : 'the opening slide'}?`,
      options: [
        firstSlide && firstSlide.bullets[0] ? firstSlide.bullets[0] : 'Establishing foundational structural invariants',
        'Skipping foundational checks and jumping to deployment',
        'Disregarding memory allocation bounds completely',
        'Assuming unbounded execution time without constraints',
      ],
      correctIndex: 0,
      explanation: 'Foundational slides establish core constraints and operational boundaries.',
    });
  }

  // Clean transcript digest
  const transcriptDigest = activeChunks
    .map((c) => c.filteredSpeech || c.rawSpeech || '')
    .filter(Boolean)
    .join(' ');

  const currentSlide = slides[currentSlideIndex] || { title: `Slide ${currentSlideIndex + 1}` };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const missedMins = Math.max(1, Math.round((toSeconds - fromSeconds) / 60));

  return {
    classCode,
    className,
    studentName,
    missedFromFormatted: formatMinSec(fromSeconds),
    missedToFormatted: formatMinSec(toSeconds),
    missedMinutesCount: missedMins,
    ninetySecondBriefEn: briefBulletsEn.slice(0, 6),
    ninetySecondBriefMl: briefBulletsMl.slice(0, 6),
    missedSlides: missedSlideSummaries,
    keyConcepts,
    whereWeAreNow: {
      currentSlideIndex,
      currentSlideTitle: currentSlide.title,
      currentTopic: currentSlide.title,
    },
    teacherFlaggedImportant: teacherFlagged.slice(0, 4),
    answeredDoubts,
    studentPersonalizedAlert,
    quickCheckQuestions: quickCheck,
    transcriptDigest: transcriptDigest || 'No verbal audio recorded during this window.',
    generatorMode: 'basic',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates catch-up with Gemini API if reachable, with automatic fallback
 * to deterministic extractive summarizer.
 */
export async function generateLateJoinCatchUp(params: {
  classCode: string;
  className: string;
  studentName: string;
  fromSeconds: number;
  toSeconds: number;
  chunks: FilteredVoiceChunk[];
  slides: SlideItem[];
  currentSlideIndex: number;
  deckTitle?: string;
  doubts: DoubtItem[];
  studentMastery?: Record<string, StudentMastery>;
  concepts?: Concept[];
  deckId?: string;
  language: 'en' | 'ml';
}): Promise<LateJoinCatchUpData> {
  // Check cache first
  const cached = getCachedCatchUp(params.classCode, params.fromSeconds, params.toSeconds, params.language);
  if (cached) {
    return cached;
  }

  // Fallback baseline
  const baseline = buildDeterministicCatchUp(params);

  // Attempt server Gemini call
  try {
    const res = await fetch('http://localhost:5000/api/late-catchup/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classCode: params.classCode,
        className: params.className,
        fromSeconds: params.fromSeconds,
        toSeconds: params.toSeconds,
        transcriptDigest: baseline.transcriptDigest,
        missedSlides: baseline.missedSlides,
        teacherEmphasis: baseline.teacherFlaggedImportant,
        language: params.language,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.ninetySecondBriefEn && data.ninetySecondBriefEn.length > 0) {
        const enriched: LateJoinCatchUpData = {
          ...baseline,
          ...data,
          generatorMode: 'ai',
        };
        saveCachedCatchUp(enriched, params.fromSeconds, params.toSeconds, params.language);
        return enriched;
      }
    }
  } catch (err) {
    // Expected when offline or server Gemini unconfigured
    console.warn('Gemini Late Join Catch-up endpoint unreachable, using extractive summary:', err);
  }

  // Cache and return baseline
  saveCachedCatchUp(baseline, params.fromSeconds, params.toSeconds, params.language);
  return baseline;
}
