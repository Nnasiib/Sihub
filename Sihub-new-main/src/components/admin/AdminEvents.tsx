import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminEvents: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['event']} initialType="event" heading="Events" /><BackendSubmissionManager submissionType="event-registration" heading="Event registrations" allowCompletion /></div>;
