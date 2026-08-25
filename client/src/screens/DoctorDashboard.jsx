import React, { useState, useEffect } from 'react';
import PrescriptionPrintView from '../components/PrescriptionPrintView';
import { generateAutoRx } from '../utils/api';

const MOCK_PATIENT_QUEUE = [
  {
    id: 'SESS-892',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    identifier: '9876543210',
    chiefComplaint: 'Chest Pain',
    triagePriority: 'Urgent',
    time: '10 mins ago',
    summary: {
      chief_complaint: 'Chest pain radiating to left arm, started 2 hours ago.',
      hpi: 'Patient reports heavy pressure-like chest pain rated 8/10. Associated with mild shortness of breath and diaphoresis.',
      past_history: 'Hypertension (diagnosed 2018), taking Telmisartan 40mg daily.',
      review_of_systems: 'Cardiovascular: Positive for exertional chest tightness. Denies fever, cough, nausea.',
    },
    prescriptions: 'Telmisartan 40mg once daily',
  },
  {
    id: 'SESS-893',
    name: 'Priya Sharma',
    age: 32,
    gender: 'Female',
    identifier: '9123456789',
    chiefComplaint: 'Fever',
    triagePriority: 'Standard',
    time: '25 mins ago',
    summary: {
      chief_complaint: 'High fever 102°F with body aches for 2 days.',
      hpi: 'Patient reports sudden onset fever accompanied by severe chills, frontal headache, and fatigue.',
      past_history: 'No chronic illness. Paracetamol taken with mild relief.',
      review_of_systems: 'Constitutional: High fever, rigors. Respiratory: Clear.',
    },
    prescriptions: 'None',
  },
  {
    id: 'SESS-894',
    name: 'Sunil Verma',
    age: 58,
    gender: 'Male',
    identifier: '9988776655',
    chiefComplaint: 'Stomach Ache',
    triagePriority: 'Standard',
    time: '40 mins ago',
    summary: {
      chief_complaint: 'Upper abdominal cramping pain after meals.',
      hpi: 'Patient reports sharp epigastric pain following heavy meals. History of acid reflux.',
      past_history: 'GERD, Type 2 Diabetes on Metformin 500mg.',
      review_of_systems: 'GI: Epigastric tenderness. Denies hematemesis or melena.',
    },
    prescriptions: 'Metformin 500mg BD',
  },
];

const DoctorDashboard = ({ currentSession, onBackToKiosk }) => {
  const [patientQueue, setPatientQueue] = useState(MOCK_PATIENT_QUEUE);
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENT_QUEUE[0]);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [isGeneratingRx, setIsGeneratingRx] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // If a live session was completed at the kiosk, insert it at the top of the queue!
  useEffect(() => {
    if (currentSession && currentSession.summary) {
      const newQueueItem = {
        id: currentSession.sessionId || `SESS-${Math.floor(100 + Math.random() * 900)}`,
        name: currentSession.patientInfo?.name || 'Guest Patient',
        age: currentSession.patientInfo?.age || 35,
        gender: currentSession.patientInfo?.gender || 'Male',
        identifier: currentSession.patientInfo?.identifier || 'ABHA-LIVE-901',
        chiefComplaint: currentSession.chiefComplaint || 'Chest Pain',
        triagePriority: currentSession.redFlag ? 'EMERGENCY' : 'Urgent',
        time: 'Just now (Live Kiosk Session)',
        summary: currentSession.summary,
        prescriptions: currentSession.prescriptions || 'Attached via kiosk',
      };

      setPatientQueue((prev) => [newQueueItem, ...prev.filter((p) => p.id !== newQueueItem.id)]);
      setSelectedPatient(newQueueItem);
    }
  }, [currentSession]);

  const handleAutoGenerateRx = async () => {
    if (!selectedPatient) return;

    setIsGeneratingRx(true);
    try {
      const autoRx = await generateAutoRx(
        selectedPatient.chiefComplaint,
        selectedPatient.summary
      );
      setPrescriptionData(autoRx);
    } catch (error) {
      alert('Failed to generate auto-prescription.');
    } finally {
      setIsGeneratingRx(false);
    }
  };

  const handleAddMedication = () => {
    if (!prescriptionData) return;
    const newMed = {
      name: 'Tab. Paracetamol',
      dosage: '650 mg',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'After food',
    };
    setPrescriptionData({
      ...prescriptionData,
      medications: [...(prescriptionData.medications || []), newMed],
    });
  };

  const handleRemoveMedication = (index) => {
    if (!prescriptionData) return;
    const updated = prescriptionData.medications.filter((_, idx) => idx !== index);
    setPrescriptionData({ ...prescriptionData, medications: updated });
  };

  const handleMedChange = (index, field, value) => {
    if (!prescriptionData) return;
    const updated = [...prescriptionData.medications];
    updated[index][field] = value;
    setPrescriptionData({ ...prescriptionData, medications: updated });
  };

  return (
    <div className="screen doctor-dashboard-screen fade-in">
      <div className="doctor-dashboard-container">
        {/* Left Pane: Patient Queue */}
        <div className="queue-pane glass-card">
          <div className="pane-header">
            <h2>📋 OPD Patient Queue</h2>
            <span className="count-badge">{patientQueue.length} Waiting</span>
          </div>

          <div className="queue-list">
            {patientQueue.map((patient) => {
              const isSelected = selectedPatient?.id === patient.id;
              const isEmergency = patient.triagePriority === 'EMERGENCY';
              return (
                <div
                  key={patient.id}
                  className={`queue-item ${isSelected ? 'selected' : ''} ${
                    isEmergency ? 'emergency-item' : ''
                  }`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setPrescriptionData(null); // Reset Rx editor for new patient
                  }}
                >
                  <div className="queue-item-top">
                    <strong>{patient.name}</strong>
                    <span className={`priority-badge ${patient.triagePriority.toLowerCase()}`}>
                      {patient.triagePriority}
                    </span>
                  </div>
                  <div className="queue-item-sub">
                    {patient.age}y/{patient.gender} • {patient.chiefComplaint}
                  </div>
                  <div className="queue-item-time">⏱️ {patient.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: EMR Review & Auto-Prescription Workspace */}
        <div className="emr-pane glass-card">
          {selectedPatient ? (
            <div className="emr-workspace slide-in">
              {/* Header */}
              <div className="emr-patient-header">
                <div>
                  <h1>👤 {selectedPatient.name}</h1>
                  <div className="patient-demog-pills">
                    <span className="pill">{selectedPatient.age} Yrs / {selectedPatient.gender}</span>
                    <span className="pill">ID: {selectedPatient.identifier}</span>
                    <span className="pill highlight">CC: {selectedPatient.chiefComplaint}</span>
                  </div>
                </div>
                <div className="emr-actions-top">
                  <button
                    className="btn btn-primary"
                    onClick={handleAutoGenerateRx}
                    disabled={isGeneratingRx}
                  >
                    {isGeneratingRx ? (
                      <span className="spinner"></span>
                    ) : (
                      '🤖 Auto-Generate AI Prescription'
                    )}
                  </button>
                </div>
              </div>

              {/* Patient Kiosk Clinical History Tabs / Cards */}
              <div className="emr-history-grid">
                <div className="emr-card">
                  <h3>📝 History of Present Illness (HPI)</h3>
                  <p>{selectedPatient.summary?.hpi}</p>
                </div>

                <div className="emr-card">
                  <h3>📑 Past Medical & Medication History</h3>
                  <p>{selectedPatient.summary?.past_history}</p>
                </div>
              </div>

              {/* Prescription Workspace */}
              <div className="rx-workspace-card glass-card">
                <div className="rx-workspace-header">
                  <h2>℞ Prescription & Orders Workspace</h2>
                  {prescriptionData && (
                    <button className="btn btn-secondary btn-sm" onClick={handleAddMedication}>
                      + Add Drug
                    </button>
                  )}
                </div>

                {!prescriptionData ? (
                  <div className="empty-rx-state">
                    <div className="empty-icon">💊</div>
                    <p>Click <strong>"🤖 Auto-Generate AI Prescription"</strong> above to auto-create a treatment draft based on kiosk clinical history.</p>
                  </div>
                ) : (
                  <div className="active-rx-editor">
                    {/* Medications Table Editor */}
                    <table className="rx-editor-table">
                      <thead>
                        <tr>
                          <th>Drug Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Instructions</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptionData.medications?.map((med, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                className="input-field table-input"
                                value={med.name}
                                onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-field table-input"
                                value={med.dosage}
                                onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-field table-input"
                                value={med.frequency}
                                onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-field table-input"
                                value={med.duration}
                                onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-field table-input"
                                value={med.instructions}
                                onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                className="btn-icon danger-icon"
                                onClick={() => handleRemoveMedication(idx)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Advice & Tests */}
                    <div className="rx-extra-fields">
                      <div className="form-group">
                        <label>🔬 Investigations Ordered</label>
                        <input
                          type="text"
                          className="input-field"
                          value={prescriptionData.investigations?.join(', ')}
                          onChange={(e) =>
                            setPrescriptionData({
                              ...prescriptionData,
                              investigations: e.target.value.split(',').map((s) => s.trim()),
                            })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>💡 Doctor Advice & Instructions</label>
                        <input
                          type="text"
                          className="input-field"
                          value={prescriptionData.advice?.join('; ')}
                          onChange={(e) =>
                            setPrescriptionData({
                              ...prescriptionData,
                              advice: e.target.value.split(';').map((s) => s.trim()),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Finalize Actions */}
                    <div className="rx-editor-actions">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowPrintModal(true)}
                      >
                        📄 Preview & Print Official Rx
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-patient-state">
              Select a patient from the OPD Queue to view clinical history.
            </div>
          )}
        </div>
      </div>

      {/* Print Prescription Modal */}
      {showPrintModal && prescriptionData && (
        <PrescriptionPrintView
          prescription={prescriptionData}
          patientInfo={{
            name: selectedPatient.name,
            age: selectedPatient.age,
            gender: selectedPatient.gender,
            identifier: selectedPatient.identifier,
          }}
          chiefComplaint={selectedPatient.chiefComplaint}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
