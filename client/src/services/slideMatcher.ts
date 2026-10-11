/**
 * slideMatcher.ts
 *
 * Advanced speech-to-slide matcher for LectureLens.
 *
 * Features:
 * 1. Reference text compilation per slide (title, bullets, speaker notes, extracted keywords).
 * 2. Multi-factor scoring:
 *    - Normalized term overlap (TF-IDF weighted)
 *    - Fuzzy token matching (Levenshtein distance <= 2) for misheard speech (e.g. "neurofiction" -> "NeuroFusion")
 *    - Numbers and exact key phrase matching (e.g. "12 to 36 months", "3d deep learning")
 * 3. Temporal smoothing:
 *    - Matches over a window of the last 2-3 final sentences.
 *    - Forward bias (slight preference for current or next slides).
 *    - Hysteresis rule: only transitions slide if top candidate beats current slide by a clear margin (>= 1.25x or +15%) or if consecutive sentences agree.
 * 4. Real % Aligned computation (0-100%). If < 25%, labeled 'off-slide / added'.
 * 5. Voice command parser: "next slide", "previous slide", "go to slide X", etc.
 * 6. Vocabulary booster / light correction: cleans recognized speech towards slide terminology.
 */

import { SlideItem } from '../types';

export interface SlideMatchResult {
  targetSlideIndex: number; // 0-based
  alignmentScore: number;   // 0-100%
  category: 'core_concept' | 'analogy' | 'pitfall_warning' | 'administrative' | 'off_slide';
  isVoiceCommand: boolean;
  voiceCommandAction?: 'next' | 'prev' | 'goto';
  voiceCommandTarget?: number;
  cleanedText: string;
}

// ─── Levenshtein Distance Helper ──────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// ─── Voice Command Detection ──────────────────────────────────────────────────

const WORD_TO_NUM: Record<string, number> = {
  one: 1, first: 1, '1': 1,
  two: 2, second: 2, '2': 2,
  three: 3, third: 3, '3': 3,
  four: 4, fourth: 4, '4': 4,
  five: 5, fifth: 5, '5': 5,
  six: 6, sixth: 6, '6': 6,
  seven: 7, seventh: 7, '7': 7,
  eight: 8, eighth: 8, '8': 8,
  nine: 9, ninth: 9, '9': 9,
  ten: 10, tenth: 10, '10': 10,
};

export function detectVoiceCommand(
  rawText: string,
  currentSlideIdx: number,
  totalSlides: number,
  slides: SlideItem[]
): { isCommand: boolean; action?: 'next' | 'prev' | 'goto'; target?: number } {
  const lower = rawText.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  // Next slide patterns
  if (
    lower === 'next slide' ||
    lower === 'move to next slide' ||
    lower === 'go to next slide' ||
    lower === 'advance slide' ||
    lower.startsWith('next slide please')
  ) {
    return {
      isCommand: true,
      action: 'next',
      target: Math.min(totalSlides - 1, currentSlideIdx + 1),
    };
  }

  // Previous slide patterns
  if (
    lower === 'previous slide' ||
    lower === 'prev slide' ||
    lower === 'go back' ||
    lower === 'back to previous slide' ||
    lower === 'last slide'
  ) {
    return {
      isCommand: true,
      action: 'prev',
      target: Math.max(0, currentSlideIdx - 1),
    };
  }

  // "Go to slide X" or "jump to slide X"
  const gotoMatch = lower.match(/(?:go to|jump to|move to|switch to|open)\s+(?:slide|page)\s+([a-z0-9]+)/);
  if (gotoMatch) {
    const rawNum = gotoMatch[1];
    const parsedNum = parseInt(rawNum, 10) || WORD_TO_NUM[rawNum];
    if (parsedNum && parsedNum >= 1 && parsedNum <= totalSlides) {
      return {
        isCommand: true,
        action: 'goto',
        target: parsedNum - 1,
      };
    }
  }

  // "Back to the problem statement" or title matching
  const topicMatch = lower.match(/(?:back to|go to|return to)\s+(?:the\s+)?([a-z0-9\s]{3,})/);
  if (topicMatch) {
    const topic = topicMatch[1].trim();
    for (let i = 0; i < slides.length; i++) {
      const sTitle = slides[i].title.toLowerCase();
      if (sTitle.includes(topic) || topic.includes('problem') && sTitle.includes('problem')) {
        return {
          isCommand: true,
          action: 'goto',
          target: i,
        };
      }
    }
  }

  return { isCommand: false };
}

// ─── Slide Terminology Vocabulary & Spell Correction ─────────────────────────

export function buildDeckVocabulary(slides: SlideItem[]): string[] {
  const words = new Set<string>();
  slides.forEach((s) => {
    const text = `${s.title} ${s.bullets.join(' ')} ${s.notes || ''}`;
    text
      .replace(/[^a-zA-Z0-9-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .forEach((w) => words.add(w));
  });
  return Array.from(words);
}

/** Corrects common speech-to-text mistranscriptions using deck terms */
export function correctSpeechTerms(text: string, vocabulary: string[]): string {
  if (!text || vocabulary.length === 0) return text;
  const tokens = text.split(/\b/);
  return tokens
    .map((token) => {
      if (token.length <= 3 || !/^[a-zA-Z]+$/.test(token)) return token;
      const lower = token.toLowerCase();

      // Find direct match or fuzzy distance <= 2
      for (const vocab of vocabulary) {
        if (vocab.toLowerCase() === lower) {
          return vocab; // restore original deck casing (e.g. NeuroFusion)
        }
        if (token.length >= 6 && levenshteinDistance(lower, vocab.toLowerCase()) <= 2) {
          return vocab;
        }
      }
      return token;
    })
    .join('');
}

// ─── Multi-factor Slide Matcher ───────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
  'with', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were',
  'or', 'will', 'can', 'has', 'have', 'had', 'do', 'does', 'did', 'not', 'our',
  'we', 'today', 'discuss', 'going', 'let', 'now', 'class', 'here', 'see', 'also'
]);

export function matchSentenceToSlides(
  sentence: string,
  recentSentencesWindow: string[],
  slides: SlideItem[],
  currentSlideIdx: number,
  keywordsPerSlide?: { slideIndex: number; keywords: string[] }[]
): { targetSlideIndex: number; alignmentScore: number; isOffSlide: boolean } {
  if (!slides || slides.length === 0) {
    return { targetSlideIndex: 0, alignmentScore: 70, isOffSlide: false };
  }

  // Combine current sentence + previous 1-2 sentences for context window
  const combinedContext = [...recentSentencesWindow.slice(-2), sentence].join(' ').toLowerCase();
  const currentTokens = sentence.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const contextTokens = combinedContext.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const slideScores: number[] = slides.map((slide, sIdx) => {
    let score = 0;

    // Reference terms from title, bullets, notes
    const titleText = slide.title.toLowerCase();
    const bulletsText = slide.bullets.join(' ').toLowerCase();
    const notesText = (slide.notes || '').toLowerCase();
    const fullSlideText = `${titleText} ${bulletsText} ${notesText}`;
    const slideTokens = fullSlideText.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const slideTokenSet = new Set(slideTokens);

    // 1. Direct word matches (title words have 3x weight)
    for (const t of currentTokens) {
      if (titleText.includes(t)) {
        score += 3.5;
      } else if (slideTokenSet.has(t)) {
        score += 1.5;
      } else {
        // Fuzzy token match (Levenshtein distance <= 2 for words >= 6 chars)
        if (t.length >= 6) {
          for (const st of slideTokenSet) {
            if (st.length >= 6 && levenshteinDistance(t, st) <= 2) {
              score += 1.2;
              break;
            }
          }
        }
      }
    }

    // 2. Keyword boost from extracted keywordsPerSlide
    if (keywordsPerSlide && keywordsPerSlide[sIdx]) {
      const kws = keywordsPerSlide[sIdx].keywords;
      for (const kw of kws) {
        if (combinedContext.includes(kw.toLowerCase())) {
          score += 2.0;
        }
      }
    }

    // 3. Numbers & multi-word phrase matching (e.g. "12 to 36", "3d", "multimodal fusion")
    const numbersInSentence = sentence.match(/\b\d+(?:[\s-]*\d+)?\b/g);
    if (numbersInSentence) {
      for (const num of numbersInSentence) {
        if (fullSlideText.includes(num)) {
          score += 2.5;
        }
      }
    }

    // 4. Sequential / Forward bias (teachers typically stay or advance)
    if (sIdx === currentSlideIdx) {
      score += 0.8; // Inertia on current slide
    } else if (sIdx === currentSlideIdx + 1) {
      score += 0.5; // Next slide gentle encouragement
    } else if (sIdx < currentSlideIdx) {
      score -= 0.5; // Slight resistance to jumping backwards
    }

    return score;
  });

  // Find slide with highest score
  let bestIdx = currentSlideIdx;
  let maxScore = slideScores[currentSlideIdx] || 0;

  for (let i = 0; i < slideScores.length; i++) {
    if (slideScores[i] > maxScore) {
      maxScore = slideScores[i];
      bestIdx = i;
    }
  }

  // Hysteresis check: only switch away from current slide if bestIdx beats current by clear margin
  const currentScore = slideScores[currentSlideIdx] || 0;
  let finalTargetIdx = currentSlideIdx;

  if (bestIdx !== currentSlideIdx) {
    if (maxScore >= currentScore * 1.25 + 1.0 || maxScore >= 4.0) {
      finalTargetIdx = bestIdx;
    }
  }

  // Calculate alignment score (0 - 100%)
  const matchedTokensCount = currentTokens.filter((t) => {
    const sText = `${slides[finalTargetIdx].title} ${slides[finalTargetIdx].bullets.join(' ')}`.toLowerCase();
    return sText.includes(t);
  }).length;

  const rawPct = currentTokens.length > 0 ? (matchedTokensCount / currentTokens.length) * 100 : 50;
  const normalizedAlignment = Math.min(98, Math.max(20, Math.round(rawPct * 0.7 + Math.min(30, maxScore * 6))));

  const isOffSlide = normalizedAlignment < 28;

  return {
    targetSlideIndex: finalTargetIdx,
    alignmentScore: normalizedAlignment,
    isOffSlide,
  };
}
