import type { AppView } from '../context/AppContext';

export const protectedViewRoles: Partial<Record<AppView, readonly string[]>> = {
  admin: ['OWNER', 'SUPER_ADMIN', 'ADMIN'],
  education_admin: ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'EDUCATION_MANAGER'],
  education_teacher: ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'EDUCATION_MANAGER', 'INSTRUCTOR'],
  education_student: ['STUDENT', 'LEARNER'],
  learner_portal: ['STUDENT', 'LEARNER'],
  instructor_portal: ['INSTRUCTOR', 'EDUCATION_MANAGER'],
  startup_portal: ['STARTUP_FOUNDER'],
  mentor_portal: ['MENTOR'],
  partner_portal: ['PARTNER']
};

export const canAccessView = (view: AppView, role: string | null) => {
  const allowedRoles = protectedViewRoles[view];
  return !allowedRoles || (role !== null && allowedRoles.includes(role));
};

export const isAdminRole = (role: string | null) => role !== null && ['OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(role);

const privateRoleViews: readonly AppView[] = [
  'admin',
  'learner_portal',
  'instructor_portal',
  'startup_portal',
  'mentor_portal',
  'partner_portal',
  'education_admin',
  'education_teacher',
  'education_student'
];

export const shouldShowRoleSwitcher = (view: AppView, role: string | null) =>
  role !== null && privateRoleViews.includes(view) && canAccessView(view, role);

export const appViewForPath = (pathname: string): AppView | null => {
  if (/^\/(?:pages|p)\/[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(pathname)) return 'cms_page';
  switch (pathname.toLowerCase()) {
    case '/': return 'home';
    case '/about': return 'about';
    case '/programs': return 'programs';
    case '/entrepreneurship': return 'startups';
    case '/institute': return 'courses';
    case '/innovation': return 'innovation';
    case '/community': return 'community';
    case '/events': return 'events';
    case '/opportunities': return 'opportunities';
    case '/mentorship': return 'mentorship';
    case '/partnerships': return 'partnerships';
    case '/impact': return 'impact';
    case '/news': return 'news';
    case '/media': return 'media_gallery';
    case '/contact': return 'contact';
    case '/track': return 'submission_tracking';
    case '/admin': return 'admin';
    case '/learner':
    case '/learner_portal': return 'learner_portal';
    case '/instructor':
    case '/instructor_portal': return 'instructor_portal';
    case '/founder':
    case '/startup_portal': return 'startup_portal';
    case '/mentor':
    case '/mentor_portal': return 'mentor_portal';
    case '/partner':
    case '/partner_portal': return 'partner_portal';
    case '/visitor':
    case '/visitor_portal': return 'visitor_portal';
    case '/education': return 'education';
    case '/education/admin': return 'education_admin';
    case '/education/teacher': return 'education_teacher';
    case '/education/student': return 'education_student';
    default: return null;
  }
};

export const appPathForView = (view: AppView) => {
  switch (view) {
    case 'home': return '/';
    case 'about': return '/about';
    case 'programs': return '/programs';
    case 'startups': return '/entrepreneurship';
    case 'courses': return '/institute';
    case 'innovation': return '/innovation';
    case 'community': return '/community';
    case 'events': return '/events';
    case 'opportunities': return '/opportunities';
    case 'mentorship': return '/mentorship';
    case 'partnerships': return '/partnerships';
    case 'impact': return '/impact';
    case 'news': return '/news';
    case 'media_gallery': return '/media';
    case 'contact': return '/contact';
    case 'submission_tracking': return '/track';
    case 'admin': return '/admin';
    case 'learner_portal': return '/learner';
    case 'instructor_portal': return '/instructor';
    case 'startup_portal': return '/founder';
    case 'mentor_portal': return '/mentor';
    case 'partner_portal': return '/partner';
    case 'visitor_portal': return '/visitor';
    case 'education': return '/education';
    case 'education_admin': return '/education/admin';
    case 'education_teacher': return '/education/teacher';
    case 'education_student': return '/education/student';
    default: return '/';
  }
};
