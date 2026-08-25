import React from 'react';
import { PrescriptionData, PatientInfo } from '../types/medikiosk';

interface PrescriptionPrintViewProps {
  prescription: PrescriptionData;
  patientInfo?: PatientInfo | null;
  chiefComplaint?: string;
  onClose: () => void;
}

const PrescriptionPrintView: React.FC<PrescriptionPrintViewProps> = ({
  prescription,
  patientInfo,
  chiefComplaint,
  onClose,
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rx-modal-overlay fade-in">
      <div className="rx-letterhead-card glass-card slide-in">
        {/* Modal Controls */}
        <div className="rx-modal-header no-print">
          <h2>📄 Official Prescription Letterhead</h2>
          <div className="rx-modal-actions">
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨️ Print Prescription PDF
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => alert('Prescription sent via SMS & WhatsApp to patient phone! (Mock)')}
            >
              📱 Send via WhatsApp / SMS
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Formal Hospital Letterhead Document (Printable) */}
        <div className="formal-rx-document">
          {/* Hospital & Doctor Header */}
          <div className="rx-hospital-header">
            <div className="rx-hospital-brand">
              <div className="hosp-logo">🏥</div>
              <div>
                <h1 className="hosp-name">APEX MULTISPECIALTY HOSPITAL</h1>
                <div className="hosp-address">
                  Sector 14, OPD Block, Ring Road • Phone: +91 11 4050 9000 • ABHA/ABDM Connected
                </div>
              </div>
            </div>
            <div className="rx-doctor-info">
              <h2>Dr. Ananya Sharma, MD</h2>
              <div className="doc-sub">Senior Consultant Physician</div>
              <div className="doc-reg">Reg. No: MCI-2014-98421</div>
            </div>
          </div>

          <hr className="rx-divider" />

          {/* Patient Demographic Banner */}
          <div className="rx-patient-banner">
            <div>
              <strong>Patient Name:</strong> {patientInfo?.name || 'Ramesh Kumar'}
            </div>
            <div>
              <strong>Age / Sex:</strong> {patientInfo?.age || '45'} Yrs / {patientInfo?.gender || 'Male'}
            </div>
            <div>
              <strong>Date:</strong> {currentDate}
            </div>
            <div>
              <strong>Rx No:</strong> RX-{Math.floor(100000 + Math.random() * 900000)}
            </div>
            <div>
              <strong>ABHA / Mob:</strong> {patientInfo?.identifier || '9876543210'}
            </div>
            <div>
              <strong>Diagnosis / CC:</strong> {chiefComplaint || 'Chest Discomfort'}
            </div>
          </div>

          <hr className="rx-divider" />

          {/* Rx Symbol & Medication Table */}
          <div className="rx-body">
            <div className="rx-symbol">℞</div>

            <table className="rx-meds-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medication & Strength</th>
                  <th>Dosage / Freq</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescription?.medications?.map((med, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{med.name}</strong> {med.dosage}
                    </td>
                    <td>{med.frequency}</td>
                    <td>{med.duration}</td>
                    <td>{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Investigations */}
            {prescription?.investigations?.length > 0 && (
              <div className="rx-block">
                <h3>🔬 Diagnostic Tests / Investigations Ordered:</h3>
                <ul>
                  {prescription.investigations.map((test, idx) => (
                    <li key={idx}>{test}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice & Instructions */}
            {prescription?.advice?.length > 0 && (
              <div className="rx-block">
                <h3>💡 General & Dietary Advice:</h3>
                <ul>
                  {prescription.advice.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow up */}
            {prescription?.follow_up && (
              <div className="rx-followup">
                📅 <strong>Next Review / Follow-up:</strong> In {prescription.follow_up}
              </div>
            )}
          </div>

          {/* Footer Signature & Stamp */}
          <div className="rx-footer">
            <div className="rx-qr">
              <div className="qr-box">📱 QR Verified</div>
              <div className="qr-text">Scan for digital E-Prescription validation</div>
            </div>

            <div className="rx-signature-box">
              <div className="signature-line">Dr. Ananya Sharma</div>
              <div className="sig-title">Digitally Signed & Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrintView;
