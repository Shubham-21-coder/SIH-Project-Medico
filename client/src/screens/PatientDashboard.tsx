import React from 'react';
import { PatientInfo, SummaryData, ReviewState, DeliveryStatus } from '../types/medikiosk';

interface PatientDashboardProps {
  patientInfo?: PatientInfo | null;
  currentEncounterId?: string | null;
  currentSummary?: SummaryData | null;
  reviewState?: ReviewState;
  deliveryStatus?: DeliveryStatus;
  onBack: () => void;
}

const REVIEW_STATE_LABELS: Record<ReviewState, { label: string; color: string; icon: string }> = {
  in_progress: { label: 'In Progress', color: '#f59e0b', icon: '⏳' },
  submitted: { label: 'Submitted — Awaiting Doctor Review', color: '#3b82f6', icon: '📨' },
  under_review: { label: 'Under Review by Clinician', color: '#8b5cf6', icon: '👨‍⚕️' },
  approved: { label: 'Approved by Clinician', color: '#10b981', icon: '✅' },
  amended: { label: 'Amended After Approval', color: '#f59e0b', icon: '📝' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
};

const DELIVERY_LABELS: Record<DeliveryStatus, { label: string; color: string }> = {
  not_requested: { label: 'Not yet requested', color: '#6b7280' },
  blocked_by_consent: { label: 'Blocked — consent not provided for external sharing', color: '#ef4444' },
  pending: { label: 'Pending delivery to hospital system', color: '#f59e0b' },
  delivered: { label: 'Successfully delivered to hospital HIS', color: '#10b981' },
  failed: { label: 'Delivery failed — retry available', color: '#ef4444' },
};

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientInfo,
  currentEncounterId,
  currentSummary,
  reviewState = 'in_progress',
  deliveryStatus = 'not_requested',
  onBack,
}) => {
  const reviewInfo = REVIEW_STATE_LABELS[reviewState];
  const deliveryInfo = DELIVERY_LABELS[deliveryStatus];

  return (
    <div className="screen fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="glass-card slide-in" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="gov-badge-row" style={{ marginBottom: '0.5rem' }}>
              <span className="gov-badge">📋 Patient Record Dashboard (FR12)</span>
              <span className="gov-badge dpdp-badge">🔒 DPDP Act 2023</span>
            </div>
            <h2 style={{ margin: 0 }}>
              👤 {patientInfo?.name || 'Patient'} — My Health Records
            </h2>
            <p className="small-text" style={{ marginTop: '0.3rem' }}>
              {patientInfo?.abhaNumber ? `ABHA: ${patientInfo.abhaNumber}` : ''} • {patientInfo?.age}y / {patientInfo?.gender}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </div>

        {/* Current Encounter */}
        {currentEncounterId && (
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: `1.5px solid ${reviewInfo.color}`, background: `${reviewInfo.color}11` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Current Visit</h3>
              <span style={{ background: reviewInfo.color, color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                {reviewInfo.icon} {reviewInfo.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
              <div>
                <strong style={{ opacity: 0.7, fontSize: '0.75rem', display: 'block' }}>Encounter ID</strong>
                <span>{currentEncounterId}</span>
              </div>
              <div>
                <strong style={{ opacity: 0.7, fontSize: '0.75rem', display: 'block' }}>Date</strong>
                <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div>
                <strong style={{ opacity: 0.7, fontSize: '0.75rem', display: 'block' }}>Chief Complaint</strong>
                <span>{currentSummary?.chief_complaint || 'General Consultation'}</span>
              </div>
              <div>
                <strong style={{ opacity: 0.7, fontSize: '0.75rem', display: 'block' }}>Clinical Mode</strong>
                <span>{currentSummary?.clinical_mode === 'ayush' ? '🌿 AYUSH / Ayurveda' : '🩺 Allopathy'}</span>
              </div>
            </div>

            {/* Delivery Status */}
            <div style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>Hospital Delivery Status: </strong>
              <span style={{ color: deliveryInfo.color }}>{deliveryInfo.label}</span>
            </div>

            {/* Summary Preview */}
            {currentSummary && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>📋 Clinical Summary (
                  {reviewState === 'approved' ? (
                    <span style={{ color: '#10b981' }}>Approved</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>Draft — Not yet reviewed by clinician</span>
                  )}
                )</h4>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <p><strong>HPI:</strong> {currentSummary.hpi}</p>
                  <p><strong>Past History:</strong> {currentSummary.past_history}</p>
                  {currentSummary.medications_allergies && (
                    <p><strong>Medications & Allergies:</strong> {currentSummary.medications_allergies}</p>
                  )}
                </div>

                {/* PRD FR09: Missing fields alert */}
                {currentSummary.missingFields && currentSummary.missingFields.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', fontSize: '0.82rem' }}>
                    <strong style={{ color: '#f59e0b' }}>⚠️ Incomplete sections:</strong>{' '}
                    {currentSummary.missingFields.join(', ')}
                  </div>
                )}

                {/* PRD FR09: Unresolved conflicts */}
                {currentSummary.unresolvedConflicts && currentSummary.unresolvedConflicts.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', fontSize: '0.82rem' }}>
                    <strong style={{ color: '#ef4444' }}>🔀 Needs review:</strong>
                    {currentSummary.unresolvedConflicts.map((c, i) => (
                      <p key={i} style={{ margin: '0.2rem 0 0' }}>{c}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No encounters yet */}
        {!currentEncounterId && (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3>No Active Encounters</h3>
            <p>Complete a clinical intake at the kiosk to see your records here.</p>
          </div>
        )}

        {/* Info about record access */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.82rem', opacity: 0.8 }}>
          <strong>ℹ️ About Your Records:</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
            <li>You can only view records authorized for your access.</li>
            <li>Draft records have not been reviewed by a clinician and may contain errors.</li>
            <li>Approved records have been verified and signed by your doctor.</li>
            <li>You may request data deletion under the DPDP Act 2023.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
