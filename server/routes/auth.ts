import { Router, Request, Response } from 'express';
import { sendRealSmsOtp, verifySmsOtp } from '../services/sms.js';

const router = Router();

/**
 * POST /api/auth/send-otp
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    const result = await sendRealSmsOtp(mobileNumber);
    res.json(result);
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send SMS OTP' });
  }
});

/**
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const result = verifySmsOtp(mobileNumber, otp);
    if (result.valid) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
