import 'dotenv/config';
import { app } from './app';
import { prisma } from './db';

const port = Number(process.env.PORT) || Number(process.env.API_PORT) || 3001;
const server = app.listen(port, '0.0.0.0', () => console.log(`SiHub API listening on port ${port}`));

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
