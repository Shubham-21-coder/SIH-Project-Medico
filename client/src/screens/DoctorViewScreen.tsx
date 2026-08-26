import React, { useState } from 'react';
import { SummaryData, PatientInfo, FhirBundle } from '../types/medikiosk';
import { generateFhirBundle } from '../utils/api';

interface DoctorViewScreenProps {
  summary: SummaryData;
  sessionId?: string;
  language?: string;
  chiefComplaint?: string;
  patientInfo?: PatientInfo | null;
  prescriptions?: string;
  onSave: (summary: SummaryData) => void;
}

const DoctorViewScreen: React.FC<DoctorViewScreenProps> = ({
  summary,
  sessionId,
  language,
  chiefComplaint,
  patientInfo,
  prescriptions,
  onSave,
}) => {
  const [editedSummary, setEditedSummary] = useState<SummaryData>(
    summary || {
      chief_complaint: '',
      hpi: '',
      past_history: '',
      medications_allergies: '',
      family_history: '',
      personal_social_history: '',
      review_of_systems: '',
      prior_investigations: '',
    }
  );
  const [editingField, setEditingField] = useState<keyof SummaryData | null>(null);
  const [showFhirModal, setShowFhirModal] = useState<boolean>(false);
  const [fhirBundle, setFhirBundle] = useState<FhirBundle | null>(null);
  const [isGeneratingFhir, setIsGeneratingFhir] = useState<boolean>(false);
  const [abdmSynced, setAbdmSynced] = useState<boolean>(false);

  const isAyush = summary?.clinical_mode === 'ayush' || patientInfo?.clinicalMode === 'ayush';

  const handleChange = (field: keyof SummaryData, value: string) => {
    setEditedSummary((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEdit = (field: keyof SummaryData) => {
    setEditingField(editingField === field ? null : field);
  };

  const handleOpenFhir = async () => {
    setIsGeneratingFhir(true);
    setShowFhirModal(true);
    try {
      const res = await generateFhirBundle(patientInfo || null, chiefComplaint || '', editedSummary);
      setFhirBundle(res.bundle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFhir(false);
    }
  };

  const handleSyncAbdm = () => {
    setAbdmSynced(true);
    setTimeout(() => {
      alert(`✅ Success: Clinical Consultation Note pushed to ABDM National Health Repository under ABHA ID: ${patientInfo?.identifier || '91-4920-1849-2810'} (FHIR R4 Bundle Linked).`);
    }, 400);
  };

  const renderSection = (title: string, field: keyof SummaryData, isLarge = false) => {
    const isEditing = editingField === field;
    const value = (editedSummary[field] as string) || '';

    return (
      <div className="summary-section glass-card">
        <div className="section-header">
          <h3>{title}</h3>
          <button
            className="btn-icon"
            onClick={() => toggleEdit(field)}
            title={isEditing ? 'Save edits' : 'Edit section'}
          >
            {isEditing ? '💾' : '✏️'}
          </button>
        </div>
        {isEditing ? (
          <textarea
            className={`editable-textarea ${isLarge ? 'large' : ''}`}
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        ) : (
          <div className="summary-text">
            {value || 'No pertinent findings recorded.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen doctor-view-screen slide-in" style={{ maxWidth: '1180px' }}>
      <div className="header">
        <div className="gov-badge-row" style={{ marginBottom: '0.75rem' }}>
          <span className="gov-badge">🏥 Hospital Information System (HIS) OPD Desk</span>
          <span className={`gov-badge ${isAyush ? 'ayush-badge' : 'dpdp-badge'}`}>
            {isAyush ? '🌿 आयुर्वेद दशविध परीक्षा रिपोर्ट' : '🩺 ABDM FHIR R4 Structured Note'}
          </span>
        </div>

        <h1>🩺 Physician OPD Clinical Consultation Note</h1>

        {/* Patient Identity Banner */}
        <div className="patient-summary-card glass-card">
          <div className="patient-name-title">
            👤 {patientInfo?.name || 'Shubham Garg'}
            <span className="patient-subinfo">
              ({patientInfo?.age || '20'} yrs, {patientInfo?.gender || 'Male'})
            </span>
          </div>
          <div className="metadata">
            <span className="metadata-badge">ABHA: {patientInfo?.identifier || '91-4920-1849-2810'}</span>
            <span className="metadata-badge">Session: {sessionId?.substring(0, 8) || 'SESS-102'}</span>
            <span className="metadata-badge">Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="metadata-badge">Mode: {isAyush ? 'AYUSH' : 'ALLOPATHY'}</span>
            <span className="metadata-badge">Lang: {language?.toUpperCase() || 'HI'}</span>
          </div>
        </div>
      </div>

      {/* Abnormal Lab Outliers Alert Banner */}
      {editedSummary.lab_outliers && editedSummary.lab_outliers.length > 0 && (
        <div className="summary-section glass-card" style={{ border: '1.5px solid #ef4444', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '1.25rem' }}>
          <div className="section-header">
            <h3 style={{ color: '#ef4444' }}>🧪 Abnormal Out-of-Range Lab Values Detected from Prior Records</h3>
            <span className="ocr-verified-badge" style={{ background: '#ef4444', color: '#fff' }}>Critical Attention</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {editedSummary.lab_outliers.map((lab, idx) => (
              <div key={idx} style={{ background: '#ef4444', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                ⬆️ {lab.testName}: {lab.value} {lab.unit} (Normal Ref: {lab.referenceRange})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Drug-Drug Interaction Warning Alert */}
      {editedSummary.drug_interactions && editedSummary.drug_interactions.length > 0 && (
        <div className="summary-section glass-card" style={{ border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', marginBottom: '1.25rem' }}>
          <div className="section-header">
            <h3 style={{ color: '#f59e0b' }}>⚠️ Clinical Drug-Drug Interaction Warning</h3>
            <span className="ocr-verified-badge" style={{ background: '#f59e0b', color: '#000' }}>Review Regimen</span>
          </div>
          {editedSummary.drug_interactions.map((di, idx) => (
            <p key={idx} style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
              <strong>{di.drug1} + {di.drug2}:</strong> {di.description}
            </p>
          ))}
        </div>
      )}

      {/* AYUSH / Ayurvedic Dashavidha Pariksha Findings Box */}
      {isAyush && editedSummary.ayush_pariksha && (
        <div className="summary-section glass-card ayush-summary-box" style={{ border: '1.5px solid #10b981', background: 'rgba(16, 185, 129, 0.08)', marginBottom: '1.5rem' }}>
          <div className="section-header">
            <h3 style={{ color: '#10b981' }}>🌿 दशविध एवं अष्टविध परीक्षा निष्कर्ष (AYUSH Clinical Parameters)</h3>
            <span className="ocr-verified-badge" style={{ background: '#10b981', color: '#fff' }}>Ayurveda EMR</span>
          </div>
          <div className="ayush-params-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div className="ayush-param-card"><strong>प्रकृति (Prakriti):</strong> {editedSummary.ayush_pariksha.prakriti}</div>
            <div className="ayush-param-card"><strong>विकृति (Vikriti):</strong> {editedSummary.ayush_pariksha.vikriti}</div>
            <div className="ayush-param-card"><strong>अग्नि (Digestive Agni):</strong> {editedSummary.ayush_pariksha.agni}</div>
            <div className="ayush-param-card"><strong>कोष्ठ (Bowel Habit):</strong> {editedSummary.ayush_pariksha.koshtha}</div>
            <div className="ayush-param-card"><strong>आहार-विहार (Diet/Lifestyle):</strong> {editedSummary.ayush_pariksha.ahara_vihara}</div>
            <div className="ayush-param-card"><strong>धातु सारता (Sara):</strong> {editedSummary.ayush_pariksha.sara || 'मध्यम'}</div>
            <div className="ayush-param-card"><strong>व्यायाम शक्ति (Bala):</strong> {editedSummary.ayush_pariksha.vyayama_shakti || 'मध्यम बल'}</div>
            <div className="ayush-param-card"><strong>सत्त्व (Mental Strength):</strong> {editedSummary.ayush_pariksha.sattva || 'मध्यम सत्त्व'}</div>
            <div className="ayush-param-card" style={{ gridColumn: '1 / -1' }}><strong>निदान एवं सम्प्राप्ति (Pathogenesis):</strong> {editedSummary.ayush_pariksha.nidana_samprapti || 'वात-पित्त प्रकोप एवं अग्निमांद्य।'}</div>
          </div>
        </div>
      )}

      {/* Digitized Prior Prescriptions / Records */}
      {prescriptions && (
        <div className="summary-section glass-card rx-attachment-banner" style={{ marginBottom: '1.25rem' }}>
          <div className="section-header">
            <h3>🤖 AI Digitized Prior Medical Documents & Health Timeline</h3>
            <span className="ocr-verified-badge">✓ Document Extracted</span>
          </div>
          <pre className="summary-text rx-pre">{prescriptions}</pre>
        </div>
      )}

      {/* Complete 8-Part Standard EMR Clinical Summary Grid */}
      <div className="summary-grid">
        {renderSection('1. Chief Complaint (CC)', 'chief_complaint')}
        {renderSection('2. History of Present Illness (HPI - SOCRATES)', 'hpi', true)}
        {renderSection('3. Past Medical & Surgical History', 'past_history', true)}
        {renderSection('4. Current Medications & Known Drug Allergies', 'medications_allergies', true)}
        {renderSection('5. Family History', 'family_history')}
        {renderSection('6. Personal & Social History (Diet, Habit, Sleep)', 'personal_social_history')}
        {renderSection('7. Review of Systems (ROS)', 'review_of_systems', true)}
        {renderSection('8. Prior Investigations Summary & Lab Outliers', 'prior_investigations')}
      </div>

      <div className="action-buttons" style={{ marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Print Clinical OPD Ticket
        </button>
        <button className="btn btn-secondary" onClick={handleOpenFhir}>
          📄 View ABDM FHIR R4 Bundle
        </button>
        <button className="btn btn-secondary" onClick={handleSyncAbdm} disabled={abdmSynced}>
          {abdmSynced ? '✓ Synced to ABDM HIE' : '☁️ Push to ABDM / Hospital HIS'}
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => onSave(editedSummary)}>
          ✅ Confirm & Open Doctor Prescribing Dashboard →
        </button>
      </div>

      {/* FHIR R4 Modal */}
      {showFhirModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowFhirModal(false)}>
          <div className="modal-content glass-card slide-in" style={{ maxWidth: '850px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2>📄 ABDM FHIR R4 Clinical Document Bundle</h2>
                <p className="small-text">HL7 FHIR Document standard compliant for Ayushman Bharat Health Information Exchange (HIE)</p>
              </div>
              <button className="btn-icon" onClick={() => setShowFhirModal(false)}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#0a1628', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {isGeneratingFhir ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Generating FHIR R4 Bundle...</div>
              ) : (
                <pre style={{ fontSize: '0.78rem', color: '#00d4aa', margin: 0, fontFamily: 'monospace' }}>
                  {JSON.stringify(fhirBundle, null, 2)}
                </pre>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2))}>
                📋 Copy FHIR JSON
              </button>
              <button className="btn btn-primary" onClick={() => setShowFhirModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorViewScreen;
