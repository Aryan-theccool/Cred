export interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(phone: string): string {
  // 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const entry: OtpEntry = {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  otpStore.set(phone, entry);
  console.log(`\n========== MOCK OTP ==========\n Phone: ${phone}\n OTP  : ${otp} (valid 5 min)\n============================\n`);
  return otp;
}

export function verifyOtp(phone: string, otp: string): { ok: boolean; reason?: string } {
  const entry = otpStore.get(phone);
  if (!entry) return { ok: false, reason: 'No OTP requested for this phone. Call /request-otp first.' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return { ok: false, reason: 'OTP expired. Please request a new one.' };
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return { ok: false, reason: 'Too many attempts. Request a new OTP.' };
  }
  if (entry.otp !== otp) {
    return { ok: false, reason: 'Invalid OTP' };
  }
  // Success -> consume OTP
  otpStore.delete(phone);
  return { ok: true };
}

// For testing
export function __getOtpForPhone(phone: string): string | undefined {
  return otpStore.get(phone)?.otp;
}
export function __setOtpForPhone(phone: string, otp: string, ttlMs = OTP_TTL_MS) {
  otpStore.set(phone, { otp, expiresAt: Date.now() + ttlMs, attempts: 0 });
}
export function __clearOtpStore() {
  otpStore.clear();
}
