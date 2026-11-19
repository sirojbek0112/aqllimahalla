import express from 'express';
import serverless from 'serverless-http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { initSchema } from '../../server/db.ts';
import { seedDatabase } from '../../server/seed.ts';
import { createApiRouter } from '../../server/routes.ts';

let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initSchema();
    seedDatabase();
    initialized = true;
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  ensureInitialized();
  next();
});

const uploadsDir = path.join(os.tmpdir(), 'aqllimahalla_uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/', createApiRouter());

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Netlify Function API Error:', err);
  res.status(500).json({ error: err.message || 'Server xatoligi yuz berdi' });
});

export const handler = serverless(app);
