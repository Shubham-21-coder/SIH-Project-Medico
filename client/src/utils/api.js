const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
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
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function sendSmsOtp(mobileNumber) {
  return request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber }),
  });
}

export async function verifySmsOtp(mobileNumber, otp) {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, otp }),
  });
}

export async function startInterview(language, chiefComplaint, patientInfo, prescriptions) {
  return request('/interview/start', {
    method: 'POST',
    body: JSON.stringify({ language, chiefComplaint, patientInfo, prescriptions }),
  });
}

export async function getNextQuestion(sessionId, answer) {
  return request('/interview/next', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answer }),
  });
}

export async function generateSummary(sessionId, prescriptions) {
  return request('/interview/summary', {
    method: 'POST',
    body: JSON.stringify({ sessionId, prescriptions }),
  });
}

export async function generateAutoRx(chiefComplaint, summary) {
  return request('/interview/auto-rx', {
    method: 'POST',
    body: JSON.stringify({ chiefComplaint, summary }),
  });
}
