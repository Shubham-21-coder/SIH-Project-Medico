import React from 'react';
import { PatientInfo } from '../types/medikiosk';

interface KioskNavbarProps {
  mode: 'doctor' | 'kiosk';
  onToggleMode: () => void;
  onNewPatient: (() => void) | null;
  patientInfo?: PatientInfo | null;
}

const KioskNavbar: React.FC<KioskNavbarProps> = ({ mode, onToggleMode, onNewPatient, patientInfo }) => {
  return (
    <header className="kiosk-navbar">
      <div className="kiosk-brand">
        <span className="brand-logo">🏥</span>
        <span>MediKiosk</span>
        <span className="brand-tag">OPD AI Portal</span>
      </div>

      <div className="kiosk-nav-right">
        {patientInfo && (
          <span className="patient-badge">
            👤 {patientInfo.name} ({patientInfo.age}y/{patientInfo.gender})
          </span>
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
