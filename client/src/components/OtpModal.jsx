import React, { useState, useEffect } from 'react';
import { sendSmsOtp, verifySmsOtp } from '../utils/api';

const OtpModal = ({ mobileNumber, onVerify, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [serverMsg, setServerMsg] = useState('');
  const [isSending, setIsSending] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const requestSms = async () => {
    setIsSending(true);
    setError('');
    try {
      const res = await sendSmsOtp(mobileNumber || '9876543210');
      if (res.otpCode) {
        setServerMsg(`[SMS Sent] Real OTP: ${res.otpCode}`);
        // Pre-fill digits for smooth demo
        setOtp(res.otpCode.split(''));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send SMS OTP. (Fallback Demo OTP is 1234)');
      setOtp(['1', '2', '3', '4']);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    requestSms();
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, [mobileNumber]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter complete 4-digit OTP.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await verifySmsOtp(mobileNumber || '9876543210', enteredOtp);
      if (res.success) {
        onVerify();
      } else {
        setError(res.error || 'Invalid OTP code.');
      }
    } catch (err) {
      if (enteredOtp === '1234') {
        onVerify();
      } else {
        setError('Invalid OTP code. (Demo OTP is 1234)');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAutofill = () => {
    setOtp(['1', '2', '3', '4']);
    setError('');
  };

  return (
    <div className="rx-modal-overlay fade-in">
      <div className="otp-modal-card glass-card slide-in">
        <div className="otp-icon">📱</div>
        <h2>Patient Phone Verification</h2>
        <p className="subtitle">
          {isSending ? (
            <span className="scanning-text">Dispatching Real SMS OTP...</span>
          ) : (
            <>Enter 4-digit OTP sent via SMS to <strong>+91-{mobileNumber || '9876543210'}</strong></>
          )}
        </p>

        {serverMsg && <div className="sms-debug-toast">📲 {serverMsg}</div>}

        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-inputs-row">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                className="otp-box"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
              />
            ))}
          </div>

          {error && <div className="auth-error-msg">⚠️ {error}</div>}

          <div className="otp-timer">
            {timer > 0 ? (
              `Resend OTP in 00:${timer < 10 ? '0' : ''}${timer}`
            ) : (
              <button
                type="button"
                className="btn-icon text-accent"
                onClick={() => {
                  setTimer(30);
                  requestSms();
                }}
              >
                🔄 Resend SMS OTP
              </button>
            )}
          </div>

          <div className="otp-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAutofill}>
              ⚡ Auto-fill Demo OTP (1234)
            </button>
            <div className="btn-group-row">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isVerifying}>
                {isVerifying ? <span className="spinner"></span> : 'Verify & Continue →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
