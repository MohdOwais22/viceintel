import type { IncomingMessage, ServerResponse } from 'http';
import { createExpressApp } from '../server';

let cachedAppPromise: Promise<any> | null = null;

function getApp() {
  if (!cachedAppPromise) {
    cachedAppPromise = createExpressApp();
  }
  return cachedAppPromise;
}

/**
 * Vercel Serverless Function Handler
 * Proxies all /api/* requests directly through Express with full MongoDB connection support.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return app(req, res);
}
