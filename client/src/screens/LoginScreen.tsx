import React, { useState } from 'react';
import { PatientInfo } from '../types/medikiosk';
import OtpModal from '../components/OtpModal';
import { loginAccount, registerAccount, resetPasswordAccount, sendSmsOtp } from '../utils/api';

interface LoginScreenProps {
  onSubmit: (info: PatientInfo) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit, onBack, onSkip }) => {
  // Main Auth Tab: 'register' (Login as a new user) vs 'signin' (Sign In)
  const [authMode, setAuthMode] = useState<'register' | 'signin'>('register');

  // Register Form Fields (Login as a New User)
  const [abhaOrAadhaar, setAbhaOrAadhaar] = useState<string>('');
  const [createLoginId, setCreateLoginId] = useState<string>('');
  const [createUsername, setCreateUsername] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [regAge, setRegAge] = useState<string>('25');
  const [regGender, setRegGender] = useState<string>('Male');
  const [regChannel, setRegChannel] = useState<'sms' | 'email'>('email');
  const [regContact, setRegContact] = useState<string>('');
  const [consentGranted, setConsentGranted] = useState<boolean>(false);

  // Sign In Form Fields
  const [signInLoginId, setSignInLoginId] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');

  // Forgot Password Flow States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [fpEmailOrLoginId, setFpEmailOrLoginId] = useState<string>('');
  const [fpOtpSent, setFpOtpSent] = useState<boolean>(false);
  const [fpOtpCode, setFpOtpCode] = useState<string>('');
  const [fpDeliveredOtp, setFpDeliveredOtp] = useState<string>('');
  const [fpNewPassword, setFpNewPassword] = useState<string>('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState<string>('');
  const [fpIsSending, setFpIsSending] = useState<boolean>(false);
  const [fpIsResetting, setFpIsResetting] = useState<boolean>(false);
  const [fpStatusMsg, setFpStatusMsg] = useState<string>('');

  // General state
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [pendingRegData, setPendingRegData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [statusSuccess, setStatusSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validate Register Form
  const validateRegister = (): boolean => {
    if (!abhaOrAadhaar.trim()) {
      setValidationError('Please enter your 14-digit ABHA ID or 12-digit Aadhaar Number.');
      return false;
    }
    if (!createLoginId.trim()) {
      setValidationError('Please create a unique Login ID (e.g. patient_123).');
      return false;
    }
    if (!createUsername.trim()) {
      setValidationError('Please enter your Full Name / Username.');
      return false;
    }
    if (!createPassword.trim() || createPassword.length < 4) {
      setValidationError('Please create a password of at least 4 characters.');
      return false;
    }
    if (!regContact.trim()) {
      setValidationError(
        regChannel === 'email'
          ? 'Please enter a valid Email Address for OTP verification.'
          : 'Please enter a valid 10-digit Phone Number for SMS OTP.'
      );
      return false;
    }
    if (!consentGranted) {
      setValidationError('Digital Health Consent is mandatory under DPDP Act 2023 to proceed.');
      return false;
    }

    setValidationError('');
    return true;
  };

  // Start Register Flow (triggers OTP verification first)
  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setPendingRegData({
      loginId: createLoginId.trim(),
      username: createUsername.trim(),
      name: createUsername.trim(),
      abhaOrAadhaar: abhaOrAadhaar.trim(),
      abhaNumber: abhaOrAadhaar.trim(),
      password: createPassword,
      age: Number(regAge) || 25,
      gender: regGender,
      email: regChannel === 'email' ? regContact.trim() : undefined,
      phone: regChannel === 'sms' ? regContact.trim() : undefined,
      identifier: createLoginId.trim() || regContact.trim(),
      consentGranted: true,
      consentTimestamp: new Date().toISOString(),
    });

    setShowOtpModal(true);
  };

  // Completed OTP verification for registration
  const handleRegOtpVerified = async (sessionToken?: string) => {
    setShowOtpModal(false);
    if (!pendingRegData) return;

    setIsSubmitting(true);
    setValidationError('');
    try {
      const res = await registerAccount(pendingRegData);
      if (res.success && res.user) {
        setStatusSuccess('✅ Account registered successfully! Initiating clinical intake...');
        setTimeout(() => {
          onSubmit({
            ...pendingRegData,
            sessionToken: res.token || sessionToken,
          });
        }, 600);
      } else {
        setValidationError((res as any).error || 'Failed to register account. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Fallback: Proceed with intake if offline demo mode
      onSubmit({
        ...pendingRegData,
        sessionToken,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Form Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoginId.trim()) {
      setValidationError('Please enter your Login ID, Email, or ABHA ID.');
      return;
    }
    if (!signInPassword.trim()) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    setStatusSuccess('');

    try {
      const res = await loginAccount({
        loginId: signInLoginId.trim(),
        password: signInPassword.trim(),
      });

      if (res.success && res.user) {
        setStatusSuccess(`✅ Welcome back, ${res.user.name || res.user.username}! Signed in successfully.`);
        setTimeout(() => {
          onSubmit({
            name: res.user.name || res.user.username,
            age: res.user.age || 25,
            gender: res.user.gender || 'Male',
            identifier: res.user.loginId || signInLoginId.trim(),
            abhaNumber: res.user.abhaOrAadhaar || res.user.abhaNumber,
            consentGranted: true,
            consentTimestamp: new Date().toISOString(),
            sessionToken: res.token,
          });
        }, 500);
      } else {
        setValidationError((res as any).error || 'Invalid Login ID or Password.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Fallback for demo sign in
      onSubmit({
        name: signInLoginId.trim().split('@')[0] || 'Registered Patient',
        age: 28,
        gender: 'Male',
        identifier: signInLoginId.trim(),
        consentGranted: true,
        consentTimestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password: Send OTP to Email
  const handleFpSendOtp = async () => {
    if (!fpEmailOrLoginId.trim()) {
      setValidationError('Please enter your registered Email address or Login ID.');
      return;
    }

    setFpIsSending(true);
    setValidationError('');
    setFpStatusMsg('');

    try {
      const res = await sendSmsOtp(fpEmailOrLoginId.trim(), 'email');
      if (res.success) {
        setFpOtpSent(true);
        setFpStatusMsg(res.message || `Verification OTP code dispatched to ${fpEmailOrLoginId}.`);
        if (res.otpCode) {
          setFpDeliveredOtp(res.otpCode);
        }
      } else {
        setValidationError(res.error || 'Failed to send OTP to mail. Please check your email address.');
      }
    } catch (err: any) {
      console.error('Forgot password OTP error:', err);
      setValidationError(err?.message || 'Unable to dispatch OTP code to mail.');
    } finally {
      setFpIsSending(false);
    }
  };

  // Forgot Password: Verify OTP & Create New Password
  const handleFpResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpOtpCode.trim() || fpOtpCode.trim().length < 4) {
      setValidationError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    if (!fpNewPassword.trim() || fpNewPassword.length < 4) {
      setValidationError('Please enter a new password of at least 4 characters.');
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setValidationError('New Password and Confirm Password do not match.');
      return;
    }

    setFpIsResetting(true);
    setValidationError('');

    try {
      const res = await resetPasswordAccount({
        email: fpEmailOrLoginId.trim(),
        loginId: fpEmailOrLoginId.trim(),
        otp: fpOtpCode.trim(),
        newPassword: fpNewPassword.trim(),
      });

      if (res.success) {
        setStatusSuccess('✅ Password reset successfully! You can now Sign In with your new password.');
        setShowForgotPasswordModal(false);
        setAuthMode('signin');
        setSignInLoginId(fpEmailOrLoginId.trim());
        setSignInPassword(fpNewPassword.trim());
        // Clear FP state
        setFpOtpSent(false);
        setFpOtpCode('');
        setFpNewPassword('');
        setFpConfirmPassword('');
      } else {
        setValidationError(res.error || 'Invalid OTP code or password reset failed.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setValidationError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setFpIsResetting(false);
    }
  };

  return (
    <div className="screen login-screen flex-center fade-in" style={{ padding: '1.5rem 1rem' }}>
      <div className="login-card glass-card slide-in" style={{ maxWidth: '640px', width: '100%', padding: '2rem' }}>
        
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ← Back to Languages
            </button>
          )}
          <div className="kiosk-badge" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
            🌿 Ayush Setu OPD Patient Portal
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: '0.3rem 0', fontWeight: 700 }}>
            Patient Intake & Verification
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Register as a new user with ABHA / Aadhaar or Sign In with existing credentials
          </p>
        </div>

        {/* 2 Main Options Selector: New User vs Sign In */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.4rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setAuthMode('register');
              setValidationError('');
              setStatusSuccess('');
            }}
            style={{
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>✨</span> 1. Login as a New User
          </button>
          <button
            type="button"
            className={`btn ${authMode === 'signin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setAuthMode('signin');
              setValidationError('');
              setStatusSuccess('');
            }}
            style={{
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🔑</span> 2. Sign In
          </button>
        </div>

        {/* Status Alerts */}
        {validationError && (
          <div
            className="auth-error-msg fade-in"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {validationError}
          </div>
        )}

        {statusSuccess && (
          <div
            className="auth-success-msg fade-in"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
            }}
          >
            {statusSuccess}
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTION 1: REGISTER / LOGIN AS A NEW USER FORM */}
        {/* ========================================================= */}
        {authMode === 'register' && (
          <form onSubmit={handleStartRegister} className="auth-form fade-in">
            <div style={{ background: 'rgba(0, 212, 170, 0.06)', border: '1px solid rgba(0, 212, 170, 0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#00d4aa' }}>
                🆔 New Patient Account Setup (ABDM & Aadhaar Enabled)
              </span>
            </div>

            {/* 1. Enter ABHA ID or Aadhaar Number */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                1. Enter ABHA ID or Aadhaar Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 14-digit ABHA (91-4920-1849-2810) or 12-digit Aadhaar Number"
                value={abhaOrAadhaar}
                onChange={(e) => setAbhaOrAadhaar(e.target.value)}
                required
              />
            </div>

            {/* 2 & 3. Create Login ID & Username */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  2. Create Login ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. patient_shubham"
                  value={createLoginId}
                  onChange={(e) => setCreateLoginId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  3. Create Username / Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Shubham Garg"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 4 & 5. Password, Age, Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  4. Create Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Create password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  Age
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Age"
                  min="1"
                  max="120"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  Gender
                </label>
                <select className="input-field" value={regGender} onChange={(e) => setRegGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* OTP Channel & Contact */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                Verification OTP Channel <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${regChannel === 'email' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRegChannel('email')}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  ✉️ Email OTP
                </button>
                <button
                  type="button"
                  className={`btn ${regChannel === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRegChannel('sms')}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  📱 Mobile SMS OTP
                </button>
              </div>
              <input
                type={regChannel === 'email' ? 'email' : 'tel'}
                className="input-field"
                placeholder={regChannel === 'email' ? 'Enter Email (e.g. shubham@example.com)' : 'Enter 10-digit Mobile (+91)'}
                value={regContact}
                onChange={(e) => setRegContact(e.target.value)}
                required
              />
            </div>

            {/* Mandatory DPDP Consent Checkbox */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.85rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: '#00d4aa' }}
                />
                <span>
                  I give explicit affirmative consent for pre-consultation health history intake, clinical AI analysis, and ABDM record synchronization under Digital Personal Data Protection (DPDP) Act 2023.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ padding: '0.85rem', fontWeight: 700, fontSize: '1rem' }}
            >
              {isSubmitting ? <span className="spinner"></span> : 'Verify OTP & Register New Account →'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* OPTION 2: SIGN IN FORM */}
        {/* ========================================================= */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form fade-in">
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>
                🔑 Sign In to Your Existing Ayush Setu Account
              </span>
            </div>

            {/* Enter Login ID */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                Enter Login ID / Email / ABHA ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your Login ID (e.g. shubham2026 or email)"
                value={signInLoginId}
                onChange={(e) => setSignInLoginId(e.target.value)}
                required
              />
            </div>

            {/* Enter Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>
                  Enter Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                    setFpEmailOrLoginId(signInLoginId);
                    setValidationError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#00d4aa', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ padding: '0.85rem', fontWeight: 700, fontSize: '1rem', marginTop: '1rem' }}
            >
              {isSubmitting ? <span className="spinner"></span> : 'Sign In & Continue →'}
            </button>
          </form>
        )}

        {/* Footer info & Guest / Skip */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>🏥 OPD Walk-in Support Available</span>
          {onSkip && (
            <button type="button" onClick={onSkip} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}>
              Continue as Guest Patient
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* OTP MODAL FOR REGISTRATION */}
      {/* ========================================================= */}
      {showOtpModal && (
        <OtpModal
          identifier={regContact}
          channel={regChannel}
          onVerify={handleRegOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ========================================================= */}
      {showForgotPasswordModal && (
        <div className="rx-modal-overlay fade-in">
          <div className="otp-modal-card glass-card slide-in" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2rem' }}>🔑</span>
              <h2 style={{ fontSize: '1.4rem', margin: '0.3rem 0' }}>Reset Password</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                Enter your registered Email/Login ID to receive an OTP code to create a new password.
              </p>
            </div>

            {validationError && (
              <div className="auth-error-msg" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {validationError}
              </div>
            )}

            {fpStatusMsg && (
              <div style={{ background: 'rgba(0, 212, 170, 0.12)', border: '1px solid rgba(0, 212, 170, 0.4)', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>
                {fpStatusMsg}
              </div>
            )}

            {fpDeliveredOtp && (
              <div
                onClick={() => setFpOtpCode(fpDeliveredOtp)}
                style={{ background: 'rgba(0, 212, 170, 0.15)', border: '1px dashed #00d4aa', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem', color: '#fff' }}
              >
                ✉️ OTP Code: <strong style={{ letterSpacing: '0.15em', fontSize: '1.1rem', color: '#00d4aa' }}>{fpDeliveredOtp}</strong> (Click to fill)
              </div>
            )}

            {!fpOtpSent ? (
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                  Enter Login ID or Registered Email
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. shubham@example.com or shubham2026"
                  value={fpEmailOrLoginId}
                  onChange={(e) => setFpEmailOrLoginId(e.target.value)}
                  style={{ marginBottom: '1.25rem' }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPasswordModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleFpSendOtp} disabled={fpIsSending} style={{ flex: 1 }}>
                    {fpIsSending ? <span className="spinner"></span> : 'Send OTP to Mail →'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFpResetPassword}>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#e2e8f0' }}>
                    6-Digit Email OTP Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter 6-digit OTP code"
                    value={fpOtpCode}
                    onChange={(e) => setFpOtpCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#e2e8f0' }}>
                    Create New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#e2e8f0' }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Re-enter new password"
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPasswordModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={fpIsResetting} style={{ flex: 1 }}>
                    {fpIsResetting ? <span className="spinner"></span> : 'Reset Password & Sign In →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
