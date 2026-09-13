import React from 'react';
import { ClinicalMode, PatientInfo } from '../types/medikiosk';

interface SymptomSelectionScreenProps {
  patientInfo?: PatientInfo | null;
  onSelectSymptom: (mode: ClinicalMode, chiefComplaint: string) => void;
  onBack?: () => void;
}

const SymptomSelectionScreen: React.FC<SymptomSelectionScreenProps> = ({
  patientInfo,
  onSelectSymptom,
  onBack,
}) => {
  return (
    <div className="screen welcome-screen flex-center fade-in" style={{ padding: '1.5rem 1rem' }}>
      <div className="step-container slide-in" style={{ maxWidth: '1080px', width: '100%' }}>
        
        {/* Top Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              ← Back to Sign In / Registration
            </button>
          )}
          {patientInfo && (
            <div className="patient-badge" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
              👤 Logged in as: <strong>{patientInfo.name}</strong> ({patientInfo.age}y/{patientInfo.gender})
            </div>
          )}
        </div>

        <div className="welcome-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="gov-badge ayush-badge" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
            🩺 Step 3: SOCRATES Symptom & OPD Department Elicitation
          </span>
          <h1 style={{ fontSize: '1.8rem', margin: '0.3rem 0' }}>Select OPD Department & Symptom Category</h1>
          <p className="subtitle" style={{ fontSize: '0.95rem' }}>
            Choose between Modern Allopathic OPD consultation or AYUSH Ayurvedic Dashavidha Pariksha.
          </p>
        </div>

        <div className="mode-selection-grid">
          {/* Mode A: Modern Allopathic OPD */}
          <div className="mode-category-box glass-card">
            <div className="mode-category-header">
              <span className="mode-pill allopathy-pill">🩺 Modern Allopathy OPD</span>
              <h3>General & Specialty Medicine</h3>
              <p className="small-text">SOCRATES symptom elicitation, organ-system analysis & emergency triage</p>
            </div>
            <div className="complaint-list-grid">
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'General Consultation / Symptoms')}
              >
                <span>🩺</span>
                <strong>General OPD / Mixed Symptoms</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Chest Pain / Cardiac Discomfort')}
              >
                <span>🫀</span>
                <strong>Chest Pain / Cardiac</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Fever / Infection / Chills')}
              >
                <span>🌡️</span>
                <strong>Fever / Acute Infection</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Headache / Neurological')}
              >
                <span>🤕</span>
                <strong>Headache / Migraine</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Abdominal Pain / Gastric')}
              >
                <span>🤢</span>
                <strong>Abdominal / GI Distress</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Dental Pain / Oral Care')}
              >
                <span>🦷</span>
                <strong>Dental / Oral Pain</strong>
              </button>
              <button
                className="complaint-btn"
                onClick={() => onSelectSymptom('allopathy', 'Skin Rash / Hair Fall')}
              >
                <span>🧴</span>
                <strong>Dermatology / Skin & Hair</strong>
              </button>
            </div>
          </div>

          {/* Mode B: AYUSH / Ayurvedic OPD */}
          <div className="mode-category-box glass-card ayush-mode-card">
            <div className="mode-category-header">
              <span className="mode-pill ayush-pill">🌿 AYUSH / आयुर्वेद ओपीडी</span>
              <h3>दशविध परीक्षा एवं प्रकृति विश्लेषण</h3>
              <p className="small-text">Trividha, Ashtavidha & Dashavidha Pariksha (Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara)</p>
            </div>
            <div className="complaint-list-grid">
              <button
                className="complaint-btn ayush-btn"
                onClick={() => onSelectSymptom('ayush', 'आयुर्वेदिक संपूर्ण स्वास्थ्य एवं दशविध परीक्षा')}
              >
                <span>🌿</span>
                <strong>संपूर्ण आयुर्वेदिक दशविध परीक्षा (General AYUSH)</strong>
              </button>
              <button
                className="complaint-btn ayush-btn"
                onClick={() => onSelectSymptom('ayush', 'वात रोग / संधिवात / संधि शूल (Joint & Nerve Pain)')}
              >
                <span>🦴</span>
                <strong>वात रोग / संधि शूल (Joints & Pain)</strong>
              </button>
              <button
                className="complaint-btn ayush-btn"
                onClick={() => onSelectSymptom('ayush', 'अम्लपित्त / उदर विकार (Acidity & Digestion)')}
              >
                <span>🔥</span>
                <strong>अम्लपित्त / मंदाग्नि (Acidity / Digestion)</strong>
              </button>
              <button
                className="complaint-btn ayush-btn"
                onClick={() => onSelectSymptom('ayush', 'त्वचा विकार / कुष्ठ / खाज (Ayurvedic Skin Care)')}
              >
                <span>🍃</span>
                <strong>त्वक विकार / एलर्जी (Skin / Blood Purifier)</strong>
              </button>
              <button
                className="complaint-btn ayush-btn"
                onClick={() => onSelectSymptom('ayush', 'अनिद्रा / मानसिक तनाव / मेध्य रसायन (Stress & Sleep)')}
              >
                <span>🧠</span>
                <strong>मानसिक तनाव / अनिद्रा (Stress & Sleep)</strong>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SymptomSelectionScreen;
