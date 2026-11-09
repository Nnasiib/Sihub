/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Global Application Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Language, Course, SiHubEvent as Event, Startup } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { apiRequest } from '../services/apiClient';
import { appPathForView, appViewForPath } from '../utils/appRouting';

export interface AuthAccount {
  id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'EDUCATION_MANAGER' | 'INSTRUCTOR' | 'STUDENT' | 'LEARNER' | 'STARTUP_FOUNDER' | 'MENTOR' | 'COMMUNITY_MEMBER' | 'STAFF' | 'PARTNER' | 'PROGRAM_MANAGER' | 'VISITOR';
}

const roleToUiRole: Record<AuthAccount['role'], UserRole> = {
  OWNER: 'super_admin',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDUCATION_MANAGER: 'education_admin',
  INSTRUCTOR: 'course_instructor',
  STUDENT: 'student',
  LEARNER: 'learner',
  STARTUP_FOUNDER: 'startup_founder',
  MENTOR: 'mentor',
  COMMUNITY_MEMBER: 'community_member',
  STAFF: 'staff',
  PARTNER: 'partner',
  PROGRAM_MANAGER: 'program_manager',
  VISITOR: 'visitor'
};

export type AppView =
  | 'home'
  | 'cms_page'
  | 'submission_tracking'
  | 'about'
  | 'programs'
  | 'courses'
  | 'startups'
  | 'innovation'
  | 'community'
  | 'events'
  | 'opportunities'
  | 'mentorship'
  | 'partnerships'
  | 'impact'
  | 'news'
  | 'media_gallery'
  | 'contact'
  | 'admin'
  | 'learner_portal'
  | 'instructor_portal'
  | 'startup_portal'
  | 'mentor_portal'
  | 'partner_portal'
  | 'education'
  | 'education_admin'
  | 'education_teacher'
  | 'education_student'
  | 'visitor_portal';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'lms'
  | 'startups'
  | 'innovation'
  | 'programs'
  | 'community'
  | 'events'
  | 'mentorship'
  | 'opportunities'
  | 'partnerships'
  | 'content'
  | 'media'
  | 'impact'
  | 'ai'
  | 'settings'
  | 'visitors';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  navigateTo: (view: AppView, adminTab?: AdminTab) => void;

  // Role & User
  currentUser: User;
  users: User[];
  authUser: AuthAccount | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;

  // Selected entities for modals / player
  selectedCourseForApply: Course | null;
  setSelectedCourseForApply: (course: Course | null) => void;
  selectedEventForRegister: Event | null;
  setSelectedEventForRegister: (event: Event | null) => void;
  selectedStartupForView: Startup | null;
  setSelectedStartupForView: (startup: Startup | null) => void;

  // Modals & Panels
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isStartupModalOpen: boolean;
  setIsStartupModalOpen: (open: boolean) => void;
  isPartnerModalOpen: boolean;
  setIsPartnerModalOpen: (open: boolean) => void;

  // Notifications
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Global Actions
  triggerRefresh: () => void;
  dataVersion: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>(() => appViewForPath(window.location.pathname) ?? 'home');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [language, setLanguage] = useState<Language>('en');
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [authUser, setAuthUser] = useState<AuthAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals & Selected
  const [selectedCourseForApply, setSelectedCourseForApply] = useState<Course | null>(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState<Event | null>(null);
  const [selectedStartupForView, setSelectedStartupForView] = useState<Startup | null>(null);

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isStartupModalOpen, setIsStartupModalOpen] = useState<boolean>(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setDataVersion(v => v + 1);
  };

  useEffect(() => {
    let active = true;
    apiRequest<{ user: AuthAccount }>('/api/auth/me')
      .then(({ user }) => {
        if (active) {
          setAuthUser(user);
        }
      })
      .catch(() => {
        if (active) setAuthUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Initial route synchronization from browser URL
  useEffect(() => {
    const handleUrlRoute = () => {
      const view = appViewForPath(window.location.pathname);
      if (view) setCurrentView(view);
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setDataVersion(v => v + 1);
    };
    window.addEventListener('sihub-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('sihub-storage-update', handleStorageUpdate);
  }, []);

  const currentUser: User = authUser ? {
    id: authUser.id,
    fullName: authUser.fullName,
    email: authUser.email,
    role: roleToUiRole[authUser.role],
    isActive: true,
    registeredAt: ''
  } : {
    id: 'anonymous-visitor',
    fullName: 'Site Visitor',
    email: '',
    role: 'visitor',
    isActive: true,
    registeredAt: new Date().toISOString()
  };
  const users: User[] = authUser ? [currentUser] : [];

  const login = async (email: string, password: string) => {
    const result = await apiRequest<{ user: AuthAccount }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setAuthUser(result.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const result = await apiRequest<{ user: AuthAccount }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password }) });
    setAuthUser(result.user);
  };

  const forgotPassword = async (email: string) => {
    await apiRequest<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const resetPassword = async (token: string, password: string) => {
    await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  };

  const logout = async () => {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
    if (currentView !== 'admin') setCurrentView('home');
  };

  const navigateTo = (view: AppView, targetAdminTab?: AdminTab) => {
    setCurrentView(view);
    if (targetAdminTab) {
      setAdminTab(targetAdminTab);
    }

    // Sync path URL for education and key routes
    try {
      const path = appPathForView(view);

      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch {
      // browser history may be restricted in sandboxes
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        adminTab,
        setAdminTab,
        navigateTo,
        currentUser,
        users,
        authUser,
        authLoading,
        login,
        register,
        forgotPassword,
        resetPassword,
        changePassword,
        logout,
        language,
        setLanguage,
        t,
        selectedCourseForApply,
        setSelectedCourseForApply,
        selectedEventForRegister,
        setSelectedEventForRegister,
        selectedStartupForView,
        setSelectedStartupForView,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        isStartupModalOpen,
        setIsStartupModalOpen,
        isPartnerModalOpen,
        setIsPartnerModalOpen,
        toasts,
        addToast,
        removeToast,
        triggerRefresh,
        dataVersion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
