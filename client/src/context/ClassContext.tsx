/**
 * ClassContext.tsx
 *
 * Separate React context for Class Code state so we avoid touching AppContext.
 * Wraps the demo-mode classSessionStore and provides React state + BroadcastChannel
 * syncing for both Teacher and Student perspectives.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ClassSession,
  ClassMember,
  createClass as storeCreateClass,
  endClass as storeEndClass,
  regenerateCode as storeRegenerateCode,
  joinClass as storeJoinClass,
  leaveClass as storeLeaveClass,
  getActiveTeacherSession,
  getMembers,
  getStudentActiveClass,
  subscribeToClassEvents,
  ClassBroadcastEvent,
} from '../services/classSessionStore';

// ─── Context type ─────────────────────────────────────────────────────────────

interface ClassContextType {
  // Teacher state
  activeSession: ClassSession | null;
  roster: ClassMember[];
  createSession: (name: string, subject: string, lectureTitle?: string) => ClassSession;
  endSession: () => void;
  regenCode: () => void;

  // Student state
  joinedClass: { session: ClassSession; member: ClassMember } | null;
  joinByCode: (
    code: string,
    studentId: string,
    studentName: string
  ) => { ok: true; session: ClassSession } | { ok: false; reason: string };
  leaveCurrentClass: (studentId: string) => void;

  // Shared
  refreshRoster: () => void;
}

const ClassContext = createContext<ClassContextType | null>(null);

export function useClassContext(): ClassContextType {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error('useClassContext must be used inside ClassProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ClassProviderProps {
  children: React.ReactNode;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'teacher' | 'student';
}

export const ClassProvider: React.FC<ClassProviderProps> = ({
  children,
  currentUserId,
  currentUserName,
  currentUserRole,
}) => {
  const [activeSession, setActiveSession] = useState<ClassSession | null>(() =>
    currentUserRole === 'teacher' ? getActiveTeacherSession(currentUserId) : null
  );
  const [roster, setRoster] = useState<ClassMember[]>(() =>
    activeSession ? getMembers(activeSession.id) : []
  );
  const [joinedClass, setJoinedClass] = useState<{ session: ClassSession; member: ClassMember } | null>(
    () => (currentUserRole === 'student' ? getStudentActiveClass(currentUserId) : null)
  );

  const refreshRoster = useCallback(() => {
    if (activeSession) setRoster(getMembers(activeSession.id));
  }, [activeSession]);

  // Poll roster every 3 seconds (demo-mode substitute for real-time subscription)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activeSession) {
      pollRef.current = setInterval(refreshRoster, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeSession, refreshRoster]);

  // BroadcastChannel for cross-tab sync
  useEffect(() => {
    const unsub = subscribeToClassEvents((event: ClassBroadcastEvent) => {
      switch (event.type) {
        case 'class_created':
          if (currentUserRole === 'teacher' && event.session.teacherId === currentUserId) {
            setActiveSession(event.session);
            setRoster([]);
          }
          break;
        case 'class_ended':
          if (activeSession && event.sessionId === activeSession.id) {
            setActiveSession(null);
            setRoster([]);
          }
          if (joinedClass && event.sessionId === joinedClass.session.id) {
            setJoinedClass(null);
          }
          break;
        case 'code_regenerated':
          if (activeSession && event.sessionId === activeSession.id) {
            setActiveSession((prev) => (prev ? { ...prev, code: event.newCode } : prev));
          }
          break;
        case 'member_joined':
          if (activeSession && event.member.classId === activeSession.id) {
            setRoster((prev) => {
              if (prev.find((m) => m.studentId === event.member.studentId)) return prev;
              return [...prev, event.member];
            });
          }
          break;
        case 'member_left':
          if (activeSession && event.classId === activeSession.id) {
            setRoster((prev) => prev.filter((m) => m.studentId !== event.studentId));
          }
          break;
      }
    });
    return unsub;
  }, [activeSession, joinedClass, currentUserId, currentUserRole]);

  // Re-sync when role changes (persona switcher)
  useEffect(() => {
    if (currentUserRole === 'teacher') {
      const s = getActiveTeacherSession(currentUserId);
      setActiveSession(s);
      setRoster(s ? getMembers(s.id) : []);
      setJoinedClass(null);
    } else {
      setActiveSession(null);
      setRoster([]);
      setJoinedClass(getStudentActiveClass(currentUserId));
    }
  }, [currentUserId, currentUserRole]);

  // ─── Teacher actions ────────────────────────────────────────────────────────

  const createSession = useCallback(
    (name: string, subject: string, lectureTitle?: string): ClassSession => {
      const session = storeCreateClass(currentUserId, currentUserName, name, subject, lectureTitle);
      setActiveSession(session);
      setRoster([]);
      return session;
    },
    [currentUserId, currentUserName]
  );

  const endSession = useCallback(() => {
    if (!activeSession) return;
    storeEndClass(activeSession.id);
    setActiveSession(null);
    setRoster([]);
  }, [activeSession]);

  const regenCode = useCallback(() => {
    if (!activeSession) return;
    const updated = storeRegenerateCode(activeSession.id);
    if (updated) setActiveSession(updated);
  }, [activeSession]);

  // ─── Student actions ────────────────────────────────────────────────────────

  const joinByCode = useCallback(
    (
      code: string,
      studentId: string,
      studentName: string
    ): { ok: true; session: ClassSession } | { ok: false; reason: string } => {
      const result = storeJoinClass(code, studentId, studentName);
      if (result.ok) {
        setJoinedClass({ session: result.session, member: result.member });
      }
      return result.ok
        ? { ok: true, session: result.session }
        : { ok: false, reason: result.reason };
    },
    []
  );

  const leaveCurrentClass = useCallback(
    (studentId: string) => {
      if (!joinedClass) return;
      storeLeaveClass(joinedClass.session.id, studentId);
      setJoinedClass(null);
    },
    [joinedClass]
  );

  const value: ClassContextType = {
    activeSession,
    roster,
    createSession,
    endSession,
    regenCode,
    joinedClass,
    joinByCode,
    leaveCurrentClass,
    refreshRoster,
  };

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};
