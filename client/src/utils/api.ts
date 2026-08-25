import { PatientInfo, SummaryData, PrescriptionData, LLMQuestionResponse } from '../types/medikiosk';

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

export async function sendSmsOtp(mobileNumber: string) {
  return request<{ success: boolean; provider: string; otpCode?: string; message?: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber }),
  });
}

export async function verifySmsOtp(mobileNumber: string, otp: string) {
  return request<{ success: boolean; message?: string; error?: string }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, otp }),
  });
}

export async function startInterview(
  language: string,
  chiefComplaint: string,
  patientInfo?: PatientInfo | null,
  prescriptions?: string
) {
  return request<{ sessionId: string; question: LLMQuestionResponse }>('/interview/start', {
    method: 'POST',
    body: JSON.stringify({ language, chiefComplaint, patientInfo, prescriptions }),
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

export async function generateAutoRx(chiefComplaint: string, summary: SummaryData) {
  return request<PrescriptionData>('/interview/auto-rx', {
    method: 'POST',
    body: JSON.stringify({ chiefComplaint, summary }),
  });
}
