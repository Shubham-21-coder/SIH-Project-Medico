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

// ─── Auth APIs ───

let authToken: string | null = sessionStorage.getItem('ayush_auth_token');

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    sessionStorage.setItem('ayush_auth_token', token);
  } else {
    sessionStorage.removeItem('ayush_auth_token');
  }
}

export async function fetchCurrentUser() {
  return request<{ success: boolean; user: any }>('/auth/me');
}

export async function loginAccount(data: any) {
  return request<{ success: boolean; token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerAccount(data: any) {
  return request<{ success: boolean; token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPasswordAccount(data: { loginId?: string; email?: string; otp: string; newPassword: string }) {
  return request<{ success: boolean; message: string; error?: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logoutAccount() {
  return request<{ success: boolean }>('/auth/logout', { method: 'POST' });
}

export async function sendSmsOtp(identifier: string, channel?: 'sms' | 'email') {
  return request<{ success: boolean; channel?: string; message: string; otpCode?: string; error?: string; cooldownSeconds?: number }>(
    '/auth/send-otp', { method: 'POST', body: JSON.stringify({ identifier, channel }) }
  );
}

export async function verifySmsOtp(identifier: string, otp: string) {
  return request<{ success: boolean; message: string; sessionToken?: string; error?: string; remainingAttempts?: number }>(
    '/auth/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, otp }) }
  );
}

export async function initiateAbhaAuth(identifier: string, authMode: 'MOBILE_OTP' | 'AADHAAR_OTP' = 'MOBILE_OTP') {
  return request<{ success: boolean; txnId: string; authMode: string; maskedMobile?: string; message: string; error?: string; cooldownSeconds?: number }>(
    '/abha/auth/init', { method: 'POST', body: JSON.stringify({ identifier, authMode }) }
  );
}

export async function confirmAbhaOtp(txnId: string, otp: string) {
  return request<{
    success: boolean; message: string;
    profile?: { abhaNumber: string; abhaAddress: string; name: string; gender: string; age: string | number; mobile: string; kycVerified: boolean };
    sessionToken?: string; error?: string;
  }>('/abha/auth/confirm', { method: 'POST', body: JSON.stringify({ txnId, otp }) });
}

// ─── Interview APIs (PRD FR01–FR03) ───

export async function startInterview(
  language: string,
  chiefComplaint: string,
  patientInfo: any,
  prescriptions: string,
  clinicalMode: string = 'allopathy',
  consentRecord?: any
) {
  return request<{ sessionId: string; encounterId: string; reviewState: string; question: any }>(
    '/interview/start', {
      method: 'POST',
      body: JSON.stringify({ language, chiefComplaint, patientInfo, prescriptions, clinicalMode, consentRecord }),
    }
  );
}

export async function sendAnswer(
  sessionId: string,
  answer: string,
  answerState: string = 'answered',
  provenance?: any
) {
  return request<any>('/interview/next', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answer, answerState, provenance }),
  });
}

export async function generateSummary(sessionId: string, prescriptions?: string) {
  return request<any>('/interview/summary', {
    method: 'POST',
    body: JSON.stringify({ sessionId, prescriptions }),
  });
}

export async function generateAutoRx(chiefComplaint: string, summary: any, clinicalMode: string = 'allopathy') {
  return request<any>('/interview/auto-rx', {
    method: 'POST',
    body: JSON.stringify({ chiefComplaint, summary, clinicalMode }),
  });
}

export async function generateFhirBundle(patientInfo: any, chiefComplaint: string, summaryData: any, prescriptionsData: any) {
  return request<{ success: boolean; message: string; bundle: any }>('/interview/fhir-bundle', {
    method: 'POST',
    body: JSON.stringify({ patientInfo, chiefComplaint, summaryData, prescriptionsData }),
  });
}

export async function purgeSession(sessionId: string) {
  return request<{ success: boolean; message: string }>('/interview/purge-session', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

// ─── PRD FR11: Doctor Approval Workflow ───

export async function approveHistory(sessionId: string, approverName: string, approverId?: string, updatedSummary?: any) {
  return request<any>('/interview/approve', {
    method: 'POST',
    body: JSON.stringify({ sessionId, approverName, approverId, updatedSummary }),
  });
}

// ─── PRD FR05: Alert Acknowledgement ───

export async function acknowledgeAlert(sessionId: string, alertId: string, staffName: string) {
  return request<any>('/interview/alert/acknowledge', {
    method: 'POST',
    body: JSON.stringify({ sessionId, alertId, staffName }),
  });
}

// ─── PRD FR12: Patient Dashboard ───

export async function getPatientEncounters(patientId: string) {
  return request<any>(`/interview/encounter/${encodeURIComponent(patientId)}`, { method: 'GET' });
}
