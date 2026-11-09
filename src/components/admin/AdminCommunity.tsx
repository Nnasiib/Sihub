import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminCommunity: React.FC = () => <div className="space-y-8"><BackendCMSManager allowedTypes={['community-member', 'community-topic']} initialType="community-member" heading="Community content" /><BackendSubmissionManager submissionType="community-topic" heading="Community submissions" /></div>;
