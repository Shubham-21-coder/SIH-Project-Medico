import React from 'react';
import { PatientInfo } from '../types/medikiosk';

interface KioskNavbarProps {
  mode: 'doctor' | 'kiosk';
  onToggleMode: () => void;
  onNewPatient: (() => void) | null;
  onGoToLogin?: () => void;
  patientInfo?: PatientInfo | null;
  onMyRecords?: () => void;
  showTimeoutWarning?: boolean;
  onDismissTimeout?: () => void;
}

const KioskNavbar: React.FC<KioskNavbarProps> = ({
  mode,
  onToggleMode,
  onNewPatient,
  onGoToLogin,
  patientInfo,
  onMyRecords,
  showTimeoutWarning,
  onDismissTimeout,
}) => {
  return (
    <header className="kiosk-navbar">
      <div className="kiosk-brand" onClick={onGoToLogin} style={{ cursor: 'pointer' }}>
        <span className="brand-logo">🌿</span>
        <span className="brand-name">Ayush Setu</span>
        <span className="brand-tag">आयुष सेतु OPD AI</span>
      </div>

      {showTimeoutWarning && (
        <div className="timeout-warning-banner" style={{ background: '#f59e0b', color: '#0f172a', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⏳ Inactive Session Warning — Click anywhere to stay active
          {onDismissTimeout && <button onClick={onDismissTimeout} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>}
        </div>
      )}

      <div className="kiosk-nav-right">
        {patientInfo && (
          <span className="patient-badge nav-patient-badge">
            <span className="patient-badge-full">👤 {patientInfo.name} ({patientInfo.age}y/{patientInfo.gender})</span>
            <span className="patient-badge-short">👤 {patientInfo.name}</span>
          </span>
        )}

        {onMyRecords && (
          <button
            className="btn btn-secondary nav-btn"
            onClick={onMyRecords}
            title="View Patient Dashboard & Encounters"
          >
            <span className="nav-text-full">📋 My Encounters</span>
            <span className="nav-text-short">📋 Records</span>
          </button>
        )}

        {onGoToLogin && (
          <button
            className="btn btn-secondary nav-btn"
            onClick={onGoToLogin}
            title="Patient Login / Verification"
          >
            <span className="nav-text-full">📱 Patient Login</span>
            <span className="nav-text-short">📱 Login</span>
          </button>
        )}

        <button
          className="btn btn-secondary nav-btn"
          onClick={onToggleMode}
          title={mode === 'doctor' ? 'Switch to Patient Kiosk' : 'Switch to Doctor Portal'}
        >
          <span className="nav-text-full">{mode === 'doctor' ? '🏥 Switch to Patient Kiosk' : '🩺 Switch to Doctor Portal'}</span>
          <span className="nav-text-short">{mode === 'doctor' ? '🏥 Kiosk' : '🩺 Doctor'}</span>
        </button>

        {onNewPatient && (
          <button
            className="btn btn-primary nav-btn nav-btn-primary"
            onClick={onNewPatient}
            title="Start New Patient Intake"
          >
            <span className="nav-text-full">+ New Intake</span>
            <span className="nav-text-short">+ New</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default KioskNavbar;
