import React, { useState } from 'react';
import { ClinicalMode } from '../types/medikiosk';

interface WelcomeScreenProps {
  onStart: (language: string, chiefComplaint: string, mode: ClinicalMode, staffAssist?: boolean) => void;
  isLoading?: boolean;
}

const LANGUAGES = [
  { code: 'hi', label: 'हिंदी (Hindi)', icon: '🇮🇳', region: 'National / North' },
  { code: 'en', label: 'English', icon: '🌐', region: 'Global / Standard' },
  { code: 'ta', label: 'தமிழ் (Tamil)', icon: '🇮🇳', region: 'Tamil Nadu' },
  { code: 'te', label: 'తెలుగు (Telugu)', icon: '🇮🇳', region: 'Andhra / Telangana' },
  { code: 'bn', label: 'বাংলা (Bengali)', icon: '🇮🇳', region: 'West Bengal' },
  { code: 'mr', label: 'मराठी (Marathi)', icon: '🇮🇳', region: 'Maharashtra' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', icon: '🇮🇳', region: 'Gujarat' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', icon: '🇮🇳', region: 'Karnataka' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<string>('hi');
  const [clinicalMode, setClinicalMode] = useState<ClinicalMode>('allopathy');
  const [staffAssist, setStaffAssist] = useState<boolean>(false);

  const handleLanguageSelect = (lang: string) => {
    setSelectedLang(lang);
    setStep(2);
  };

  const handleModeAndComplaintSelect = (mode: ClinicalMode, complaint: string) => {
    setClinicalMode(mode);
    onStart(selectedLang, complaint, mode, staffAssist);
  };


  return (
    <div className="screen welcome-screen flex-center fade-in">
      {/* STEP 1: Language & Digital India Accessibility */}
      {step === 1 && (
        <div className="step-container slide-in" style={{ maxWidth: '980px' }}>
          <div className="welcome-header">
            <div className="gov-badge-row">
              <span className="gov-badge">🇮🇳 National Health Mission & ABDM Enabled</span>
              <span className="gov-badge ayush-badge">🌿 Allopathy & AYUSH Integrated</span>
            </div>
            <h1>MediKiosk ✚ AI Clinical Intake</h1>
            <div className="subtitle">AI-Powered Multilingual OPD History & Document Digitization Platform</div>
            <p className="description">
              Select your language. You can speak or tap on screen to record your symptoms and digitize prior medical records before meeting your physician.
            </p>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>🗣️ Choose Your Preferred Language (अपनी भाषा चुनें)</h3>
          <div className="card-grid language-grid">
            {LANGUAGES.map((l) => (
              <div
                key={l.code}
                className={`card language-card glass-card ${selectedLang === l.code ? 'selected-lang' : ''}`}
                onClick={() => handleLanguageSelect(l.code)}
              >
                <div className="icon">{l.icon}</div>
                <div className="card-label">{l.label}</div>
                <div className="card-desc" style={{ fontSize: '0.75rem', opacity: 0.7 }}>{l.region}</div>
              </div>
            ))}
          </div>

          {/* Staff Assist Mode & DPDP Notice */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <div
              className={`glass-card ${staffAssist ? 'selected-lang' : ''}`}
              style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: staffAssist ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setStaffAssist(!staffAssist)}
            >
              <div style={{ fontSize: '1.8rem' }}>👨‍💼</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Volunteer / Staff Assist Mode</strong>
                  <span className="gov-badge" style={{ fontSize: '0.65rem', background: staffAssist ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
                    {staffAssist ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="small-text" style={{ margin: '0.2rem 0 0' }}>
                  Enable for hospital staff or triage nurses assisting elderly/first-time patients.
                </p>
              </div>
            </div>

            <div className="dpdp-banner glass-card" style={{ margin: 0 }}>
              <div className="dpdp-icon">🔒</div>
              <div className="dpdp-content">
                <strong>DPDP Act 2023 & ABDM Consent Compliant</strong>
                <p>Medical data is encrypted, ephemeral, and shared with treating doctor via ABDM FHIR standard upon explicit consent.</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* STEP 2: Clinical Department & Mode Selection (Allopathy vs AYUSH) */}
      {step === 2 && (
        <div className="step-container slide-in" style={{ maxWidth: '1080px' }}>
          <div className="welcome-header">
            <h1>Select OPD Department & Intake Mode</h1>
            <p className="subtitle">
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
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'General Consultation / Symptoms')}
                >
                  <span>🩺</span>
                  <strong>General OPD / Mixed Symptoms</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Chest Pain / Cardiac Discomfort')}
                >
                  <span>🫀</span>
                  <strong>Chest Pain / Cardiac</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Fever / Infection / Chills')}
                >
                  <span>🌡️</span>
                  <strong>Fever / Acute Infection</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Headache / Neurological')}
                >
                  <span>🤕</span>
                  <strong>Headache / Migraine</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Abdominal Pain / Gastric')}
                >
                  <span>🤢</span>
                  <strong>Abdominal / GI Distress</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Dental Pain / Oral Care')}
                >
                  <span>🦷</span>
                  <strong>Dental / Oral Pain</strong>
                </button>
                <button
                  className="complaint-btn"
                  onClick={() => handleModeAndComplaintSelect('allopathy', 'Skin Rash / Hair Fall')}
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
                  onClick={() => handleModeAndComplaintSelect('ayush', 'आयुर्वेदिक संपूर्ण स्वास्थ्य एवं दशविध परीक्षा')}
                >
                  <span>🌿</span>
                  <strong>संपूर्ण आयुर्वेदिक दशविध परीक्षा (General AYUSH)</strong>
                </button>
                <button
                  className="complaint-btn ayush-btn"
                  onClick={() => handleModeAndComplaintSelect('ayush', 'वात रोग / संधिवात / संधि शूल (Joint & Nerve Pain)')}
                >
                  <span>🦴</span>
                  <strong>वात रोग / संधि शूल (Joints & Pain)</strong>
                </button>
                <button
                  className="complaint-btn ayush-btn"
                  onClick={() => handleModeAndComplaintSelect('ayush', 'अम्लपित्त / उदर विकार (Acidity & Digestion)')}
                >
                  <span>🔥</span>
                  <strong>अम्लपित्त / मंदाग्नि (Acidity / Digestion)</strong>
                </button>
                <button
                  className="complaint-btn ayush-btn"
                  onClick={() => handleModeAndComplaintSelect('ayush', 'त्वचा विकार / कुष्ठ / खाज (Ayurvedic Skin Care)')}
                >
                  <span>🍃</span>
                  <strong>त्वक विकार / एलर्जी (Skin / Blood Purifier)</strong>
                </button>
                <button
                  className="complaint-btn ayush-btn"
                  onClick={() => handleModeAndComplaintSelect('ayush', 'अनिद्रा / मानसिक तनाव / मेध्य रसायन (Stress & Sleep)')}
                >
                  <span>🧠</span>
                  <strong>मानसिक तनाव / अनिद्रा (Stress & Sleep)</strong>
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back to Language Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
