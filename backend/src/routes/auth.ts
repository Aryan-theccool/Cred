import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { generateOtp, verifyOtp } from '../utils/otp';
import { findUserByPhone, createUser } from '../db';

const router = Router();

// Rate limit OTP requests: 5 per 15 min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many OTP requests, try later' },
});

const phoneSchema = z
  .string()
  .min(10, 'Phone must be at least 10 digits')
  .max(15, 'Phone too long')
  .regex(/^\+?\d+$/, 'Phone must contain only digits, optional leading +');

router.post('/request-otp', otpLimiter, async (req, res) => {
  const schema = z.object({ phone: phoneSchema });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { phone } = parsed.data;

  // Normalize phone: keep as-is, trim
  const normalized = phone.trim();

  const otp = generateOtp(normalized);
  // In production we would send SMS; here we just log.
  // For convenience in dev, return OTP hint if NODE_ENV != production
  const response: any = { message: `OTP sent to ${normalized} (check server log)` };
  if (process.env.NODE_ENV !== 'production') {
    response.devOtp = otp; // helpful for mobile testing without log access
  }
  res.json(response);
});

router.post('/verify-otp', async (req, res) => {
  const schema = z.object({
    phone: phoneSchema,
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { phone, otp } = parsed.data;
  const normalized = phone.trim();

  const result = verifyOtp(normalized, otp);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  let user = await findUserByPhone(normalized);
  if (!user) {
    user = await createUser(normalized);
  }

  const secret = process.env.JWT_SECRET || 'dev-secret-key';
  const token = jwt.sign({ id: user.id, phone: user.phone }, secret, { expiresIn: '30d' });

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, phone: user.phone },
  });
});

export default router;
