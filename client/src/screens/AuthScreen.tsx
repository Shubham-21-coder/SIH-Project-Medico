import React, { useState } from 'react';
import { AuthRole } from '../types/medikiosk';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('patient');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (mode === 'signup' && phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(digits.slice(-10))) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: phone.trim() || undefined,
        });
      }
    } catch (err: any) {
      setError(err?.message || (mode === 'login' ? 'Invalid email or password.' : 'Could not create account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="screen login-screen fade-in">
      <div className="login-container glass-card slide-in auth-account-card">
        <div className="login-header">
          <div className="gov-badge-row">
            <span className="gov-badge">🔒 Secure Local Account Access</span>
            <span className="gov-badge dpdp-badge">DPDP Act 2023</span>
          </div>
          <div className="login-logo">🏥</div>
          <h1>{mode === 'login' ? 'Sign in to Ayush Setu' : 'Create Ayush Setu Account'}</h1>

          <p className="subtitle">
            {mode === 'login'
              ? 'Use your local account to open the patient kiosk or physician portal.'
              : 'Register once on this machine. Your session stays on this device.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                className="input-field"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Dr. Ananya Sharma"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              className="input-field"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@hospital.local"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label>Mobile (optional)</label>
                <input
                  type="tel"
                  className="input-field"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="form-group">
                <label>Account Type *</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AuthRole)}
                >
                  <option value="patient">Patient / Kiosk User</option>
                  <option value="doctor">Physician / EMR User</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              className="input-field"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="At least 8 characters"
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                className="input-field"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="Re-enter password"
              />
            </div>
          )}

          {error && <div className="auth-error-msg">⚠️ {error}</div>}

          <div className="login-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? (
                <span className="spinner"></span>
              ) : mode === 'login' ? (
                'Login →'
              ) : (
                'Create Account →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
