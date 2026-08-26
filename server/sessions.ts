import crypto from 'crypto';

export interface Session {
  sessionId: string;
  language: string;
  clinicalMode: 'allopathy' | 'ayush';
  chiefComplaint: string;
  patientInfo?: any;
  prescriptions?: string;
  history: Array<{ q?: string; a?: string }>;
  currentQuestion?: string | null;
  createdAt: number;
  redFlag?: boolean;
  redFlagReason?: string | null;
  summary?: any;
}

const sessions = new Map<string, Session>();

export function createSession(
  language: string,
  chiefComplaint: string,
  patientInfo: any = null,
  prescriptions: string = '',
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy'
): Session {
  const sessionId = crypto.randomUUID();
  const session: Session = {
    sessionId,
    language,
    clinicalMode,
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

export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) || null;
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session | null {
  const session = getSession(sessionId);
  if (session) {
    Object.assign(session, updates);
  }
  return session;
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}
