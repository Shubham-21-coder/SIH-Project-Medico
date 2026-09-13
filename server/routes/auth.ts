import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendOtp, verifyOtp, validateSessionToken, normalizeIdentifier } from '../services/sms.js';
import {
  findUserByLoginId,
  findUserByAbhaOrAadhaar,
  createUser,
  updateUserPassword,
  logAuditTrail,
  verifyDoctorCredentials,
} from '../services/db.js';

const router = Router();

/**
 * POST /api/auth/register
 * Registers a new patient with ABHA/Aadhaar number, login ID, username, and password in SQLite DB
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

    const existingUser = findUserByLoginId(loginId.trim()) || findUserByAbhaOrAadhaar(abhaOrAadhaar.trim());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `Account with Login ID "${loginId}" or ABHA/Aadhaar number is already registered. Please Sign In.`,
      });
    }

    const newUser = createUser({
      loginId: loginId.trim(),
      username: username.trim(),
      name: username.trim(),
      password,
      abhaOrAadhaar: abhaOrAadhaar.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      age: Number(age) || 25,
      gender: gender || 'Male',
      consentGranted: true,
    });

    logAuditTrail('REGISTER_PATIENT', newUser.login_id, {
      name: newUser.name,
      abha_id: newUser.abha_id,
      aadhaar_number: newUser.aadhaar_number,
    });

    const token = `TOKEN-${crypto.randomUUID()}`;
    return res.json({
      success: true,
      message: 'New patient account registered successfully in database!',
      token,
      user: {
        loginId: newUser.login_id,
        name: newUser.name,
        username: newUser.username,
        abhaOrAadhaar: newUser.abha_id || newUser.aadhaar_number,
        abhaNumber: newUser.abha_id,
        aadhaarNumber: newUser.aadhaar_number,
        identifier: newUser.login_id,
        email: newUser.email,
        phone: newUser.phone,
        age: newUser.age,
        gender: newUser.gender,
      },
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Internal server error during database registration.' });
  }
});

/**
 * POST /api/auth/login
 * Sign in using Login ID / Email / ABHA ID and Password verified against SQLite DB
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body || {};

    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'Login ID and Password are required.' });
    }

    const user = findUserByLoginId(loginId.trim()) || findUserByAbhaOrAadhaar(loginId.trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account not found. Please verify your Login ID or register as a new user.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please check your credentials or reset password via Email OTP.',
      });
    }

    logAuditTrail('LOGIN_SUCCESS', user.login_id, { ip: req.ip });

    const token = `TOKEN-${crypto.randomUUID()}`;
    return res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: {
        loginId: user.login_id,
        name: user.name,
        username: user.username,
        abhaOrAadhaar: user.abha_id || user.aadhaar_number,
        abhaNumber: user.abha_id,
        aadhaarNumber: user.aadhaar_number,
        identifier: user.login_id,
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
 * Resets user password in SQLite DB after OTP verification
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

    const updated = updateUserPassword(targetIdentifier.trim(), newPassword.trim());
    if (updated) {
      logAuditTrail('RESET_PASSWORD_SUCCESS', targetIdentifier);
      return res.json({
        success: true,
        message: 'Password reset successfully in database! You can now Sign In with your new password.',
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'User account not found for password reset.',
      });
    }
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

/**
 * POST /api/auth/doctor/login
 * Verifies Doctor Reference ID / NMC Registration Number & Security PIN against DB & HPR Gateway
 */
router.post('/doctor/login', async (req: Request, res: Response) => {
  try {
    const { doctorId, pin } = req.body || {};

    if (!doctorId || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Doctor Reference ID / Reg. No. and Security PIN are required.',
      });
    }

    const verification = verifyDoctorCredentials(doctorId, pin);

    if (verification.verified && verification.doctor) {
      logAuditTrail('DOCTOR_VERIFIED_LOGIN', verification.doctor.doctor_ref_id, {
        name: verification.doctor.doctor_name,
        reg_no: verification.doctor.nmc_hpr_reg_no,
      });

      return res.json({
        success: true,
        message: verification.message,
        doctor: {
          id: verification.doctor.doctor_ref_id,
          name: verification.doctor.doctor_name,
          nmcRegNo: verification.doctor.nmc_hpr_reg_no,
          role: verification.doctor.speciality,
          department: verification.doctor.department,
          councilName: verification.doctor.council_name,
          status: verification.doctor.verification_status,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        error: verification.message,
      });
    }
  } catch (error: any) {
    console.error('Doctor verification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during doctor verification.' });
  }
});

export default router;
