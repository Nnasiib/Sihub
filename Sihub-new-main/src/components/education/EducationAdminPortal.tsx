import React from 'react';
import { BackendEducationManager } from '../admin/BackendEducationManager';
import { BackendEducationRecordsManager } from './BackendEducationRecordsManager';

export const EducationAdminPortal: React.FC = () => (
  <div className="space-y-10">
    <BackendEducationManager />
    <BackendEducationRecordsManager />
  </div>
);
