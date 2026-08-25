import React, { useState } from 'react';
import KioskNavbar from './components/KioskNavbar';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import InterviewScreen from './screens/InterviewScreen';
import RedFlagScreen from './screens/RedFlagScreen';
import LoadingScreen from './screens/LoadingScreen';
import DoctorViewScreen from './screens/DoctorViewScreen';
import DoctorDashboard from './screens/DoctorDashboard';
import DoctorAuthModal from './components/DoctorAuthModal';
import Toast from './components/Toast';
import { startInterview, generateSummary } from './utils/api';

function App() {
  const [appState, setAppState] = useState('login'); // 'login', 'welcome', 'prescription', 'interview', 'redFlag', 'loading', 'doctorView', 'doctorDashboard'
  const [patientInfo, setPatientInfo] = useState(null);
  const [language, setLanguage] = useState('en');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [firstQuestion, setFirstQuestion] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [redFlagReason, setRedFlagReason] = useState('');
  const [showDoctorAuth, setShowDoctorAuth] = useState(false);
  const [authenticatedDoctor, setAuthenticatedDoctor] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [toastVisible, setToastVisible] = useState(false);
  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);

  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLoginSubmit = (patientData) => {
    setPatientInfo(patientData);
    setAppState('welcome');
  };

  const handleWelcomeStart = (selectedLang, selectedComplaint) => {
    setLanguage(selectedLang);
    setChiefComplaint(selectedComplaint);
    setAppState('prescription');
  };

  const handlePrescriptionSubmit = async (prescriptionData) => {
    setPrescriptions(prescriptionData);
    setIsLoadingOverlay(true);

    try {
      const data = await startInterview(language, chiefComplaint, patientInfo, prescriptionData);
      setSessionId(data.sessionId);
      setFirstQuestion(data.question);
      setAppState('interview');
    } catch (error) {
      showToast('Failed to start interview. Please try again.', 'error');
    } finally {
      setIsLoadingOverlay(false);
    }
  };

  const handlePrescriptionSkip = async () => {
    setPrescriptions('');
    setIsLoadingOverlay(true);

    try {
      const data = await startInterview(language, chiefComplaint, patientInfo, '');
      setSessionId(data.sessionId);
      setFirstQuestion(data.question);
      setAppState('interview');
    } catch (error) {
      showToast('Failed to start interview. Please try again.', 'error');
    } finally {
      setIsLoadingOverlay(false);
    }
  };

  const handleInterviewComplete = async (finalHistory) => {
    setHistory(finalHistory);
    setAppState('loading');

    try {
      const summaryData = await generateSummary(sessionId, prescriptions);
      setSummary(summaryData);
      setAppState('doctorView');
    } catch (error) {
      showToast('Failed to generate summary.', 'error');
      setAppState('interview');
    }
  };

  const handleRedFlag = (reason) => {
    setRedFlagReason(reason);
    setAppState('redFlag');
  };

  const handleRedFlagAcknowledge = async () => {
    setAppState('loading');
    try {
      const summaryData = await generateSummary(sessionId, prescriptions);
      setSummary(summaryData);
      setAppState('doctorView');
    } catch (error) {
      showToast('Failed to generate summary.', 'error');
      setAppState('redFlag');
    }
  };

  const handleSaveDoctorView = (editedSummary) => {
    setSummary(editedSummary);
    showToast('Summary saved & pushed to Doctor EMR Portal!', 'success');
    setTimeout(() => {
      if (!authenticatedDoctor) {
        setShowDoctorAuth(true);
      } else {
        setAppState('doctorDashboard');
      }
    }, 1500);
  };

  const resetSession = () => {
    setAppState('login');
    setPatientInfo(null);
    setLanguage('en');
    setChiefComplaint('');
    setPrescriptions('');
    setSessionId('');
    setFirstQuestion(null);
    setHistory([]);
    setSummary(null);
    setRedFlagReason('');
  };

  const toggleNavbarMode = () => {
    if (appState === 'doctorDashboard') {
      setAppState('login');
    } else {
      if (!authenticatedDoctor) {
        setShowDoctorAuth(true);
      } else {
        setAppState('doctorDashboard');
      }
    }
  };

  const handleDoctorAuthenticated = (doctorInfo) => {
    setAuthenticatedDoctor(doctorInfo);
    setShowDoctorAuth(false);
    showToast(`Authenticated as ${doctorInfo.name}`, 'success');
    setAppState('doctorDashboard');
  };

  return (
    <div className="app-container">
      <KioskNavbar
        mode={appState === 'doctorDashboard' ? 'doctor' : 'kiosk'}
        onToggleMode={toggleNavbarMode}
        onNewPatient={appState !== 'login' ? resetSession : null}
        patientInfo={patientInfo}
      />

      {appState === 'login' && (
        <LoginScreen onSubmit={handleLoginSubmit} onSkip={() => handleLoginSubmit({ name: 'Guest Patient', age: '35', gender: 'Male', identifier: 'ABHA-DEMO-9823' })} />
      )}

      {appState === 'welcome' && (
        <WelcomeScreen onStart={handleWelcomeStart} isLoading={isLoadingOverlay} />
      )}

      {appState === 'prescription' && (
        <PrescriptionScreen
          patientInfo={patientInfo}
          onNext={handlePrescriptionSubmit}
          onSkip={handlePrescriptionSkip}
        />
      )}

      {appState === 'interview' && (
        <InterviewScreen
          sessionId={sessionId}
          firstQuestion={firstQuestion}
          language={language}
          chiefComplaint={chiefComplaint}
          onComplete={handleInterviewComplete}
          onRedFlag={handleRedFlag}
        />
      )}

      {appState === 'redFlag' && (
        <RedFlagScreen
          reason={redFlagReason}
          onAcknowledge={handleRedFlagAcknowledge}
        />
      )}

      {appState === 'loading' && <LoadingScreen />}

      {appState === 'doctorView' && (
        <DoctorViewScreen
          summary={summary}
          sessionId={sessionId}
          language={language}
          chiefComplaint={chiefComplaint}
          patientInfo={patientInfo}
          prescriptions={prescriptions}
          onSave={handleSaveDoctorView}
        />
      )}

      {appState === 'doctorDashboard' && (
        <DoctorDashboard
          currentSession={{
            sessionId,
            patientInfo,
            chiefComplaint,
            prescriptions,
            summary,
            redFlagReason,
          }}
          onBackToKiosk={() => setAppState('login')}
        />
      )}

      {showDoctorAuth && (
        <DoctorAuthModal
          onAuthenticate={handleDoctorAuthenticated}
          onClose={() => setShowDoctorAuth(false)}
        />
      )}

      {isLoadingOverlay && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}

export default App;
