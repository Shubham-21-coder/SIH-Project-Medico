export interface PatientInfo {
  name: string;
  age: number | string;
  gender: string;
  identifier: string;
  isGuest?: boolean;
  language?: string;
}

export interface QuestionHistoryItem {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
}

export interface SummaryData {
  chief_complaint: string;
  hpi: string;
  past_history: string;
  review_of_systems: string;
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
  follow_up: string;
}

export interface LLMQuestionResponse {
  next_question: string;
  suggested_replies: string[];
  red_flag?: boolean;
  red_flag_reason?: string | null;
  interview_complete?: boolean;
}

export interface SessionData {
  sessionId: string;
  language: string;
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
