import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminMentorship: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['mentor']} initialType="mentor" heading="Mentor directory" /><BackendSubmissionManager submissionType="mentorship-request" heading="Mentorship requests" /></div>;
