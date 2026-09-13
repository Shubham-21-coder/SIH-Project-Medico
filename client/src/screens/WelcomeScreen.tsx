import React, { useState } from 'react';

interface WelcomeScreenProps {
  onSelectLanguage: (language: string, staffAssist?: boolean) => void;
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

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectLanguage }) => {
  const [selectedLang, setSelectedLang] = useState<string>('hi');
  const [staffAssist, setStaffAssist] = useState<boolean>(false);

  const handleLanguageClick = (langCode: string) => {
    setSelectedLang(langCode);
    onSelectLanguage(langCode, staffAssist);
  };

  return (
    <div className="screen welcome-screen flex-center fade-in">
      <div className="step-container slide-in" style={{ maxWidth: '980px' }}>
        <div className="welcome-header">
          <div className="gov-badge-row">
            <span className="gov-badge">🇮🇳 National Health Mission & ABDM Enabled</span>
            <span className="gov-badge ayush-badge">🌿 Allopathy & AYUSH Integrated</span>
          </div>
          <h1>Ayush Setu (आयुष सेतु) ✚ AI Clinical Intake</h1>
          <div className="subtitle">AI-Powered Multilingual OPD History, ABDM & AYUSH Dashavidha Platform</div>

          <p className="description">
            Step 1: Select your preferred language. You can speak or tap on screen to record your health history.
          </p>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>🗣️ Step 1: Choose Your Preferred Language (अपनी भाषा चुनें)</h3>
        <div className="card-grid language-grid">
          {LANGUAGES.map((l) => (
            <div
              key={l.code}
              className={`card language-card glass-card ${selectedLang === l.code ? 'selected-lang' : ''}`}
              onClick={() => handleLanguageClick(l.code)}
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
    </div>
  );
};

export default WelcomeScreen;
