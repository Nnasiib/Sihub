/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - SEO & Website Settings Management Area
 * Meta tags, OpenGraph previews, campus contact credentials, and analytics.
 */

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, ApiError } from '../../../services/apiClient';
import { useApp } from '../../../context/AppContext';
import {
  Globe,
  Share2,
  PhoneCall,
  Save,
  Sparkles,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  Clock,
  Eye
} from 'lucide-react';

interface SeoWebsiteSettings {
  siteTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterHandle?: string;
  hqAddress?: string;
  primaryEmail?: string;
  partnershipsEmail?: string;
  phoneNumber?: string;
  operatingHours?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  youtubeUrl?: string;
  analyticsId?: string;
}

const DEFAULT_SETTINGS: SeoWebsiteSettings = {
  siteTitle: 'Somali Innovation Hub (SiHub) - Empowering East African Innovators',
  metaDescription: 'SiHub is Somalia premier innovation ecosystem, digital academy, startup incubator, and climate-tech research facility based in Mogadishu.',
  metaKeywords: 'Somalia tech, startup incubator, digital academy, renewable energy, Mogadishu maker space, diaspora venture capital',
  ogTitle: 'Somali Innovation Hub (SiHub) | National Digital Ecosystem',
  ogDescription: 'Catalyzing Somali innovation through venture incubation, technology academy cohorts, and sustainable climate-tech pilots.',
  ogImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  twitterHandle: '@sihub_so',
  hqAddress: 'Airport Road, KM4 District, Mogadishu, Somalia',
  primaryEmail: 'info@sihub.so',
  partnershipsEmail: 'partnerships@sihub.so',
  phoneNumber: '+252 61 500 0000',
  operatingHours: 'Mon - Fri: 8:00 AM - 6:00 PM EAT',
  twitterUrl: 'https://twitter.com/sihub_so',
  linkedinUrl: 'https://linkedin.com/company/sihub',
  githubUrl: 'https://github.com/sihub-so',
  youtubeUrl: 'https://youtube.com/@sihub_so',
  analyticsId: 'G-SIHUB2026'
};

export const SEOSettingsArea: React.FC = () => {
  const { addToast } = useApp();
  const [settings, setSettings] = useState<SeoWebsiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'meta' | 'social' | 'contact'>('meta');

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await apiGet<{ settings?: { seo?: SeoWebsiteSettings } }>('/api/cms/settings');
        if (isMounted && res.settings?.seo) {
          setSettings(prev => ({ ...prev, ...res.settings?.seo }));
        }
      } catch (err) {
        console.warn('Using default SEO settings', err);
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
        seo: settings
      });
      addToast('success', 'Settings Synchronized', 'SEO meta tags and website configurations saved to live database.');
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
    } catch (err) {
      addToast('error', 'Save Failed', err instanceof ApiError ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
            <Globe className="w-4 h-4" /> Global Meta Configuration & Institutional Settings
          </div>
          <h2 className="text-2xl font-extrabold font-heading">SEO & Website Settings</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Configure site-wide search engine indexing metadata, social share OpenGraph cards, verified campus contact information, and institutional social handles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings to Live Site'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'meta'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" /> Search Engine Meta & Indexing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'social'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> OpenGraph & Social Sharing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'contact'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" /> Campus Contact & Social Handles
        </button>
      </div>

      {/* Tab 1: Search Engine Meta */}
      {activeTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Global Site Title (&lt;title&gt;)</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Recommended: 50-60 characters. Current: {settings.siteTitle?.length}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Meta Description (&lt;meta name="description"&gt;)</label>
              <textarea
                rows={3}
                value={settings.metaDescription}
                onChange={e => setSettings({ ...settings, metaDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Recommended: 150-160 characters. Current: {settings.metaDescription?.length}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Meta Keywords</label>
              <input
                type="text"
                value={settings.metaKeywords}
                onChange={e => setSettings({ ...settings, metaKeywords: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Comma-separated keywords"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Google Analytics Measurement ID</label>
              <input
                type="text"
                value={settings.analyticsId}
                onChange={e => setSettings({ ...settings, analyticsId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
          </div>

          {/* Google Search Simulator Preview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
              <Eye className="w-4 h-4 text-cyan-600" /> Google Search Result Simulator
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] flex items-center justify-center font-bold">S</div>
                <span className="text-slate-800 font-medium">Somali Innovation Hub</span>
                <span className="text-slate-400">https://sihub.so</span>
              </div>
              <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer leading-tight">
                {settings.siteTitle}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {settings.metaDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: OpenGraph & Social Cards */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">OpenGraph Title (og:title)</label>
              <input
                type="text"
                value={settings.ogTitle}
                onChange={e => setSettings({ ...settings, ogTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">OpenGraph Description (og:description)</label>
              <textarea
                rows={3}
                value={settings.ogDescription}
                onChange={e => setSettings({ ...settings, ogDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Social Share Image URL (og:image / 1200x630)</label>
              <input
                type="url"
                value={settings.ogImage}
                onChange={e => setSettings({ ...settings, ogImage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Twitter / X Handle</label>
              <input
                type="text"
                value={settings.twitterHandle}
                onChange={e => setSettings({ ...settings, twitterHandle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
              />
            </div>
          </div>

          {/* Social Card Preview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
              <Share2 className="w-4 h-4 text-cyan-600" /> Social Card Share Preview
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-slate-50">
              {settings.ogImage && (
                <img
                  src={settings.ogImage}
                  alt="Social share preview"
                  className="w-full h-44 object-cover"
                />
              )}
              <div className="p-4 space-y-1 bg-white">
                <span className="text-[10px] uppercase font-mono text-slate-400">sihub.so</span>
                <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                  {settings.ogTitle}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {settings.ogDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Campus Contact & Social Handles */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading border-b border-slate-100 pb-2">
              Official Campus Credentials
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Headquarters Campus Address</label>
              <input
                type="text"
                value={settings.hqAddress}
                onChange={e => setSettings({ ...settings, hqAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary General Email</label>
              <input
                type="email"
                value={settings.primaryEmail}
                onChange={e => setSettings({ ...settings, primaryEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Partnerships & Grants Email</label>
              <input
                type="email"
                value={settings.partnershipsEmail}
                onChange={e => setSettings({ ...settings, partnershipsEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={settings.phoneNumber}
                onChange={e => setSettings({ ...settings, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={settings.operatingHours}
                onChange={e => setSettings({ ...settings, operatingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading border-b border-slate-100 pb-2">
              Institutional Social Profiles
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Page URL</label>
              <input
                type="url"
                value={settings.linkedinUrl}
                onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Twitter / X Profile URL</label>
              <input
                type="url"
                value={settings.twitterUrl}
                onChange={e => setSettings({ ...settings, twitterUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Organization URL</label>
              <input
                type="url"
                value={settings.githubUrl}
                onChange={e => setSettings({ ...settings, githubUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Channel URL</label>
              <input
                type="url"
                value={settings.youtubeUrl}
                onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
