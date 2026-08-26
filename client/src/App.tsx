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
  purgeKioskSession,
} from './utils/api';

import { PatientInfo, SummaryData, LLMQuestionResponse, DoctorInfo, ClinicalMode } from './types/medikiosk';

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
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');

  // Intake State
  const [language, setLanguage] = useState<string>('hi');
  const [clinicalMode, setClinicalMode] = useState<ClinicalMode>('allopathy');
  const [chiefComplaint, setChiefComplaint] = useState<string>('General Consultation');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>({
    name: 'Shubham Garg',
    age: '20',
    gender: 'Male',
    identifier: '91-4920-1849-2810',
    clinicalMode: 'allopathy',
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
    department: 'General Medicine / OPD',
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
    if (clinicalMode === 'ayush') {
      return {
        clinical_mode: 'ayush',
        chief_complaint: `आयुर्वेदिक ओपीडी परामर्श: ${chiefComplaint || 'स्वास्थ्य परीक्षण व वात-पित्त-कफ असंतुलन'}`,
        hpi: `रोगी (${patientInfo?.name || 'Shubham Garg'}, ${patientInfo?.age || '20'} वर्ष / ${patientInfo?.gender || 'पुरुष'}) द्वारा दशविध परीक्षा विवरण: वात-पित्तज प्रकृति, मंदाग्नि, मध्यम कोष्ठ।`,
        past_history: prescriptions ? `पूर्व औषध एवं उपचार विवरण:\n${prescriptions}` : 'पूर्व में कोई दीर्घकालिक औषधि इतिहास नहीं।',
        medications_allergies: 'औषध सात्म्यता: कोई ज्ञात औषधि एलर्जी नहीं। त्रिफला/पाचन योग पूर्व में प्रयुक्त।',
        review_of_systems: 'अग्नि: मंदाग्नि लक्षित। कोष्ठ: मध्यम। धातु सारता एवं सत्त्व मध्यम।',
        ayush_pariksha: {
          prakriti: 'वात-पित्तज प्रकृति (Vata-Pitta Prakriti)',
          vikriti: 'समान वात एवं पाचक पित्त दृष्टि (Vata-Pitta Imbalance)',
          agni: 'मंदाग्नि (Low Digestive Agni)',
          koshtha: 'मध्यम कोष्ठ (Moderate Bowel Habit)',
          ahara_vihara: 'कटु-अम्ल रस प्रधान आहार, रात्रि जागरण एवं मानसिक तनाव',
          sara: 'मध्यम रस-रक्त सारता',
          samhanana: 'मध्यम संहनन',
          sattva: 'मध्यम सत्त्व',
        },
      };
    }

    return {
      clinical_mode: 'allopathy',
      chief_complaint: `Patient (${patientInfo?.name || 'Shubham Garg'}) presents for OPD Consultation (${chiefComplaint || 'General OPD'})`,
      hpi: `Patient (${patientInfo?.name || 'Shubham Garg'}, ${patientInfo?.age || '20'}y/${patientInfo?.gender || 'Male'}) checked in via MediKiosk OPD Portal. ${prescriptions ? 'Uploaded active prescription records.' : 'Symptom intake completed.'}`,
      past_history: prescriptions ? `Attached Previous Prescriptions & Records:\n${prescriptions}` : 'No past prescription documents uploaded.',
      review_of_systems: 'Cardiovascular, Respiratory & Gastrointestinal: Pertinent findings noted. Other systems reviewed and negative.',
    };
  };

  // STEP 1: Language, Department & Mode Selection
  const handleWelcomeStart = (selectedLang: string, selectedComplaint: string, mode: ClinicalMode) => {
    setLanguage(selectedLang);
    setChiefComplaint(selectedComplaint);
    setClinicalMode(mode);
    setCurrentStep('login');
  };

  // STEP 2: Patient Registration & ABHA / Phone Verification
  const handleLoginSubmit = (info: PatientInfo) => {
    setPatientInfo({ ...info, clinicalMode });
    setCurrentStep('prescriptions');
    showToast(`Welcome ${info.name}! ABHA verified.`, 'success');
  };

  // STEP 3: Prescriptions & Past Document Digitization
  const handlePrescriptionsNext = async (prescriptionsText: string) => {
    setPrescriptions(prescriptionsText);
    setCurrentStep('loading');

    try {
      const data = await startInterview(language, chiefComplaint, patientInfo, prescriptionsText, clinicalMode);
      setSessionId(data.sessionId);
      setInitialQuestionData(data.question);
      setCurrentStep('interview');
    } catch (err: any) {
      showToast('Interview session initiated.', 'info');
      setCurrentStep('interview');
    }
  };

  // STEP 4: Interview Question & Answer Processing
  const handleAnswerSubmit = async (answerText: string): Promise<LLMQuestionResponse> => {
    if (!sessionId) {
      return {
        next_question: 'Thank you. Clinical interview complete.',
        suggested_replies: [],
        interview_complete: true,
      };
    }

    try {
      const response = await getNextQuestion(sessionId, answerText);

      if (response.red_flag) {
        setRedFlagReason(response.red_flag_reason || 'Severe emergency indicators detected');
        setCurrentStep('red_flag');
        return response;
      }

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
    if (sessionId) {
      purgeKioskSession(sessionId).catch(() => {});
    }
    setPatientInfo({ name: 'Shubham Garg', age: '20', gender: 'Male', identifier: '91-4920-1849-2810', clinicalMode: 'allopathy' });
    setPrescriptions('');
    setSessionId(null);
    setInitialQuestionData(null);
    setRedFlagReason(null);
    setSummaryData(null);
    setClinicalMode('allopathy');
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
              setPatientInfo({ name: 'Shubham Garg', age: '20', gender: 'Male', identifier: '91-4920-1849-2810', clinicalMode, isGuest: false });
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

        {currentStep === 'red_flag' && (
          <RedFlagScreen
            reason={redFlagReason}
            patientInfo={patientInfo}
            onReset={handleReset}
          />
        )}

        {currentStep === 'loading' && (
          <LoadingScreen message="Analyzing Symptoms, Digitisations & Generating ABDM Clinical Note..." />
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
            sessionId={sessionId}
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
