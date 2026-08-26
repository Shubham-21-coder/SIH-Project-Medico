import React, { useState } from 'react';
import OtpModal from '../components/OtpModal';
import { PatientInfo } from '../types/medikiosk';

interface LoginScreenProps {
  onSubmit: (patientInfo: PatientInfo) => void;
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit }) => {
  const [name, setName] = useState<string>('Shubham Garg');
  const [age, setAge] = useState<string>('20');
  const [gender, setGender] = useState<string>('Male');
  const [identifier, setIdentifier] = useState<string>('91-4920-1849-2810');
  const [abhaAddress, setAbhaAddress] = useState<string>('shubham@abdm');
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [pendingData, setPendingData] = useState<PatientInfo | null>(null);

  const validateInput = (): boolean => {
    if (!name.trim()) {
      setValidationError('Please enter patient full name.');
      return false;
    }

    const ageNum = Number(age);
    if (!age || ageNum < 1 || ageNum > 120) {
      setValidationError('Please enter a valid age between 1 and 120.');
      return false;
    }

    const cleanId = identifier.trim().replace(/[-\s]/g, '');
    const isMobile = /^[6-9]\d{9}$/.test(cleanId);
    const isAbha = /^\d{14}$/.test(cleanId) || cleanId.includes('@');

    if (!isMobile && !isAbha) {
      setValidationError('Please enter a valid 10-digit Mobile Number or 14-digit ABHA ID.');
      return false;
    }

    if (!consentGranted) {
      setValidationError('Consent under DPDP Act 2023 is required to process clinical history.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleScanAbhaQr = () => {
    setName('Shubham Garg');
    setAge('20');
    setGender('Male');
    setIdentifier('91-4920-1849-2810');
    setAbhaAddress('shubhamgarg@abdm');
    setConsentGranted(true);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;

    const data: PatientInfo = {
      name: name.trim(),
      age,
      gender,
      identifier: identifier.trim(),
      abhaNumber: identifier.includes('-') ? identifier.trim() : `91-${identifier.trim()}`,
      abhaAddress: abhaAddress.trim() || `${name.toLowerCase().replace(/\s/g, '')}@abdm`,
      consentGranted: true,
      consentTimestamp: new Date().toISOString(),
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

  const handleQuickCheckin = () => {
    onSubmit({
      name: 'Shubham Garg',
      age: '20',
      gender: 'Male',
      identifier: '91-4920-1849-2810',
      abhaNumber: '91-4920-1849-2810',
      abhaAddress: 'shubhamgarg@abdm',
      consentGranted: true,
      consentTimestamp: new Date().toISOString(),
      isGuest: false,
    });
  };

  return (
    <div className="screen login-screen fade-in">
      <div className="login-container glass-card slide-in" style={{ maxWidth: '780px' }}>
        <div className="login-header">
          <div className="gov-badge-row">
            <span className="gov-badge">🇮🇳 Ayushman Bharat Digital Mission (ABDM)</span>
            <span className="gov-badge dpdp-badge">🔒 DPDP Act 2023 Compliant</span>
          </div>
          <h1>Patient Registration & ABHA Check-in</h1>
          <p className="subtitle">Instant self-service identification & digital health record linking</p>
        </div>

        {/* ABHA QR Scanner Bar */}
        <div className="abha-scan-card glass-card">
          <div className="abha-scan-icon">📱</div>
          <div className="abha-scan-info">
            <strong>Have an ABHA Health Card or QR Code?</strong>
            <p>Scan your physical card or Ayushman app QR to auto-fill your details in 1 second.</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleScanAbhaQr}>
            📷 Scan ABHA QR
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: '1.25rem' }}>
          <div className="form-group">
            <label>Patient Full Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Shubham Garg"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Age (Years) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 20"
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
                <option value="Male">Male (पुरुष)</option>
                <option value="Female">Female (महिला)</option>
                <option value="Other">Other (अन्य)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>14-Digit ABHA ID or Mobile Number *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 91-4920-1849-2810 or 9876543210"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setValidationError('');
                }}
              />
            </div>

            <div className="form-group flex-1">
              <label>ABHA Address / PHR Handle</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. username@abdm"
                value={abhaAddress}
                onChange={(e) => setAbhaAddress(e.target.value)}
              />
            </div>
          </div>

          {/* DPDP Act 2023 Consent Checkbox */}
          <div className="consent-check-row glass-card">
            <input
              type="checkbox"
              id="dpdp-consent"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              style={{ width: '22px', height: '22px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
            />
            <label htmlFor="dpdp-consent" style={{ fontSize: '0.82rem', lineHeight: 1.4, cursor: 'pointer' }}>
              <strong>DPDP Act 2023 Informed Digital Health Consent:</strong> I authorize MediKiosk to record my clinical history, analyze uploaded prescription documents, and push a structured FHIR R4 clinical summary to the treating hospital physician and my ABHA health repository.
            </label>
          </div>

          {validationError && (
            <div className="auth-error-msg">⚠️ {validationError}</div>
          )}

          <div className="login-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              Verify ABHA / Mobile via SMS OTP →
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={handleQuickCheckin}
            >
              ⚡ Fast Check-in (Pre-Verified ABHA)
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
