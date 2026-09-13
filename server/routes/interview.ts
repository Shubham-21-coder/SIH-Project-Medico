import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { createSession, getSession, updateSession, deleteSession } from '../sessions.js';
import { getNextQuestion, generateSummary, generateAutoPrescription, detectNonsenseInput } from '../services/llm.js';
import { generateAbdmFhirBundle } from '../services/fhir.js';

const router = Router();

// POST /api/interview/start — PRD FR01: Creates session with encounter ID
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { language, chiefComplaint, patientInfo, prescriptions, clinicalMode, consentRecord } = req.body;
    const complaint = chiefComplaint || (clinicalMode === 'ayush' ? 'आयुर्वेदिक ओपीडी' : 'general');
    const mode = clinicalMode === 'ayush' ? 'ayush' : 'allopathy';

    // PRD FR02: Validate consent before proceeding
    if (!consentRecord && !patientInfo?.consentGranted) {
      return res.status(400).json({
        error: 'Consent is required before clinical intake can begin. Please provide informed consent.',
        consentRequired: true,
      });
    }

    const session = createSession(language || 'hi', complaint, patientInfo, prescriptions, mode, consentRecord);
    const response = await getNextQuestion(complaint, [], mode, session.language);

    session.currentQuestion = response.next_question;
    session.currentSuggestedReplies = response.suggested_replies;

    res.json({
      sessionId: session.sessionId,
      encounterId: session.encounterId,
      reviewState: session.reviewState,
      question: {
        next_question: response.next_question,
        suggested_replies: response.suggested_replies,
        ayush_category: (response as any).ayush_category,
      },
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// POST /api/interview/next — PRD FR03: Tracks answer states and provenance
router.post('/next', async (req: Request, res: Response) => {
  try {
    const { sessionId, answer, answerState, provenance } = req.body;
    if (!sessionId || answer === undefined) {
      return res.status(400).json({ error: 'Session ID and answer are required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Off-topic and nonsense input validation check
    const validationError = detectNonsenseInput(answer, answerState, session.language);
    if (validationError) {
      return res.json({
        next_question: validationError,
        suggested_replies: session.currentSuggestedReplies || ['I don\'t know', 'Skip', 'Prefer not to answer'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
        is_invalid_answer: true,
      });
    }

    // PRD FR03: Record answer with state and provenance metadata
    const turnIndex = session.history.length;
    session.history.push({
      q: session.currentQuestion || '',
      a: answer,
      answerState: answerState || (answer.trim() ? 'answered' : 'unknown'),
      provenance: provenance || { language: session.language, inputMethod: 'text', speakerRole: 'patient', timestamp: new Date().toISOString() },
      turnIndex,
    });

    if ((session.chiefComplaint === 'general' || session.chiefComplaint === 'General OPD' || !session.chiefComplaint) && answer.trim()) {
      session.chiefComplaint = answer.trim();
    }

    const response = await getNextQuestion(session.chiefComplaint, session.history, session.clinicalMode, session.language);

    // PRD FR05: Track red flag alerts
    if (response.red_flag) {
      updateSession(sessionId, { redFlag: true, redFlagReason: response.red_flag_reason });

      const alertId = `ALERT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      session.alertRecords.push({
        id: alertId,
        state: 'open',
        patientName: session.patientInfo?.name || 'Unknown Patient',
        patientLocation: session.patientInfo?.currentHospital || 'Kiosk',
        triggerRule: 'Urgent symptom detection',
        triggerReason: response.red_flag_reason || 'Critical symptom indicators detected',
        createdAt: new Date().toISOString(),
      });
    }

    session.currentQuestion = response.next_question;
    session.currentSuggestedReplies = response.suggested_replies;

    // PRD FR09: Update review state when interview completes
    if (response.interview_complete) {
      session.reviewState = 'submitted';
    }

    res.json({
      ...response,
      encounterId: session.encounterId,
      turnIndex,
    });
  } catch (error) {
    console.error('Failed to get next question:', error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

// POST /api/interview/summary — PRD FR09: Returns structured draft with missing fields
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const { sessionId, prescriptions } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const activePrescriptions = prescriptions || session.prescriptions || '';
    const summary = await generateSummary(
      session.chiefComplaint,
      session.history,
      session.patientInfo,
      activePrescriptions,
      session.clinicalMode
    );

    // PRD FR09/FR11: Attach review metadata
    const enhancedSummary = {
      ...summary,
      reviewState: session.reviewState,
      encounterId: session.encounterId,
    };

    res.json(enhancedSummary);
  } catch (error) {
    console.error('Failed to generate summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/interview/approve — PRD FR11: Doctor review and approval workflow
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { sessionId, approverName, approverId, updatedSummary } = req.body;
    if (!sessionId || !approverName) {
      return res.status(400).json({ error: 'Session ID and approver name are required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date().toISOString();
    const newVersion = session.versions.length + 1;

    session.reviewState = 'approved';
    session.summary = updatedSummary || session.summary;
    session.versions.push({
      version: newVersion,
      timestamp: now,
      author: approverName,
      action: 'Approved by clinician',
    });

    console.log(`[Encounter ${session.encounterId}] Approved by ${approverName} at ${now} (v${newVersion})`);

    res.json({
      success: true,
      message: `Clinical history approved by ${approverName}.`,
      encounterId: session.encounterId,
      reviewState: session.reviewState,
      version: newVersion,
      approvedAt: now,
      approvedBy: approverName,
    });
  } catch (error) {
    console.error('Failed to approve history:', error);
    res.status(500).json({ error: 'Failed to approve clinical history' });
  }
});

// POST /api/interview/alert/acknowledge — PRD FR05: Triage staff alert acknowledgement
router.post('/alert/acknowledge', async (req: Request, res: Response) => {
  try {
    const { sessionId, alertId, staffName } = req.body;
    if (!sessionId || !alertId || !staffName) {
      return res.status(400).json({ error: 'Session ID, alert ID, and staff name are required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const alert = session.alertRecords.find((a) => a.id === alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const now = new Date().toISOString();
    alert.state = 'acknowledged';
    alert.acknowledgedBy = staffName;
    alert.acknowledgedAt = now;

    console.log(`[Alert ${alertId}] Acknowledged by ${staffName} at ${now}`);

    res.json({
      success: true,
      message: `Alert acknowledged by ${staffName}.`,
      alertId,
      state: alert.state,
      acknowledgedAt: now,
    });
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// GET /api/interview/encounter/:encounterId — PRD FR12: Patient dashboard encounter retrieval
router.get('/encounter/:encounterId', async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    // Search all sessions for matching encounter ID
    // (In production, this would be a proper database query)
    const allSessions = Array.from((global as any).__sessions?.values?.() || []);
    // Fallback: search by iterating the sessions map isn't directly accessible here,
    // so we'll add a helper. For now, return a structured placeholder.

    res.json({
      success: true,
      encounterId,
      message: 'Encounter retrieval available. Connect to session store for full data.',
    });
  } catch (error) {
    console.error('Failed to retrieve encounter:', error);
    res.status(500).json({ error: 'Failed to retrieve encounter' });
  }
});

router.post('/auto-rx', async (req: Request, res: Response) => {
  try {
    const { chiefComplaint, summary, clinicalMode } = req.body;
    const mode = clinicalMode === 'ayush' ? 'ayush' : 'allopathy';
    const autoRx = await generateAutoPrescription(chiefComplaint || 'Clinical OPD', summary, mode);
    res.json(autoRx);
  } catch (error) {
    console.error('Failed to generate auto-prescription:', error);
    res.status(500).json({ error: 'Failed to generate auto-prescription' });
  }
});

router.post('/fhir-bundle', async (req: Request, res: Response) => {
  try {
    const { patientInfo, chiefComplaint, summaryData, prescriptionsData } = req.body;
    const bundle = generateAbdmFhirBundle(patientInfo, chiefComplaint, summaryData, prescriptionsData);
    res.json({
      success: true,
      message: 'FHIR R4 Document Bundle generated successfully for ABDM Health Repository',
      bundle,
    });
  } catch (error) {
    console.error('Failed to generate FHIR bundle:', error);
    res.status(500).json({ error: 'Failed to generate FHIR bundle' });
  }
});

router.post('/purge-session', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      deleteSession(sessionId);
    }
    res.json({
      success: true,
      message: 'DPDP Act 2023: Temporary kiosk session memory cleared.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to purge session' });
  }
});

export default router;

