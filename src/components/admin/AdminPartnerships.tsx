import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminPartnerships: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['partner']} initialType="partner" heading="Partners" /><BackendSubmissionManager submissionType="partner-inquiry" heading="Partner inquiries" /></div>;
