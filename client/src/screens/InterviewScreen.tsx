import React, { useState, useEffect, useRef } from 'react';
import QuickReplyChips from '../components/QuickReplyChips';
import VoiceButton from '../components/VoiceButton';
import ProgressBar from '../components/ProgressBar';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { LLMQuestionResponse, PatientInfo } from '../types/medikiosk';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

interface InterviewScreenProps {
  initialQuestion: LLMQuestionResponse;
  patientInfo?: PatientInfo | null;
  onAnswerSubmit: (answerText: string) => Promise<LLMQuestionResponse>;
  language?: string;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({
  initialQuestion,
  patientInfo,
  onAnswerSubmit,
  language = 'en',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: initialQuestion?.next_question || 'Hello, how can I help you today?',
    },
  ]);

  const [currentReplies, setCurrentReplies] = useState<string[]>(
    initialQuestion?.suggested_replies || []
  );

  const [inputVal, setInputVal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Read question aloud when new assistant message arrives
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      speak(lastMsg.text, language);
    }
  }, [messages, speak, language]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend || inputVal.trim();
    if (!text || isSubmitting) return;

    // Append user message
    const updatedMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInputVal('');
    setCurrentReplies([]);
    setIsSubmitting(true);

    try {
      const response = await onAnswerSubmit(text);
      if (response && response.next_question) {
        setMessages([...updatedMessages, { role: 'assistant', text: response.next_question }]);
        setCurrentReplies(response.suggested_replies || []);
        setQuestionCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (text) {
      handleSend(text);
    }
  };

  return (
    <div className="screen interview-screen slide-in">
      <div className="chat-container glass-card">
        {/* Header with Progress Bar */}
        <div className="chat-header">
          <div className="header-info">
            <span className="patient-name">
              👤 {patientInfo?.name || 'Patient'} ({patientInfo?.age || '35'}y, {patientInfo?.gender || 'Male'})
            </span>
            <span className="step-counter">Question {questionCount} of ~10</span>
          </div>
          <ProgressBar current={questionCount} total={10} />
        </div>

        {/* Chat History Messages */}
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className={`message-bubble ${msg.role} fade-in`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isSubmitting && (
            <div className="message-wrapper assistant">
              <div className="message-bubble assistant typing-indicator fade-in">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        {!isSubmitting && currentReplies.length > 0 && (
          <div className="chips-container fade-in">
            <QuickReplyChips
              options={currentReplies}
              onSelect={(opt) => handleSend(opt)}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Input Controls Bar (Voice + Text + Send) */}
        <div className="input-controls-bar">
          <div className="voice-col">
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              language={language}
              disabled={isSubmitting}
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
              placeholder="Type your answer or select a quick option..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="btn btn-primary send-btn"
              disabled={!inputVal.trim() || isSubmitting}
            >
              Send ➔
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;
