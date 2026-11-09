import test from 'node:test';
import assert from 'node:assert/strict';

import { appPathForView, appViewForPath, canAccessView, shouldShowRoleSwitcher } from '../src/utils/appRouting';

test('Admin and public URLs resolve to the existing application views', () => {
  assert.equal(appViewForPath('/'), 'home');
  assert.equal(appViewForPath('/about'), 'about');
  assert.equal(appViewForPath('/programs'), 'programs');
  assert.equal(appViewForPath('/entrepreneurship'), 'startups');
  assert.equal(appViewForPath('/institute'), 'courses');
  assert.equal(appViewForPath('/impact'), 'impact');
  assert.equal(appViewForPath('/media'), 'media_gallery');
  assert.equal(appViewForPath('/partnerships'), 'partnerships');
  assert.equal(appViewForPath('/admin'), 'admin');
  assert.equal(appPathForView('admin'), '/admin');
  assert.equal(appPathForView('about'), '/about');
  assert.equal(appPathForView('media_gallery'), '/media');
  assert.equal(appPathForView('startups'), '/entrepreneurship');
  assert.equal(appViewForPath('/education/admin'), 'education_admin');
  assert.equal(appViewForPath('/learner'), 'learner_portal');
  assert.equal(appViewForPath('/learner_portal'), 'learner_portal');
  assert.equal(appViewForPath('/instructor'), 'instructor_portal');
  assert.equal(appViewForPath('/founder'), 'startup_portal');
  assert.equal(appViewForPath('/mentor'), 'mentor_portal');
  assert.equal(appViewForPath('/partner'), 'partner_portal');
  assert.equal(appViewForPath('/visitor'), 'visitor_portal');
  assert.equal(appPathForView('learner_portal'), '/learner');
  assert.equal(appPathForView('instructor_portal'), '/instructor');
  assert.equal(appPathForView('startup_portal'), '/founder');
  assert.equal(appPathForView('mentor_portal'), '/mentor');
  assert.equal(appPathForView('partner_portal'), '/partner');
  assert.equal(appPathForView('visitor_portal'), '/visitor');
  assert.equal(appViewForPath('/pages/community-guidelines'), 'cms_page');
  assert.equal(appViewForPath('/track'), 'submission_tracking');
  assert.equal(appPathForView('submission_tracking'), '/track');
  assert.equal(appViewForPath('/unknown'), null);
});

test('only Owner, Super Admin, and Admin roles pass the Admin view gate', () => {
  assert.equal(canAccessView('admin', 'OWNER'), true);
  assert.equal(canAccessView('admin', 'SUPER_ADMIN'), true);
  assert.equal(canAccessView('admin', 'ADMIN'), true);
  assert.equal(canAccessView('admin', 'STUDENT'), false);
  assert.equal(canAccessView('admin', 'EDUCATION_MANAGER'), false);
  assert.equal(canAccessView('admin', 'STAFF'), false);
  assert.equal(canAccessView('admin', 'VISITOR'), false);
  assert.equal(canAccessView('admin', null), false);
  assert.equal(canAccessView('home', null), true);
  assert.equal(canAccessView('education_student', 'LEARNER'), true);
});

test('persona selector is hidden on public routes and shown only on authorized private views', () => {
  assert.equal(shouldShowRoleSwitcher('home', null), false);
  assert.equal(shouldShowRoleSwitcher('home', 'VISITOR'), false);
  assert.equal(shouldShowRoleSwitcher('about', 'STUDENT'), false);
  assert.equal(shouldShowRoleSwitcher('admin', null), false);
  assert.equal(shouldShowRoleSwitcher('admin', 'STUDENT'), false);
  assert.equal(shouldShowRoleSwitcher('admin', 'OWNER'), true);
  assert.equal(shouldShowRoleSwitcher('learner_portal', 'STUDENT'), true);
});
