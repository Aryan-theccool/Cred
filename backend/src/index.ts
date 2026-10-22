import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { initDb } from './db';
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);

// Serve uploaded receipts statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler (for multer etc)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  if (err.message === 'Only image files allowed') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 5MB' });
  }
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n MiniLedger backend running on http://0.0.0.0:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log(` OTP is logged to server console (mock) \n`);
  });
}

// Only start if run directly (not during tests)
if (require.main === module) {
  start();
}

export default app;
