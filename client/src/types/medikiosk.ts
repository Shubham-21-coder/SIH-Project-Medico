export type ClinicalMode = 'allopathy' | 'ayush';

export type AuthRole = 'patient' | 'doctor' | 'staff' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  phone?: string;
}

// PRD FR03: Distinct answer states for every interview question
export type AnswerState = 'answered' | 'unknown' | 'declined' | 'not_asked' | 'denied';

// PRD FR09/FR11: Review lifecycle for clinical drafts
export type ReviewState = 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'amended' | 'cancelled';

// PRD FR14: External delivery status (ABDM/HIS)
export type DeliveryStatus = 'not_requested' | 'blocked_by_consent' | 'pending' | 'delivered' | 'failed';

// PRD FR05: Alert lifecycle states for urgent symptom escalation
export type AlertState = 'open' | 'delivered' | 'acknowledged' | 'escalated' | 'resolved';

export interface PatientInfo {
  name: string;
  age: number | string;
  gender: string;
  identifier: string; // ABHA ID or Phone number
  abhaNumber?: string;
  abhaAddress?: string;
  originHospital?: string;
  currentHospital?: string;
  isGuest?: boolean;
  language?: string;
  clinicalMode?: ClinicalMode;
  consentGranted?: boolean;
  consentTimestamp?: string;
  sessionToken?: string;
}

// PRD FR02/FR13: Structured consent record
export interface ConsentRecord {
  version: string;
  language: string;
  purposes: string[];
  grantedBy: string; // patient name or caregiver
  speakerRole: 'patient' | 'caregiver' | 'staff';
  timestamp: string;
  revoked: boolean;
  revocationTimestamp?: string;
  explanationRead: boolean;
}

// PRD FR03: Answer provenance metadata
export interface AnswerProvenance {
  language: string;
  inputMethod: 'voice' | 'touch' | 'text';
  speakerRole: 'patient' | 'caregiver' | 'staff';
  timestamp: string;
}

// PRD FR03: Updated question history with answer state tracking
export interface QuestionHistoryItem {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
  answerState?: AnswerState;
  provenance?: AnswerProvenance;
  turnIndex?: number;
}

// PRD FR05: Alert record for urgent symptom escalation
export interface AlertRecord {
  id: string;
  state: AlertState;
  patientName: string;
  patientLocation: string;
  triggerRule: string;
  triggerReason: string;
  createdAt: string;
  deliveredAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
}

// PRD FR06/FR07: Document evidence linking extracted facts to source
export interface DocumentEvidence {
  sourceFileId: string;
  sourceFileName: string;
  pageNumber?: number;
  extractedText: string;
  confidence: number; // 0-1
  dateConfidence: 'high' | 'medium' | 'low' | 'unknown';
  clinicalDate?: string;
  rawDateText?: string;
  isHistoric: boolean; // PRD FR07: past prescription ≠ current medication
  verificationState: 'unverified' | 'verified' | 'flagged' | 'rejected';
  extractionVersion: string;
}

// PRD FR14: Encounter record for patient dashboard
export interface EncounterRecord {
  encounterId: string;
  sessionId?: string;
  patientId: string;
  visitDate: string;
  department: string;
  clinicalMode: ClinicalMode;
  chiefComplaint: string;
  reviewState: ReviewState;
  deliveryStatus: DeliveryStatus;
  approvedBy?: string;
  approvedAt?: string;
  versions: Array<{ version: number; timestamp: string; author: string; action: string }>;
}

export interface AyushParikshaData {
  prakriti: string;
  vikriti: string;
  agni: string;
  koshtha: string;
  ahara_vihara: string;
  sara?: string;
  samhanana?: string;
  pramana?: string; // PRD FR04: Body measurement/proportions — added per PRD
  ahara_shakti?: string;
  vyayama_shakti?: string;
  sattva?: string;
  satmya?: string;
  vaya?: string;
  nidana_samprapti?: string;
}

export interface LabReportItem {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  riskLevel: 'normal' | 'high' | 'critical' | 'low';
  evidence?: DocumentEvidence;
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
  dateConfidence?: 'high' | 'medium' | 'low' | 'unknown';
  doctorOrClinic: string;
  extractedSummary: string;
  previewUrl?: string;
  labItems?: LabReportItem[];
  medications?: Medication[];
  diagnoses?: string[];
  isHistoric?: boolean; // PRD FR07: past prescription ≠ current medication
  evidenceLinks?: DocumentEvidence[];
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
  // PRD FR09: Explicit missing/conflict tracking
  missingFields?: string[];
  unresolvedConflicts?: string[];
  reviewState?: ReviewState;
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
  encounterId: string;
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
  reviewState: ReviewState;
  deliveryStatus: DeliveryStatus;
  consentRecord?: ConsentRecord;
  alertRecords?: AlertRecord[];
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
