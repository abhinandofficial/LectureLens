/**
 * classLiveChannel.ts
 *
 * DEMO-MODE real-time "class live channel" for LectureLens.
 *
 * In production this would use Supabase Realtime / WebSocket / SSE.
 * Here we use:
 *   - BroadcastChannel (key: `lecturelens_live_<classCode>`) for same-browser cross-tab
 *     delivery in < 50 ms.
 *   - localStorage (key: `lecturelens_live_state_<classCode>`) to persist the full
 *     current lecture state so late-joiners immediately receive all prior lines.
 *
 * Publisher  = Teacher's LiveLectureStudioPage
 * Subscribers = Any student tab that has joined the class with the matching code.
 *
 * Message types
 * ─────────────
 *  recording-state  – status change + elapsed timer (broadcast on every status transition)
 *  transcript-interim – fleeting partial phrase (not persisted)
 *  transcript-final   – committed phrase (persisted in LiveState.chunks)
 *  slide-change       – active slide index changed
 *  notes-updated      – master notes generated/updated
 *  class-ended        – teacher ended the class session
 */

import { FilteredVoiceChunk, MasterLectureNotes } from '../types';
import { RecordingStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveState {
  recordingStatus: RecordingStatus;
  elapsedSeconds: number;
  currentSlideIndex: number;
  slides?: import('../types').SlideItem[];
  deckTitle?: string;
  chunks: FilteredVoiceChunk[];
  masterNotes: MasterLectureNotes | null;
  classEnded: boolean;
  recordingStartedAt?: string; // ISO string when recording started
  lastUpdated: number; // epoch ms
}

export type LiveChannelEvent =
  | { type: 'recording-state'; status: RecordingStatus; elapsedSeconds: number }
  | { type: 'transcript-interim'; text: string }
  | { type: 'transcript-final'; chunk: FilteredVoiceChunk }
  | { type: 'slide-change'; slideIndex: number }
  | { type: 'deck-updated'; slides: import('../types').SlideItem[]; deckTitle: string }
  | { type: 'notes-updated'; notes: MasterLectureNotes }
  | { type: 'class-ended' };

// ─── Storage keys ─────────────────────────────────────────────────────────────

function channelName(classCode: string): string {
  return `lecturelens_live_${classCode}`;
}

function stateKey(classCode: string): string {
  return `lecturelens_live_state_${classCode}`;
}

const EMPTY_STATE: LiveState = {
  recordingStatus: 'idle',
  elapsedSeconds: 0,
  currentSlideIndex: 0,
  chunks: [],
  masterNotes: null,
  classEnded: false,
  recordingStartedAt: undefined,
  lastUpdated: 0,
};

// ─── BroadcastChannel registry ─────────────────────────────────────────────────

const _channels: Map<string, BroadcastChannel> = new Map();

function getBC(classCode: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  const key = channelName(classCode);
  if (!_channels.has(key)) {
    _channels.set(key, new BroadcastChannel(key));
  }
  return _channels.get(key)!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the persisted live state for a class, or a fresh empty state. */
export function getLiveState(classCode: string): LiveState {
  try {
    const raw = localStorage.getItem(stateKey(classCode));
    if (raw) return JSON.parse(raw) as LiveState;
  } catch { /* ignore */ }
  return { ...EMPTY_STATE };
}

function saveLiveState(classCode: string, state: LiveState): void {
  try {
    localStorage.setItem(stateKey(classCode), JSON.stringify(state));
  } catch { /* quota */ }
}

/** Clear the persisted state when the teacher starts a fresh recording. */
export function clearLiveState(classCode: string): void {
  localStorage.removeItem(stateKey(classCode));
}

/**
 * Publish a live event from the teacher's side.
 * Mutates and persists the LiveState for late joiners, then broadcasts.
 */
export function publishLiveEvent(classCode: string, event: LiveChannelEvent): void {
  const state = getLiveState(classCode);

  // Mutate persisted state
  switch (event.type) {
    case 'recording-state':
      state.recordingStatus = event.status;
      state.elapsedSeconds = event.elapsedSeconds;
      if (event.status === 'recording' && !state.recordingStartedAt) {
        state.recordingStartedAt = new Date().toISOString();
      }
      if (event.status === 'idle') {
        // Fresh start — clear transcript
        state.chunks = [];
        state.masterNotes = null;
        state.classEnded = false;
        state.recordingStartedAt = undefined;
      }
      break;

    case 'transcript-final':
      // Avoid duplicates (idempotent by chunk id)
      if (!state.chunks.find((c) => c.id === event.chunk.id)) {
        state.chunks = [...state.chunks, event.chunk];
      }
      break;

    case 'slide-change':
      state.currentSlideIndex = event.slideIndex;
      break;

    case 'deck-updated':
      state.slides = event.slides;
      state.deckTitle = event.deckTitle;
      state.currentSlideIndex = 0;
      break;

    case 'notes-updated':
      state.masterNotes = event.notes;
      break;

    case 'class-ended':
      state.classEnded = true;
      state.recordingStatus = 'stopped';
      break;

    case 'transcript-interim':
      // Not persisted — ephemeral
      break;
  }

  state.lastUpdated = Date.now();

  // Persist (skip for interim — ephemeral)
  if (event.type !== 'transcript-interim') {
    saveLiveState(classCode, state);
  }

  // Broadcast to other tabs
  getBC(classCode)?.postMessage(event);
}

/**
 * Subscribe to live events for a class.
 * Calls `onEvent` for each incoming message.
 * Returns an unsubscribe function — call it on unmount.
 */
export function subscribeLiveChannel(
  classCode: string,
  onEvent: (event: LiveChannelEvent) => void
): () => void {
  const bc = getBC(classCode);
  if (!bc) return () => {};

  const handler = (e: MessageEvent) => onEvent(e.data as LiveChannelEvent);
  bc.addEventListener('message', handler);
  return () => bc.removeEventListener('message', handler);
}
