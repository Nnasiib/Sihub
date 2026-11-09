/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Master Full-Stack Server
 * Serves Express API routes and Vite frontend middlewares on a single port (3000).
 */

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { app } from './server/app';
import { prisma } from './server/db';

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res, next) => {
      res.sendFile(path.join(distPath, 'index.html'), err => err && next(err));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`SiHub Digital Ecosystem running on http://0.0.0.0:${port}`);
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void startServer();
