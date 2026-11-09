import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';

export const AdminImpact: React.FC = () => <BackendCMSManager allowedTypes={['impact']} initialType="impact" heading="Impact records" />;
