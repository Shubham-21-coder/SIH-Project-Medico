import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStart: (language: string, chiefComplaint: string) => void;
  isLoading?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<string>('');

  const handleLanguageSelect = (lang: string) => {
    setSelectedLang(lang);
    setStep(2);
  };

  const handleComplaintSelect = (complaint: string) => {
    onStart(selectedLang, complaint);
  };

  return (
    <div className="screen welcome-screen flex-center">
      {step === 1 && (
        <div className="step-container slide-in">
          <div className="welcome-header">
            <h1>MediKiosk ✚</h1>
            <div className="subtitle">AI-Powered Clinical History Taking</div>
            <div className="description">
              Complete your medical history in minutes using voice or touch, before seeing your doctor.
            </div>
          </div>

          <h2 style={{ marginTop: '3rem' }}>Please select your language</h2>
          <div className="card-grid">
            <div className="card language-card glass-card" onClick={() => handleLanguageSelect('en')}>
              <div className="icon">🇬🇧</div>
              <div className="card-label">English</div>
            </div>
            <div className="card language-card glass-card" onClick={() => handleLanguageSelect('hi')}>
              <div className="icon">🇮🇳</div>
              <div className="card-label">हिंदी (Hindi)</div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-container slide-in">
          <div className="welcome-header">
            <h1>MediKiosk ✚</h1>
          </div>

          <h2>What brings you in today?</h2>
          <div className="card-grid complaint-grid">
            <div className="card complaint-card glass-card" onClick={() => handleComplaintSelect('Chest Pain')}>
              <div className="icon">🫀</div>
              <div className="card-label">Chest Pain</div>
              <div className="card-desc">Pain or discomfort in the chest area</div>
            </div>
            <div className="card complaint-card glass-card" onClick={() => handleComplaintSelect('Headache')}>
              <div className="icon">🤕</div>
              <div className="card-label">Headache</div>
              <div className="card-desc">Severe or persistent pain in the head</div>
            </div>
            <div className="card complaint-card glass-card" onClick={() => handleComplaintSelect('Fever')}>
              <div className="icon">🌡️</div>
              <div className="card-label">Fever</div>
              <div className="card-desc">High body temperature and chills</div>
            </div>
            <div className="card complaint-card glass-card" onClick={() => handleComplaintSelect('Stomach Ache')}>
              <div className="icon">🤢</div>
              <div className="card-label">Stomach Ache</div>
              <div className="card-desc">Abdominal pain or discomfort</div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '2rem' }}
            onClick={() => setStep(1)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
