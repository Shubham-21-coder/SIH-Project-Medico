import React, { useState } from 'react';

const DoctorViewScreen = ({
  summary,
  sessionId,
  language,
  chiefComplaint,
  patientInfo,
  prescriptions,
  onSave,
}) => {
  const [editedSummary, setEditedSummary] = useState(
    summary || {
      chief_complaint: '',
      hpi: '',
      past_history: '',
      review_of_systems: '',
    }
  );
  const [editingField, setEditingField] = useState(null);

  const handleChange = (field, value) => {
    setEditedSummary((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEdit = (field) => {
    setEditingField(editingField === field ? null : field);
  };

  const renderSection = (title, field, isLarge = false) => {
    const isEditing = editingField === field;
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
            value={editedSummary[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        ) : (
          <div className="summary-text">
            {editedSummary[field] || 'No information provided.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen doctor-view-screen slide-in">
      <div className="header">
        <h1>🩺 Physician OPD Summary Note</h1>

        {/* Patient Identity Banner */}
        <div className="patient-summary-card glass-card">
          <div className="patient-name-title">
            👤 {patientInfo?.name || 'Ramesh Kumar'}
            <span className="patient-subinfo">
              ({patientInfo?.age || '45'} yrs, {patientInfo?.gender || 'Male'})
            </span>
          </div>
          <div className="metadata">
            <span className="metadata-badge">ID: {patientInfo?.identifier || 'ABHA-DEMO-9823'}</span>
            <span className="metadata-badge">Session: {sessionId?.substring(0, 8) || 'SESS-102'}</span>
            <span className="metadata-badge">Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="metadata-badge">Lang: {language?.toUpperCase() || 'EN'}</span>
            <span className="metadata-badge">CC: {chiefComplaint?.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Previous Prescriptions & Records Attachment Banner */}
      {prescriptions && (
        <div className="summary-section glass-card rx-attachment-banner">
          <div className="section-header">
            <h3>📑 Attached Previous Prescriptions & Medical Records</h3>
          </div>
          <pre className="summary-text rx-pre">{prescriptions}</pre>
        </div>
      )}

      {/* Main Clinical Summary Grid */}
      <div className="summary-grid">
        {renderSection('Chief Complaint', 'chief_complaint')}
        {renderSection('History of Present Illness (HPI)', 'hpi', true)}
        {renderSection('Past Medical & Medication History', 'past_history', true)}
        {renderSection('Review of Systems (ROS)', 'review_of_systems', true)}
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Print Clinical Summary
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => alert('Summary & Prescription Records pushed to ABDM / Hospital HIS successfully! (Mock)')}
        >
          ☁️ Push to ABDM / HIS
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => onSave(editedSummary)}>
          ✅ Confirm & Save Clinical Note
        </button>
      </div>
    </div>
  );
};

export default DoctorViewScreen;
