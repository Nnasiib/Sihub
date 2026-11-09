/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Community & Regional Youth Hubs Page
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommunityMember, ForumTopic } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { apiDelete, apiGet, apiPost, ApiError } from '../../services/apiClient';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Sparkles,
  Send,
  PlusCircle,
  Award
} from 'lucide-react';

type CommunityCmsPage = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  hubs?: { name?: string; description?: string }[];
};

export const CommunityPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage<CommunityCmsPage>('community');
  const { currentUser, authUser, addToast } = useApp();
  const { items: members } = useCmsCollection<CommunityMember>('community-member');
  const { items: forumTopics } = useCmsCollection<ForumTopic>('community-topic');
  const regionalHubs = cmsPage?.hubs ?? [];

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('AgriTech & Climate');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [submissionReference, setSubmissionReference] = useState('');
  const [reactions, setReactions] = useState<Record<string, { count: number; hasReacted: boolean }>>({});

  useEffect(() => {
    let active = true;
    Promise.all(forumTopics.map(async topic => {
      try {
        const result = await apiGet<{ count: number; hasReacted: boolean }>(`/api/community/topics/${encodeURIComponent(topic.id)}/reactions`);
        return [topic.id, result] as const;
      } catch {
        return [topic.id, { count: 0, hasReacted: false }] as const;
      }
    })).then(results => { if (active) setReactions(Object.fromEntries(results)); });
    return () => { active = false; };
  }, [forumTopics]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;

    try {
      const { submission } = await apiPost<{ submission: { referenceCode: string } }>('/api/submissions/community-topic', { payload: { title: newTopicTitle, content: newTopicContent, author: currentUser.fullName, category: newTopicCategory } });
      setNewTopicTitle('');
      setNewTopicContent('');
      setShowNewTopicForm(false);
      setSubmissionReference(submission.referenceCode);
      addToast('success', 'Discussion Submitted', 'Your topic is in the SiHub moderation queue.');
    } catch (reason) {
      addToast('error', 'Discussion Failed', reason instanceof ApiError ? reason.message : 'Unable to submit your discussion.');
    }
  };

  const handleLike = async (id: string) => {
    if (!authUser) {
      addToast('warning', 'Sign-In Required', 'Sign in to record a community endorsement.');
      return;
    }
    try {
      const current = reactions[id]?.hasReacted;
      const next = current
        ? await apiDelete<{ count: number; hasReacted: boolean }>(`/api/community/topics/${encodeURIComponent(id)}/reactions`)
        : await apiPost<{ count: number; hasReacted: boolean }>(`/api/community/topics/${encodeURIComponent(id)}/reactions`);
      setReactions(values => ({ ...values, [id]: next }));
    } catch (reason) {
      addToast('error', 'Endorsement Failed', reason instanceof ApiError ? reason.message : 'Unable to save your endorsement.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
          {cmsPage?.eyebrow ?? 'Grassroots Networks & Regional Chapters'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Community & Innovation Circles'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Explore published community members, discussions, and regional hub information.'}
        </p>
      </div>

      {/* Regional Youth Hubs Showcase */}
      {regionalHubs.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {regionalHubs.map((hub, index) => <div key={`${hub.name}-${index}`} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className={`flex items-center gap-2 ${['text-cyan-600', 'text-emerald-600', 'text-amber-600', 'text-indigo-600'][index % 4]} font-bold text-sm`}>
            <MapPin className="w-4 h-4" /> {hub.name}
          </div>
          <p className="text-xs text-slate-600">{hub.description}</p>
        </div>)}
      </div>}

      {/* Forum & Technical Discussions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Discussions Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              <h2 className="text-lg font-bold text-slate-900">Community Knowledge Exchange</h2>
            </div>
            <button
              onClick={() => setShowNewTopicForm(!showNewTopicForm)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start Discussion
            </button>
          </div>

          {submissionReference && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">Topic submitted for moderation. Reference: <strong className="font-mono">{submissionReference}</strong></p>}

          {/* New Discussion Form */}
          {showNewTopicForm && (
            <form onSubmit={handlePostSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <h3 className="font-bold text-xs text-slate-900">Create New Community Discussion</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Discussion Topic Title..."
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <select
                  value={newTopicCategory}
                  onChange={e => setNewTopicCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option>AgriTech & Climate</option>
                  <option>Renewable Energy</option>
                  <option>Software Engineering</option>
                  <option>Entrepreneurship</option>
                  <option>Women in Tech</option>
                </select>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Share your technical question, project findings, or local community challenge..."
                value={newTopicContent}
                onChange={e => setNewTopicContent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTopicForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
                >
                  Post Topic
                </button>
              </div>
            </form>
          )}

          {/* Topics List */}
          <div className="space-y-4">
            {forumTopics.map(topic => (
              <div
                key={topic.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {topic.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{topic.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{topic.content}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Author: <strong className="text-slate-800">{topic.author}</strong></span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => void handleLike(topic.id)}
                      aria-pressed={Boolean(reactions[topic.id]?.hasReacted)}
                      className={`flex items-center gap-1.5 transition-colors ${reactions[topic.id]?.hasReacted ? 'text-cyan-700' : 'hover:text-cyan-600'}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{reactions[topic.id]?.count ?? 0} Endorsements</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{topic.repliesCount} Replies</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Community Members Roster */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Active Regional Leads
            </h3>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Verified</span>
          </div>

          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    {member.name}
                    {member.isAmbassador && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Ambassador
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{member.sectorInterest} • {member.city}</div>
                </div>
                <div className="text-[10px] text-cyan-700 font-bold">
                  {member.contributionsCount} posts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
