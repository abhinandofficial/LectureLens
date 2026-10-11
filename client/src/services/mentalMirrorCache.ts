/**
 * mentalMirrorCache.ts
 *
 * In-memory client cache for Mental Mirror explanations and Remediation Bites.
 *
 * Cache keys:
 * 1. Question + Option + Language: `${questionId}_${optionId}_${lang}`
 * 2. Misconception + Language: `misconception_${misconceptionId}_${lang}`
 *
 * Provides:
 * - High-speed in-memory retrieval measured via performance.now().
 * - Real measured latency reporting ("Served from cache in 0.04 ms" or "Loaded in 1.2 ms").
 */

import { DistractorMentalMirror } from '../types/recallQTypes';

export interface CachedMentalMirrorItem {
  deconstructiveFeedback: string;
  paradoxScenario: string;
  rebuildGuidance: string;
  misconceptionLabel: string;
  language: 'en' | 'ml' | 'manglish';
  lookupLatencyMs: number;
  isCached: boolean;
}

// In-memory Map cache
const _cache = new Map<string, CachedMentalMirrorItem>();

export function getCachedMentalMirror(
  questionId: string,
  optionId: string,
  misconception: DistractorMentalMirror | undefined,
  language: 'en' | 'ml' | 'manglish'
): CachedMentalMirrorItem {
  const startTime = performance.now();
  const directKey = `${questionId}_${optionId}_${language}`;
  const misconceptionKey = misconception?.misconceptionId ? `misc_${misconception.misconceptionId}_${language}` : null;

  // 1. Direct hit
  if (_cache.has(directKey)) {
    const item = _cache.get(directKey)!;
    const latency = Number((performance.now() - startTime).toFixed(2));
    return { ...item, lookupLatencyMs: latency, isCached: true };
  }

  // 2. Misconception reuse hit
  if (misconceptionKey && _cache.has(misconceptionKey)) {
    const item = _cache.get(misconceptionKey)!;
    const latency = Number((performance.now() - startTime).toFixed(2));
    return { ...item, lookupLatencyMs: latency, isCached: true };
  }

  // 3. Resolve from pre-generated distractor object
  let feedback = '';
  let paradox = '';
  let rebuild = '';

  if (misconception) {
    if (language === 'ml') {
      feedback = misconception.deconstructiveFeedbackMl || misconception.deconstructiveFeedbackEn;
      paradox = misconception.paradoxScenarioMl || misconception.paradoxScenarioEn;
      rebuild = misconception.rebuildGuidanceMl || misconception.rebuildGuidanceEn;
    } else if (language === 'manglish') {
      feedback = misconception.deconstructiveFeedbackManglish || misconception.deconstructiveFeedbackEn;
      paradox = misconception.paradoxScenarioManglish || misconception.paradoxScenarioEn;
      rebuild = misconception.rebuildGuidanceManglish || misconception.rebuildGuidanceEn;
    } else {
      feedback = misconception.deconstructiveFeedbackEn;
      paradox = misconception.paradoxScenarioEn;
      rebuild = misconception.rebuildGuidanceEn;
    }
  } else {
    feedback = 'You may have chosen this option because of an incomplete evaluation of the problem constraints.';
    paradox = 'Under non-trivial inputs, this assumption leads to an unexpected computational bottleneck or incorrect output.';
    rebuild = 'Verify the boundary invariants before selecting an answer.';
  }

  const result: CachedMentalMirrorItem = {
    deconstructiveFeedback: feedback,
    paradoxScenario: paradox,
    rebuildGuidance: rebuild,
    misconceptionLabel: misconception?.misconceptionLabel || 'Conceptual Ambiguity',
    language,
    lookupLatencyMs: Number((performance.now() - startTime).toFixed(2)),
    isCached: false,
  };

  // Populate cache
  _cache.set(directKey, result);
  if (misconceptionKey) {
    _cache.set(misconceptionKey, result);
  }

  return result;
}

export function clearMentalMirrorCache(): void {
  _cache.clear();
}
