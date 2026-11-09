import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../services/apiClient';

export const ChangePasswordModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { changePassword } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const close = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed. Your other sessions have been signed out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to change your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-5 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-cyan-400" /><h2 id="change-password-title" className="text-base font-bold">Change password</h2></div>
          <button type="button" onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close password change"><X className="h-4 w-4" /></button>
        </header>
        <label className="block text-xs font-semibold text-slate-300">Current password<input type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" /></label>
        <label className="block text-xs font-semibold text-slate-300">New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" /></label>
        <label className="block text-xs font-semibold text-slate-300">Confirm new password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" /></label>
        {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-2.5 text-xs text-rose-200">{error}</p>}
        {success && <p role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/60 p-2.5 text-xs text-emerald-200">{success}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={close} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">Close</button><button disabled={submitting} className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{submitting ? 'Updating...' : 'Update password'}</button></div>
      </form>
    </div>
  );
};
