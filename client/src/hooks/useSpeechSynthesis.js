import { useCallback, useEffect, useRef } from 'react';

export default function useSpeechSynthesis() {
  const isSpeaking = useRef(false);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Preload voices
  useEffect(() => {
    if (!isSupported) return;
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback((text, lang = 'en-IN') => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => { isSpeaking.current = true; };
    utterance.onend = () => { isSpeaking.current = false; };
    utterance.onerror = () => { isSpeaking.current = false; };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      isSpeaking.current = false;
    }
  }, [isSupported]);

  return { speak, stop, isSupported };
}
