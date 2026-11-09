import type { ErrorRequestHandler, RequestHandler, Request, Response, NextFunction } from 'express';

export const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { void handler(req, res, next).catch(next); };

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;
  const status = Number(error?.status) || 500;
  const message = status >= 500 ? 'Internal server error' : String(error?.message ?? 'Request failed');
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
};

export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });
