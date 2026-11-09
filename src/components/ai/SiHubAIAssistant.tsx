/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Interactive AI Assistant (Somali & English)
 * Guides learners, entrepreneurs, and partners directly through the ecosystem.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { apiPost, ApiError } from '../../services/apiClient';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    view: 'courses' | 'programs' | 'startups' | 'events' | 'opportunities' | 'contact';
  };
  mode?: 'gemini' | 'faq';
}

export const SiHubAIAssistant: React.FC = () => {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    language,
    navigateTo,
    addToast
  } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text:
        language === 'so'
          ? 'Ku soo dhawoow SiHub Kaaliyaha Caqliga Macmalka ah! Waxaan kaa caawin karaa helitaanka koorsooyinka, codsiga shirkadaha cusub (incubation), deeqaha waxbarasho, iyo munaasabadaha. Sideen kuu caawin karaa maanta?'
          : 'Welcome to the SiHub AI Assistant! I can help you find certified training courses, apply for startup incubation and seed grants, explore community hackathons, or understand SiHub services across Somalia. What would you like to explore today?',
      timestamp: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isAiAssistantOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsAiAssistantOpen(true)}
        className="sihub-ai-launcher inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-white/70 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
        aria-label="Open SiHub AI Assistant"
        title="Open SiHub AI Assistant"
      >
        <Bot className="h-5 w-5" />
        <span>SiHub AI</span>
      </button>
    );
  }

  const quickPrompts = [
    { label: language === 'so' ? 'Koorsooyinka Tignoolajiyada' : 'Tech & Solar Courses', query: 'Show me courses in technology and solar energy' },
    { label: language === 'so' ? 'Codso Incubation 2026' : 'Apply for Incubation', query: 'How can I submit my startup idea for the 2026 incubation cohort?' },
    { label: language === 'so' ? 'Deeqaha & Fursadaha' : 'Grants & Scholarships', query: 'What grants and fellowships are currently open?' },
    { label: language === 'so' ? 'Munaasabadaha SiHub' : 'Upcoming Summit & Events', query: 'When is the Somalia Annual Innovation Summit?' }
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);
    try {
      const result = await apiPost<{ answer: string; mode: 'gemini' | 'faq' }>('/api/ai/chat', { message: q, language });
      const normalized = q.toLowerCase();
      const action: ChatMessage['actionButton'] = normalized.includes('course') || normalized.includes('learn')
        ? { label: language === 'so' ? 'Fur Koorsooyinka' : 'Browse courses', view: 'courses' }
        : normalized.includes('startup') || normalized.includes('incub') || normalized.includes('pitch')
          ? { label: language === 'so' ? 'Booqo Startup Hub' : 'Visit Startup Hub', view: 'startups' }
          : normalized.includes('grant') || normalized.includes('scholar') || normalized.includes('opportunity')
            ? { label: language === 'so' ? 'Eeg Fursadaha' : 'View opportunities', view: 'opportunities' }
            : normalized.includes('event') || normalized.includes('summit')
              ? { label: language === 'so' ? 'Eeg Munaasabadaha' : 'View events', view: 'events' }
              : undefined;
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButton: action,
        mode: result.mode
      }]);
    } catch (reason) {
      const message = reason instanceof ApiError ? reason.message : 'The SiHub assistant is temporarily unavailable.';
      addToast('error', 'Assistant unavailable', message);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl max-w-xl w-full h-full sm:h-[85vh] sm:max-h-[700px] border-0 sm:border border-slate-700 flex flex-col text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">SiHub AI Assistant</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  SERVER ASSISTANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bilingual Ecosystem Guide (Somali & English)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAiAssistantOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-xs'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>

                {msg.actionButton && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/80">
                    <button
                      onClick={() => {
                        setIsAiAssistantOpen(false);
                        if (msg.actionButton) navigateTo(msg.actionButton.view);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {msg.actionButton.label} &rarr;
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
              <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>SiHub AI is formulating response...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              language === 'so'
                ? 'Weydii SiHub AI su’aal ku saabsan koorsooyinka ama deeqaha...'
                : 'Ask SiHub AI about courses, programs, startup incubation, or events...'
            }
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
