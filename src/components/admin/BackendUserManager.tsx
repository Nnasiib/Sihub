import React, { useEffect, useState } from 'react';
import { Check, RefreshCw, Shield, UserRound } from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

type ServerUser = { id: string; email: string; fullName: string; role: string; isActive: boolean; createdAt: string };
const managedRoles = ['STUDENT', 'LEARNER', 'INSTRUCTOR', 'EDUCATION_MANAGER', 'STARTUP_FOUNDER', 'MENTOR', 'COMMUNITY_MEMBER', 'PARTNER', 'PROGRAM_MANAGER', 'STAFF', 'VISITOR', 'ADMIN', 'SUPER_ADMIN', 'OWNER'];

export const BackendUserManager: React.FC = () => {
  const { authUser } = useApp();
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ users: ServerUser[] }>('/api/admin/users');
      setUsers(result.users);
      setRoles(Object.fromEntries(result.users.map(user => [user.id, user.role])));
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load registered accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const update = async (user: ServerUser, changes: { role?: string; isActive?: boolean }) => {
    try {
      await apiPatch(`/api/admin/users/${encodeURIComponent(user.id)}`, changes);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to update account.');
    }
  };

  const canEditRole = (user: ServerUser) => {
    if (!authUser || user.id === authUser.id) return false;
    if (user.role === 'OWNER' && authUser.role !== 'OWNER') return false;
    if (authUser.role === 'ADMIN' && ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'EDUCATION_MANAGER'].includes(user.role)) return false;
    return true;
  };

  const roleOptions = (user: ServerUser) => {
    if (!canEditRole(user)) return [user.role];
    if (authUser?.role === 'OWNER') return managedRoles;
    if (authUser?.role === 'SUPER_ADMIN') return managedRoles.filter(role => role !== 'OWNER');
    return ['STUDENT', 'LEARNER', 'INSTRUCTOR', 'STARTUP_FOUNDER', 'MENTOR', 'COMMUNITY_MEMBER', 'PARTNER', 'VISITOR'];
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Persistent accounts • PostgreSQL</span><h2 className="mt-1 text-xl font-extrabold text-white">Registered users and roles</h2><p className="mt-1 text-xs text-slate-400">Role changes are permission-checked and audited by the server.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>
      {error && <p role="alert" className="rounded border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      {loading && <p className="py-5 text-center text-xs text-slate-400">Loading users</p>}
      <div className="overflow-x-auto border border-slate-800">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-slate-950 text-[10px] uppercase text-slate-500"><tr><th className="px-3 py-3">Account</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(user => <tr key={user.id} className="bg-slate-900/70">
              <td className="px-3 py-3"><span className="flex items-center gap-2 font-semibold text-slate-200"><UserRound className="h-4 w-4 text-cyan-400" />{user.fullName}</span><span className="ml-6 text-[10px] text-slate-500">{user.email}</span></td>
              <td className="px-3 py-3"><select value={roles[user.id] || user.role} disabled={!canEditRole(user)} onChange={event => setRoles(current => ({ ...current, [user.id]: event.target.value }))} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[10px] text-slate-200 disabled:opacity-50">{roleOptions(user).map(role => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></td>
              <td className="px-3 py-3"><span className={user.isActive ? 'text-emerald-300' : 'text-rose-300'}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
              <td className="px-3 py-3 text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="px-3 py-3"><div className="flex items-center gap-1.5">
                {roles[user.id] !== user.role && <button onClick={() => void update(user, { role: roles[user.id] })} className="inline-flex items-center gap-1 rounded bg-cyan-800 px-2 py-1.5 text-[10px] font-bold text-white"><Check className="h-3 w-3" />Save role</button>}
                <button onClick={() => void update(user, { isActive: !user.isActive })} disabled={user.role === 'OWNER' && authUser?.role !== 'OWNER'} className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-[10px] font-bold disabled:opacity-50 ${user.isActive ? 'bg-rose-950 text-rose-200' : 'bg-emerald-950 text-emerald-200'}`}><Shield className="h-3 w-3" />{user.isActive ? 'Suspend' : 'Reactivate'}</button>
              </div></td>
            </tr>)}
          </tbody>
        </table>
        {!loading && users.length === 0 && <p className="p-6 text-center text-xs text-slate-500">No registered users.</p>}
      </div>
      <p className="text-[10px] text-slate-500">Account roles and status are sourced from the server. Changes take effect through authenticated requests.</p>
    </section>
  );
};
