import crypto from 'crypto';

export interface ConsentRecord {
  version: string;
  language: string;
  purposes: string[];
  grantedBy: string;
  speakerRole: 'patient' | 'caregiver' | 'staff';
  timestamp: string;
  revoked: boolean;
  revocationTimestamp?: string;
  explanationRead: boolean;
}

export interface AlertRecord {
  id: string;
  state: 'open' | 'delivered' | 'acknowledged' | 'escalated' | 'resolved';
  patientName: string;
  patientLocation: string;
  triggerRule: string;
  triggerReason: string;
  createdAt: string;
  deliveredAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface Session {
  sessionId: string;
  encounterId: string;
  language: string;
  clinicalMode: 'allopathy' | 'ayush';
  chiefComplaint: string;
  patientInfo?: any;
  prescriptions?: string;
  history: Array<{ q?: string; a?: string; answerState?: string; provenance?: any; turnIndex?: number }>;
  currentQuestion?: string | null;
  currentSuggestedReplies?: string[];
  createdAt: number;
  redFlag?: boolean;
  redFlagReason?: string | null;
  summary?: any;
  // PRD FR09/FR11: Review lifecycle
  reviewState: 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'amended' | 'cancelled';
  // PRD FR14: External delivery status
  deliveryStatus: 'not_requested' | 'blocked_by_consent' | 'pending' | 'delivered' | 'failed';
  // PRD FR02/FR13: Consent tracking
  consentRecord?: ConsentRecord;
  // PRD FR05: Alert records
  alertRecords: AlertRecord[];
  // PRD FR11: Version history
  versions: Array<{ version: number; timestamp: string; author: string; action: string }>;
  // PRD FR06: Uploaded document metadata
  uploadedDocuments: Array<{ fileId: string; fileName: string; type: string; uploadedAt: string }>;
}

const sessions = new Map<string, Session>();

export function createSession(
  language: string,
  chiefComplaint: string,
  patientInfo: any = null,
  prescriptions: string = '',
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy',
  consentRecord?: ConsentRecord
): Session {
  const sessionId = crypto.randomUUID();
  const encounterId = `ENC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  const session: Session = {
    sessionId,
    encounterId,
    language,
    clinicalMode,
    chiefComplaint,
    patientInfo,
    prescriptions,
    history: [],
    currentQuestion: null,
    createdAt: Date.now(),
    reviewState: 'in_progress',
    deliveryStatus: 'not_requested',
    consentRecord: consentRecord || undefined,
    alertRecords: [],
    versions: [{ version: 1, timestamp: new Date().toISOString(), author: 'system', action: 'Session created' }],
    uploadedDocuments: [],
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

// Auto-eviction for stale sessions (2 hours TTL, sweeps every 10 mins)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

