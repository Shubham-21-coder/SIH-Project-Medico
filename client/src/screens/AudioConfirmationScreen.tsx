import React, { useEffect, useState } from 'react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { SummaryData, PatientInfo, ClinicalMode } from '../types/medikiosk';
import { getAudioConfirmationStrings } from '../constants/indicTranslations';

interface AudioConfirmationScreenProps {
  summary: SummaryData;
  patientInfo?: PatientInfo | null;
  clinicalMode?: ClinicalMode;
  language?: string;
  onConfirm: () => void;
  onEdit: () => void;
}

const AudioConfirmationScreen: React.FC<AudioConfirmationScreenProps> = ({
  summary,
  patientInfo,
  clinicalMode = 'allopathy',
  language = 'hi',
  onConfirm,
  onEdit,
}) => {
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const loc = getAudioConfirmationStrings(language);
  const isAyush = clinicalMode === 'ayush';
  const audioText = loc.spokenText(patientInfo?.name || '', summary.chief_complaint, isAyush);

  useEffect(() => {
    speak(audioText, language);
    setIsPlaying(true);
    return () => {
      stop();
    };
  }, [audioText, language, speak, stop]);

  const handleTogglePlay = () => {
    if (isSpeaking) {
      stop();
      setIsPlaying(false);
    } else {
      speak(audioText, language);
      setIsPlaying(true);
    }
  };

  return (
    <div className="screen audio-confirm-screen slide-in" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        {/* Header with audio wave indicator */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="gov-badge-row" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
            <span className="gov-badge">🔊 PRD FR-12: Spoken Confirmation</span>
            <span className="gov-badge dpdp-badge">🔒 DPDP Act 2023 Compliant</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
            {loc.title}
          </h2>
          <p className="description" style={{ fontSize: '0.95rem' }}>
            {loc.description}
          </p>
        </div>

        {/* Audio Player Card */}
        <div
          className="glass-card"
          style={{
            padding: '1.25rem',
            background: 'rgba(0, 212, 170, 0.08)',
            border: '1.5px solid var(--accent-teal)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleTogglePlay}
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
            >
              {isSpeaking ? '⏸️' : '▶️'}
            </button>
            <div>
              <strong style={{ color: 'var(--accent-teal)', display: 'block', fontSize: '1rem' }}>
                {isSpeaking ? loc.playing : loc.paused}
              </strong>
              <span className="small-text">Language: {language.toUpperCase()} • Voice: Bhashini Indic TTS</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => speak(audioText, language)}>
            {loc.replay}
          </button>
        </div>

        {/* Structured Points Box */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(10, 20, 38, 0.6)' }}>
          <h4 style={{ color: 'var(--accent-teal)', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📋 Recorded Summary for Dr. Review
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.92rem' }}>
            <div>
              <strong>{loc.patientLabel}</strong> {patientInfo?.name || 'Patient'} ({patientInfo?.age || '30'}y / {patientInfo?.gender || 'Male'}) • ABHA: {patientInfo?.identifier || '91-4920-1849-2810'}
            </div>
            <div>
              <strong>{loc.chiefComplaintLabel}</strong> {summary.chief_complaint}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <strong>{loc.hpiLabel}</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                {summary.hpi}
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-lg" onClick={onEdit} style={{ flex: '1 1 200px' }}>
            {loc.editBtn}
          </button>
          <button className="btn btn-primary btn-lg" onClick={onConfirm} style={{ flex: '2 1 300px' }}>
            {loc.confirmBtn} ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioConfirmationScreen;

