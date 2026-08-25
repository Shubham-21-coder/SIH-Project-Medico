import { Router } from 'express';
import { createSession, getSession, updateSession } from '../sessions.js';
import { getNextQuestion, generateSummary, generateAutoPrescription } from '../services/llm.js';

const router = Router();

router.post('/start', async (req, res) => {
  try {
    const { language, chiefComplaint, patientInfo, prescriptions } = req.body;
    if (!chiefComplaint) {
      return res.status(400).json({ error: 'Chief complaint is required' });
    }

    const session = createSession(language || 'en', chiefComplaint, patientInfo, prescriptions);

    const response = await getNextQuestion(chiefComplaint, []);
    session.currentQuestion = response.next_question;

    res.json({
      sessionId: session.sessionId,
      question: {
        next_question: response.next_question,
        suggested_replies: response.suggested_replies,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

router.post('/next', async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'Session ID and answer are required' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.history.push({ q: session.currentQuestion, a: answer });

    const response = await getNextQuestion(session.chiefComplaint, session.history);

    if (response.red_flag) {
      updateSession(sessionId, { redFlag: true, redFlagReason: response.red_flag_reason });
    }

    session.currentQuestion = response.next_question;

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

router.post('/summary', async (req, res) => {
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
      activePrescriptions
    );
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.post('/auto-rx', async (req, res) => {
  try {
    const { chiefComplaint, summary } = req.body;
    const autoRx = await generateAutoPrescription(chiefComplaint || 'Chest Pain', summary);
    res.json(autoRx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate auto-prescription' });
  }
});

export default router;

