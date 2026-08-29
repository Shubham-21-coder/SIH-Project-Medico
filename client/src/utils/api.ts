import { PatientInfo, SummaryData, PrescriptionData, LLMQuestionResponse, ClinicalMode, FhirBundle } from '../types/medikiosk';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function sendSmsOtp(identifier: string, channel?: 'sms' | 'email') {
  return request<{
    success: boolean;
    channel?: 'sms' | 'email';
    provider?: string;
    message: string;
    otpCode?: string;
    cooldownSeconds?: number;
    error?: string;
  }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, channel }),
  });
}

export async function verifySmsOtp(identifier: string, otp: string) {
  return request<{
    success: boolean;
    message: string;
    sessionToken?: string;
    error?: string;
    remainingAttempts?: number;
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, otp }),
  });
}



export async function startInterview(
  language: string,
  chiefComplaint: string,
  patientInfo?: PatientInfo | null,
  prescriptions?: string,
  clinicalMode: ClinicalMode = 'allopathy'
) {
  return request<{ sessionId: string; question: LLMQuestionResponse }>('/interview/start', {
    method: 'POST',
    body: JSON.stringify({ language, chiefComplaint, patientInfo, prescriptions, clinicalMode }),
  });
}

export async function getNextQuestion(sessionId: string, answer: string) {
  return request<LLMQuestionResponse>('/interview/next', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answer }),
  });
}

export async function generateSummary(sessionId: string, prescriptions?: string) {
  return request<SummaryData>('/interview/summary', {
    method: 'POST',
    body: JSON.stringify({ sessionId, prescriptions }),
  });
}

export async function generateAutoRx(
  chiefComplaint: string,
  summary: SummaryData,
  clinicalMode: ClinicalMode = 'allopathy'
) {
  return request<PrescriptionData>('/interview/auto-rx', {
    method: 'POST',
    body: JSON.stringify({ chiefComplaint, summary, clinicalMode }),
  });
}

export async function generateFhirBundle(
  patientInfo: PatientInfo | null,
  chiefComplaint: string,
  summaryData: SummaryData,
  prescriptionsData?: PrescriptionData
) {
  return request<{ success: boolean; message: string; bundle: FhirBundle }>('/interview/fhir-bundle', {
    method: 'POST',
    body: JSON.stringify({ patientInfo, chiefComplaint, summaryData, prescriptionsData }),
  });
}

export async function purgeKioskSession(sessionId: string) {
  return request<{ success: boolean; message: string }>('/interview/purge-session', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}
