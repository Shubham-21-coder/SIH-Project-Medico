import { Router, Request, Response } from 'express';
import { sendOtp, verifyOtp, validateSessionToken, normalizeIdentifier } from '../services/sms.js';

const router = Router();

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
 * Checks if a session token is active and valid
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
