/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Design & Styling Management Area
 * Live brand token editor: colors, typography, border radius, and spacing.
 */

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, ApiError } from '../../../services/apiClient';
import { useApp } from '../../../context/AppContext';
import {
  Palette,
  Type,
  Square,
  Sparkles,
  CheckCircle2,
  Save,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DesignSettings {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFontWeight?: string;
  borderRadius?: string;
  spacingScale?: string;
  siteTheme?: string;
}

const DEFAULT_DESIGN: DesignSettings = {
  primaryColor: '#0891b2', // Cyan-600
  accentColor: '#10b981',  // Emerald-500
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  headingFontWeight: '800',
  borderRadius: '1.5rem',  // rounded-3xl
  spacingScale: 'standard',
  siteTheme: 'modern-ecosystem'
};

const COLOR_PRESETS = [
  { name: 'SiHub Cyan', hex: '#0891b2', accent: '#10b981' },
  { name: 'Royal Indigo', hex: '#4f46e5', accent: '#06b6d4' },
  { name: 'Emerald Oasis', hex: '#059669', accent: '#d97706' },
  { name: 'Deep Sapphire', hex: '#0284c7', accent: '#f59e0b' },
  { name: 'Midnight Charcoal', hex: '#0f172a', accent: '#38bdf8' }
];

const FONT_PRESETS = [
  { name: 'Plus Jakarta Sans (Default)', value: 'Plus Jakarta Sans, sans-serif' },
  { name: 'Inter Display', value: 'Inter, system-ui, sans-serif' },
  { name: 'Outfit Modern', value: 'Outfit, sans-serif' },
  { name: 'Space Grotesk', value: 'Space Grotesk, sans-serif' }
];

const RADIUS_PRESETS = [
  { label: 'Subtle (8px)', value: '0.5rem', classKey: 'rounded-lg' },
  { label: 'Modern (16px)', value: '1rem', classKey: 'rounded-2xl' },
  { label: 'Curved (24px)', value: '1.5rem', classKey: 'rounded-3xl' },
  { label: 'Pill Shape', value: '9999px', classKey: 'rounded-full' }
];

export const DesignStylingArea: React.FC = () => {
  const { addToast } = useApp();
  const [design, setDesign] = useState<DesignSettings>(DEFAULT_DESIGN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await apiGet<{ settings?: { design?: DesignSettings } }>('/api/cms/settings');
        if (isMounted && res.settings?.design) {
          setDesign(prev => ({ ...prev, ...res.settings?.design }));
        }
      } catch (err) {
        console.warn('Could not load design settings, using defaults', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut('/api/cms/settings', {
        design
      });
      addToast('success', 'Design System Saved', 'Brand design tokens have been synchronized.');
      // Dispatch real-time site theme update event
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
    } catch (err) {
      addToast('error', 'Failed to Save Design', err instanceof ApiError ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDesign(DEFAULT_DESIGN);
    addToast('info', 'Reset to Defaults', 'Design tokens restored to institutional standard.');
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
            <Palette className="w-4 h-4" /> Global Design System & Tokens
          </div>
          <h2 className="text-2xl font-extrabold font-heading">Design & Brand Styling</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Configure primary brand colors, typography, card corner radius, and spacing scales. Changes are immediately reflected across all public pages and visual components.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Design System'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Palette */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Palette className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">Brand Color Palette</h3>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Institutional Palettes</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map(preset => {
                  const isSelected = design.primaryColor === preset.hex;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setDesign({ ...design, primaryColor: preset.hex, accentColor: preset.accent })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.hex }} />
                        <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.primaryColor}
                    onChange={e => setDesign({ ...design, primaryColor: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.primaryColor}
                    onChange={e => setDesign({ ...design, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accent Highlight Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.accentColor}
                    onChange={e => setDesign({ ...design, accentColor: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.accentColor}
                    onChange={e => setDesign({ ...design, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Type className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">Typography System</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Primary Font Family</label>
              <div className="space-y-2">
                {FONT_PRESETS.map(font => (
                  <label
                    key={font.name}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      design.fontFamily === font.value
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="fontFamily"
                        checked={design.fontFamily === font.value}
                        onChange={() => setDesign({ ...design, fontFamily: font.value })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-800" style={{ fontFamily: font.value }}>
                        {font.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Aa Bb Gg 123</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Heading Weight</label>
              <select
                value={design.headingFontWeight}
                onChange={e => setDesign({ ...design, headingFontWeight: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              >
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800) - Recommended</option>
                <option value="900">Black Heavy (900)</option>
              </select>
            </div>
          </div>

          {/* Border Radius & Geometry */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Square className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">Border Radius & Surface Geometry</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RADIUS_PRESETS.map(rad => {
                const isSelected = design.borderRadius === rad.value;
                return (
                  <button
                    key={rad.label}
                    type="button"
                    onClick={() => setDesign({ ...design, borderRadius: rad.value })}
                    className={`p-3 border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    style={{ borderRadius: rad.value }}
                  >
                    <div
                      className="w-8 h-8 bg-slate-200 border border-slate-300"
                      style={{ borderRadius: rad.value }}
                    />
                    <span className="text-[11px] font-bold text-slate-800">{rad.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Eye className="w-4 h-4 text-cyan-600" /> Live Interactive Preview
            </div>
            <span className="text-[10px] font-mono text-slate-400">Updates in real time</span>
          </div>

          {/* Simulated Component Mockups */}
          <div
            className="bg-white border border-slate-200 p-6 shadow-lg space-y-6"
            style={{
              fontFamily: design.fontFamily,
              borderRadius: design.borderRadius
            }}
          >
            {/* Mock Hero Header */}
            <div
              className="p-6 text-white text-center space-y-2 relative overflow-hidden"
              style={{
                backgroundColor: design.primaryColor,
                borderRadius: design.borderRadius
              }}
            >
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full"
                style={{ backgroundColor: design.accentColor, color: '#fff' }}
              >
                Ecosystem Portal
              </span>
              <h4
                className="text-lg leading-tight"
                style={{ fontWeight: Number(design.headingFontWeight) || 800 }}
              >
                Somali Innovation Hub
              </h4>
              <p className="text-xs text-white/80 max-w-xs mx-auto">
                Next-generation incubation, digital talent, and climate technology.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5"
                  style={{
                    backgroundColor: design.accentColor,
                    color: '#ffffff',
                    borderRadius: design.borderRadius
                  }}
                >
                  Join Academy <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mock Card */}
            <div
              className="p-5 border border-slate-200 bg-slate-50 space-y-3"
              style={{ borderRadius: design.borderRadius }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Makerspace Facility</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: design.primaryColor }}
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hardware rapid prototyping with 3D printers, laser cutters, and IoT test benches.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">KM4 Campus</span>
                <span
                  className="font-bold underline cursor-pointer"
                  style={{ color: design.primaryColor }}
                >
                  Learn More &rarr;
                </span>
              </div>
            </div>

            {/* Token Inspect Output */}
            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] space-y-1">
              <div className="text-cyan-400 font-bold">// Active Tokens</div>
              <div>--color-primary: <span className="text-white">{design.primaryColor}</span></div>
              <div>--color-accent: <span className="text-white">{design.accentColor}</span></div>
              <div>--font-sans: <span className="text-white">{design.fontFamily?.split(',')[0]}</span></div>
              <div>--radius-card: <span className="text-white">{design.borderRadius}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
