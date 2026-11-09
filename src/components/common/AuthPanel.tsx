import React, { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../services/apiClient';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type AuthPortal = 'learner' | 'startup' | 'partner' | 'admin';

interface AuthPanelProps {
  portal?: AuthPortal;
  initialMode?: AuthMode;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ portal = 'learner', initialMode = 'login' }) => {
  const { login, register, forgotPassword, resetPassword, navigateTo, setIsStartupModalOpen } = useApp();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (window.location.pathname === '/reset-password' || token) {
      setResetToken(token ?? '');
      setMode('reset');
    } else if (window.location.pathname === '/forgot-password') {
      setMode('forgot');
    }
  }, []);

  const openForgotPassword = () => {
    if (portal !== 'admin') window.history.pushState({}, '', '/forgot-password');
    setMode('forgot');
    setError('');
    setMessage('');
  };

  const backToLogin = () => {
    window.history.replaceState({}, '', portal === 'admin' ? '/Admin' : '/');
    setMode('login');
    setError('');
    setMessage('');
    setPassword('');
    setResetToken('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(fullName, email, password);
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setMessage('If an account exists for this email, a password reset link has been sent.');
      } else if (mode === 'reset') {
        await resetPassword(resetToken, password);
        setMode('login');
        setPassword('');
        setMessage('Your password has been updated successfully. You can now sign in.');
      } else {
        await login(email, password);
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to reach the SiHub account service.');
    } finally {
      setSubmitting(false);
    }
  };

  const portalTitle = portal === 'startup' ? 'Startup Portal' : portal === 'partner' ? 'Partner Portal' : portal === 'admin' ? 'Admin Dashboard' : 'Learner Portal';
  const title = mode === 'login' ? `Sign in to ${portalTitle}` : mode === 'register' ? 'Student Registration' : mode === 'forgot' ? 'Forgot Password' : 'Set a new password';

  return (
    <main className="flex-1 min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-6 text-white">
          {mode !== 'forgot' && mode !== 'reset' && (
            <button onClick={() => navigateTo('home')} className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white mb-5">
              <ArrowLeft className="w-3.5 h-3.5" /> Public site
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300"><KeyRound className="w-5 h-5" /></span>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-xs text-slate-300 mt-1">Private access is verified by the SiHub service.</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && portal === 'learner' && (
            <label className="block text-xs font-semibold text-slate-700">
              Full name
              <input value={fullName} onChange={event => setFullName(event.target.value)} autoComplete="name" required minLength={2} maxLength={120} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </label>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <label className="block text-xs font-semibold text-slate-700">
              Email address
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </label>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <label className="block text-xs font-semibold text-slate-700">
              {mode === 'reset' ? 'New password' : 'Password'}
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : mode === 'reset' ? 'new-password' : 'new-password'} required minLength={12} maxLength={128} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              {mode === 'register' && <span className="mt-1 block font-normal text-slate-500">Use at least 12 characters. New accounts start with student access.</span>}
              {mode === 'reset' && <span className="mt-1 block font-normal text-slate-500">Choose a new password with at least 12 characters.</span>}
            </label>
          )}

          {mode === 'reset' && (
            <label className="block text-xs font-semibold text-slate-700">
              Reset token
              <input type="text" value={resetToken} onChange={event => setResetToken(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </label>
          )}

          {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
          <button disabled={submitting} className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60">
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Register as a student' : mode === 'forgot' ? 'Send reset link' : 'Update password'}
          </button>

          {mode === 'login' && portal === 'learner' && (
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
              New to SiHub learning?
              <button type="button" onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="font-bold text-cyan-700 hover:text-cyan-900">
                Create student account
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-center text-xs text-slate-500">
              <button type="button" onClick={openForgotPassword} className="font-bold text-cyan-700 hover:text-cyan-900">
                Forgot password?
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
              <button type="button" onClick={backToLogin} className="font-bold text-cyan-700 hover:text-cyan-900">
                Back to Login
              </button>
            </div>
          )}

          {mode === 'login' && portal === 'startup' && (
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="mb-2 text-xs text-slate-500">New venture seeking SiHub support?</p>
              <button type="button" onClick={() => setIsStartupModalOpen(true)} className="font-bold text-cyan-700 hover:text-cyan-900">Start a Startup Application</button>
            </div>
          )}

          {mode === 'login' && portal === 'partner' && (
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="mb-2 text-xs text-slate-500">Interested in collaborating with SiHub?</p>
              <button type="button" onClick={() => navigateTo('partnerships')} className="font-bold text-cyan-700 hover:text-cyan-900">Start a Partnership Application</button>
            </div>
          )}

          {mode !== 'forgot' && mode !== 'reset' && <p className="flex items-start gap-2 border-t border-slate-100 pt-4 text-[10px] leading-relaxed text-slate-500">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            Admin and instructor access is assigned by authorized SiHub administrators. Public student registration never grants elevated roles.
          </p>}
        </form>
      </section>
    </main>
  );
};
