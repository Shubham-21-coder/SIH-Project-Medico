import React, { useEffect, useRef } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
}

const STT_LANG_MAP: Record<string, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  en: 'en-IN',
};

const VoiceButton: React.FC<VoiceButtonProps> = ({ onTranscript, language = 'en-IN', disabled }) => {
  const langKey = language.toLowerCase().split('-')[0];
  const langCode = STT_LANG_MAP[langKey] || language || 'en-IN';
  const { isListening, transcript, interimTranscript, isSupported, startListening, stopListening } = useSpeechRecognition(langCode);
  const prevListeningRef = useRef<boolean>(false);


  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcript) {
      onTranscript(transcript);
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        className="voice-btn"
        disabled
        title="Voice input not supported in this browser"
      >
        🎤
      </button>
    );
  }

  return (
    <div className="voice-section">
      <button
        type="button"
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={disabled}
      >
        {isListening ? '⏹️' : '🎤'}
      </button>
      {isListening && (
        <div className="interim-text">
          {interimTranscript || transcript || 'Listening...'}
        </div>
      )}
      <div className="voice-label">Tap to Speak</div>
    </div>
  );
};

export default VoiceButton;
