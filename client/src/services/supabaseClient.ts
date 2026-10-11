import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from '../types';

export const PRELOADED_TEACHER: User = {
  id: 'user-tch-1',
  name: 'Prof. Meera Sen',
  email: 'teacher@lecturelens.edu',
  role: 'teacher',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
};

export const PRELOADED_STUDENT: User = {
  id: 'user-std-1',
  name: 'Aarav Sharma',
  email: 'student@lecturelens.edu',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  enrollmentNumber: 'CS2026-042',
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Persistent local session helper for immediate reliable usage
const AUTH_STORAGE_KEY = 'lecturelens_auth_session';

export interface AuthSession {
  user: User;
  token: string;
  source: 'supabase' | 'preloaded';
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

export async function loginWithPreloaded(role: UserRole): Promise<User> {
  const user = role === 'teacher' ? PRELOADED_TEACHER : PRELOADED_STUDENT;
  setStoredSession({
    user,
    token: `demo-token-${role}-${Date.now()}`,
    source: 'preloaded',
  });
  return user;
}

export async function loginWithSupabaseAuth(email: string, pass: string): Promise<{ user: User | null; error: string | null }> {
  // If credentials match the preloaded accounts, immediately return them
  const trimmed = email.toLowerCase().trim();
  if (trimmed === 'teacher@lecturelens.edu' || trimmed === 'm.sen@university.edu') {
    const user = await loginWithPreloaded('teacher');
    return { user, error: null };
  }
  if (trimmed === 'student@lecturelens.edu' || trimmed === 'aarav.sharma@campus.edu') {
    const user = await loginWithPreloaded('student');
    return { user, error: null };
  }

  if (isLiveSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        return { user: null, error: error.message };
      }
      if (data?.user) {
        const role: UserRole = (data.user.user_metadata?.role as UserRole) || 'student';
        const user: User = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Learner',
          email: data.user.email || email,
          role,
          avatar: role === 'teacher' ? PRELOADED_TEACHER.avatar : PRELOADED_STUDENT.avatar,
        };
        setStoredSession({
          user,
          token: data.session?.access_token || `token-${Date.now()}`,
          source: 'supabase',
        });
        return { user, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Supabase authentication failed' };
    }
  }

  // Simulated fallback for custom email/password
  const isTeacherEmail = trimmed.includes('teacher') || trimmed.includes('prof');
  const role: UserRole = isTeacherEmail ? 'teacher' : 'student';
  const customUser: User = {
    id: `user-${Date.now()}`,
    name: trimmed.split('@')[0].replace('.', ' ').toUpperCase(),
    email: trimmed,
    role,
    avatar: role === 'teacher' ? PRELOADED_TEACHER.avatar : PRELOADED_STUDENT.avatar,
  };
  setStoredSession({
    user: customUser,
    token: `token-${Date.now()}`,
    source: 'preloaded',
  });
  return { user: customUser, error: null };
}

export async function logoutUser() {
  if (isLiveSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error', e);
    }
  }
  setStoredSession(null);
}
