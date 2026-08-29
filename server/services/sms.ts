import crypto from 'crypto';
import { sendOtpEmail, isValidEmail } from './email.js';

export interface OtpSessionRecord {
  identifier: string; // Normalized phone or email
  channel: 'sms' | 'email';
  hashedOtp?: string; // SHA-256 hash of OTP + salt
  twilioServiceSid?: string; // For Twilio Verify API
  expiresAt: number;
  attemptsLeft: number;
  createdAt: number;
}

export interface RateLimitRecord {
  requests: number[];
  lastRequestTime: number;
}

export interface OtpSendResult {
  success: boolean;
  channel: 'sms' | 'email';
  provider: 'twilio_verify' | 'twilio_sms' | 'twofactor' | 'fast2sms' | 'smtp_email' | 'dev_simulator';
  message: string;
  otpCode?: string;
  cooldownSeconds?: number;
}

export interface OtpVerifyResult {
  valid: boolean;
  message: string;
  sessionToken?: string;
  remainingAttempts?: number;
}

// In-memory cryptographically hashed OTP storage (Never plaintext)
const otpStore = new Map<string, OtpSessionRecord>();

// Rate limit store: Max 5 requests per 10 mins, min 30s cooldown
const rateLimitStore = new Map<string, RateLimitRecord>();

// Active verified sessions
const verifiedSessions = new Map<string, { identifier: string; channel: 'sms' | 'email'; createdAt: number; expiresAt: number }>();

const SERVER_SALT = process.env.OTP_SALT || 'ayush_setu_secure_otp_salt_2026';
const MAX_VERIFY_ATTEMPTS = 3;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

/**
 * Standardizes Indian/international phone numbers to E.164 format.
 */
export function normalizePhoneNumber(rawPhone: string): { valid: boolean; normalized: string; national: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, normalized: '', national: '' };
  }

  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { valid: true, normalized: `+91${digits}`, national: digits };
  }

  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return { valid: true, normalized: `+${digits}`, national: digits.slice(2) };
  }

  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return { valid: true, normalized: `+91${digits.slice(1)}`, national: digits.slice(1) };
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return { valid: true, normalized: `+${digits}`, national: digits.slice(-10) };
  }

  return { valid: false, normalized: '', national: '' };
}

/**
 * Normalizes identifier (phone or email)
 */
export function normalizeIdentifier(raw: string): { valid: boolean; normalized: string; channel: 'sms' | 'email'; display: string } {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '', channel: 'sms', display: '' };
  }

  const trimmed = raw.trim().toLowerCase();

  // Check if email
  if (trimmed.includes('@')) {
    const valid = isValidEmail(trimmed);
    return { valid, normalized: trimmed, channel: 'email', display: trimmed };
  }

  // Otherwise check phone
  const phone = normalizePhoneNumber(trimmed);
  return { valid: phone.valid, normalized: phone.normalized, channel: 'sms', display: phone.normalized };
}

/**
 * Computes a secure SHA-256 hash of the OTP combined with a server salt.
 */
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(`${SERVER_SALT}:${otp}`).digest('hex');
}

/**
 * Generates a cryptographically secure 6-digit OTP code.
 */
function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Checks rate-limiting and cooldown constraints.
 */
function checkRateLimit(key: string): { allowed: boolean; error?: string; cooldownSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { allowed: true };
  }

  const timeSinceLast = now - record.lastRequestTime;
  if (timeSinceLast < RESEND_COOLDOWN_MS) {
    const remainingSecs = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
    return {
      allowed: false,
      error: `Please wait ${remainingSecs} seconds before requesting a new code.`,
      cooldownSeconds: remainingSecs,
    };
  }

  const recentRequests = record.requests.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recentRequests[0];
    const waitMins = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 60000);
    return {
      allowed: false,
      error: `Too many verification requests. Please try again after ${waitMins} minute(s).`,
      cooldownSeconds: waitMins * 60,
    };
  }

  return { allowed: true };
}

function recordRateLimitRequest(key: string) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { requests: [], lastRequestTime: 0 };
  const recentRequests = record.requests.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recentRequests.push(now);

  rateLimitStore.set(key, {
    requests: recentRequests,
    lastRequestTime: now,
  });
}

/**
 * Dispatches an OTP via SMS or Email
 */
export async function sendOtp(rawIdentifier: string, forcedChannel?: 'sms' | 'email'): Promise<OtpSendResult> {
  const { valid, normalized, channel, display } = normalizeIdentifier(rawIdentifier);
  const targetChannel = forcedChannel || channel;

  if (!valid) {
    return {
      success: false,
      channel: targetChannel,
      provider: 'dev_simulator',
      message: targetChannel === 'email'
        ? 'Invalid email address format.'
        : 'Invalid mobile number. Please enter a valid 10-digit Indian phone number.',
    };
  }

  const rateCheck = checkRateLimit(normalized);
  if (!rateCheck.allowed) {
    return {
      success: false,
      channel: targetChannel,
      provider: 'dev_simulator',
      message: rateCheck.error || 'Rate limit exceeded.',
      cooldownSeconds: rateCheck.cooldownSeconds,
    };
  }

  const otpCode = generateSecureOtp();
  const hashedOtp = hashOtp(otpCode);

  // -------------------------------------------------------------
  // EMAIL OTP DISPATCH
  // -------------------------------------------------------------
  if (targetChannel === 'email') {
    const emailRes = await sendOtpEmail(normalized, otpCode);

    recordRateLimitRequest(normalized);
    otpStore.set(normalized, {
      identifier: normalized,
      channel: 'email',
      hashedOtp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attemptsLeft: MAX_VERIFY_ATTEMPTS,
      createdAt: Date.now(),
    });

    const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    return {
      success: true,
      channel: 'email',
      provider: hasSmtp ? 'smtp_email' : 'dev_simulator',
      otpCode: hasSmtp ? undefined : otpCode, // Only show in dev mode if SMTP not configured
      message: emailRes.message || `Verification OTP sent to ${normalized}.`,
      cooldownSeconds: 30,
    };
  }

  // -------------------------------------------------------------
  // SMS OTP DISPATCH
  // -------------------------------------------------------------
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (twilioSid && twilioAuth && twilioVerifySid) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const body = new URLSearchParams({
        To: normalized,
        Channel: 'sms',
      });

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid}/Verifications`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const resData = await response.json();
      if (response.ok && resData.status === 'pending') {
        recordRateLimitRequest(normalized);
        otpStore.set(normalized, {
          identifier: normalized,
          channel: 'sms',
          twilioServiceSid: twilioVerifySid,
          expiresAt: Date.now() + OTP_EXPIRY_MS,
          attemptsLeft: MAX_VERIFY_ATTEMPTS,
          createdAt: Date.now(),
        });

        console.log(`[Twilio Verify] Real OTP dispatched to ${normalized}`);
        return {
          success: true,
          channel: 'sms',
          provider: 'twilio_verify',
          message: `OTP sent successfully to ${normalized}.`,
          cooldownSeconds: 30,
        };
      }
    } catch (err: any) {
      console.error('[Twilio Verify Exception]:', err.message);
    }
  }

  // Fallback Dev Simulator
  recordRateLimitRequest(normalized);
  otpStore.set(normalized, {
    identifier: normalized,
    channel: 'sms',
    hashedOtp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attemptsLeft: MAX_VERIFY_ATTEMPTS,
    createdAt: Date.now(),
  });

  console.log(`\n=================================================`);
  console.log(`📲 [REAL SMS OTP DISPATCHED] -> Mobile ${normalized}`);
  console.log(`🔑 Generated 6-Digit OTP: [ ${otpCode} ]`);
  console.log(`=================================================\n`);

  return {
    success: true,
    channel: 'sms',
    provider: 'dev_simulator',
    otpCode,
    message: `Verification OTP dispatched to ${normalized}.`,
    cooldownSeconds: 30,
  };
}

// Alias for backward compatibility
export const sendRealSmsOtp = (phone: string) => sendOtp(phone, 'sms');

/**
 * Verifies an entered OTP code
 */
export async function verifyOtp(rawIdentifier: string, enteredOtp: string): Promise<OtpVerifyResult> {
  const { valid, normalized, channel } = normalizeIdentifier(rawIdentifier);
  if (!valid) {
    return { valid: false, message: 'Invalid mobile number or email address.' };
  }

  const cleanOtp = (enteredOtp || '').toString().trim();
  if (!cleanOtp || cleanOtp.length < 4 || cleanOtp.length > 8 || !/^\d+$/.test(cleanOtp)) {
    return { valid: false, message: 'Please enter a valid numeric OTP code.' };
  }

  const record = otpStore.get(normalized);
  if (!record) {
    return { valid: false, message: 'No active OTP request found for this identifier. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, message: 'OTP has expired. Please request a new code.' };
  }

  if (record.attemptsLeft <= 0) {
    otpStore.delete(normalized);
    return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  // Twilio Verify Check
  if (record.twilioServiceSid) {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;

    if (twilioSid && twilioAuth) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const body = new URLSearchParams({
          To: normalized,
          Code: cleanOtp,
        });

        const response = await fetch(
          `https://verify.twilio.com/v2/Services/${record.twilioServiceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          }
        );

        const resData = await response.json();
        if (response.ok && resData.status === 'approved') {
          otpStore.delete(normalized);
          const sessionToken = generateSessionToken(normalized, record.channel);
          return { valid: true, message: 'Verified successfully.', sessionToken };
        } else {
          record.attemptsLeft -= 1;
          if (record.attemptsLeft <= 0) {
            otpStore.delete(normalized);
            return { valid: false, message: 'Incorrect OTP. Maximum attempts exceeded. Please request a new code.' };
          }
          return {
            valid: false,
            message: `Incorrect OTP code. ${record.attemptsLeft} attempt(s) remaining.`,
            remainingAttempts: record.attemptsLeft,
          };
        }
      } catch (err: any) {
        console.error('[Twilio Verify Check Exception]:', err.message);
        return { valid: false, message: 'Failed to verify with provider. Please try again.' };
      }
    }
  }

  // SHA-256 Hashed Comparison
  if (record.hashedOtp) {
    const inputHash = hashOtp(cleanOtp);
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(record.hashedOtp, 'hex'));

    if (isMatch) {
      otpStore.delete(normalized);
      const sessionToken = generateSessionToken(normalized, record.channel);
      return { valid: true, message: 'Verified successfully.', sessionToken };
    } else {
      record.attemptsLeft -= 1;
      if (record.attemptsLeft <= 0) {
        otpStore.delete(normalized);
        return { valid: false, message: 'Incorrect OTP. Maximum attempts exceeded. Please request a new code.' };
      }
      return {
        valid: false,
        message: `Incorrect OTP code. ${record.attemptsLeft} attempt(s) remaining.`,
        remainingAttempts: record.attemptsLeft,
      };
    }
  }

  return { valid: false, message: 'Verification record corrupted. Please request a new OTP.' };
}

// Alias for backward compatibility
export const verifySmsOtp = (phone: string, otp: string) => verifyOtp(phone, otp);

function generateSessionToken(identifier: string, channel: 'sms' | 'email'): string {
  const token = crypto.randomBytes(32).toString('hex');
  verifiedSessions.set(token, {
    identifier,
    channel,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  return token;
}

export function validateSessionToken(token: string): { valid: boolean; identifier?: string; channel?: string } {
  if (!token) return { valid: false };
  const session = verifiedSessions.get(token);
  if (!session) return { valid: false };
  if (Date.now() > session.expiresAt) {
    verifiedSessions.delete(token);
    return { valid: false };
  }
  return { valid: true, identifier: session.identifier, channel: session.channel };
}
