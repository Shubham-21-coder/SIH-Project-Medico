import React, { useState, useEffect } from 'react';

const OtpModal = ({ mobileNumber, onVerify, onClose }) => {
  const [otp, setOtp] = useState(['1', '2', '3', '4']); // Pre-filled for smooth demoing
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter complete 4-digit OTP.');
      return;
    }

    if (enteredOtp === '1234') {
      onVerify();
    } else {
      setError('Invalid OTP code. (Demo OTP is 1234)');
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
          Enter 4-digit OTP sent via SMS to <strong>+91-{mobileNumber || '9876543210'}</strong>
        </p>

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
            {timer > 0 ? `Resend OTP in 00:${timer < 10 ? '0' : ''}${timer}` : 'Didn\'t receive code? Resend SMS'}
          </div>

          <div className="otp-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAutofill}>
              ⚡ Auto-fill Demo OTP (1234)
            </button>
            <div className="btn-group-row">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Verify & Continue →
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
