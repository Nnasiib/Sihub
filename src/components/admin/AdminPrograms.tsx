import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminPrograms: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['program']} initialType="program" heading="Programs and cohorts" /><BackendSubmissionManager submissionType="program-application" heading="Program applications" /></div>;
