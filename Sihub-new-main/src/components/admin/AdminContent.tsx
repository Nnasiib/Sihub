import React from 'react';
import { AdminWebsiteBuilder } from './AdminWebsiteBuilder';
import { BackendCMSManager } from './BackendCMSManager';
import { BackendSubmissionManager } from './BackendSubmissionManager';

export const AdminContent: React.FC = () => (
  <div className="space-y-8">
    <AdminWebsiteBuilder />
    <BackendCMSManager />
    <BackendSubmissionManager />
  </div>
);

