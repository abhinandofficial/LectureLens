import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginPreloaded, loginCredentials, isSupabaseConnected } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('teacher@lecturelens.edu');
  const [password, setPassword] = useState<string>('Teacher@2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePreloadedLogin = async (role: 'teacher' | 'student') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginPreloaded(role);
      navigate('/app/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginCredentials(email, password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-dark-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#10B981" stroke="#10B981" />
            </svg>
          </div>
          <span className="font-black text-2xl tracking-tight text-zinc-950">
            LectureLens
          </span>
        </Link>

        <h2 className="text-3xl font-black text-zinc-950 tracking-tight">
          Sign In to Your Classroom
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Access your DAG knowledge graph, lecture recording suite, and AI notes
        </p>

        {/* Supabase backend status pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 shadow-xs">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isSupabaseConnected ? 'Supabase Live Auth: Connected' : 'Supabase Auth Engine: Active & Preloaded'}
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-zinc-200 rounded-3xl shadow-float space-y-6">
          {/* PRELOADED 1-CLICK ACCOUNTS (Required by prompt) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span>Instant 1-Click Access</span>
              <span className="text-emerald-700 font-extrabold">Pre-loaded</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Teacher Button */}
              <button
                type="button"
                onClick={() => handlePreloadedLogin('teacher')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 transition-all text-center group"
              >
                <Shield className="w-6 h-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-zinc-900 block">Prof. Meera Sen</span>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                  Teacher (Start Live)
                </span>
              </button>

              {/* Student Button */}
              <button
                type="button"
                onClick={() => handlePreloadedLogin('student')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400 transition-all text-center group"
              >
                <UserCheck className="w-6 h-6 text-zinc-700 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-zinc-900 block">Aarav Sharma</span>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                  Student (Catch-Up)
                </span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-zinc-400 font-bold">Or sign in with email</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-3 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-dark-900 focus:border-dark-900"
                  placeholder="teacher@lecturelens.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-3 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-dark-900 focus:border-dark-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-dark-900 hover:bg-black text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-subtle transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In with Supabase'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-2 text-center text-xs text-zinc-500">
            <Link to="/" className="font-bold text-zinc-800 hover:underline">
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
