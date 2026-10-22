import { Pool } from 'pg';

// ---- Database abstraction ----
// If DATABASE_URL is not set or PG fails, we fallback to in-memory storage
// so the app can run without Postgres (useful for demo/tests).
// In production, Postgres is used.

let pool: Pool | null = null;
export let useMemoryFallback = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  pool.on('error', (err) => {
    console.error('[DB] Pool error, falling back to memory:', err.message);
    useMemoryFallback = true;
  });
} else {
  console.warn('[DB] DATABASE_URL not set -> using in-memory storage');
  useMemoryFallback = true;
}

export function getPool() {
  return pool;
}

// Initialize schema if using Postgres
export async function initDb() {
  // If no DATABASE_URL -> skip, already in memory mode
  if (!process.env.DATABASE_URL) {
    console.log('[DB] In-memory mode: skipping init');
    return;
  }
  if (!pool) return;

  // Test connection
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected to Postgres');
  } catch (e: any) {
    console.warn('[DB] Failed to connect to Postgres, falling back to memory:', e.message);
    useMemoryFallback = true;
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name VARCHAR(100) NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
      due_date DATE NOT NULL,
      is_repaid BOOLEAN DEFAULT false,
      repaid_at TIMESTAMPTZ,
      receipt_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);`);
  console.log('[DB] Schema ready');
}

// ---------------- In-memory fallback stores ----------------
export interface UserRow {
  id: number;
  phone: string;
  created_at?: string;
}

export interface LoanRow {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_repaid: boolean;
  repaid_at?: string | null;
  receipt_url?: string | null;
  created_at: string;
}

let memUsers: UserRow[] = [];
let memLoans: LoanRow[] = [];
let memUserSeq = 1;
let memLoanSeq = 1;

// Helper to check if we should use memory
export function isMemoryMode() {
  return useMemoryFallback || !pool;
}

// ----- User operations -----
export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  if (isMemoryMode()) {
    return memUsers.find(u => u.phone === phone) || null;
  }
  const res = await pool!.query('SELECT * FROM users WHERE phone=$1', [phone]);
  return res.rows[0] || null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  if (isMemoryMode()) {
    return memUsers.find(u => u.id === id) || null;
  }
  const res = await pool!.query('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0] || null;
}

export async function createUser(phone: string): Promise<UserRow> {
  if (isMemoryMode()) {
    const u: UserRow = { id: memUserSeq++, phone, created_at: new Date().toISOString() };
    memUsers.push(u);
    return u;
  }
  const res = await pool!.query('INSERT INTO users(phone) VALUES($1) RETURNING *', [phone]);
  return res.rows[0];
}

// ----- Loan operations -----
export async function createLoan(data: Omit<LoanRow, 'id' | 'created_at' | 'repaid_at' | 'is_repaid'> & Partial<Pick<LoanRow, 'is_repaid' | 'repaid_at' | 'receipt_url'>>): Promise<LoanRow> {
  if (isMemoryMode()) {
    const loan: LoanRow = {
      id: memLoanSeq++,
      user_id: data.user_id,
      friend_name: data.friend_name,
      amount: Number(data.amount),
      due_date: data.due_date,
      is_repaid: data.is_repaid || false,
      repaid_at: data.repaid_at || null,
      receipt_url: data.receipt_url || null,
      created_at: new Date().toISOString(),
    };
    memLoans.push(loan);
    return loan;
  }
  const res = await pool!.query(
    `INSERT INTO loans(user_id, friend_name, amount, due_date, receipt_url)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [data.user_id, data.friend_name, data.amount, data.due_date, data.receipt_url || null]
  );
  return res.rows[0];
}

export async function listLoans(userId: number): Promise<LoanRow[]> {
  if (isMemoryMode()) {
    return memLoans.filter(l => l.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const res = await pool!.query('SELECT * FROM loans WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return res.rows;
}

export async function getLoanById(id: number, userId: number): Promise<LoanRow | null> {
  if (isMemoryMode()) {
    return memLoans.find(l => l.id === id && l.user_id === userId) || null;
  }
  const res = await pool!.query('SELECT * FROM loans WHERE id=$1 AND user_id=$2', [id, userId]);
  return res.rows[0] || null;
}

export async function markRepaid(id: number, userId: number): Promise<LoanRow | null> {
  if (isMemoryMode()) {
    const loan = memLoans.find(l => l.id === id && l.user_id === userId);
    if (!loan) return null;
    loan.is_repaid = true;
    loan.repaid_at = new Date().toISOString();
    return loan;
  }
  const res = await pool!.query(
    `UPDATE loans SET is_repaid=true, repaid_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId]
  );
  return res.rows[0] || null;
}

export async function updateReceipt(id: number, userId: number, receiptUrl: string): Promise<LoanRow | null> {
  if (isMemoryMode()) {
    const loan = memLoans.find(l => l.id === id && l.user_id === userId);
    if (!loan) return null;
    loan.receipt_url = receiptUrl;
    return loan;
  }
  const res = await pool!.query(
    `UPDATE loans SET receipt_url=$1 WHERE id=$2 AND user_id=$3 RETURNING *`,
    [receiptUrl, id, userId]
  );
  return res.rows[0] || null;
}

export async function getSummary(userId: number) {
  const loans = await listLoans(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalLent = 0;
  let totalRepaid = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let activeCount = 0;

  for (const l of loans) {
    const amt = Number(l.amount);
    totalLent += amt;
    if (l.is_repaid) {
      totalRepaid += amt;
    } else {
      activeCount++;
      const due = new Date(l.due_date);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        overdueAmount += amt;
        overdueCount++;
      }
    }
  }

  return {
    totalLent: Number(totalLent.toFixed(2)),
    totalRepaid: Number(totalRepaid.toFixed(2)),
    outstanding: Number((totalLent - totalRepaid).toFixed(2)),
    overdueAmount: Number(overdueAmount.toFixed(2)),
    overdueCount,
    activeCount,
    totalCount: loans.length,
  };
}

// For tests: reset memory
export function __resetMemory() {
  memUsers = [];
  memLoans = [];
  memUserSeq = 1;
  memLoanSeq = 1;
}
export function __setMemoryMode(v: boolean) {
  useMemoryFallback = v;
}
