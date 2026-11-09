/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - System Settings
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  ShieldCheck,
  Lock,
  Sliders
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { setAdminTab } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'architecture'>('architecture');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
            System settings
          </span>
          <h1 className="text-2xl font-extrabold text-white font-heading mt-1">
            Platform configuration and access
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage public profile content and review the platform's current access and storage model.
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'architecture'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> Platform security
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'general'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Organization Profile & Branding
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'roles'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Role-Based Access Control (RBAC) Matrix
        </button>
      </div>

      {/* Tab: Current application architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 text-xs text-slate-300">
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-800 text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <ShieldCheck className="w-5 h-5 text-cyan-400" /> Current SiHub application architecture
            </div>
            <p className="leading-relaxed">
              This deployment uses a React client, Express API, Prisma/PostgreSQL persistence, database-backed sessions, server-enforced roles, and optional private S3-compatible media storage. Secrets and infrastructure settings are supplied through the server environment and are not exposed here.
            </p>
          </div>

          {/* Persistent data model */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Persistent platform records
            </h3>
            <p className="text-slate-400">
              The Prisma schema is the source of truth for the database models and relationships used by the application.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              {['Accounts and sessions', 'CMS entries and revisions', 'Private media assets', 'Courses, lessons and progress', 'Assignments, exams and certificates', 'Public submissions and audit records'].map(model => <div key={model} className="border border-slate-800 bg-slate-900 p-3 text-slate-300">{model}</div>)}
            </div>
          </div>

          {/* Security Specifications */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> Implemented security controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white block font-semibold">Authentication and roles</strong>
                <p className="text-slate-400">
                  Passwords use Argon2id. Random opaque session tokens are stored hashed in PostgreSQL and sent in HttpOnly, SameSite=Strict cookies. Mutating API requests require a signed CSRF token.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white block font-semibold">API safeguards</strong>
                <p className="text-slate-400">
                  Prisma parameterizes database operations. Helmet sets response security headers, and Express rate limits authentication, reset, submission, and visitor tracking routes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white block font-semibold">Audit trail</strong>
                <p className="text-slate-400">
                  Administrative and education decisions create persisted audit records. Access is enforced by server-side session and role middleware.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: General Settings & Branding */}
      {activeTab === 'general' && (
        <div className="space-y-4 border border-slate-800 bg-slate-950 p-6 text-xs">
          <h3 className="text-sm font-bold text-white">Public organization profile</h3>
          <p className="text-slate-400">The former profile form only changed browser state and did not save. Public contact details, navigation, footer copy, and page content are managed through the persistent CMS.</p>
          <button onClick={() => setAdminTab('content')} className="rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white hover:bg-cyan-600">Open public content CMS</button>
        </div>
      )}

      {/* Tab: Role Matrix */}
      {activeTab === 'roles' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Ecosystem Role Matrix & Permissions</h3>
          <p className="text-slate-400">This summary is informational; protected routes and server API middleware enforce access for each account role.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Public Site</th>
                  <th className="py-2.5 px-3">Learner LMS</th>
                  <th className="py-2.5 px-3">Founder Hub</th>
                  <th className="py-2.5 px-3">Admin Console</th>
                  <th className="py-2.5 px-3">Approve Enrollments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Visitor</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-slate-500">Apply Only</td>
                  <td className="py-2.5 px-3 text-slate-500">Apply Only</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Student / Learner</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full (Approved)</td>
                  <td className="py-2.5 px-3 text-slate-500">View Only</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Instructor</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-emerald-400">Manage Course</td>
                  <td className="py-2.5 px-3 text-slate-500">View Only</td>
                  <td className="py-2.5 px-3 text-slate-500">LMS Sub-desk</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Startup Founder</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-slate-300">Enrolled</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full Venture Desk</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                  <td className="py-2.5 px-3 text-rose-500">No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Administrator</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full Console</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">YES (Auth)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-purple-400">Super Administrator</td>
                  <td className="py-2.5 px-3 text-emerald-400">Yes</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full</td>
                  <td className="py-2.5 px-3 text-emerald-400">Full Governance</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">YES (Auth)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
