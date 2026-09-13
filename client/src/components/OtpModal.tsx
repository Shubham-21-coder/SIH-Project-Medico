import React, { useState, useEffect, useRef } from 'react';
import { sendSmsOtp, verifySmsOtp, confirmAbhaOtp, initiateAbhaAuth } from '../utils/api';

interface OtpModalProps {
  identifier: string; // Phone number, Email, or ABHA ID
  channel?: 'sms' | 'email';
  isAbdm?: boolean;
  initialTxnId?: string;
  maskedMobile?: string;
  onVerify: (sessionToken?: string, abhaProfile?: any) => void;
  onClose: () => void;
}

const OTP_LENGTH = 6;

function playSmsChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.08);
    osc2.start(audioCtx.currentTime + 0.08);
    osc2.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio restrictions
  }
}

function triggerSystemNotification(target: string, otpCode: string, isEmail: boolean, isAbdm: boolean) {
  if (!('Notification' in window)) return;
  const showNotif = () => {
    new Notification(
      isAbdm
        ? '🇮🇳 ABDM Health Account OTP Alert'
        : isEmail
        ? '✉️ Ayush Setu Email OTP Alert'
        : '📲 Ayush Setu SMS OTP Alert',
      {
        body: `Verification code for ${target} is ${otpCode}. Valid for 5 mins.`,
        icon: '🌿',
      }
    );
  };

  if (Notification.permission === 'granted') {
    showNotif();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') showNotif();
    });
  }
}

const OtpModal: React.FC<OtpModalProps> = ({
  identifier,
  channel = 'sms',
  isAbdm = false,
  initialTxnId = '',
  maskedMobile = '',
  onVerify,
  onClose,
}) => {
  const isEmail = !isAbdm && (channel === 'email' || identifier.includes('@'));
  const [txnId, setTxnId] = useState<string>(initialTxnId);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState<number>(30);
  const [error, setError] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [deliveredOtp, setDeliveredOtp] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(!initialTxnId);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const requestOtp = async () => {
    setIsSending(true);
    setError('');
    setStatusMsg('');
    try {
      if (isAbdm) {
        const res = await initiateAbhaAuth(identifier, 'MOBILE_OTP');
        if (res.success) {
          setTxnId(res.txnId);
          setStatusMsg(`ABDM OTP dispatched to mobile ${res.maskedMobile || 'registered with ABHA'}.`);
          setTimer(res.cooldownSeconds || 30);
        } else {
          setError(res.error || 'Failed to initiate ABDM authentication.');
          if (res.cooldownSeconds) setTimer(res.cooldownSeconds);
        }
      } else {
        const res = await sendSmsOtp(identifier, isEmail ? 'email' : 'sms');
        if (res.success) {
          setStatusMsg(res.message || (isEmail ? `Verification OTP sent to ${identifier}` : `Real OTP sent via SMS to +91-${identifier}`));
          setTimer(res.cooldownSeconds || 30);
          if (res.otpCode) {
            setDeliveredOtp(res.otpCode);
            playSmsChime();
            triggerSystemNotification(identifier, res.otpCode, isEmail, isAbdm);
          }
        } else {
          setError(res.error || 'Failed to dispatch verification code.');
          if (res.cooldownSeconds) setTimer(res.cooldownSeconds);
        }
      }
    } catch (err: any) {
      console.error('OTP request error:', err);
      setError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!initialTxnId) {
      requestOtp();
    } else {
      setStatusMsg(`ABDM OTP sent to mobile ${maskedMobile || 'registered with ABHA ID'}.`);
    }
  }, [identifier, initialTxnId]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const updated = [...otp];
    updated[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtp(updated);
    setError('');

    if (cleanVal && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const updated = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      updated[i] = pastedData[i];
    }
    setOtp(updated);
    setError('');

    const focusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleAutoFillReceived = () => {
    if (deliveredOtp) {
      setOtp(deliveredOtp.split(''));
      setError('');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length < 4) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      if (isAbdm) {
        const res = await confirmAbhaOtp(txnId, enteredOtp);
        if (res.success) {
          if (res.sessionToken) {
            sessionStorage.setItem('ayush_auth_token', res.sessionToken);
          }
          onVerify(res.sessionToken, res.profile);
        } else {
          setError(res.error || 'Invalid ABDM OTP code.');
        }
      } else {
        const res = await verifySmsOtp(identifier, enteredOtp);
        if (res.success) {
          if (res.sessionToken) {
            sessionStorage.setItem('ayush_auth_token', res.sessionToken);
          }
          onVerify(res.sessionToken);
        } else {
          setError(res.error || 'Invalid OTP code.');
        }
      }
    } catch (err: any) {
      console.error('OTP verify error:', err);
      setError(err?.message || 'Incorrect OTP code entered. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="rx-modal-overlay fade-in">
      <div className="otp-modal-card glass-card slide-in" style={{ maxWidth: '490px' }}>
        <div className="otp-icon">{isAbdm ? '🇮🇳' : isEmail ? '✉️' : '📱'}</div>
        <h2>
          {isAbdm
            ? 'ABDM / ABHA Authentication'
            : isEmail
            ? 'Patient Email Verification'
            : 'Patient Phone Verification'}
        </h2>
        <p className="subtitle">
          {isSending ? (
            <span className="scanning-text">Connecting with ABDM Gateway...</span>
          ) : isAbdm ? (
            <>
              Enter the 6-digit OTP dispatched by ABDM Gateway to the mobile number registered with{' '}
              <strong style={{ color: 'var(--accent-teal, #00d4aa)' }}>{identifier}</strong>
              {maskedMobile && <span style={{ display: 'block', marginTop: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>Linked Mobile: ({maskedMobile})</span>}
            </>
          ) : (
            <>
              Enter the 6-digit code sent to{' '}
              <strong style={{ color: 'var(--accent-teal, #00d4aa)' }}>
                {isEmail ? identifier : `+91-${identifier}`}
              </strong>
            </>
          )}
        </p>

        {deliveredOtp && (
          <div
            onClick={handleAutoFillReceived}
            style={{
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid rgba(0, 212, 170, 0.4)',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.85rem',
              color: '#10b981',
              marginBottom: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            title="Click to auto-fill"
          >
            {isEmail ? '✉️' : '📲'} <strong>[Real Verification Alert]</strong> OTP Code:{' '}
            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {deliveredOtp}
            </span>{' '}
            (Click to fill)
          </div>
        )}

        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-inputs-row" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1.25rem 0' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="otp-box"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                disabled={isVerifying || isSending}
              />
            ))}
          </div>

          {error && (
            <div className="auth-error-msg" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="otp-timer" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            {timer > 0 ? (
              <span>Resend code in <strong style={{ color: '#fff' }}>00:{timer < 10 ? '0' : ''}{timer}</strong></span>
            ) : (
              <button
                type="button"
                className="btn-icon text-accent"
                onClick={requestOtp}
                disabled={isSending}
                style={{ background: 'none', border: 'none', color: '#00d4aa', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                🔄 Resend {isAbdm ? 'ABDM' : isEmail ? 'Email' : 'SMS'} OTP
              </button>
            )}
          </div>

          <div className="otp-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isVerifying || isSending || otp.join('').length < 4}
              style={{ flex: 1 }}
            >
              {isVerifying ? <span className="spinner"></span> : 'Verify & Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
