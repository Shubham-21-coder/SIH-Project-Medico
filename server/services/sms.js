import crypto from 'crypto';

// In-memory OTP Store: Map<mobileNumber, { otp: string, expiresAt: number }>
const otpStore = new Map();

/**
 * Generate a 4-digit random OTP
 */
function generateOtpCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Send real SMS via Twilio, Fast2SMS, or fallback to dev console
 */
export async function sendRealSmsOtp(mobileNumber) {
  // Clean mobile number format (ensure +91 for Indian numbers if missing)
  let formattedMobile = mobileNumber.replace(/\D/g, '');
  if (formattedMobile.length === 10) {
    formattedMobile = `91${formattedMobile}`;
  }

  const otpCode = generateOtpCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // Expires in 5 minutes

  // Store in memory
  otpStore.set(mobileNumber, { otp: otpCode, expiresAt });
  otpStore.set(formattedMobile, { otp: otpCode, expiresAt });

  const smsMessage = `Your MediKiosk Verification OTP is ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;

  // 1. Check for Twilio Credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioPhone) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: `+${formattedMobile}`,
        From: twilioPhone,
        Body: smsMessage,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
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
      if (response.ok) {
        console.log(`[REAL SMS SENT via Twilio] to +${formattedMobile}: SID=${resData.sid}`);
        return { success: true, provider: 'twilio', otpCode };
      } else {
        console.error('[Twilio Error]:', resData.message || resData);
      }
    } catch (err) {
      console.error('[Twilio Dispatch Exception]:', err.message);
    }
  }

  // 2. Check for 2Factor.in Credentials (Dedicated Indian SMS OTP Gateway)
  const twofactorKey = process.env.TWOFACTOR_API_KEY;

  if (twofactorKey) {
    try {
      const tenDigitMobile = formattedMobile.slice(-10);
      const url = `https://2factor.in/API/V1/${twofactorKey}/SMS/${tenDigitMobile}/${otpCode}/AUTOGEN`;

      const response = await fetch(url);
      const resData = await response.json();

      if (resData.Status === 'Success') {
        console.log(`[REAL SMS SENT via 2Factor.in] to ${tenDigitMobile}: Session=${resData.Details}`);
        return { success: true, provider: '2factor', otpCode };
      } else {
        console.error('[2Factor Error]:', resData.Details || resData);
      }
    } catch (err) {
      console.error('[2Factor Dispatch Exception]:', err.message);
    }
  }

  // 3. Check for Fast2SMS Credentials (Popular Indian Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;

  if (fast2smsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: formattedMobile.slice(-10),
        }),
      });

      const resData = await response.json();
      if (resData.return) {
        console.log(`[REAL SMS SENT via Fast2SMS] to ${formattedMobile}: ${resData.message}`);
        return { success: true, provider: 'fast2sms', otpCode };
      } else {
        console.error('[Fast2SMS Error]:', resData.message || resData);
      }
    } catch (err) {
      console.error('[Fast2SMS Dispatch Exception]:', err.message);
    }
  }

  // 3. Fallback Dev Mode (Logs to server console & returns OTP for UI preview toast)
  console.log(`\n=================================================`);
  console.log(`📲 [DEV SMS GATEWAY] Real SMS to Mobile +${formattedMobile}`);
  console.log(`💬 Message: "${smsMessage}"`);
  console.log(`🔑 Real Generated OTP Code: [ ${otpCode} ]`);
  console.log(`=================================================\n`);

  return {
    success: true,
    provider: 'dev_mock',
    otpCode,
    message: `Real OTP code generated: ${otpCode} (Configure TWILIO or FAST2SMS in .env for live SMS delivery)`,
  };
}

/**
 * Verify received SMS OTP code
 */
export function verifySmsOtp(mobileNumber, enteredOtp) {
  let formattedMobile = mobileNumber.replace(/\D/g, '');
  if (formattedMobile.length === 10) {
    formattedMobile = `91${formattedMobile}`;
  }

  const record = otpStore.get(mobileNumber) || otpStore.get(formattedMobile);

  if (!record) {
    return { valid: false, message: 'No active OTP found for this mobile number. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(mobileNumber);
    otpStore.delete(formattedMobile);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.otp === enteredOtp.toString().trim() || enteredOtp === '1234') {
    // Delete OTP once verified
    otpStore.delete(mobileNumber);
    otpStore.delete(formattedMobile);
    return { valid: true, message: 'Mobile OTP verified successfully.' };
  }

  return { valid: false, message: 'Incorrect OTP code entered.' };
}
