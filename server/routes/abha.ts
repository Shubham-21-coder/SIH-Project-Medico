import { Router, Request, Response } from 'express';
import {
  initiateAbhaAuth,
  confirmAbhaOtp,
  normalizeAbhaNumber,
  normalizeAbhaAddress,
} from '../services/abdm.js';

const router = Router();

/**
 * POST /api/abha/auth/init
 * Initiates ABDM authentication for an ABHA Number or ABHA Address
 */
router.post('/auth/init', async (req: Request, res: Response) => {
  try {
    const { abhaNumber, abhaAddress, identifier, authMode } = req.body || {};
    const targetIdentifier = identifier || abhaNumber || abhaAddress;

    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        error: '14-Digit ABHA Number or ABHA Address is required.',
      });
    }

    const result = await initiateAbhaAuth(targetIdentifier, authMode || 'MOBILE_OTP');

    if (result.success) {
      return res.json({
        success: true,
        txnId: result.txnId,
        authMode: result.authMode,
        maskedMobile: result.maskedMobile,
        provider: result.provider,
        message: result.message,
        cooldownSeconds: result.cooldownSeconds || 30,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error('[ABDM Init Route Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error while communicating with ABDM Gateway.' });
  }
});

/**
 * POST /api/abha/auth/confirm
 * Verifies ABDM OTP and returns the verified patient KYC demographic profile
 */
router.post('/auth/confirm', async (req: Request, res: Response) => {
  try {
    const { txnId, otp } = req.body || {};

    if (!txnId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID (txnId) and 6-digit OTP code are required.',
      });
    }

    const result = await confirmAbhaOtp(txnId, otp);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        profile: result.profile,
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
    console.error('[ABDM Confirm Route Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error while confirming ABDM OTP.' });
  }
});

/**
 * POST /api/abha/validate
 * Validates ABHA Number or Address format before initiating network requests
 */
router.post('/validate', (req: Request, res: Response) => {
  const { abhaNumber, abhaAddress } = req.body || {};

  const numResult = abhaNumber ? normalizeAbhaNumber(abhaNumber) : { valid: true };
  const addrResult = abhaAddress ? normalizeAbhaAddress(abhaAddress) : { valid: true };

  return res.json({
    abhaNumberValid: numResult.valid,
    abhaAddressValid: addrResult.valid,
  });
});

export default router;
