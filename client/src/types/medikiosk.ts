export type ClinicalMode = 'allopathy' | 'ayush';

export interface PatientInfo {
  name: string;
  age: number | string;
  gender: string;
  identifier: string; // ABHA ID or Phone number
  abhaNumber?: string;
  abhaAddress?: string;
  originHospital?: string; // e.g. "SMS Hospital, Jaipur (Rajasthan)"
  currentHospital?: string; // e.g. "SN Medical College & Hospital, Agra (UP)"
  isGuest?: boolean;
  language?: string;
  clinicalMode?: ClinicalMode;
  consentGranted?: boolean;
  consentTimestamp?: string;
}


export interface QuestionHistoryItem {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
}

export interface AyushParikshaData {
  prakriti: string; // Vata, Pitta, Kapha, Dwidwoshaja, Samadoshaja
  vikriti: string; // Current dosha imbalance
  agni: string; // Samagni, Mandagni, Tikshnagni, Vishamagni
  koshtha: string; // Mridu, Madhyama, Krura
  ahara_vihara: string; // Diet, sleep, circadian habits
  sara?: string; // Dhatu excellence (Rasa, Rakta, Mamsa, Meda, etc.)
  samhanana?: string; // Compactness/Build
  ahara_shakti?: string; // Digestive capacity
  vyayama_shakti?: string; // Exercise capacity
  sattva?: string; // Mental strength (Pravara, Madhyama, Avara)
  satmya?: string; // Adaptability
  vaya?: string; // Age stage (Balya, Madhyama, Vriddha)
  nidana_samprapti?: string; // Causative factors & pathogenesis
}

export interface LabReportItem {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  riskLevel: 'normal' | 'high' | 'critical' | 'low';
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface DigitizedDocument {
  id: string;
  type: 'prescription' | 'lab_report' | 'discharge_summary';
  fileName: string;
  date: string;
  doctorOrClinic: string;
  extractedSummary: string;
  previewUrl?: string;
  labItems?: LabReportItem[];
  medications?: Medication[];
  diagnoses?: string[];
}

export interface SummaryData {
  clinical_mode?: ClinicalMode;
  chief_complaint: string;
  hpi: string;
  past_history: string;
  medications_allergies?: string;
  family_history?: string;
  personal_social_history?: string;
  review_of_systems: string;
  prior_investigations?: string;
  ayush_pariksha?: AyushParikshaData;
  drug_interactions?: DrugInteraction[];
  lab_outliers?: LabReportItem[];
  timeline?: DigitizedDocument[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionData {
  medications: Medication[];
  investigations: string[];
  advice: string[];
  ayushAdvice?: string[];
  follow_up: string;
}

export interface LLMQuestionResponse {
  next_question: string;
  suggested_replies: string[];
  red_flag?: boolean;
  red_flag_reason?: string | null;
  interview_complete?: boolean;
  ayush_category?: string;
}

export interface SessionData {
  sessionId: string;
  language: string;
  clinicalMode: ClinicalMode;
  chiefComplaint: string;
  patientInfo?: PatientInfo | null;
  prescriptions?: string;
  history: QuestionHistoryItem[];
  currentQuestion?: string | null;
  createdAt?: number;
  summary?: SummaryData | null;
  redFlag?: boolean;
  redFlagReason?: string;
}

export interface DoctorInfo {
  id: string;
  name: string;
  role: string;
  department: string;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'document';
  id: string;
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}
