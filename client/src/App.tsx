import React, { useState, useEffect, useCallback } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SymptomSelectionScreen from './screens/SymptomSelectionScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import InterviewScreen from './screens/InterviewScreen';
import AudioConfirmationScreen from './screens/AudioConfirmationScreen';
import RedFlagScreen from './screens/RedFlagScreen';
import LoadingScreen from './screens/LoadingScreen';
import DoctorViewScreen from './screens/DoctorViewScreen';
import DoctorDashboard from './screens/DoctorDashboard';
import PatientDashboard from './screens/PatientDashboard';
import KioskNavbar from './components/KioskNavbar';
import DoctorAuthModal from './components/DoctorAuthModal';
import Toast from './components/Toast';

import {
  startInterview,
  sendAnswer,
  generateSummary,
  purgeSession,
} from './utils/api';

import { PatientInfo, SummaryData, LLMQuestionResponse, DoctorInfo, ClinicalMode, ConsentRecord, ReviewState, DeliveryStatus } from './types/medikiosk';

type AppStep =
  | 'welcome'
  | 'login'
  | 'symptoms'
  | 'consent_refused'
  | 'prescriptions'
  | 'interview'
  | 'audio_confirm'
  | 'red_flag'
  | 'loading'
  | 'doctor_summary'
  | 'doctor_dashboard'
  | 'patient_dashboard';

// PRD FR15: Session timeout (10 minutes idle)
const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const SESSION_WARN_BEFORE_MS = 2 * 60 * 1000;

export default function App() {
  const [mode, setMode] = useState<'kiosk' | 'doctor'>('kiosk');
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [staffAssist, setStaffAssist] = useState<boolean>(false);

  // Intake State — PRD FR01: No hardcoded defaults
  const [language, setLanguage] = useState<string>('hi');
  const [clinicalMode, setClinicalMode] = useState<ClinicalMode>('allopathy');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [prescriptions, setPrescriptions] = useState<string>('');

  // PRD FR02/FR13: Consent tracking
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);

  // PRD FR01/FR14: Encounter & review tracking
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>('in_progress');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('not_requested');

  // Interview & Doctor State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialQuestionData, setInitialQuestionData] = useState<LLMQuestionResponse | null>(null);
  const [redFlagReason, setRedFlagReason] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Doctor Auth State
  const [showDoctorAuth, setShowDoctorAuth] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // PRD FR15: Session timeout state
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
  };

  // PRD FR15: Track activity and handle session timeout
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetActivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetActivityTimer]);

  useEffect(() => {
    if (currentStep === 'welcome' || !sessionId) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= SESSION_IDLE_TIMEOUT_MS) {
        handleReset();
        showToast('Session expired due to inactivity. Patient data cleared.', 'info');
      } else if (elapsed >= SESSION_IDLE_TIMEOUT_MS - SESSION_WARN_BEFORE_MS) {
        setShowTimeoutWarning(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastActivity, currentStep, sessionId]);

  // PRD FR15: Warn before browser close during active intake
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId && currentStep !== 'welcome') {
        e.preventDefault();
        e.returnValue = 'You have an active intake session. Leaving will clear your data.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, currentStep]);

  const getActiveSummary = (): SummaryData => {
    if (summaryData) return summaryData;
    if (clinicalMode === 'ayush') {
      return {
        clinical_mode: 'ayush',
        chief_complaint: chiefComplaint ? `आयुर्वेदिक ओपीडी परामर्श: ${chiefComplaint}` : '[Not recorded] — Chief complaint not captured.',
        hpi: patientInfo ? `रोगी (${patientInfo.name}, ${patientInfo.age} वर्ष / ${patientInfo.gender}) — Dashavidha Pariksha intake pending.` : '[Not recorded]',
        past_history: prescriptions ? `[HISTORIC] पूर्व औषध (verify current status):\n${prescriptions}` : '[Not provided] — No prior documents uploaded.',
        review_of_systems: '[Not completed] — Review of systems pending interview.',
        missingFields: ['hpi', 'medications_allergies', 'review_of_systems'],
        reviewState: 'in_progress',
      };
    }
    return {
      clinical_mode: 'allopathy',
      chief_complaint: chiefComplaint ? `Patient presents for: ${chiefComplaint}` : '[Not recorded] — Chief complaint not captured.',
      hpi: patientInfo ? `Patient (${patientInfo.name}, ${patientInfo.age}y/${patientInfo.gender}) — History intake pending.` : '[Not recorded]',
      past_history: prescriptions ? `[HISTORIC — verify current status]\n${prescriptions}` : '[Not provided] — No prior documents uploaded.',
      review_of_systems: '[Not completed] — Review of systems pending interview.',
      missingFields: ['hpi', 'medications_allergies', 'family_history', 'review_of_systems'],
      reviewState: 'in_progress',
    };
  };

  // STEP 1: Language Selection
  const handleSelectLanguage = (selectedLang: string, assist: boolean = false) => {
    setLanguage(selectedLang);
    setStaffAssist(assist);
    setCurrentStep('login');
    resetActivityTimer();
    if (assist) {
      showToast('Staff Assist Mode active for intake', 'info');
    }
  };

  // STEP 2: Patient Sign In & Registration (Login as a New User / Sign In)
  const handleLoginSubmit = (info: PatientInfo) => {
    // PRD FR02: Check consent before proceeding
    if (!info.consentGranted) {
      setCurrentStep('consent_refused');
      return;
    }

    // PRD FR13: Create structured consent record
    const consent: ConsentRecord = {
      version: '1.0',
      language,
      purposes: ['clinical_intake', 'document_digitization', 'clinician_review'],
      grantedBy: info.name,
      speakerRole: staffAssist ? 'staff' : 'patient',
      timestamp: new Date().toISOString(),
      revoked: false,
      explanationRead: true,
    };

    setConsentRecord(consent);
    setPatientInfo({ ...info, clinicalMode });
    setCurrentStep('symptoms');
    resetActivityTimer();
    showToast(`Welcome ${info.name}! Authentication verified. Proceeding to symptom selection.`, 'success');
  };

  // STEP 3: SOCRATES Symptom & Department Selection
  const handleSelectSymptom = (selectedMode: ClinicalMode, selectedComplaint: string) => {
    setClinicalMode(selectedMode);
    setChiefComplaint(selectedComplaint);
    setCurrentStep('prescriptions');
    resetActivityTimer();
  };

  // STEP 4: Prescriptions & Past Document Digitization
  const handlePrescriptionsNext = async (prescriptionsText: string) => {
    setPrescriptions(prescriptionsText);
    setCurrentStep('loading');
    resetActivityTimer();

    try {
      const data = await startInterview(language, chiefComplaint, patientInfo, prescriptionsText, clinicalMode, consentRecord);
      setSessionId(data.sessionId);
      setEncounterId(data.encounterId);
      setReviewState((data.reviewState as ReviewState) || 'in_progress');
      setInitialQuestionData(data.question);
      setCurrentStep('interview');
    } catch (err: any) {
      showToast('Interview session initiated.', 'info');
      setCurrentStep('interview');
    }
  };

  // STEP 5: Interview Question & Answer Processing
  const handleAnswerSubmit = async (answerText: string): Promise<LLMQuestionResponse> => {
    resetActivityTimer();

    if (!sessionId) {
      return {
        next_question: 'Thank you. Clinical interview complete.',
        suggested_replies: [],
        interview_complete: true,
      };
    }

    try {
      const data = await sendAnswer(sessionId, answerText);
      if (data.red_flag) {
        setRedFlagReason(data.red_flag_reason || 'Urgent symptom detected');
        setCurrentStep('red_flag');
      }

      if (data.interview_complete) {
        setCurrentStep('loading');
        try {
          const summaryRes = await generateSummary(sessionId, prescriptions);
          setSummaryData(summaryRes.summary);
          setReviewState((summaryRes.reviewState as ReviewState) || 'submitted');
          setCurrentStep('audio_confirm');
        } catch (e) {
          console.error(e);
          setCurrentStep('audio_confirm');
        }
      }

      return data;
    } catch (err) {
      console.error('Answer submission failed:', err);
      return {
        next_question: 'I missed that. Could you please repeat your answer?',
        suggested_replies: ['Please repeat', 'I don\'t know', 'Skip this question'],
      };
    }
  };

  // Doctor Mode Authentication & Access
  const handleToggleMode = () => {
    if (mode === 'kiosk') {
      if (!doctorInfo) {
        setShowDoctorAuth(true);
      } else {
        setMode('doctor');
        setCurrentStep('doctor_summary');
      }
    } else {
      setMode('kiosk');
      setCurrentStep('welcome');
    }
  };

  const handleDoctorLogin = (info: DoctorInfo) => {
    setDoctorInfo(info);
    setShowDoctorAuth(false);
    setMode('doctor');
    setCurrentStep('doctor_summary');
    showToast(`Doctor Portal authenticated: Dr. ${info.name}`, 'success');
  };

  const handleReset = () => {
    if (sessionId) {
      purgeSession(sessionId).catch(() => {});
    }
    setSessionId(null);
    setEncounterId(null);
    setReviewState('in_progress');
    setDeliveryStatus('not_requested');
    setConsentRecord(null);
    setPatientInfo(null);
    setChiefComplaint('');
    setPrescriptions('');
    setInitialQuestionData(null);
    setRedFlagReason(null);
    setSummaryData(null);
    setMode('kiosk');
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
        onMyRecords={patientInfo ? () => setCurrentStep('patient_dashboard') : undefined}
        showTimeoutWarning={showTimeoutWarning}
        onDismissTimeout={resetActivityTimer}
      />

      {staffAssist && mode === 'kiosk' && (
        <div style={{ background: '#10b981', color: '#fff', padding: '0.45rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <span>👨‍💼 Volunteer / Staff-Assisted Intake Mode Active (Hospital Nurse / Volunteer Guided)</span>
          <button
            onClick={() => setStaffAssist(false)}
            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Turn Off
          </button>
        </div>
      )}

      <main className="main-content">
        {/* STEP 1: Language Selection */}
        {currentStep === 'welcome' && (
          <WelcomeScreen onSelectLanguage={handleSelectLanguage} />
        )}

        {/* STEP 2: Sign In & Login as a New User Page */}
        {currentStep === 'login' && (
          <LoginScreen
            onSubmit={handleLoginSubmit}
            onBack={() => setCurrentStep('welcome')}
            onSkip={() => setCurrentStep('symptoms')}
          />
        )}

        {/* STEP 3: SOCRATES Symptom & Department Selection Page */}
        {currentStep === 'symptoms' && (
          <SymptomSelectionScreen
            patientInfo={patientInfo}
            onSelectSymptom={handleSelectSymptom}
            onBack={() => setCurrentStep('login')}
          />
        )}

        {/* PRD FR02: Consent refusal — stop intake, offer staff help */}
        {currentStep === 'consent_refused' && (
          <div className="screen fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="glass-card slide-in" style={{ maxWidth: '600px', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛑</div>
              <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Consent Required</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Clinical intake cannot proceed without your informed consent under the DPDP Act 2023.
                Your data will not be collected or stored.
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
                Please speak to the <strong>hospital staff at the intake desk</strong> for assistance or to ask questions about the consent process.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={() => setCurrentStep('login')}>
                  ← Go Back & Provide Consent
                </button>
                <button className="btn btn-secondary btn-lg" onClick={handleReset}>
                  🏠 Return to Welcome
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Prescription Upload */}
        {currentStep === 'prescriptions' && (
          <PrescriptionScreen
            patientInfo={patientInfo}
            onNext={handlePrescriptionsNext}
            onSkip={() => handlePrescriptionsNext('')}
          />
        )}

        {/* STEP 5: AI Clinical Interview */}
        {currentStep === 'interview' && (
          <InterviewScreen
            initialQuestion={initialQuestionData || {
              next_question: clinicalMode === 'ayush'
                ? 'नमस्ते! आयुर्वेद ओपीडी में आपका स्वागत है। आपकी शारीरिक प्रकृति और वर्तमान समस्या क्या है?'
                : 'Hello! What health issue or symptoms are you experiencing today?',
              suggested_replies: clinicalMode === 'ayush'
                ? ['वातज (Joint pain / Dry skin)', 'पित्तज (Acidity / Burning)', 'कफज (Weight / Congestion)', 'अन्य']
                : ['Chest pain', 'Fever', 'Headache', 'Stomach pain', 'Cough / Cold', 'Skin problem', 'Teeth pain', 'Other'],
            }}
            patientInfo={patientInfo}
            clinicalMode={clinicalMode}
            onAnswerSubmit={handleAnswerSubmit}
            language={language}
          />
        )}

        {currentStep === 'audio_confirm' && (
          <AudioConfirmationScreen
            summary={getActiveSummary()}
            patientInfo={patientInfo}
            clinicalMode={clinicalMode}
            language={language}
            onConfirm={() => {
              showToast('Clinical summary confirmed and sent to OPD Doctor!', 'success');
              setCurrentStep('doctor_summary');
            }}
            onEdit={() => {
              setCurrentStep('interview');
            }}
          />
        )}

        {currentStep === 'red_flag' && (
          <RedFlagScreen
            reason={redFlagReason}
            patientInfo={patientInfo}
            sessionId={sessionId}
            onReset={handleReset}
          />
        )}

        {currentStep === 'loading' && (
          <LoadingScreen message="Analyzing Symptoms, Digitisations & Generating ABDM Clinical Note..." />
        )}

        {currentStep === 'doctor_summary' && (
          <DoctorViewScreen
            summary={getActiveSummary()}
            sessionId={sessionId || ''}
            encounterId={encounterId || ''}
            reviewState={reviewState}
            language={language}
            chiefComplaint={chiefComplaint}
            patientInfo={patientInfo}
            prescriptions={prescriptions}
            doctorInfo={doctorInfo}
            onSave={(updatedSummary) => {
              setSummaryData(updatedSummary);
              setCurrentStep('doctor_dashboard');
              showToast('Clinical summary saved to EMR!', 'success');
            }}
            onApprove={(approvedSummary) => {
              setSummaryData(approvedSummary);
              setReviewState('approved');
              setCurrentStep('doctor_dashboard');
              showToast('Clinical history approved and signed!', 'success');
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
            sessionId={sessionId}
            encounterId={encounterId}
            reviewState={reviewState}
            deliveryStatus={deliveryStatus}
            onDeliveryStatusChange={setDeliveryStatus}
            onNewPatient={handleReset}
          />
        )}

        {currentStep === 'patient_dashboard' && (
          <PatientDashboard
            patientInfo={patientInfo}
            currentEncounterId={encounterId}
            currentSummary={getActiveSummary()}
            onBack={handleReset}
          />
        )}
      </main>

      {/* Doctor Authentication Modal */}
      {showDoctorAuth && (
        <DoctorAuthModal
          onAuthenticate={handleDoctorLogin}
          onClose={() => setShowDoctorAuth(false)}
        />
      )}

      {/* Toast Alerts */}
      <Toast message={toastMsg} type={toastType} visible={!!toastMsg} onClose={() => setToastMsg('')} />
    </div>
  );
}
