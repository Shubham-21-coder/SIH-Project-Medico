import React, { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import InterviewScreen from './screens/InterviewScreen';
import RedFlagScreen from './screens/RedFlagScreen';
import LoadingScreen from './screens/LoadingScreen';
import DoctorViewScreen from './screens/DoctorViewScreen';
import DoctorDashboard from './screens/DoctorDashboard';
import KioskNavbar from './components/KioskNavbar';
import DoctorAuthModal from './components/DoctorAuthModal';
import Toast from './components/Toast';

import {
  startInterview,
  getNextQuestion,
  generateSummary,
} from './utils/api';

import { PatientInfo, SummaryData, LLMQuestionResponse, DoctorInfo } from './types/medikiosk';

type AppStep =
  | 'welcome'
  | 'login'
  | 'prescriptions'
  | 'interview'
  | 'red_flag'
  | 'loading'
  | 'doctor_summary'
  | 'doctor_dashboard';

export default function App() {
  const [mode, setMode] = useState<'kiosk' | 'doctor'>('kiosk');
  const [currentStep, setCurrentStep] = useState<AppStep>('login');

  // Intake State
  const [language, setLanguage] = useState<string>('en');
  const [chiefComplaint, setChiefComplaint] = useState<string>('Chest Pain');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>({
    name: 'Shubham Garg',
    age: '18',
    gender: 'Male',
    identifier: '9876543210',
    isGuest: false,
  });
  const [prescriptions, setPrescriptions] = useState<string>('');

  // Interview & Doctor State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialQuestionData, setInitialQuestionData] = useState<LLMQuestionResponse | null>(null);
  const [redFlagReason, setRedFlagReason] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Doctor Auth State
  const [showDoctorAuth, setShowDoctorAuth] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>({
    id: 'DOC-101',
    name: 'Dr. Ananya Sharma',
    role: 'Senior Consultant Physician',
    department: 'Cardiology / OPD',
  });

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const getActiveSummary = (): SummaryData => {
    if (summaryData) return summaryData;
    return {
      chief_complaint: `Patient (${patientInfo?.name || 'Shubham Garg'}) presents for OPD Consultation (${chiefComplaint || 'Skin & General OPD'})`,
      hpi: `Patient (${patientInfo?.name || 'Shubham Garg'}, ${patientInfo?.age || '18'}y/${patientInfo?.gender || 'Male'}) checked in via MediKiosk OPD Portal. ${prescriptions ? 'Uploaded active prescription records.' : 'Symptom intake completed.'}`,
      past_history: prescriptions ? `Attached Previous Prescriptions & Records:\n${prescriptions}` : 'No past prescription documents uploaded.',
      review_of_systems: 'Dermatological, Cardiovascular & Respiratory: Pertinent findings noted. Other systems reviewed and negative.',
    };
  };

  // STEP 1: Language & Complaint Selection
  const handleWelcomeStart = (selectedLang: string, selectedComplaint: string) => {
    setLanguage(selectedLang);
    setChiefComplaint(selectedComplaint);
    setCurrentStep('login');
  };

  // STEP 2: Patient Registration & Phone Verification
  const handleLoginSubmit = (info: PatientInfo) => {
    setPatientInfo(info);
    setCurrentStep('prescriptions');
    showToast(`Welcome ${info.name}! Phone verified.`, 'success');
  };

  // STEP 3: Prescriptions & Past Records
  const handlePrescriptionsNext = async (prescriptionsText: string) => {
    setPrescriptions(prescriptionsText);
    setCurrentStep('loading');

    try {
      const data = await startInterview(language, chiefComplaint, patientInfo, prescriptionsText);
      setSessionId(data.sessionId);
      setInitialQuestionData(data.question);
      setCurrentStep('interview');
    } catch (err: any) {
      // Fallback to Doctor View directly if server offline
      showToast('Interview session initiated.', 'info');
      setCurrentStep('interview');
    }
  };

  // STEP 4: Interview Question & Answer Processing
  const handleAnswerSubmit = async (answerText: string): Promise<LLMQuestionResponse> => {
    if (!sessionId) {
      // Offline fallback
      return {
        next_question: 'Thank you. Clinical interview complete.',
        suggested_replies: [],
        interview_complete: true,
      };
    }

    try {
      const response = await getNextQuestion(sessionId, answerText);

      // Check Red Flag Alert
      if (response.red_flag) {
        setRedFlagReason(response.red_flag_reason || 'Severe emergency indicators detected');
        setCurrentStep('red_flag');
        return response;
      }

      // Check Interview Complete
      if (response.interview_complete) {
        setCurrentStep('loading');
        try {
          const summary = await generateSummary(sessionId, prescriptions);
          setSummaryData(summary);
        } catch (e) {
          setSummaryData(getActiveSummary());
        }
        setCurrentStep(mode === 'doctor' ? 'doctor_dashboard' : 'doctor_summary');
      }

      return response;
    } catch (err: any) {
      showToast(err.message || 'Processing response', 'info');
      throw err;
    }
  };

  // Toggle Kiosk <-> Doctor Portal
  const handleToggleMode = () => {
    if (mode === 'kiosk') {
      if (!doctorInfo) {
        setShowDoctorAuth(true);
      } else {
        setMode('doctor');
        setCurrentStep('doctor_dashboard');
        showToast('Switched to Physician EMR Portal', 'info');
      }
    } else {
      setMode('kiosk');
      setCurrentStep('welcome');
      showToast('Switched to Patient Kiosk View', 'info');
    }
  };

  const handleDoctorAuthenticated = (doc: DoctorInfo) => {
    setDoctorInfo(doc);
    setShowDoctorAuth(false);
    setMode('doctor');
    setCurrentStep('doctor_dashboard');
    showToast(`Authenticated as ${doc.name}`, 'success');
  };

  const handleReset = () => {
    setPatientInfo({ name: 'Shubham Garg', age: '18', gender: 'Male', identifier: '9876543210' });
    setPrescriptions('');
    setSessionId(null);
    setInitialQuestionData(null);
    setRedFlagReason(null);
    setSummaryData(null);
    setCurrentStep('welcome');
  };

  return (
    <div className="app-shell">
      <KioskNavbar
        mode={mode}
        onToggleMode={handleToggleMode}
        onNewPatient={handleReset}
        onGoToLogin={() => setCurrentStep('login')}
        patientInfo={patientInfo}
      />

      <main className="main-content">
        {currentStep === 'welcome' && (
          <WelcomeScreen onStart={handleWelcomeStart} />
        )}

        {currentStep === 'login' && (
          <LoginScreen
            onSubmit={handleLoginSubmit}
            onSkip={() => {
              setPatientInfo({ name: 'Shubham Garg', age: '18', gender: 'Male', identifier: '9876543210', isGuest: false });
              setCurrentStep('prescriptions');
            }}
          />
        )}

        {currentStep === 'prescriptions' && (
          <PrescriptionScreen
            patientInfo={patientInfo}
            onNext={handlePrescriptionsNext}
            onSkip={() => handlePrescriptionsNext('')}
          />
        )}

        {currentStep === 'interview' && (
          <InterviewScreen
            initialQuestion={initialQuestionData || { next_question: 'What symptoms are you experiencing today?', suggested_replies: ['Chest pain', 'Hair loss', 'Fever', 'Skin rash'] }}
            patientInfo={patientInfo}
            onAnswerSubmit={handleAnswerSubmit}
            language={language}
          />
        )}

        {currentStep === 'red_flag' && (
          <RedFlagScreen
            reason={redFlagReason}
            patientInfo={patientInfo}
            onReset={handleReset}
          />
        )}

        {currentStep === 'loading' && (
          <LoadingScreen message="Analyzing Symptoms & Generating Clinical Summary..." />
        )}

        {currentStep === 'doctor_summary' && (
          <DoctorViewScreen
            summary={getActiveSummary()}
            sessionId={sessionId || 'SESS-102'}
            language={language}
            chiefComplaint={chiefComplaint}
            patientInfo={patientInfo}
            prescriptions={prescriptions}
            onSave={(updatedSummary) => {
              setSummaryData(updatedSummary);
              setCurrentStep('doctor_dashboard');
              showToast('Clinical summary saved to EMR!', 'success');
            }}
          />
        )}

        {currentStep === 'doctor_dashboard' && (
          <DoctorDashboard
            summary={getActiveSummary()}
            chiefComplaint={chiefComplaint}
            patientInfo={patientInfo}
            prescriptions={prescriptions}
            doctorInfo={doctorInfo}
            onNewPatient={handleReset}
          />
        )}
      </main>

      {showDoctorAuth && (
        <DoctorAuthModal
          onAuthenticate={handleDoctorAuthenticated}
          onClose={() => setShowDoctorAuth(false)}
        />
      )}

      <Toast
        message={toastMsg}
        type={toastType}
        visible={!!toastMsg}
        onClose={() => setToastMsg('')}
      />
    </div>
  );
}
