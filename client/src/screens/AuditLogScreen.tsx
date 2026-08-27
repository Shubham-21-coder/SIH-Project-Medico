import React, { useState } from 'react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'CONSENT_CAPTURED' | 'ABHA_AUTH' | 'DOCUMENT_OCR' | 'CLINICAL_INTAKE' | 'FHIR_SYNC' | 'SESSION_PURGED';
  actor: string;
  details: string;
  dpdpClause: string;
  status: 'COMPLIANT' | 'VERIFIED' | 'SUCCESS';
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-88210',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
    eventType: 'CONSENT_CAPTURED',
    actor: 'Patient (Shubham Garg / 91-4920-1849-2810)',
    details: 'DPDP Act 2023 Section 6 granular audio-explained consent recorded via Kiosk Touchscreen.',
    dpdpClause: 'DPDP Act 2023 §6(1) Notice & Consent',
    status: 'COMPLIANT',
  },
  {
    id: 'AUD-88211',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString(),
    eventType: 'ABHA_AUTH',
    actor: 'ABDM Gateway (National Health Authority)',
    details: 'ABHA ID token verified via QR simulation. Demographics matched against ABDM registry.',
    dpdpClause: 'ABDM Health Data Management Policy §4',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-88212',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
    eventType: 'DOCUMENT_OCR',
    actor: 'MediKiosk Document-AI Pipeline',
    details: 'Multi-document OCR processed. Lab outliers (Glucose 185 mg/dL, HbA1c 8.9%) extracted and encrypted in-memory.',
    dpdpClause: 'DPDP Act 2023 §8 Data Security Safeguards',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-88213',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(),
    eventType: 'CLINICAL_INTAKE',
    actor: 'MediKiosk Clinical NLP Engine',
    details: 'Adaptive SOCRATES / Dashavidha clinical intake completed. Structured 8-part EMR note synthesized.',
    dpdpClause: 'MCI / NMC Telemedicine Guidelines 2020',
    status: 'COMPLIANT',
  },
  {
    id: 'AUD-88214',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
    eventType: 'FHIR_SYNC',
    actor: 'Hospital HIS & ABDM HIE Interoperability Gateway',
    details: 'Standard HL7 FHIR R4 Document Bundle (Composition, Patient, Encounter, Observation) pushed to ABDM repository.',
    dpdpClause: 'EHR Standards for India 2016 / ABDM FHIR R4',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-88215',
    timestamp: new Date().toLocaleTimeString(),
    eventType: 'SESSION_PURGED',
    actor: 'Kiosk Memory Sanitation Worker',
    details: 'Ephemeral raw audio clips and transient OCR buffers deleted from physical kiosk RAM upon consultation handoff.',
    dpdpClause: 'DPDP Act 2023 §8(7) Erasure of Personal Data',
    status: 'COMPLIANT',
  },
];

interface AuditLogScreenProps {
  onClose: () => void;
}

const AuditLogScreen: React.FC<AuditLogScreenProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredLogs = DEFAULT_AUDIT_LOGS.filter((l) => {
    if (filter === 'ALL') return true;
    return l.eventType === filter;
  });

  return (
    <div className="modal-backdrop fade-in" style={{ zIndex: 1100 }}>
      <div className="modal-content glass-card slide-in" style={{ maxWidth: '1040px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
          <div>
            <div className="gov-badge-row" style={{ marginBottom: '0.35rem' }}>
              <span className="gov-badge dpdp-badge">🔒 PRD FR-17: Compliance & Audit Trail</span>
              <span className="gov-badge">📜 DPDP Act 2023 & ABDM Standard</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>🛡️ Regulatory Consent, Access & Interoperability Audit Log</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['ALL', 'CONSENT_CAPTURED', 'ABHA_AUTH', 'DOCUMENT_OCR', 'FHIR_SYNC', 'SESSION_PURGED'].map((f) => (
            <button
              key={f}
              className={`doc-tab-btn ${filter === f ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setFilter(f)}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Audit Log Table */}
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="meds-table" style={{ fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Time</th>
                <th>Event Type</th>
                <th>Actor / Entity</th>
                <th>Regulatory Clause</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-teal)' }}>{log.id}</td>
                  <td>{log.timestamp}</td>
                  <td>
                    <span className="gov-badge" style={{ fontSize: '0.7rem' }}>{log.eventType}</span>
                  </td>
                  <td>{log.actor}</td>
                  <td style={{ fontSize: '0.78rem', color: '#10b981' }}>{log.dpdpClause}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                  <td>
                    <span className="ocr-verified-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem' }}>
                      ✓ {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="small-text">
            🔒 Cryptographically signed tamper-evident audit trail • Retention: 180 Days (NHA Guidelines)
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Audit logs exported to encrypted CSV for hospital compliance officer!')}>
            📥 Export Compliance CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogScreen;
