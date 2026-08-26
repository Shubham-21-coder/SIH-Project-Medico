import { Router, Request, Response } from 'express';
import { createSession, getSession, updateSession, deleteSession } from '../sessions.js';
import { getNextQuestion, generateSummary, generateAutoPrescription } from '../services/llm.js';
import { generateAbdmFhirBundle } from '../services/fhir.js';

const router = Router();

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { language, chiefComplaint, patientInfo, prescriptions, clinicalMode } = req.body;
    const complaint = chiefComplaint || (clinicalMode === 'ayush' ? 'आयुर्वेदिक ओपीडी' : 'general');
    const mode = clinicalMode === 'ayush' ? 'ayush' : 'allopathy';

    const session = createSession(language || 'en', complaint, patientInfo, prescriptions, mode);
    const response = await getNextQuestion(complaint, [], mode);

    session.currentQuestion = response.next_question;

    res.json({
      sessionId: session.sessionId,
      question: {
        next_question: response.next_question,
        suggested_replies: response.suggested_replies,
        ayush_category: response.ayush_category,
      },
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

router.post('/next', async (req: Request, res: Response) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || answer === undefined) {
      return res.status(400).json({ error: 'Session ID and answer are required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.history.push({ q: session.currentQuestion || '', a: answer });

    const response = await getNextQuestion(session.chiefComplaint, session.history, session.clinicalMode);

    if (response.red_flag) {
      updateSession(sessionId, { redFlag: true, redFlagReason: response.red_flag_reason });
    }

    session.currentQuestion = response.next_question;

    res.json(response);
  } catch (error) {
    console.error('Failed to get next question:', error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

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
    res.json(summary);
  } catch (error) {
    console.error('Failed to generate summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
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
