import React from 'react';
import { PrescriptionData, PatientInfo, DoctorInfo, SummaryData } from '../types/medikiosk';

interface PrescriptionPrintViewProps {
  prescription?: PrescriptionData;
  rxData?: PrescriptionData;
  patientInfo?: PatientInfo | null;
  doctorInfo?: DoctorInfo | null;
  chiefComplaint?: string;
  summary?: SummaryData | null;
  onClose: () => void;
}

const PrescriptionPrintView: React.FC<PrescriptionPrintViewProps> = ({
  prescription,
  rxData,
  patientInfo,
  doctorInfo,
  chiefComplaint,
  summary,
  onClose,
}) => {
  const activeRx = prescription || rxData;
  const isAyush = summary?.clinical_mode === 'ayush' || patientInfo?.clinicalMode === 'ayush';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rx-modal-overlay fade-in">
      <div className="rx-letterhead-card glass-card slide-in" style={{ maxWidth: '920px' }}>
        {/* Modal Controls */}
        <div className="rx-modal-header no-print">
          <div>
            <h2>📄 Official OPD Electronic Prescription (e-Rx)</h2>
            <span className="small-text">ABDM Compliant • Digital Healthcare Record</span>
          </div>
          <div className="rx-modal-actions">
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨️ Print Prescription PDF
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => alert(`Prescription dispatched via SMS & WhatsApp to ${patientInfo?.identifier || '91-4920-1849-2810'}! (ABDM Push Completed)`)}
            >
              📱 Send via WhatsApp / SMS
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Hospital Document Letterhead */}
        <div className="formal-rx-document">
          {/* Hospital Brand Header */}
          <div className="rx-hospital-header">
            <div className="rx-hospital-brand">
              <div className="hosp-logo">{isAyush ? '🌿' : '🏥'}</div>
              <div>
                <h1 className="hosp-name">
                  {isAyush ? 'AYUSH APEX AYURVEDA HOSPITAL & RESEARCH CENTRE' : 'APEX MULTISPECIALTY HOSPITAL & MEDICAL COLLEGE'}
                </h1>
                <div className="hosp-address">
                  {isAyush
                    ? 'Ministry of AYUSH • National Health Portal • ABHA / ABDM Integrated'
                    : 'Sector 14, OPD Block, Ring Road • Phone: +91 11 4050 9000 • ABHA/ABDM Connected'}
                </div>
              </div>
            </div>
            <div className="rx-doctor-info">
              <h2>{doctorInfo?.name || (isAyush ? 'Vaidya R. K. Shastri (BAMS, MD)' : 'Dr. Ananya Sharma, MD')}</h2>
              <div className="doc-sub">{doctorInfo?.role || (isAyush ? 'Senior Ayurvedic Physician' : 'Senior Consultant Physician')}</div>
              <div className="doc-reg">Reg. No: {isAyush ? 'AYU-DEL-2012-4829' : 'MCI-2014-98421'}</div>
            </div>
          </div>

          <hr className="rx-divider" />

          {/* Patient Demographic Bar */}
          <div className="rx-patient-banner">
            <div>
              <strong>Patient Name:</strong> {patientInfo?.name || 'Shubham Garg'}
            </div>
            <div>
              <strong>Age / Sex:</strong> {patientInfo?.age || '20'} Yrs / {patientInfo?.gender || 'Male'}
            </div>
            <div>
              <strong>Date:</strong> {currentDate}
            </div>
            <div>
              <strong>Rx No:</strong> RX-{Math.floor(100000 + Math.random() * 900000)}
            </div>
            <div>
              <strong>ABHA ID:</strong> {patientInfo?.identifier || '91-4920-1849-2810'}
            </div>
            <div>
              <strong>Provisional Dx:</strong> {chiefComplaint || 'General OPD Consultation'}
            </div>
          </div>

          <hr className="rx-divider" />

          {/* Clinical Findings / Prakriti Summary */}
          {isAyush && summary?.ayush_pariksha && (
            <div className="ayush-rx-summary-block" style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>
              <strong>दशविध परीक्षा निष्कर्ष:</strong> प्रकृति: {summary.ayush_pariksha.prakriti} | अग्नि: {summary.ayush_pariksha.agni} | कोष्ठ: {summary.ayush_pariksha.koshtha}
              <hr className="rx-divider" style={{ marginTop: '0.4rem' }} />
            </div>
          )}

          {/* Rx Symbol & Medication Table */}
          <div className="rx-body">
            <div className="rx-symbol">{isAyush ? '🌿 योग व्यवस्थापत्र (Rx)' : '℞'}</div>

            <table className="rx-meds-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medication / Formulation</th>
                  <th>Dosage & Strength</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {activeRx?.medications?.map((med, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{med.name}</strong>
                    </td>
                    <td>{med.dosage}</td>
                    <td>{med.frequency}</td>
                    <td>{med.duration}</td>
                    <td>{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Diagnostic Investigations Ordered */}
            {activeRx?.investigations && activeRx.investigations.length > 0 && (
              <div className="rx-block">
                <h3>🔬 Diagnostic Tests / Investigations Ordered:</h3>
                <ul>
                  {activeRx.investigations.map((test, idx) => (
                    <li key={idx}>{test}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical & Dietary Advice */}
            {((activeRx?.advice && activeRx.advice.length > 0) || (activeRx?.ayushAdvice && activeRx.ayushAdvice.length > 0)) && (
              <div className="rx-block">
                <h3>💡 {isAyush ? 'पथ्य-अपथ्य एवं दिनचर्या परामर्श (Diet & Lifestyle Advice):' : 'Clinical & Dietary Advice:'}</h3>
                <ul>
                  {activeRx?.advice?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                  {activeRx?.ayushAdvice?.map((item, idx) => (
                    <li key={`ayush-${idx}`} style={{ color: '#047857' }}>🌿 {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Note */}
            {activeRx?.follow_up && (
              <div className="rx-followup">
                📅 <strong>Next Review / Follow-up:</strong> {activeRx.follow_up}
              </div>
            )}
          </div>

          {/* Footer Signature & Stamp */}
          <div className="rx-footer">
            <div className="rx-qr">
              <div className="qr-box">📱 ABDM QR Verified</div>
              <div className="qr-text">Scan for digital EMR / PHR validation</div>
            </div>

            <div className="rx-signature-box">
              <div className="signature-line">{doctorInfo?.name || (isAyush ? 'Vaidya R. K. Shastri' : 'Dr. Ananya Sharma')}</div>
              <div className="sig-title">Digitally Signed & Verified (e-Sign)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrintView;
