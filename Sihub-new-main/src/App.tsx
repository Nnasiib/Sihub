/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Master Application Entry Point
 * Full public website, administration console, and role-protected education portals.
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Common Components
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthPanel } from './components/common/AuthPanel';

// Public Pages & Navigation
import { Header } from './components/public/Header';
import { Footer } from './components/public/Footer';
import { Home } from './components/public/Home';
import { About } from './components/public/About';
import { ProgramsPage } from './components/public/ProgramsPage';
import { CoursesPage } from './components/public/CoursesPage';
import { StartupHubPage } from './components/public/StartupHubPage';
import { InnovationLabPage } from './components/public/InnovationLabPage';
import { CommunityPage } from './components/public/CommunityPage';
import { EventsPage } from './components/public/EventsPage';
import { OpportunitiesPage } from './components/public/OpportunitiesPage';
import { MentorshipPage } from './components/public/MentorshipPage';
import { PartnershipsPage } from './components/public/PartnershipsPage';
import { NewsPage } from './components/public/NewsPage';
import { MediaGalleryPage } from './components/public/MediaGalleryPage';
import { ContactPage } from './components/public/ContactPage';
import { SubmissionTrackingPage } from './components/public/SubmissionTrackingPage';
import { DynamicCmsSections } from './components/public/DynamicCmsSections';
import { DynamicCmsPage } from './components/public/DynamicCmsPage';

// Admin Modules
import { AdminLayout } from './components/admin/AdminLayout';
import { BackendOverview } from './components/admin/BackendOverview';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminLMS } from './components/admin/AdminLMS';
import { AdminContent } from './components/admin/AdminContent';
import { MediaLibrary } from './components/admin/MediaLibrary';
import { AdminAI } from './components/admin/AdminAI';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminVisitors } from './components/admin/AdminVisitors';
import { BackendCMSManager } from './components/admin/BackendCMSManager';
import { BackendSubmissionManager } from './components/admin/BackendSubmissionManager';

// Dedicated Role Dashboards
import { LearnerDashboard } from './components/portals/LearnerDashboard';
import { InstructorDashboard } from './components/portals/InstructorDashboard';
import { StartupDashboard } from './components/portals/StartupDashboard';
import { MentorDashboard } from './components/portals/MentorDashboard';
import { PartnerDashboard } from './components/portals/PartnerDashboard';
import { VisitorPortal } from './components/portals/VisitorPortal';

// Task 2: Dedicated Education Portal Components
import { EducationLayout } from './components/education/EducationLayout';
import { EducationHome } from './components/education/EducationHome';
import { EducationAdminPortal } from './components/education/EducationAdminPortal';
import { TeacherPortal } from './components/education/TeacherPortal';
import { StudentPortal } from './components/education/StudentPortal';
import { StudentLearningPortal } from './components/education/StudentLearningPortal';

// Interactive Modals & Assistant
import { ApplyCourseModal } from './components/modals/ApplyCourseModal';
import { PitchStartupModal } from './components/modals/PitchStartupModal';
import { EventRegisterModal } from './components/modals/EventRegisterModal';
import { SiHubAIAssistant } from './components/ai/SiHubAIAssistant';
import { protectedViewRoles, shouldShowRoleSwitcher } from './utils/appRouting';

const AppContent: React.FC = () => {
  const { currentView, adminTab, authUser, authLoading, logout } = useApp();

  useEffect(() => {
    if (currentView !== 'impact') return;
    const frame = window.requestAnimationFrame(() => document.getElementById('our-impact')?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [currentView]);

  const requiredRoles = protectedViewRoles[currentView];
  const accessDenied = Boolean(requiredRoles && authUser && !requiredRoles.includes(authUser.role));
  const isPasswordResetRoute = window.location.pathname === '/reset-password';
  const isForgotPasswordRoute = window.location.pathname === '/forgot-password';
  const authPortal = currentView === 'startup_portal'
    ? 'startup'
    : currentView === 'partner_portal'
      ? 'partner'
      : currentView === 'admin'
        ? 'admin'
        : 'learner';
  const authMode = isPasswordResetRoute ? 'reset' : isForgotPasswordRoute ? 'forgot' : 'login';

  const renderAdminModule = () => {
    switch (adminTab) {
      case 'overview': return <BackendOverview />;
      case 'users': return <AdminUsers />;
      case 'lms': return <AdminLMS />;
      case 'startups': return <><BackendCMSManager allowedTypes={['startup']} initialType="startup" heading="Startup profiles" /><BackendSubmissionManager submissionType="startup-pitch" heading="Startup pitches" /></>;
      case 'innovation': return <BackendCMSManager allowedTypes={['innovation']} initialType="innovation" heading="Innovation projects" />;
      case 'programs': return <><BackendCMSManager allowedTypes={['program']} initialType="program" heading="Programs and cohorts" /><BackendSubmissionManager submissionType="program-application" heading="Program applications" /></>;
      case 'community': return <><BackendCMSManager allowedTypes={['community-member', 'community-topic']} initialType="community-member" heading="Community members and topics" /><BackendSubmissionManager submissionType="community-topic" heading="Community submissions" /></>;
      case 'events': return <><BackendCMSManager allowedTypes={['event']} initialType="event" heading="Events" /><BackendSubmissionManager submissionType="event-registration" heading="Event registrations" allowCompletion /></>;
      case 'mentorship': return <><BackendCMSManager allowedTypes={['mentor']} initialType="mentor" heading="Mentor directory" /><BackendSubmissionManager submissionType="mentorship-request" heading="Mentorship requests" /></>;
      case 'opportunities': return <><BackendCMSManager allowedTypes={['opportunity']} initialType="opportunity" heading="Grants and opportunities" /><BackendSubmissionManager submissionType="opportunity-application" heading="Opportunity applications" /></>;
      case 'partnerships': return <><BackendCMSManager allowedTypes={['partner']} initialType="partner" heading="Partners" /><BackendSubmissionManager submissionType="partner-inquiry" heading="Partner inquiries" /></>;
      case 'content': return <AdminContent />;
      case 'media': return <MediaLibrary />;
      case 'impact': return <BackendCMSManager allowedTypes={['impact']} initialType="impact" heading="Impact records" />;
      case 'ai': return <AdminAI />;
      case 'settings': return <AdminSettings />;
      case 'visitors': return <AdminVisitors />;
      default: return <BackendOverview />;
    }
  };

  const renderPublicView = () => {
    switch (currentView) {
      case 'cms_page': return <DynamicCmsPage slug={decodeURIComponent(window.location.pathname.split('/').at(-1) ?? '')} />;
      case 'home': return <Home />;
      case 'impact': return <Home />;
      case 'about': return <About />;
      case 'programs': return <ProgramsPage />;
      case 'courses': return <CoursesPage />;
      case 'startups': return <StartupHubPage />;
      case 'innovation': return <InnovationLabPage />;
      case 'community': return <CommunityPage />;
      case 'events': return <EventsPage />;
      case 'opportunities': return <OpportunitiesPage />;
      case 'mentorship': return <MentorshipPage />;
      case 'partnerships': return <PartnershipsPage />;
      case 'news': return <NewsPage />;
      case 'media_gallery': return <MediaGalleryPage />;
      case 'contact': return <ContactPage />;
      case 'submission_tracking': return <SubmissionTrackingPage />;
      case 'learner_portal': return <StudentLearningPortal />;
      case 'visitor_portal': return <VisitorPortal />;
      case 'instructor_portal': return <InstructorDashboard />;
      case 'startup_portal': return <StartupDashboard />;
      case 'mentor_portal': return <MentorDashboard />;
      case 'partner_portal': return <PartnerDashboard />;
      default: return <Home />;
    }
  };

  const renderMainView = () => {
    // 1. Dedicated Education Portal Routes (Task 2)
    if (currentView === 'education') {
      return (
        <EducationLayout activePortal="hub">
          <EducationHome />
        </EducationLayout>
      );
    }
    if (currentView === 'education_admin') {
      return (
        <EducationLayout activePortal="admin">
          <EducationAdminPortal />
        </EducationLayout>
      );
    }
    if (currentView === 'education_teacher') {
      return (
        <EducationLayout activePortal="teacher">
          <TeacherPortal />
        </EducationLayout>
      );
    }
    if (currentView === 'education_student') {
      return (
        <EducationLayout activePortal="student">
          <StudentLearningPortal />
        </EducationLayout>
      );
    }

    // 2. Admin Back-Office Console
    if (currentView === 'admin') {
      return (
        <AdminLayout>
          {renderAdminModule()}
        </AdminLayout>
      );
    }

    // 3. Public Institutional Website
    const cmsPageSlug: Partial<Record<typeof currentView, string>> = {
      home: 'home', impact: 'home', about: 'about', programs: 'programs', courses: 'courses',
      startups: 'startups', innovation: 'innovation', community: 'community', events: 'events',
      opportunities: 'opportunities', mentorship: 'mentorship', partnerships: 'partnerships', news: 'news', contact: 'contact'
    };
    const pageSlug = cmsPageSlug[currentView];
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1">
          {pageSlug && <DynamicCmsSections pageSlug={pageSlug} placement="top" />}
          {renderPublicView()}
          {pageSlug && <DynamicCmsSections pageSlug={pageSlug} placement="bottom" />}
        </main>
        <Footer />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-cyan-500 selection:text-white pb-16 md:pb-0">
      {/* Authenticated Session Controls */}
      {shouldShowRoleSwitcher(currentView, authUser?.role ?? null) && <RoleSwitcherBar />}

      {/* Main Dynamic View */}
      {isPasswordResetRoute || isForgotPasswordRoute ? (
        <AuthPanel portal={authPortal} initialMode={authMode} />
      ) : requiredRoles && authLoading ? (
        <main className="flex-1 flex items-center justify-center text-sm text-slate-500">Checking your SiHub account…</main>
      ) : requiredRoles && !authUser ? (
        <AuthPanel portal={authPortal} />
      ) : accessDenied ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">This account cannot access this portal</h1>
          <p className="text-sm text-slate-600">Sign in with an account assigned to this role.</p>
          <button onClick={() => void logout()} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">Sign out</button>
        </main>
      ) : renderMainView()}

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      {currentView !== 'admin' && <MobileBottomBar />}

      {/* Modals & AI Assistant Overlays */}
      <ApplyCourseModal />
      <PitchStartupModal />
      <EventRegisterModal />
      <SiHubAIAssistant />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
