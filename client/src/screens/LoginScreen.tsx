import React, { useState } from 'react';
import { PatientInfo } from '../types/medikiosk';
import OtpModal from '../components/OtpModal';

interface LoginScreenProps {
  onSubmit: (info: PatientInfo) => void;
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit, onSkip }) => {
  const [authChannel, setAuthChannel] = useState<'sms' | 'email'>('sms');
  const [name, setName] = useState<string>('Shubham Garg');
  const [age, setAge] = useState<string>('20');
  const [gender, setGender] = useState<string>('Male');
  const [identifier, setIdentifier] = useState<string>('7500259740');
  const [emailAddress, setEmailAddress] = useState<string>('shubham@gmail.com');
  const [abhaAddress, setAbhaAddress] = useState<string>('shubham@abdm');
  const [originHospital, setOriginHospital] = useState<string>('SMS Hospital, Jaipur (Rajasthan)');
  const [currentHospital, setCurrentHospital] = useState<string>('SN Medical College & Hospital, Agra (UP)');
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [pendingData, setPendingData] = useState<PatientInfo | null>(null);
  const [federatedDiscovered, setFederatedDiscovered] = useState<boolean>(false);

  const validateInput = (): boolean => {
    if (!name.trim()) {
      setValidationError('Please enter patient full name.');
      return false;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
      setValidationError('Please enter a valid age between 1 and 120.');
      return false;
    }

    if (authChannel === 'sms') {
      const cleanPhone = identifier.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setValidationError('Please enter a valid 10-digit Indian mobile number.');
        return false;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress.trim())) {
        setValidationError('Please enter a valid email address (e.g. name@example.com).');
        return false;
      }
    }

    if (!consentGranted) {
      setValidationError('Digital Health Consent is mandatory under DPDP Act 2023 to proceed.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleScanAbhaQr = () => {
    setName('Shubham Garg');
    setAge('20');
    setGender('Male');
    setIdentifier('7500259740');
    setAbhaAddress('shubhamgarg@abdm');
    setOriginHospital('SMS Hospital, Jaipur (Rajasthan)');
    setCurrentHospital('SN Medical College & Hospital, Agra (UP)');
    setConsentGranted(true);
    setFederatedDiscovered(true);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;

    const data: PatientInfo = {
      name: name.trim(),
      age,
      gender,
      identifier: authChannel === 'sms' ? identifier.trim() : emailAddress.trim(),
      abhaNumber: identifier.includes('-') ? identifier.trim() : `91-${identifier.trim()}`,
      abhaAddress: abhaAddress.trim() || `${name.toLowerCase().replace(/\s/g, '')}@abdm`,
      originHospital,
      currentHospital,
      consentGranted: true,
      consentTimestamp: new Date().toISOString(),
      isGuest: false,
    };

    setPendingData(data);
    setShowOtpModal(true);
  };

  const handleOtpVerified = (sessionToken?: string) => {
    setShowOtpModal(false);
    if (pendingData) {
      onSubmit({
        ...pendingData,
        sessionToken,
      });
    }
  };

  const handleQuickCheckin = () => {
    onSubmit({
      name: 'Shubham Garg',
      age: '20',
      gender: 'Male',
      identifier: '7500259740',
      abhaNumber: '91-4920-1849-2810',
      abhaAddress: 'shubhamgarg@abdm',
      originHospital: 'SMS Hospital, Jaipur (Rajasthan)',
      currentHospital: 'SN Medical College & Hospital, Agra (UP)',
      consentGranted: true,
      consentTimestamp: new Date().toISOString(),
      isGuest: false,
    });
  };

  return (
    <div className="screen login-screen fade-in">
      <div className="login-container glass-card slide-in" style={{ maxWidth: '820px' }}>
        {/* Hospital Facility Context */}
        <div style={{ background: 'rgba(29, 112, 184, 0.15)', border: '1px solid var(--accent-civic-blue, #1d70b8)', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🏥 Current Check-in Facility
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              SN Medical College & Hospital, Agra (UP) • OPD Intake Desk
            </div>
          </div>
          <span className="gov-badge" style={{ fontSize: '0.7rem' }}>● Ayush Setu Gateway Live</span>
        </div>

        <div className="login-header">
          <div className="gov-badge-row">
            <span className="gov-badge">🇮🇳 Ayushman Bharat Digital Mission (ABDM)</span>
            <span className="gov-badge dpdp-badge">🔒 DPDP Act 2023 Compliant</span>
          </div>
          <h1>Patient Registration & Verification</h1>
          <p className="subtitle">Instant self-service identification via Mobile SMS or Email OTP</p>
        </div>

        {/* ABHA QR Scanner Bar */}
        <div className="abha-scan-card glass-card">
          <div className="abha-scan-icon">📱</div>
          <div className="abha-scan-info">
            <strong>Cross-City ABHA Check-in (e.g. Jaipur Patient at Agra Hospital)</strong>
            <p>Scan physical ABHA Card / QR to verify identity and pull past medical records on-demand.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleScanAbhaQr}
          >
            📷 Scan ABHA QR Code
          </button>
        </div>

        {/* Federated Record Discovery Alert */}
        {federatedDiscovered && (
          <div className="glass-card slide-in" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', border: '1.5px solid #10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
              <span>🌐</span>
              <span>ABDM National Federated Grid: Patient Records Discovered!</span>
            </div>
            <p style={{ fontSize: '0.82rem', margin: '0.3rem 0 0.5rem', color: 'var(--text-secondary)' }}>
              Found prior health records from <strong>SMS Medical College, Jaipur (Rajasthan)</strong>. With patient's DPDP consent, records will be pulled directly to Agra OPD Dr. Ananya Sharma's queue.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="ocr-verified-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem' }}>
                ✓ 2 Prescriptions (Jaipur OPD)
              </span>
              <span className="ocr-verified-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem' }}>
                ✓ 1 Lab Report (Glucose / HbA1c)
              </span>
              <span className="ocr-verified-badge" style={{ background: '#1d70b8', color: '#fff', fontSize: '0.72rem' }}>
                ✓ Assigned Token #104 ➔ Dr. Ananya Sharma (Room 104)
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: '1.25rem' }}>
          {/* Verification Channel Selector (SMS / Email) */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${authChannel === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setAuthChannel('sms');
                setValidationError('');
              }}
              style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
            >
              📱 Mobile SMS OTP
            </button>
            <button
              type="button"
              className={`btn ${authChannel === 'email' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setAuthChannel('email');
                setValidationError('');
              }}
              style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
            >
              ✉️ Email Address OTP
            </button>
          </div>

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

          {authChannel === 'sms' ? (
            <div className="form-row">
              <div className="form-group flex-1">
                <label>10-Digit Mobile Number (SMS OTP) *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 7500259740"
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
          ) : (
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Patient Email Address (Email OTP) *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="e.g. shubham@gmail.com"
                  value={emailAddress}
                  onChange={(e) => {
                    setEmailAddress(e.target.value);
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
          )}

          {/* DPDP Act 2023 Consent Checkbox */}
          <div className="consent-check-row glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="dpdp-consent"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                style={{ width: '22px', height: '22px', accentColor: 'var(--accent-teal)', cursor: 'pointer', marginTop: '2px' }}
              />
              <label htmlFor="dpdp-consent" style={{ fontSize: '0.82rem', lineHeight: 1.4, cursor: 'pointer' }}>
                <strong>DPDP Act 2023 Informed Digital Health Consent:</strong> I authorize Ayush Setu to record my clinical history, analyze uploaded prescription documents, and push a structured FHIR R4 clinical summary to the treating hospital physician and my ABHA health repository.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.2rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                onClick={() => {
                  const consentAudio = new SpeechSynthesisUtterance(
                    'डीपी डीपी एक्ट 2023 के तहत आपकी सहमति से आपका स्वास्थ्य विवरण सुरक्षित रूप से केवल आपके डॉक्टर के परामर्श और आभा रिकॉर्ड के लिए दर्ज किया जा रहा है।'
                  );
                  consentAudio.lang = 'hi-IN';
                  window.speechSynthesis.speak(consentAudio);
                }}
              >
                🔊 Listen Consent Audio (ऑडियो में सहमति सुनें)
              </button>
            </div>
          </div>

          {validationError && (
            <div className="auth-error-msg">⚠️ {validationError}</div>
          )}

          <div className="login-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              {authChannel === 'sms' ? 'Verify Mobile via SMS OTP →' : 'Verify Email via Email OTP →'}
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
          identifier={authChannel === 'sms' ? identifier : emailAddress}
          channel={authChannel}
          onVerify={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default LoginScreen;
