import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sendOtp, verifyOtp, validateSessionToken, normalizeIdentifier } from '../services/sms.js';

const router = Router();

interface UserRecord {
  loginId: string;
  username: string;
  abhaOrAadhaar: string;
  password: string;
  email?: string;
  phone?: string;
  age?: string | number;
  gender?: string;
  createdAt: string;
}

// In-memory user database
const usersDb = new Map<string, UserRecord>();

// Pre-seed a demo patient account for testing
usersDb.set('shubham2026', {
  loginId: 'shubham2026',
  username: 'Shubham Garg',
  abhaOrAadhaar: '91-4920-1849-2810',
  password: 'password123',
  email: 'shubham@example.com',
  phone: '7500259740',
  age: '20',
  gender: 'Male',
  createdAt: new Date().toISOString(),
});

/**
 * POST /api/auth/register
 * Registers a new patient with ABHA/Aadhaar number, login ID, username, and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { loginId, username, abhaOrAadhaar, password, email, phone, age, gender } = req.body || {};

    if (!loginId || !username || !abhaOrAadhaar || !password) {
      return res.status(400).json({
        success: false,
        error: 'Login ID, Username, ABHA ID/Aadhaar Number, and Password are all required.',
      });
    }

    const key = loginId.trim().toLowerCase();
    if (usersDb.has(key)) {
      return res.status(400).json({
        success: false,
        error: `Login ID "${loginId}" is already taken. Please choose another Login ID or Sign In.`,
      });
    }

    const newUser: UserRecord = {
      loginId: loginId.trim(),
      username: username.trim(),
      abhaOrAadhaar: abhaOrAadhaar.trim(),
      password,
      email: email?.trim(),
      phone: phone?.trim(),
      age: age || 25,
      gender: gender || 'Male',
      createdAt: new Date().toISOString(),
    };

    usersDb.set(key, newUser);

    const token = `TOKEN-${crypto.randomUUID()}`;
    return res.json({
      success: true,
      message: 'New user account registered successfully!',
      token,
      user: {
        loginId: newUser.loginId,
        name: newUser.username,
        username: newUser.username,
        abhaOrAadhaar: newUser.abhaOrAadhaar,
        abhaNumber: newUser.abhaOrAadhaar,
        identifier: newUser.loginId,
        email: newUser.email,
        phone: newUser.phone,
        age: newUser.age,
        gender: newUser.gender,
      },
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Sign in using Login ID and Password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body || {};

    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'Login ID and Password are required.' });
    }

    const key = loginId.trim().toLowerCase();
    let user = usersDb.get(key);

    // Also search by email or ABHA ID if not found directly by loginId key
    if (!user) {
      for (const u of usersDb.values()) {
        if (
          u.email?.toLowerCase() === key ||
          u.abhaOrAadhaar.replace(/\D/g, '') === key.replace(/\D/g, '')
        ) {
          user = u;
          break;
        }
      }
    }

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Login ID or Password. If you do not have an account, please register as a new user.',
      });
    }

    const token = `TOKEN-${crypto.randomUUID()}`;
    return res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: {
        loginId: user.loginId,
        name: user.username,
        username: user.username,
        abhaOrAadhaar: user.abhaOrAadhaar,
        abhaNumber: user.abhaOrAadhaar,
        identifier: user.loginId,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
      },
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Internal server error during sign in.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Resets user password after OTP verification sent to email
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { loginId, email, otp, newPassword } = req.body || {};
    const targetIdentifier = email || loginId;

    if (!targetIdentifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email/Login ID, OTP code, and New Password are required.',
      });
    }

    // Verify OTP code
    const otpResult = await verifyOtp(targetIdentifier, otp);
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        error: otpResult.message || 'Invalid or expired OTP code. Password reset failed.',
      });
    }

    // Locate user record to update password
    const key = (loginId || email).trim().toLowerCase();
    let user = usersDb.get(key);

    if (!user) {
      for (const u of usersDb.values()) {
        if (u.email?.toLowerCase() === key || u.loginId.toLowerCase() === key) {
          user = u;
          break;
        }
      }
    }

    if (user) {
      user.password = newPassword;
      usersDb.set(user.loginId.toLowerCase(), user);
    }

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now Sign In with your new password.',
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, error: 'Internal server error during password reset.' });
  }
});

/**
 * POST /api/auth/send-otp
 * Dispatches an OTP via SMS or Email
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, identifier, channel } = req.body || {};
    const targetIdentifier = identifier || email || mobileNumber;

    if (!targetIdentifier) {
      return res.status(400).json({ success: false, error: 'Mobile number or Email address is required.' });
    }

    const { valid, channel: detectedChannel } = normalizeIdentifier(targetIdentifier);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: detectedChannel === 'email'
          ? 'Please enter a valid email address (e.g. name@example.com).'
          : 'Please enter a valid 10-digit Indian phone number (e.g. 9876543210).',
      });
    }

    const result = await sendOtp(targetIdentifier, channel || detectedChannel);

    if (result.success) {
      return res.json({
        success: true,
        channel: result.channel,
        provider: result.provider,
        message: result.message,
        otpCode: result.otpCode,
        cooldownSeconds: result.cooldownSeconds || 30,
      });
    } else {
      const isRateLimit = result.message.toLowerCase().includes('wait') || result.message.toLowerCase().includes('too many');
      const statusCode = isRateLimit ? 429 : 400;
      return res.status(statusCode).json({
        success: false,
        channel: result.channel,
        error: result.message,
        cooldownSeconds: result.cooldownSeconds,
      });
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Internal server error while sending OTP.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies submitted OTP code for phone or email
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, identifier, otp } = req.body || {};
    const targetIdentifier = identifier || email || mobileNumber;

    if (!targetIdentifier || !otp) {
      return res.status(400).json({ success: false, error: 'Identifier and OTP code are required.' });
    }

    const result = await verifyOtp(targetIdentifier, otp);

    if (result.valid) {
      return res.json({
        success: true,
        message: result.message,
        sessionToken: result.sessionToken,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message,
        remainingAttempts: result.remainingAttempts,
      });
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Internal server error while verifying OTP.' });
  }
});

/**
 * GET /api/auth/session
 */
router.get('/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No session token provided.' });
  }

  const session = validateSessionToken(token);
  if (session.valid) {
    return res.json({ valid: true, identifier: session.identifier, channel: session.channel });
  } else {
    return res.status(401).json({ valid: false, error: 'Session expired or invalid.' });
  }
});

export default router;
