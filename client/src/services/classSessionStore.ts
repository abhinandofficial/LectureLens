/**
 * classSessionStore.ts
 *
 * DEMO-MODE implementation of Class Code feature.
 *
 * In a production app this would be backed by a database (e.g. Supabase tables) and
 * real-time subscriptions (WebSocket / SSE / Supabase Realtime).
 *
 * Here we persist to localStorage and broadcast changes across same-origin tabs via
 * the BroadcastChannel API so that teacher in Tab A and student in Tab B can simulate
 * the full create → join → roster-update flow without any backend changes.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassSession {
  id: string;
  code: string;
  name: string;
  subject: string;
  lectureTitle?: string;
  teacherId: string;
  teacherName: string;
  status: 'active' | 'ended';
  createdAt: string; // ISO string
  endedAt?: string;  // ISO string
}

export interface ClassMember {
  classId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;   // ISO string
  leftAt?: string;    // ISO string
  isLate?: boolean;
  missedFrom?: string; // ISO string
  missedTo?: string;   // ISO string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES_KEY = 'lecturelens_classes';
const MEMBERS_KEY = 'lecturelens_class_members';
const RATE_LIMIT_KEY = 'lecturelens_join_rate_limit';
const CHANNEL_NAME = 'lecturelens_class';

/**
 * Charset for join codes. Excludes look-alike characters: 0, O, 1, I, L.
 */
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// ─── BroadcastChannel ─────────────────────────────────────────────────────────

let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_channel) _channel = new BroadcastChannel(CHANNEL_NAME);
  return _channel;
}

export type ClassBroadcastEvent =
  | { type: 'class_created'; session: ClassSession }
  | { type: 'class_ended'; sessionId: string }
  | { type: 'code_regenerated'; sessionId: string; oldCode: string; newCode: string }
  | { type: 'member_joined'; member: ClassMember }
  | { type: 'member_left'; classId: string; studentId: string };

function broadcast(event: ClassBroadcastEvent) {
  getChannel()?.postMessage(event);
}

export function subscribeToClassEvents(handler: (event: ClassBroadcastEvent) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (e: MessageEvent) => handler(e.data as ClassBroadcastEvent);
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadClasses(): ClassSession[] {
  try {
    return JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]') as ClassSession[];
  } catch {
    return [];
  }
}

function saveClasses(sessions: ClassSession[]) {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(sessions));
}

function loadMembers(): ClassMember[] {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') as ClassMember[];
  } catch {
    return [];
  }
}

function saveMembers(members: ClassMember[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

// ─── Code generation ──────────────────────────────────────────────────────────

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

/**
 * Generates a code that is guaranteed to be unique across all existing active codes.
 * Retries on collision (extremely rare for a 6-char code, but guaranteed).
 */
export function generateUniqueCode(): string {
  const existing = new Set(
    loadClasses()
      .filter((s) => s.status === 'active')
      .map((s) => s.code)
  );
  let code = generateCode();
  let attempts = 0;
  while (existing.has(code) && attempts < 20) {
    code = generateCode();
    attempts++;
  }
  return code;
}

// ─── Class CRUD ───────────────────────────────────────────────────────────────

/**
 * Creates a new class session for the given teacher.
 * If the teacher already has an active session, it is ended first (caller should
 * prompt for confirmation before calling this).
 */
export function createClass(
  teacherId: string,
  teacherName: string,
  name: string,
  subject: string,
  lectureTitle?: string
): ClassSession {
  const sessions = loadClasses();

  // End any existing active session for this teacher (demo mode: soft-end it)
  const updated = sessions.map((s) =>
    s.teacherId === teacherId && s.status === 'active'
      ? { ...s, status: 'ended' as const, endedAt: new Date().toISOString() }
      : s
  );

  const newSession: ClassSession = {
    id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    code: generateUniqueCode(),
    name,
    subject,
    lectureTitle,
    teacherId,
    teacherName,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  saveClasses([...updated, newSession]);
  broadcast({ type: 'class_created', session: newSession });
  return newSession;
}

/** Ends an active class session. */
export function endClass(sessionId: string): ClassSession | null {
  const sessions = loadClasses();
  let ended: ClassSession | null = null;
  const updated = sessions.map((s) => {
    if (s.id === sessionId && s.status === 'active') {
      ended = { ...s, status: 'ended', endedAt: new Date().toISOString() };
      return ended;
    }
    return s;
  });
  if (!ended) return null;
  saveClasses(updated);
  broadcast({ type: 'class_ended', sessionId });
  return ended;
}

/**
 * Regenerates the join code for an active session.
 * The old code immediately stops working.
 */
export function regenerateCode(sessionId: string): ClassSession | null {
  const sessions = loadClasses();
  let result: ClassSession | null = null;
  const oldCode = sessions.find((s) => s.id === sessionId)?.code ?? '';
  const newCode = generateUniqueCode();
  const updated = sessions.map((s) => {
    if (s.id === sessionId && s.status === 'active') {
      result = { ...s, code: newCode };
      return result;
    }
    return s;
  });
  if (!result) return null;
  saveClasses(updated);
  broadcast({ type: 'code_regenerated', sessionId, oldCode, newCode });
  return result;
}

/** Returns all sessions for a given teacher. */
export function getTeacherSessions(teacherId: string): ClassSession[] {
  return loadClasses().filter((s) => s.teacherId === teacherId);
}

/** Returns the currently active session for a teacher, or null. */
export function getActiveTeacherSession(teacherId: string): ClassSession | null {
  return loadClasses().find((s) => s.teacherId === teacherId && s.status === 'active') ?? null;
}

/** Looks up a session by its join code. Returns null if not found. */
export function getClassByCode(code: string): ClassSession | null {
  return loadClasses().find((s) => s.code === code.toUpperCase().trim()) ?? null;
}

// ─── Member management ────────────────────────────────────────────────────────

/** Returns all active (not yet left) members of a class. */
export function getMembers(classId: string): ClassMember[] {
  return loadMembers().filter((m) => m.classId === classId && !m.leftAt);
}

/**
 * Joins a class by code.
 * Returns:
 *   { ok: true, member, session } on success
 *   { ok: false, reason } on failure
 *
 * Reasons: 'not_found', 'ended', 'rate_limited', 'already_joined'
 */
export function joinClass(
  code: string,
  studentId: string,
  studentName: string
): { ok: true; member: ClassMember; session: ClassSession } | { ok: false; reason: string } {
  // Rate limiting: 5 wrong attempts → 30s cooldown
  const rlRaw = localStorage.getItem(RATE_LIMIT_KEY);
  const rl = rlRaw ? (JSON.parse(rlRaw) as { count: number; resetAt: number }) : null;
  if (rl && rl.count >= 5 && Date.now() < rl.resetAt) {
    const secsLeft = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return { ok: false, reason: `Too many failed attempts. Try again in ${secsLeft}s.` };
  }

  const session = getClassByCode(code);

  if (!session) {
    // Count as a failed attempt
    const current = rl && Date.now() < (rl.resetAt ?? 0) ? rl : { count: 0, resetAt: 0 };
    const newCount = current.count + 1;
    localStorage.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({ count: newCount, resetAt: newCount >= 5 ? Date.now() + 30_000 : current.resetAt })
    );
    return { ok: false, reason: 'No class found with that code. Check with your teacher.' };
  }

  if (session.status === 'ended') {
    return { ok: false, reason: 'This class session has ended.' };
  }

  // Reset rate limit on a valid code
  localStorage.removeItem(RATE_LIMIT_KEY);

  const members = loadMembers();

  // Duplicate check or rejoin check
  // Check if member already has an active record or a past record in this class
  const existingActiveIdx = members.findIndex(
    (m: ClassMember) => m.classId === session.id && m.studentId === studentId && !m.leftAt
  );

  // Check if student left earlier and is rejoining
  const pastRecord = members
    .filter((m: ClassMember) => m.classId === session.id && m.studentId === studentId && m.leftAt)
    .sort((a: ClassMember, b: ClassMember) => new Date(b.leftAt!).getTime() - new Date(a.leftAt!).getTime())[0];

  const nowIso = new Date().toISOString();
  let member: ClassMember;

  if (existingActiveIdx !== -1) {
    // Already joined actively
    member = members[existingActiveIdx];
    return { ok: true, member, session };
  }

  // Check live lecture state for this class
  const liveStateRaw = localStorage.getItem(`lecturelens_live_state_${session.code}`);
  let isLate = false;
  let missedFrom: string | undefined = undefined;
  let missedTo: string | undefined = undefined;

  if (pastRecord && pastRecord.leftAt) {
    // Student left and rejoined: catch-up is strictly for the period they were away!
    isLate = true;
    missedFrom = pastRecord.leftAt;
    missedTo = nowIso;
  } else if (liveStateRaw) {
    try {
      const liveState = JSON.parse(liveStateRaw);
      const isLiveOrPaused = liveState.recordingStatus === 'recording' || liveState.recordingStatus === 'paused';
      const hasProducedContent = (liveState.chunks && liveState.chunks.length > 0) || liveState.elapsedSeconds > 0;

      if ((isLiveOrPaused || hasProducedContent) && !liveState.classEnded) {
        isLate = true;
        // Missed from recording start (or class creation if not recorded yet) to join time
        missedFrom = liveState.recordingStartedAt || session.createdAt;
        missedTo = nowIso;
      }
    } catch { /* ignore */ }
  }

  member = {
    classId: session.id,
    studentId,
    studentName,
    joinedAt: nowIso,
    isLate,
    missedFrom,
    missedTo,
  };

  saveMembers([...members, member]);
  broadcast({ type: 'member_joined', member });
  return { ok: true, member, session };
}

/** Student leaves a class. */
export function leaveClass(classId: string, studentId: string): void {
  const members = loadMembers();
  const updated = members.map((m) =>
    m.classId === classId && m.studentId === studentId && !m.leftAt
      ? { ...m, leftAt: new Date().toISOString() }
      : m
  );
  saveMembers(updated);
  broadcast({ type: 'member_left', classId, studentId });
}

/** Gets the active joined class for a student. */
export function getStudentActiveClass(studentId: string): { session: ClassSession; member: ClassMember } | null {
  const members = loadMembers().filter((m) => m.studentId === studentId && !m.leftAt);
  for (const member of members) {
    const session = loadClasses().find((s) => s.id === member.classId);
    if (session && session.status === 'active') {
      return { session, member };
    }
  }
  return null;
}
