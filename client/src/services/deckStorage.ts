/**
 * deckStorage.ts
 *
 * DEMO-MODE persistent storage for teacher uploaded slide decks.
 * Stores decks in localStorage keyed by teacherId and classCode.
 *
 * Keeps the pretrained "Sample deck (CS201 Graph Algorithms)" as the permanent default.
 */

import { DEMO_SLIDES } from '../data/seedData';
import { ProcessedDeck, SlideDeckMeta } from './slideParser';

const PRETRAINED_DECK_ID = 'pretrained-sample-deck';

export const PRETRAINED_DECK: ProcessedDeck = {
  meta: {
    id: PRETRAINED_DECK_ID,
    name: 'Sample Deck (CS201 Graph Traversals & DAGs)',
    slideCount: DEMO_SLIDES.length,
    uploadedAt: '2026-10-09T08:00:00.000Z',
    fileSize: 1024 * 420,
    format: 'pptx',
    isPretrained: true,
  },
  slides: DEMO_SLIDES,
  keywordsPerSlide: [
    { slideIndex: 0, keywords: ['matrix', 'adjacency', 'sparse', 'ram', 'grid', 'representation'] },
    { slideIndex: 1, keywords: ['bfs', 'breadth-first', 'queue', 'fifo', 'level-order', 'ripple', 'shortest'] },
    { slideIndex: 2, keywords: ['visited', 'enqueue', 'pop', 'explosion', 'invariant', 'duplicate', 'marked'] },
    { slideIndex: 3, keywords: ['dfs', 'depth-first', 'recursion', 'call stack', 'activation', 'lifo'] },
    { slideIndex: 4, keywords: ['cycle', 'cycles', 'dag', 'directed acyclic', 'kahn', 'topological', 'indegree'] },
  ],
};

function getStorageKey(teacherId: string, classCode?: string | null): string {
  return `lecturelens_decks_${teacherId}${classCode ? `_${classCode}` : ''}`;
}

export function loadUploadedDecks(teacherId: string, classCode?: string | null): ProcessedDeck[] {
  try {
    const raw = localStorage.getItem(getStorageKey(teacherId, classCode));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored decks from localStorage:', err);
  }
  return [];
}

export function saveUploadedDeck(
  teacherId: string,
  deck: ProcessedDeck,
  classCode?: string | null
): void {
  try {
    const existing = loadUploadedDecks(teacherId, classCode);
    const filtered = existing.filter((d) => d.meta.id !== deck.meta.id);
    const updated = [deck, ...filtered];
    localStorage.setItem(getStorageKey(teacherId, classCode), JSON.stringify(updated));
  } catch (err) {
    console.warn('Error persisting deck to localStorage:', err);
  }
}

export function deleteUploadedDeck(
  teacherId: string,
  deckId: string,
  classCode?: string | null
): void {
  try {
    const existing = loadUploadedDecks(teacherId, classCode);
    const updated = existing.filter((d) => d.meta.id !== deckId);
    localStorage.setItem(getStorageKey(teacherId, classCode), JSON.stringify(updated));
  } catch (err) {
    console.warn('Error deleting deck from localStorage:', err);
  }
}
