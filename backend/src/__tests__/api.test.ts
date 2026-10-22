import request from 'supertest';
import app from '../index';
import { __resetMemory, __setMemoryMode } from '../db';
import { __clearOtpStore, __getOtpForPhone, __setOtpForPhone } from '../utils/otp';

// Ensure memory mode for tests
beforeAll(() => {
  __setMemoryMode(true);
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  __resetMemory();
  __clearOtpStore();
});

describe('Auth flow', () => {
  it('should request OTP and verify and return token', async () => {
    const phone = '+919876543210';

    // Request OTP
    const req1 = await request(app).post('/api/auth/request-otp').send({ phone });
    expect(req1.status).toBe(200);
    expect(req1.body.message).toMatch(/OTP sent/);

    const otp = __getOtpForPhone(phone);
    expect(otp).toBeDefined();
    expect(otp).toMatch(/^\d{6}$/);

    // Verify OTP
    const req2 = await request(app).post('/api/auth/verify-otp').send({ phone, otp });
    expect(req2.status).toBe(200);
    expect(req2.body.token).toBeDefined();
    expect(req2.body.user.phone).toBe(phone);
  });

  it('should reject invalid OTP', async () => {
    const phone = '+919876543211';
    await request(app).post('/api/auth/request-otp').send({ phone });
    const res = await request(app).post('/api/auth/verify-otp').send({ phone, otp: '000000' });
    expect(res.status).toBe(401);
  });

  it('should reject invalid phone', async () => {
    const res = await request(app).post('/api/auth/request-otp').send({ phone: 'abc' });
    expect(res.status).toBe(400);
  });

  it('should reject expired OTP', async () => {
    const phone = '+919876543212';
    await request(app).post('/api/auth/request-otp').send({ phone });
    // Manually expire
    __setOtpForPhone(phone, '123456', -1000);
    const res = await request(app).post('/api/auth/verify-otp').send({ phone, otp: '123456' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });
});

describe('Loans API', () => {
  let token: string;

  async function login(phone = '+919999999999') {
    await request(app).post('/api/auth/request-otp').send({ phone });
    const otp = __getOtpForPhone(phone)!;
    const res = await request(app).post('/api/auth/verify-otp').send({ phone, otp });
    return res.body.token as string;
  }

  beforeEach(async () => {
    token = await login();
  });

  it('should create a loan entry with validation', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendName: 'Aman', amount: 500, dueDate: '2026-12-31' });
    expect(res.status).toBe(201);
    expect(res.body.friend_name).toBe('Aman');
    expect(Number(res.body.amount)).toBe(500);
  });

  it('should reject invalid amount', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendName: 'Aman', amount: -10, dueDate: '2026-12-31' });
    expect(res.status).toBe(400);
  });

  it('should reject missing friendName', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500, dueDate: '2026-12-31' });
    expect(res.status).toBe(400);
  });

  it('should list loans and highlight overdue', async () => {
    // overdue loan
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendName: 'Overdue Friend', amount: 1000, dueDate: '2020-01-01' });

    // future loan
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendName: 'Future Friend', amount: 2000, dueDate: '2099-01-01' });

    const list = await request(app).get('/api/loans').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(2);
    const overdue = list.body.find((l: any) => l.friend_name === 'Overdue Friend');
    expect(overdue.isOverdue).toBe(true);
    expect(list.body.find((l: any) => l.friend_name === 'Future Friend').isOverdue).toBe(false);
  });

  it('should mark as repaid', async () => {
    const created = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendName: 'Rahul', amount: 750, dueDate: '2026-12-31' });

    const id = created.body.id;

    const repaid = await request(app).patch(`/api/loans/${id}/repay`).set('Authorization', `Bearer ${token}`);
    expect(repaid.status).toBe(200);
    expect(repaid.body.is_repaid).toBe(true);

    // double repay should fail
    const second = await request(app).patch(`/api/loans/${id}/repay`).set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(400);
  });

  it('should return summary correctly', async () => {
    await request(app).post('/api/loans').set('Authorization', `Bearer ${token}`).send({ friendName: 'Amit', amount: 1000, dueDate: '2020-01-01' });
    await request(app).post('/api/loans').set('Authorization', `Bearer ${token}`).send({ friendName: 'Bharat', amount: 2000, dueDate: '2099-01-01' });
    const c = await request(app).post('/api/loans').set('Authorization', `Bearer ${token}`).send({ friendName: 'Chetan', amount: 3000, dueDate: '2026-12-31' });

    // repay C
    await request(app).patch(`/api/loans/${c.body.id}/repay`).set('Authorization', `Bearer ${token}`);

    const summary = await request(app).get('/api/loans/summary').set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.totalLent).toBe(6000);
    expect(summary.body.totalRepaid).toBe(3000);
    expect(summary.body.overdueAmount).toBe(1000);
    expect(summary.body.overdueCount).toBe(1);
    expect(summary.body.activeCount).toBe(2);
  });

  it('should require auth', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app).get('/api/loans').set('Authorization', 'Bearer invalid');
    expect(res.status).toBe(401);
  });
});
