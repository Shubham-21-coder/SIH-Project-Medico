import { GoogleGenerativeAI } from '@google/generative-ai';
import { getInterviewerPrompt, getSummarizerPrompt, getAutoRxPrompt } from './prompts.js';

let genAI: GoogleGenerativeAI | null = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Gemini API client initialized.');
} else {
  console.log('GEMINI_API_KEY not found in environment. Using mock mode for LLM.');
}

const MOCK_QUESTIONS: Record<string, Array<{ q: string; replies: string[] }>> = {
  chest_pain: [
    { q: 'Where exactly in your chest do you feel the pain?', replies: ['Center of chest', 'Left side', 'Right side', 'All over'] },
    { q: 'When did the chest pain start?', replies: ['Less than 1 hour ago', 'A few hours ago', 'Today', 'Several days ago'] },
    { q: 'How would you describe the pain?', replies: ['Sharp/stabbing', 'Dull/aching', 'Burning', 'Crushing/pressure'] },
    { q: 'Does the pain spread to your arm, jaw, or back?', replies: ['Yes, to my left arm', 'Yes, to my jaw', 'Yes, to my back', 'No, it stays in one place'] },
    { q: 'Do you have any other symptoms along with the chest pain?', replies: ['Shortness of breath', 'Sweating', 'Nausea', 'None'] },
    { q: 'Is the pain constant or does it come and go?', replies: ['Constant', 'Comes and goes', 'Getting worse', 'Getting better'] },
    { q: 'Does anything make the pain better or worse?', replies: ['Worse with exertion', 'Better with rest', 'Worse when breathing', 'Nothing changes it'] },
    { q: 'On a scale of 1 to 10, how severe is the pain?', replies: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very severe)'] },
    { q: 'Do you have any medical conditions like diabetes, hypertension, or heart disease?', replies: ['Hypertension', 'Diabetes', 'Heart disease', 'None'] },
    { q: 'Are you currently taking any medications?', replies: ['Blood pressure meds', 'Diabetes meds', 'Aspirin', 'None'] },
    { q: 'Do you have any allergies to medications?', replies: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'No known allergies'] },
  ],
  fever: [
    { q: 'When did the fever start?', replies: ['Today', 'Yesterday', '2-3 days ago', 'More than a week'] },
    { q: 'How high has your temperature been?', replies: ['99-100°F (Low)', '100-102°F (Moderate)', '102-104°F (High)', 'Not measured'] },
    { q: 'Is the fever constant or does it come and go?', replies: ['Constant', 'Comes and goes', 'Worse at night', 'Only evenings'] },
    { q: 'Do you have any other symptoms with the fever?', replies: ['Body aches', 'Headache', 'Cough/cold', 'Sore throat'] },
    { q: 'Have you had any chills or sweating?', replies: ['Chills', 'Night sweats', 'Both', 'Neither'] },
    { q: 'Have you traveled recently or been in contact with sick people?', replies: ['Recent travel', 'Sick contact', 'Both', 'Neither'] },
    { q: 'Do you have any neck stiffness or rash?', replies: ['Neck stiffness', 'Rash', 'Both', 'Neither'] },
    { q: 'On a scale of 1 to 10, how unwell do you feel overall?', replies: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very severe)'] },
    { q: 'Do you have any chronic medical conditions?', replies: ['Diabetes', 'Hypertension', 'Asthma', 'None'] },
    { q: 'Are you taking any medications currently?', replies: ['Paracetamol', 'Antibiotics', 'Other meds', 'None'] },
    { q: 'Do you have any drug allergies?', replies: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'No known allergies'] },
  ],
  abdominal_pain: [
    { q: 'Where exactly in your abdomen is the pain?', replies: ['Upper right', 'Upper left', 'Lower right', 'All over'] },
    { q: 'When did the abdominal pain start?', replies: ['Less than 1 hour ago', 'A few hours ago', 'Today', 'Several days ago'] },
    { q: 'How would you describe the pain?', replies: ['Cramping', 'Sharp/stabbing', 'Dull/aching', 'Burning'] },
    { q: 'Does the pain spread to your back or shoulder?', replies: ['Yes, to my back', 'Yes, to my shoulder', 'No spreading', 'Not sure'] },
    { q: 'Do you have any of these symptoms?', replies: ['Nausea/vomiting', 'Diarrhea', 'Constipation', 'Loss of appetite'] },
    { q: 'Is the pain related to eating?', replies: ['Worse after eating', 'Better after eating', 'No relation to food', 'Not sure'] },
    { q: 'Is your abdomen tender or hard to touch?', replies: ['Very tender', 'Slightly tender', 'Hard/rigid', 'Normal'] },
    { q: 'On a scale of 1 to 10, how severe is the pain?', replies: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very severe)'] },
    { q: 'Do you have any chronic conditions like ulcers, gallstones, or IBS?', replies: ['Ulcers/gastritis', 'Gallstones', 'IBS', 'None'] },
    { q: 'Are you currently taking any medications?', replies: ['Antacids', 'Pain killers', 'Antibiotics', 'None'] },
    { q: 'Do you have any drug allergies?', replies: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'No known allergies'] },
  ],
  headache: [
    { q: 'Where is the headache located?', replies: ['Forehead', 'One side', 'Back of head', 'All over'] },
    { q: 'When did this headache start?', replies: ['Just now (sudden)', 'A few hours ago', 'Today', 'Been recurring'] },
    { q: 'How would you describe the headache?', replies: ['Throbbing/pulsing', 'Pressure/squeezing', 'Sharp/stabbing', 'Dull/constant'] },
    { q: 'Does the pain spread to your neck or eyes?', replies: ['Yes, to neck', 'Yes, behind eyes', 'Both', 'No spreading'] },
    { q: 'Do you have any other symptoms?', replies: ['Nausea/vomiting', 'Light sensitivity', 'Vision changes', 'None'] },
    { q: 'Is this the worst headache of your life?', replies: ['Yes, absolutely', 'No, had similar before', 'Hard to say', 'No, mild'] },
    { q: 'Does anything make the headache better or worse?', replies: ['Worse with light', 'Worse with noise', 'Better lying down', 'Nothing helps'] },
    { q: 'On a scale of 1 to 10, how severe is the headache?', replies: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very severe)'] },
    { q: 'Do you have any chronic conditions like migraines or hypertension?', replies: ['Known migraines', 'Hypertension', 'Sinusitis', 'None'] },
    { q: 'Are you currently taking any medications?', replies: ['Pain killers', 'Migraine meds', 'BP medications', 'None'] },
    { q: 'Do you have any drug allergies?', replies: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'No known allergies'] },
  ],
  cough: [
    { q: 'How long have you had the cough?', replies: ['Less than a week', '1-2 weeks', '2-4 weeks', 'More than a month'] },
    { q: 'Is the cough dry or are you bringing up phlegm?', replies: ['Dry cough', 'Phlegm - clear/white', 'Phlegm - yellow/green', 'Phlegm - bloody'] },
    { q: 'When is the cough worse?', replies: ['At night', 'In the morning', 'After eating', 'All day'] },
    { q: 'Do you have any of these symptoms?', replies: ['Shortness of breath', 'Chest pain', 'Wheezing', 'None'] },
    { q: 'Do you have a fever along with the cough?', replies: ['Yes, high fever', 'Low-grade fever', 'No fever', 'Not sure'] },
    { q: 'Have you had any weight loss or night sweats recently?', replies: ['Weight loss', 'Night sweats', 'Both', 'Neither'] },
    { q: 'Are you a smoker or exposed to any irritants?', replies: ['Current smoker', 'Ex-smoker', 'Dust/pollution exposure', 'No exposure'] },
    { q: 'On a scale of 1 to 10, how much does the cough bother you?', replies: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very severe)'] },
    { q: 'Do you have any chronic conditions like asthma, TB, or COPD?', replies: ['Asthma', 'COPD', 'Previous TB', 'None'] },
    { q: 'Are you currently taking any medications?', replies: ['Cough syrup', 'Inhalers', 'Antibiotics', 'None'] },
    { q: 'Do you have any drug allergies?', replies: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'No known allergies'] },
  ],
};

function normalizeComplaintKey(chiefComplaint: string): string {
  const comp = (chiefComplaint || '').toLowerCase().trim().replace(/[\s-]/g, '_');
  if (comp.includes('chest') || comp.includes('heart')) return 'chest_pain';
  if (comp.includes('head') || comp.includes('migraine')) return 'headache';
  if (comp.includes('fever') || comp.includes('temp')) return 'fever';
  if (comp.includes('stomach') || comp.includes('abdo') || comp.includes('gut')) return 'abdominal_pain';
  if (comp.includes('cough') || comp.includes('throat')) return 'cough';
  return 'chest_pain';
}

export async function getNextQuestion(chiefComplaint: string, history: Array<{ q?: string; a?: string }>) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: 'application/json' } });
      const prompt = getInterviewerPrompt(chiefComplaint);

      let contents = [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow those instructions and output only JSON.' }] },
      ];

      let historyText = '';
      for (const item of history) {
        historyText += `Q: ${item.q}\nA: ${item.a}\n\n`;
      }

      contents.push({ role: 'user', parts: [{ text: `History:\n${historyText}\nWhat is the next question?` }] });

      const result = await model.generateContent({ contents });
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini Error:', e);
    }
  }

  // Mock Engine
  const key = normalizeComplaintKey(chiefComplaint);
  const mockList = MOCK_QUESTIONS[key] || MOCK_QUESTIONS.chest_pain;

  const currentStep = history.length;

  if (currentStep >= mockList.length) {
    return {
      next_question: 'Thank you. The clinical interview is complete.',
      suggested_replies: [],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: true,
    };
  }

  // Check Mock Red Flag Conditions
  let isRedFlag = false;
  let redFlagReason: string | null = null;

  const fullHistoryText = history.map((item) => `${item.q} ${item.a}`).join(' ');

  if (key === 'chest_pain') {
    if (fullHistoryText.includes('Crushing') && fullHistoryText.includes('Shortness of breath')) {
      isRedFlag = true;
      redFlagReason = 'Severe crushing chest pain with dyspnea suggests possible acute coronary syndrome.';
    }
  } else if (key === 'fever') {
    if (fullHistoryText.includes('Neck stiffness') && fullHistoryText.includes('Rash')) {
      isRedFlag = true;
      redFlagReason = 'Fever with neck stiffness and rash suggests possible meningococcal infection.';
    }
  } else if (key === 'headache') {
    if (fullHistoryText.includes('Just now (sudden)') && fullHistoryText.includes('Yes, absolutely')) {
      isRedFlag = true;
      redFlagReason = 'Sudden thunderclap headache ("worst headache of life") suggests possible subarachnoid hemorrhage.';
    }
  }

  const nextQ = mockList[currentStep];

  return {
    next_question: nextQ.q,
    suggested_replies: nextQ.replies,
    red_flag: isRedFlag,
    red_flag_reason: redFlagReason,
    interview_complete: false,
  };
}

export async function generateSummary(chiefComplaint: string, history: Array<{ q?: string; a?: string }>, patientInfo: any = null, prescriptions: string = '') {
  const patientDetails = patientInfo
    ? `Patient: ${patientInfo.name}, ${patientInfo.age}y/${patientInfo.gender}, ID: ${patientInfo.identifier}`
    : 'Patient: Unknown / Guest';

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: 'application/json' } });
      const prompt = getSummarizerPrompt();

      let historyText = '';
      for (const item of history) {
        historyText += `Q: ${item.q}\nA: ${item.a}\n\n`;
      }

      const input = `${prompt}\n\n${patientDetails}\nChief Complaint: ${chiefComplaint}\n\nPrevious Prescriptions & Uploaded Records:\n${prescriptions || 'None attached'}\n\nTranscript:\n${historyText}`;
      const result = await model.generateContent(input);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini Error:', e);
    }
  }

  // Mock Fallback
  let historyText = '';
  for (const item of history) {
    historyText += `${item.q} ${item.a}. `;
  }

  const pastHistorySummary = prescriptions
    ? `Attached Previous Prescriptions & Records:\n${prescriptions}`
    : 'No previous prescriptions attached. Past history as per interview.';

  return {
    chief_complaint: `Patient (${patientInfo?.name || 'Guest'}) presents with ${chiefComplaint}`,
    hpi: `Patient reports ${chiefComplaint}. ${historyText}`,
    past_history: pastHistorySummary,
    review_of_systems: 'Cardiovascular & Respiratory: Pertinent findings noted. Other systems reviewed and negative.',
  };
}

export async function generateAutoPrescription(chiefComplaint: string, summaryData: any) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: 'application/json' } });
      const prompt = getAutoRxPrompt();
      const input = `${prompt}\n\nChief Complaint: ${chiefComplaint}\n\nHPI: ${summaryData?.hpi || ''}\nPast History: ${summaryData?.past_history || ''}\nROS: ${summaryData?.review_of_systems || ''}`;

      const result = await model.generateContent(input);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini Auto-Rx Error:', e);
    }
  }

  const comp = (chiefComplaint || '').toLowerCase();

  if (comp.includes('chest')) {
    return {
      medications: [
        { name: 'Tab. Sorbitrate', dosage: '5 mg', frequency: 'Sublingual (As needed)', duration: '5 days', instructions: 'Under tongue if chest discomfort occurs' },
        { name: 'Tab. Aspirin', dosage: '75 mg', frequency: '0-1-0 (After lunch)', duration: '30 days', instructions: 'Swallow whole with water' },
        { name: 'Tab. Atorvastatin', dosage: '20 mg', frequency: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'At night after dinner' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Before breakfast)', duration: '14 days', instructions: 'Empty stomach in morning' },
      ],
      investigations: ['ECG (12-Lead)', 'Troponin-I Level', '2D Echocardiogram', 'Lipid Profile'],
      advice: ['Complete physical rest', 'Strict low-fat & low-salt diet', 'Avoid strenuous physical activity', 'Seek emergency room if pain worsens'],
      follow_up: '3 days or immediately if pain recurs',
    };
  }

  if (comp.includes('fever')) {
    return {
      medications: [
        { name: 'Tab. Dolo (Paracetamol)', dosage: '650 mg', frequency: '1-0-1 (TDS if temp > 100°F)', duration: '5 days', instructions: 'After food' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '5 days', instructions: 'Before food' },
        { name: 'Syr. ORS Electral', dosage: '1 Sachet', frequency: 'Sip throughout day', duration: '3 days', instructions: 'Dissolve in 1 liter clean water' },
      ],
      investigations: ['Complete Blood Count (CBC)', 'Peripheral Blood Smear for Malaria', 'Dengue NS1 Antigen', 'Urine Routine'],
      advice: ['Tepid sponging if temp exceeds 101°F', 'High fluid intake (minimum 3 liters/day)', 'Adequate bed rest'],
      follow_up: '4 days',
    };
  }

  return {
    medications: [
      { name: 'Syr. Ascoril-LS / Alex', dosage: '10 ml', frequency: '1-1-1 (TDS)', duration: '5 days', instructions: 'After food' },
      { name: 'Tab. Azithromycin', dosage: '500 mg', frequency: '1-0-0 (OD)', duration: '3 days', instructions: '1 hour before or 2 hours after food' },
      { name: 'Tab. Montelukast + Levocetirizine', dosage: '10mg/5mg', frequency: '0-0-1 (Night)', duration: '7 days', instructions: 'At bedtime' },
    ],
    investigations: ['Chest X-Ray (PA View)', 'Absolute Eosinophil Count (AEC)'],
    advice: ['Steam inhalation twice daily', 'Salt water gargle 3 times a day', 'Avoid cold drinks and ice creams'],
    follow_up: '5 days',
  };
}
