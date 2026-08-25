import React, { useState } from 'react';
import OtpModal from '../components/OtpModal';

const LoginScreen = ({ onSubmit, onSkip }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [identifier, setIdentifier] = useState(''); // Mobile or ABHA ID
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [pendingData, setPendingData] = useState(null);

  const validateInput = () => {
    if (!name.trim()) {
      setValidationError('Please enter patient full name.');
      return false;
    }

    if (!age || age < 1 || age > 120) {
      setValidationError('Please enter a valid age between 1 and 120.');
      return false;
    }

    const cleanId = identifier.trim().replace(/-/g, '');
    const isMobile = /^[6-9]\d{9}$/.test(cleanId);
    const isAbha = /^\d{14}$/.test(cleanId);

    if (!isMobile && !isAbha) {
      setValidationError('Please enter a valid 10-digit Mobile Number (6-9xxxxxxxx) or 14-digit ABHA ID.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInput()) return;

    const data = {
      name: name.trim(),
      age,
      gender,
      identifier: identifier.trim(),
      isGuest: false,
    };

    setPendingData(data);
    setShowOtpModal(true);
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    if (pendingData) {
      onSubmit(pendingData);
    }
  };

  const handleGuestCheckin = () => {
    onSubmit({
      name: 'Ramesh Kumar',
      age: '45',
      gender: 'Male',
      identifier: '9876543210',
      isGuest: false,
    });
  };

  return (
    <div className="screen login-screen fade-in">
      <div className="login-container glass-card slide-in">
        <div className="login-header">
          <div className="login-logo">🏥</div>
          <h1>Patient Registration & Verification</h1>
          <p className="subtitle">Official MediKiosk OPD Self-Service Check-in</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Age *</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 45"
                min="1"
                max="120"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setValidationError('');
                }}
              />
            </div>

            <div className="form-group flex-1">
              <label>Gender *</label>
              <select
                className="input-field"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>10-Digit Mobile Number or ABHA ID *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 9876543210 or 14-digit ABHA ID"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          {validationError && (
            <div className="auth-error-msg">⚠️ {validationError}</div>
          )}

          <div className="login-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              Verify Phone via SMS OTP →
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={handleGuestCheckin}
            >
              ⚡ Quick Sample Patient (Auto-Verified)
            </button>
          </div>
        </form>
      </div>

      {showOtpModal && (
        <OtpModal
          mobileNumber={pendingData?.identifier}
          onVerify={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default LoginScreen;
