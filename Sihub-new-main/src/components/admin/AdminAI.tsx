/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - 6.14 AI Management & Knowledge Base Console
 */

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '../../services/apiClient';

type Faq = { id: string; question: string; answer: string };

export const AdminAI: React.FC = () => {
  const [modelSelected, setModelSelected] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.4);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are the SiHub public information assistant. Use only verified SiHub content and FAQs provided with the request. Do not invent dates, grants, eligibility rules, statistics, or services. When information is unavailable, say so and direct the visitor to the relevant SiHub page.'
  );

  const [knowledgeBase, setKnowledgeBase] = useState<Faq[]>([]);

  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [editingFaqId, setEditingFaqId] = useState('');
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ config: { model: string; temperature: number; systemPrompt: string; knowledgeBase: Faq[] }; providerConfigured: boolean }>('/api/ai/config');
      setModelSelected(result.config.model);
      setTemperature(result.config.temperature);
      setSystemPrompt(result.config.systemPrompt);
      setKnowledgeBase(result.config.knowledgeBase);
      setProviderConfigured(result.providerConfigured);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load assistant settings.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const saveConfig = async (faqEntries = knowledgeBase) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await apiPatch<{ config: { model: string; temperature: number; systemPrompt: string; knowledgeBase: Faq[] }; providerConfigured: boolean }>('/api/ai/config', {
        model: modelSelected,
        temperature,
        systemPrompt,
        knowledgeBase: faqEntries
      });
      setKnowledgeBase(result.config.knowledgeBase);
      setProviderConfigured(result.providerConfigured);
      setNotice('Assistant settings and verified FAQs saved to PostgreSQL.');
      return true;
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save assistant settings.');
      return false;
    } finally { setSaving(false); }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    void saveConfig();
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ || !newA) return;
    const updated = editingFaqId
      ? knowledgeBase.map(faq => faq.id === editingFaqId ? { ...faq, question: newQ.trim(), answer: newA.trim() } : faq)
      : [...knowledgeBase, { id: globalThis.crypto.randomUUID(), question: newQ.trim(), answer: newA.trim() }];
    void saveConfig(updated).then(saved => { if (saved) { setNewQ(''); setNewA(''); setEditingFaqId(''); } });
  };

  const handleRemoveFaq = (faqId: string) => void saveConfig(knowledgeBase.filter(faq => faq.id !== faqId)).then(saved => { if (saved && editingFaqId === faqId) { setEditingFaqId(''); setNewQ(''); setNewA(''); } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
            Module 6.14 • AI Management Console
          </span>
          <h1 className="text-2xl font-extrabold text-white font-heading mt-1">
            SiHub AI Assistant Architecture & Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure assistant response policy and maintain the verified FAQ content used by public visitors.
          </p>
        </div>

        <div className="flex items-center gap-2"><span className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono ${providerConfigured ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>{providerConfigured ? 'Gemini configured' : 'FAQ fallback active'}</span><button onClick={() => void load()} disabled={loading} aria-label="Refresh assistant settings" className="border border-slate-700 p-2 text-slate-300 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
      </div>

      {error && <p role="alert" className="border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-200">{error}</p>}
      {notice && <p role="status" className="border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-200">{notice}</p>}
      {loading && <p className="text-xs text-slate-400">Loading stored assistant configuration…</p>}
      {!providerConfigured && <p className="border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">GEMINI_API_KEY is not configured on the server. The public assistant will answer from verified FAQs until a provider is configured.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: System Instructions Configuration */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> System Instructions & Governance Policy
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Engine Model</label>
              <select
                value={modelSelected}
                onChange={e => setModelSelected(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Low Latency)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning & Policy Analysis)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="font-semibold">Temperature (Precision vs Creativity)</span>
                <span className="font-mono text-cyan-400">{temperature}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">System Directive Prompt</label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white resize-none font-mono text-[11px] leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-[11px] text-cyan-300">
              Settings are persisted server-side. The API key remains server-only and is never returned to this console.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save AI Configuration'}
            </button>
          </form>
        </div>

        {/* Right: Knowledge Base Curation */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" /> Knowledge Base & Verified FAQs
          </h3>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {knowledgeBase.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2"><strong className="text-white block font-medium">Q: {item.question}</strong><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setEditingFaqId(item.id); setNewQ(item.question); setNewA(item.answer); }} disabled={saving} aria-label={`Edit FAQ: ${item.question}`} className="text-slate-500 hover:text-cyan-300 disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => handleRemoveFaq(item.id)} disabled={saving} aria-label={`Delete FAQ: ${item.question}`} className="text-slate-500 hover:text-rose-300 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
                <p className="text-slate-400 text-[11px]">{item.answer}</p>
              </div>
            ))}
            {!knowledgeBase.length && <p className="text-xs text-slate-500">No verified FAQs have been added.</p>}
          </div>

          <form onSubmit={handleAddFaq} className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{editingFaqId ? 'Edit verified FAQ:' : 'Add a verified FAQ:'}</span>
            <input
              type="text"
              required
              placeholder="Question..."
              value={newQ}
              onChange={e => setNewQ(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
            <textarea
              rows={2}
              required
              placeholder="Official organizational answer..."
              value={newA}
              onChange={e => setNewA(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white resize-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              {editingFaqId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {saving ? 'Saving…' : editingFaqId ? 'Update FAQ' : 'Save FAQ'}
            </button>
            {editingFaqId && <button type="button" onClick={() => { setEditingFaqId(''); setNewQ(''); setNewA(''); }} className="w-full text-[10px] text-slate-400 hover:text-white">Cancel edit</button>}
          </form>
        </div>
      </div>
    </div>
  );
};
