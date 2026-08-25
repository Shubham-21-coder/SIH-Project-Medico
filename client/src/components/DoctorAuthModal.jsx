import React, { useState } from 'react';

const DoctorAuthModal = ({ onAuthenticate, onClose }) => {
  const [doctorId, setDoctorId] = useState('DOC-101');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!doctorId.trim()) {
      setError('Please enter Doctor ID.');
      return;
    }

    if (pin === '1234') {
      onAuthenticate({
        id: doctorId,
        name: 'Dr. Ananya Sharma',
        role: 'Senior Consultant Physician',
        department: 'Cardiology / OPD',
      });
    } else {
      setError('Invalid Doctor Security PIN. (Demo PIN is 1234)');
    }
  };

  return (
    <div className="rx-modal-overlay fade-in">
      <div className="doctor-auth-card glass-card slide-in">
        <div className="doc-auth-icon">🩺</div>
        <h2>Physician Portal Verification</h2>
        <p className="subtitle">Enter Doctor Credentials & Security PIN to access EMR</p>

        <form onSubmit={handleLogin} className="doc-auth-form">
          <div className="form-group">
            <label>Doctor ID / Reg. No.</label>
            <input
              type="text"
              className="input-field"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="e.g. DOC-101"
            />
          </div>

          <div className="form-group">
            <label>4-Digit Security PIN</label>
            <input
              type="password"
              className="input-field"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </div>

          {error && <div className="auth-error-msg">⚠️ {error}</div>}

          <div className="doc-auth-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Unlock Doctor Portal 🔓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorAuthModal;
