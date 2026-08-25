import crypto from 'crypto';

const sessions = new Map();

export function createSession(language, chiefComplaint, patientInfo = null, prescriptions = '') {
  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    language,
    chiefComplaint,
    patientInfo,
    prescriptions,
    history: [],
    currentQuestion: null,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

export function updateSession(sessionId, updates) {
  const session = getSession(sessionId);
  if (session) {
    Object.assign(session, updates);
  }
  return session;
}
