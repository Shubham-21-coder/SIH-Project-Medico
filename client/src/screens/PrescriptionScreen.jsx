import React, { useState } from 'react';
import VoiceButton from '../components/VoiceButton';

const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'bp_rx',
    title: '🫀 Hypertension Rx',
    doctor: 'Dr. S. Sharma (Cardiology)',
    date: '15 Jan 2026',
    text: 'Tab. Telmisartan 40mg once daily (morning)\nTab. Amlodipine 5mg daily\nDx: Essential Hypertension',
  },
  {
    id: 'diab_rx',
    title: '🩸 Diabetes Rx',
    doctor: 'Dr. V. Gupta (Endocrinology)',
    date: '02 Feb 2026',
    text: 'Tab. Metformin 500mg BD after meals\nTab. Teneligliptin 20mg OD\nFasting Blood Sugar: 142 mg/dL',
  },
  {
    id: 'asthma_rx',
    title: '🫁 Asthma Rx',
    doctor: 'Dr. R. Mehta (Pulmonology)',
    date: '20 Nov 2025',
    text: 'Budecort 200 Inhaler 2 puffs BD\nTab. Montelukast 10mg HS\nDx: Moderate Persistent Asthma',
  },
];

const PrescriptionScreen = ({ patientInfo, onNext, onSkip }) => {
  const [selectedPrescriptions, setSelectedPrescriptions] = useState([]);
  const [customText, setCustomText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsScanning(true);
    setTimeout(() => {
      const newFiles = files.map((file) => ({
        name: file.name,
        preview: URL.createObjectURL(file),
        extractedText: `Scanned file: ${file.name} - Extracted: Active Rx (Telmisartan 40mg, Paracetamol 650mg PRN)`,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setIsScanning(false);
    }, 1500);
  };

  const toggleSampleRx = (rx) => {
    if (selectedPrescriptions.some((item) => item.id === rx.id)) {
      setSelectedPrescriptions(selectedPrescriptions.filter((item) => item.id !== rx.id));
    } else {
      setSelectedPrescriptions([...selectedPrescriptions, rx]);
    }
  };

  const handleVoiceTranscript = (text) => {
    setCustomText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleContinue = () => {
    const allPrescriptionDetails = [
      ...selectedPrescriptions.map((rx) => `${rx.title} (${rx.doctor}, ${rx.date}): ${rx.text}`),
      ...uploadedFiles.map((file) => file.extractedText),
      customText.trim() ? `Patient Notes: ${customText.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    onNext(allPrescriptionDetails);
  };

  return (
    <div className="screen prescription-screen fade-in">
      <div className="prescription-container glass-card slide-in">
        <div className="prescription-header">
          <div className="patient-badge">
            👤 Patient: {patientInfo?.name || 'Patient'} ({patientInfo?.age || '35'}y, {patientInfo?.gender || 'Male'})
          </div>
          <h1>Previous Prescriptions & Past Records</h1>
          <p className="subtitle">
            Upload photo, choose past prescriptions, or type/speak current medications.
          </p>
        </div>

        {/* Section 1: Upload Photo / File */}
        <div className="rx-section">
          <h3>📷 Upload Prescription Photo or File</h3>
          <div className="upload-dropzone">
            <input
              type="file"
              id="file-upload"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="dropzone-label">
              <div className="upload-icon">{isScanning ? '🔍' : '📁'}</div>
              <div>
                {isScanning ? (
                  <span className="scanning-text">Scanning prescription (AI OCR)...</span>
                ) : (
                  <>
                    <strong>Tap to Upload Prescription Image / Document</strong>
                    <div className="small-text">Supports JPG, PNG, PDF</div>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-list">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="uploaded-item">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <div className="extracted-snippet">{file.extractedText}</div>
                  </div>
                  <span className="check-mark">✅</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Sample Prescription Presets */}
        <div className="rx-section">
          <h3>⚡ Quick Sample Past Prescriptions</h3>
          <p className="small-text">Tap a past record to include in today's consultation:</p>
          <div className="sample-rx-grid">
            {SAMPLE_PRESCRIPTIONS.map((rx) => {
              const isSelected = selectedPrescriptions.some((item) => item.id === rx.id);
              return (
                <div
                  key={rx.id}
                  className={`sample-rx-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSampleRx(rx)}
                >
                  <div className="rx-card-header">
                    <strong>{rx.title}</strong>
                    <span>{isSelected ? '✓ Added' : '+ Add'}</span>
                  </div>
                  <div className="rx-card-meta">{rx.doctor} • {rx.date}</div>
                  <pre className="rx-card-text">{rx.text}</pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Speak / Type Additional Medications */}
        <div className="rx-section">
          <h3>🎙️ Additional Past History or Active Medications</h3>
          <div className="voice-input-row">
            <textarea
              className="input-field textarea-field"
              placeholder="e.g. Taking Paracetamol for 2 days, had gallbladder surgery in 2022..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <div className="rx-voice-col">
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                language={patientInfo?.language || 'en-IN'}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="prescription-actions">
          <button className="btn btn-secondary btn-lg" onClick={onSkip}>
            Skip for Now
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleContinue}>
            Continue to Symptom Intake →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScreen;
