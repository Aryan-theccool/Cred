import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createLoan, listLoans, getLoanById, markRepaid, updateReceipt, getSummary } from '../db';

const router = Router();

// All loan routes require auth
router.use(authMiddleware);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// Validation schemas
const createLoanSchema = z.object({
  friendName: z.string().min(2, 'Friend name too short').max(100, 'Friend name too long').trim(),
  amount: z.coerce.number().positive('Amount must be > 0').max(1_000_000, 'Amount too large'),
  dueDate: z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid dueDate, use YYYY-MM-DD' }
  ),
  receiptUrl: z.string().url().optional().nullable(),
});

// POST /api/loans - add entry
router.post('/', async (req: AuthRequest, res) => {
  const parsed = createLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { friendName, amount, dueDate, receiptUrl } = parsed.data;

  // Normalize dueDate to YYYY-MM-DD
  const due = new Date(dueDate);
  const dueDateStr = due.toISOString().split('T')[0];

  try {
    const loan = await createLoan({
      user_id: req.user!.id,
      friend_name: friendName,
      amount,
      due_date: dueDateStr,
      receipt_url: receiptUrl || null,
    });
    res.status(201).json(loan);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create loan', details: e.message });
  }
});

// GET /api/loans/summary - must be before /:id
router.get('/summary', async (req: AuthRequest, res) => {
  const summary = await getSummary(req.user!.id);
  res.json(summary);
});

// GET /api/loans - list
router.get('/', async (req: AuthRequest, res) => {
  const loans = await listLoans(req.user!.id);
  // Add computed overdue flag
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enriched = loans.map((l) => {
    const due = new Date(l.due_date);
    due.setHours(0, 0, 0, 0);
    const isOverdue = !l.is_repaid && due < today;
    return {
      ...l,
      amount: Number(l.amount),
      isOverdue,
    };
  });
  res.json(enriched);
});

// PATCH /api/loans/:id/repay
router.patch('/:id/repay', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid loan id' });

  const loan = await getLoanById(id, req.user!.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.is_repaid) return res.status(400).json({ error: 'Loan already repaid' });

  const updated = await markRepaid(id, req.user!.id);
  res.json(updated);
});

// POST /api/loans/:id/receipt - upload photo
router.post('/:id/receipt', upload.single('receipt'), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid loan id' });

  const loan = await getLoanById(id, req.user!.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Field name: receipt' });
  }

  const receiptUrl = `/uploads/${req.file.filename}`;
  const updated = await updateReceipt(id, req.user!.id, receiptUrl);
  res.json({ message: 'Receipt uploaded', loan: updated, receiptUrl });
});

export default router;
