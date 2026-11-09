import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminOpportunities: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['opportunity']} initialType="opportunity" heading="Opportunities" /><BackendSubmissionManager submissionType="opportunity-application" heading="Opportunity applications" /></div>;
