import React, { useState, useEffect } from 'react';
import ProgressBar from '../components/ProgressBar';
import VoiceButton from '../components/VoiceButton';
import QuickReplyChips from '../components/QuickReplyChips';
import Toast from '../components/Toast';
import { getNextQuestion } from '../utils/api';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';

const InterviewScreen = ({ sessionId, firstQuestion, language, chiefComplaint, onComplete, onRedFlag }) => {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion?.next_question || '');
  const [suggestedReplies, setSuggestedReplies] = useState(firstQuestion?.suggested_replies || []);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [animationKey, setAnimationKey] = useState(0);
  const [error, setError] = useState('');

  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    if (currentQuestion) {
      speak(currentQuestion, language);
    }
  }, [currentQuestion, language, speak]);

  const handleSubmit = async (answer) => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await getNextQuestion(sessionId, answer);
      
      const newHistory = [...history, { question: currentQuestion, answer }];
      setHistory(newHistory);

      if (response.red_flag) {
        onRedFlag(response.red_flag_reason);
        return;
      }

      if (response.interview_complete) {
        onComplete(newHistory);
        return;
      }

      setCurrentQuestion(response.next_question);
      setSuggestedReplies(response.suggested_replies || []);
      setInputValue('');
      setQuestionCount(c => c + 1);
      setAnimationKey(k => k + 1);
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceTranscript = (text) => {
    setInputValue(text);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const progress = Math.min((questionCount / 11) * 100, 100);

  return (
    <div className="screen interview-screen">
      <ProgressBar current={questionCount} total={11} />

      <div className="interview-container">
        <div className="question-badge">Question {questionCount}</div>
        
        <div key={animationKey} className="question-box glass-card slide-in">
          <h2>{currentQuestion}</h2>
        </div>

        {suggestedReplies.length > 0 && (
          <QuickReplyChips 
            options={suggestedReplies} 
            onSelect={handleSubmit} 
            disabled={isSubmitting}
          />
        )}

        <VoiceButton 
          onTranscript={handleVoiceTranscript}
          language={language}
          disabled={isSubmitting}
        />

        <div className="or-divider">or type your answer</div>

        <form className="answer-form" onSubmit={handleFormSubmit}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type your answer here..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSubmitting}
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !inputValue.trim()}>
            {isSubmitting ? <span className="spinner"></span> : 'Send'}
          </button>
        </form>
      </div>

      <Toast 
        message={error} 
        type="error" 
        visible={!!error} 
        onClose={() => setError('')} 
      />
    </div>
  );
};

export default InterviewScreen;
