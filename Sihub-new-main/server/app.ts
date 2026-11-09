import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import communityRoutes from './routes/community';
import cmsRoutes from './routes/cms';
import educationRoutes from './routes/education';
import educationRecordRoutes from './routes/educationRecords';
import mediaRoutes from './routes/media';
import submissionRoutes, { adminSubmissionsRouter, visitorRouter } from './routes/submissions';
import { requireCsrf } from './security';
import { errorHandler } from './utils';

export const app = express();
const s3EndpointOrigin = process.env.S3_ENDPOINT ? new URL(process.env.S3_ENDPOINT).origin : undefined;
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: ["'self'", 'https://*.amazonaws.com', ...(s3EndpointOrigin ? [s3EndpointOrigin] : [])],
      frameSrc: ["'self'", 'https://www.youtube-nocookie.com', 'https://player.vimeo.com', 'https://*.amazonaws.com', ...(s3EndpointOrigin ? [s3EndpointOrigin] : [])]
    }
  }
}));
app.use(express.json({ limit: '1mb', type: 'application/json' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', requireCsrf);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin/submissions', adminSubmissionsRouter);
app.use('/api/visitor', visitorRouter);
app.use('/api/cms', cmsRoutes);
app.use('/api/education', educationRecordRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/submissions', submissionRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use(errorHandler);
