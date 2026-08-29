import React from 'react';
import { PatientInfo } from '../types/medikiosk';

interface KioskNavbarProps {
  mode: 'doctor' | 'kiosk';
  onToggleMode: () => void;
  onNewPatient: (() => void) | null;
  onGoToLogin?: () => void;
  patientInfo?: PatientInfo | null;
}

const KioskNavbar: React.FC<KioskNavbarProps> = ({ mode, onToggleMode, onNewPatient, onGoToLogin, patientInfo }) => {
  return (
    <header className="kiosk-navbar">
      <div className="kiosk-brand" onClick={onGoToLogin} style={{ cursor: 'pointer' }}>
        <span className="brand-logo">🌿</span>
        <span>Ayush Setu</span>
        <span className="brand-tag">आयुष सेतु OPD AI</span>

      </div>

      <div className="kiosk-nav-right">
        {patientInfo && (
          <span className="patient-badge">
            👤 {patientInfo.name} ({patientInfo.age}y/{patientInfo.gender})
          </span>
        )}

        {onGoToLogin && (
          <button
            className="btn btn-secondary"
            onClick={onGoToLogin}
            style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}
          >
            📱 Patient Login / Verification
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={onToggleMode}
          style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}
        >
          {mode === 'doctor' ? '🏥 Switch to Patient Kiosk' : '🩺 Switch to Doctor Portal'}
        </button>

        {onNewPatient && (
          <button
            className="btn btn-primary"
            onClick={onNewPatient}
            style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}
          >
            + New Intake
          </button>
        )}
      </div>
    </header>
  );
};

export default KioskNavbar;
