import React from 'react';
import { PatientInfo } from '../types/medikiosk';

interface RedFlagScreenProps {
  reason?: string | null;
  patientInfo?: PatientInfo | null;
  onReset: () => void;
}

const RedFlagScreen: React.FC<RedFlagScreenProps> = ({ reason, patientInfo, onReset }) => {
  return (
    <div className="screen red-flag-screen flex-center fade-in">
      <div className="red-flag-card glass-card slide-in">
        <div className="alert-icon pulse">🚨</div>
        <h1>EMERGENCY ALERT — IMMEDIATE TRIAGE REQUIRED</h1>
        <div className="patient-banner">
          👤 Patient: <strong>{patientInfo?.name || 'Patient'}</strong> ({patientInfo?.age || '35'}y, {patientInfo?.gender || 'Male'})
        </div>

        <p className="alert-desc">
          Based on your answers, your symptoms require urgent clinical evaluation. Please step to the Emergency Counter immediately.
        </p>

        {reason && (
          <div className="reason-box">
            <strong>Clinical Trigger:</strong> {reason}
          </div>
        )}

        <div className="instructions">
          <div className="step-item">
            <span className="step-num">1</span>
            <span>Do not wait in the regular OPD queue.</span>
          </div>
          <div className="step-item">
            <span className="step-num">2</span>
            <span>An emergency nurse has been automatically notified at Counter #1.</span>
          </div>
        </div>

        <button className="btn btn-danger btn-lg" onClick={onReset}>
          Acknowledge & Return to Home
        </button>
      </div>
    </div>
  );
};

export default RedFlagScreen;
