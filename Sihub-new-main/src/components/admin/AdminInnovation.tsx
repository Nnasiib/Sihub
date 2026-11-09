import React from 'react';
import { BackendCMSManager } from './BackendCMSManager';

export const AdminInnovation: React.FC = () => <BackendCMSManager allowedTypes={['innovation']} initialType="innovation" heading="Innovation projects" />;
