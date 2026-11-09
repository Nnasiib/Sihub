import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminStartups: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['startup']} initialType="startup" heading="Startup profiles" /><BackendSubmissionManager submissionType="startup-pitch" heading="Startup pitches" /></div>;
