import { useState, useCallback, useEffect } from 'react';

const LANGUAGE_TAGS: Record<string, string[]> = {
  hi: ['hi-IN', 'hi', 'en-IN'],
  mr: ['mr-IN', 'mr', 'hi-IN', 'hi', 'en-IN'], // Marathi is Devanagari; falls back to Hindi voice if Marathi not installed in OS
  te: ['te-IN', 'te', 'en-IN', 'hi-IN'],
  ta: ['ta-IN', 'ta', 'en-IN', 'hi-IN'],
  bn: ['bn-IN', 'bn', 'en-IN', 'hi-IN'],
  gu: ['gu-IN', 'gu', 'hi-IN', 'en-IN'],
  kn: ['kn-IN', 'kn', 'en-IN', 'hi-IN'],
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
};

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, [isSupported]);

  const speak = useCallback(
    (text: string, lang: string = 'hi') => {
      if (!isSupported || !text) return;

      try {
        window.speechSynthesis.cancel(); // Stop any pending speech
        window.speechSynthesis.resume(); // Ensure speech context is not paused by browser policy

        const cleanText = text.replace(/[*_#•►→🚨⚠️]/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const candidateTags = LANGUAGE_TAGS[lang] || ['hi-IN', 'en-IN'];
        utterance.lang = candidateTags[0];
        utterance.rate = 0.90; // Natural pacing for OPD kiosk clarity

        const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

        // 1. Try finding exact matching voice
        let selectedVoice: SpeechSynthesisVoice | undefined;
        for (const tag of candidateTags) {
          const match = allVoices.find(
            (v) =>
              v.lang.toLowerCase().replace(/_/g, '-').includes(tag.toLowerCase()) ||
              (lang === 'mr' && (v.name.toLowerCase().includes('marathi') || v.name.toLowerCase().includes('hindi') || v.lang.includes('hi'))) ||
              (lang === 'te' && (v.name.toLowerCase().includes('telugu') || v.lang.includes('te'))) ||
              (lang === 'ta' && (v.name.toLowerCase().includes('tamil') || v.lang.includes('ta'))) ||
              (lang === 'bn' && (v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla') || v.lang.includes('bn'))) ||
              (lang === 'gu' && (v.name.toLowerCase().includes('gujarati') || v.lang.includes('gu'))) ||
              (lang === 'kn' && (v.name.toLowerCase().includes('kannada') || v.lang.includes('kn'))) ||
              (lang === 'hi' && (v.name.toLowerCase().includes('hindi') || v.lang.includes('hi')))
          );
          if (match) {
            selectedVoice = match;
            utterance.lang = match.lang;
            break;
          }
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.warn('Speech synthesis error or fallback:', e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('SpeechSynthesis invocation failed:', err);
        setIsSpeaking(false);
      }
    },
    [isSupported, voices]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } catch (_) {}
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}


