import React, { useState, useEffect, useRef } from 'react';
import QuickReplyChips from '../components/QuickReplyChips';
import VoiceButton from '../components/VoiceButton';
import ProgressBar from '../components/ProgressBar';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { LLMQuestionResponse, PatientInfo, ClinicalMode } from '../types/medikiosk';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  category?: string;
  isStreaming?: boolean;
}

interface InterviewScreenProps {
  initialQuestion: LLMQuestionResponse;
  patientInfo?: PatientInfo | null;
  clinicalMode?: ClinicalMode;
  onAnswerSubmit: (answerText: string, answerState?: string, provenance?: any) => Promise<LLMQuestionResponse>;
  language?: string;
}

const THINKING_STAGES = [
  '🧠 Analyzing your symptom narrative & clinical slots...',
  '🩺 Cross-referencing diagnostic dimensions & red-flags...',
  '✍️ Formulating targeted physician follow-up question...',
];

const InterviewScreen: React.FC<InterviewScreenProps> = ({
  initialQuestion,
  patientInfo,
  clinicalMode = 'allopathy',
  onAnswerSubmit,
  language = 'hi',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: initialQuestion?.next_question || 'Hello! What health issue or symptoms are you experiencing today?',
      category: initialQuestion?.ayush_category,
    },
  ]);

  const [currentReplies, setCurrentReplies] = useState<string[]>(
    initialQuestion?.suggested_replies || []
  );

  const [currentCategory, setCurrentCategory] = useState<string | undefined>(
    initialQuestion?.ayush_category
  );

  const [inputVal, setInputVal] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingStageIndex, setThinkingStageIndex] = useState<number>(0);
  const [isStreamingText, setIsStreamingText] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isStreamingText]);

  // Read question aloud when new assistant message arrives
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isStreamingText && !isThinking) {
      speak(lastMsg.text, language);
    }
  }, [messages, isStreamingText, isThinking, speak, language]);

  // Realistic thinking stage progression
  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setThinkingStageIndex((prev) => (prev + 1) % THINKING_STAGES.length);
    }, 550);
    return () => clearInterval(interval);
  }, [isThinking]);

  // Stream assistant text smoothly word-by-word
  const streamAssistantMessage = (
    fullText: string,
    category?: string,
    replies?: string[]
  ) => {
    setIsStreamingText(true);
    setCurrentReplies([]);

    const words = fullText.split(' ');
    let currentWordIndex = 0;

    // Add placeholder streaming message
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: words[0] || '',
        category,
        isStreaming: true,
      },
    ]);

    const timer = setInterval(() => {
      currentWordIndex++;
      if (currentWordIndex < words.length) {
        const textSlice = words.slice(0, currentWordIndex + 1).join(' ');
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: textSlice,
            };
          }
          return updated;
        });
      } else {
        clearInterval(timer);
        setIsStreamingText(false);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: fullText,
              isStreaming: false,
            };
          }
          return updated;
        });
        if (replies && replies.length > 0) {
          setCurrentReplies(replies);
        }
      }
    }, 45); // 45ms per word for natural conversational cadence
  };

  const handleSend = async (textToSend: string, inputMethod: 'text' | 'voice' | 'touch' = 'text', answerState: string = 'answered') => {
    const text = textToSend || inputVal.trim();
    if (!text || isThinking || isStreamingText) return;

    // PRD FR03: Show answer state label for non-standard responses
    const displayText = answerState === 'unknown' ? `[I don't know] ${text}`
      : answerState === 'declined' ? `[Prefer not to answer] ${text}`
      : text;

    // 1. Instantly display user bubble
    const updatedMessages: Message[] = [...messages, { role: 'user', text: displayText }];
    setMessages(updatedMessages);
    setInputVal('');
    setCurrentReplies([]);
    setIsThinking(true);
    setThinkingStageIndex(0);

    const startTime = Date.now();

    try {
      // 2. Fetch intelligent follow-up from Clinical Engine
      const responsePromise = onAnswerSubmit(text, answerState, {
        language: language === 'hi' ? 'hi-IN' : language,
        inputMethod,
        speakerRole: 'patient',
        timestamp: new Date().toISOString(),
      });

      // 3. Ensure realistic clinical thinking duration (~1.4s to 1.8s)
      const [response] = await Promise.all([
        responsePromise,
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);

      setIsThinking(false);

      if (response && response.next_question) {
        setCurrentCategory(response.ayush_category);
        if (!(response as any).is_invalid_answer) {
          setQuestionCount((prev) => prev + 1);
        }

        // 4. Stream response word-by-word
        streamAssistantMessage(
          response.next_question,
          response.ayush_category,
          response.suggested_replies
        );
      }
    } catch (err) {
      console.error('Interview error:', err);
      setIsThinking(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (text) {
      handleSend(text, 'voice');
    }
  };

  return (
    <div className="screen interview-screen slide-in">
      <div className="chat-container glass-card">
        {/* Header with Progress Bar & Mode Badge */}
        <div className="chat-header">
          <div className="header-info">
            <span className="patient-name">
              👤 {patientInfo?.name || 'Shubham Garg'} ({patientInfo?.age || '20'}y, {patientInfo?.gender || 'Male'})
              <span className={`mode-pill-mini ${clinicalMode === 'ayush' ? 'ayush-pill' : 'allopathy-pill'}`} style={{ marginLeft: '0.6rem' }}>
                {clinicalMode === 'ayush' ? '🌿 आयुर्वेद दशविध परीक्षा' : '🩺 Allopathy SOCRATES'}
              </span>
            </span>
            <span className="step-counter">Question {questionCount} of ~10</span>
          </div>

          {currentCategory && (
            <div className="ayush-category-banner fade-in">
              <span>📋 Active Assessment: <strong>{currentCategory}</strong></span>
            </div>
          )}

          <ProgressBar current={questionCount} total={10} />
        </div>

        {/* Chat History Messages */}
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className={`message-bubble ${msg.role} fade-in ${msg.isStreaming ? 'streaming-bubble' : ''}`}>
                {msg.category && msg.role === 'assistant' && (
                  <div className="bubble-category-tag">🌿 {msg.category}</div>
                )}
                {msg.text}
                {msg.isStreaming && <span className="typing-cursor">|</span>}
              </div>
            </div>
          ))}

          {/* Realistic Clinical Doctor Thinking State */}
          {isThinking && (
            <div className="message-wrapper assistant">
              <div className="message-bubble assistant doctor-thinking-card fade-in">
                <div className="thinking-spinner-row">
                  <div className="doctor-pulse-dot"></div>
                  <span className="thinking-stage-text">
                    {THINKING_STAGES[thinkingStageIndex]}
                  </span>
                </div>
                <div className="thinking-progress-bar">
                  <div className="thinking-progress-fill"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips (faded in smoothly when ready) */}
        {!isThinking && !isStreamingText && currentReplies.length > 0 && (
          <div className="chips-container fade-in">
            <div className="chips-hint-label">⚡ Quick options (or type/speak below):</div>
            <QuickReplyChips
              options={currentReplies}
              onSelect={(opt) => handleSend(opt, 'touch')}
              disabled={isThinking || isStreamingText}
            />
            {/* PRD FR03: Distinct answer state buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '16px', opacity: 0.85 }}
                onClick={() => handleSend('I don\'t know', 'touch', 'unknown')}
                disabled={isThinking || isStreamingText}
              >
                🤷 I don't know
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '16px', opacity: 0.85 }}
                onClick={() => handleSend('Prefer not to answer', 'touch', 'declined')}
                disabled={isThinking || isStreamingText}
              >
                🚫 Prefer not to answer
              </button>
            </div>
          </div>
        )}

        {/* Input Controls Bar (Voice + Text + Send) */}
        <div className="input-controls-bar">
          <div className="voice-col">
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              language={language === 'hi' ? 'hi-IN' : language}
              disabled={isThinking || isStreamingText}
            />
          </div>

          <form
            className="text-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
          >
            <input
              type="text"
              className="input-field chat-input"
              placeholder={isThinking ? 'Doctor is evaluating your answer...' : 'Type your answer or speak into microphone...'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isThinking || isStreamingText}
            />
            <button
              type="submit"
              className="btn btn-primary send-btn"
              disabled={!inputVal.trim() || isThinking || isStreamingText}
            >
              {isThinking ? 'Thinking...' : 'Send ➔'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;
