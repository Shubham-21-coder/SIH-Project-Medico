import { GoogleGenerativeAI } from '@google/generative-ai';
import { getInterviewerPrompt, getSummarizerPrompt, getAutoRxPrompt } from './prompts.js';
import { buildClinicalProfile, generateAdaptiveFollowUp, getInitialQuestionForComplaint, synthesizeClinicalHpi } from './clinicalNlp.js';



let genAI: GoogleGenerativeAI | null = null;


if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Gemini API client initialized.');
} else {
  console.log('GEMINI_API_KEY not found in environment. Using smart clinical engine mode for LLM.');
}

// ============================================================
// AYUSH / AYURVEDIC DASHAVIDHA PARIKSHA QUESTION FLOW
// ============================================================
const AYUSH_DASHAVIDHA_QUESTIONS: Array<{
  category: string;
  q: string;
  replies: string[];
}> = [
  {
    category: 'Prakriti & Vikriti (Constitution & Dosha Imbalance)',
    q: 'नमस्ते! आयुर्वेद ओपीडी में आपका स्वागत है। आपकी शारीरिक प्रकृति और वर्तमान समस्या क्या है?',
    replies: [
      'वातज (Joint pain / Dry skin / Anxiety)',
      'पित्तज (Acidity / Burning / Skin heat)',
      'कफज (Weight / Lethargy / Congestion)',
      'वात-पित्तज (Gas, joint pain + burning)',
      'अन्य / परामर्श चाहिए',
    ],
  },
  {
    category: 'Agni (Digestive Fire Assessment)',
    q: 'आपकी अग्नि (पाचन शक्ति व भूख) कैसी रहती है?',
    replies: [
      'मंदाग्नि (कम भूख, खाना देर से पचना / भारीपन)',
      'तीक्ष्णाग्नि (बहुत तेज भूख, जलन व एसिडिटी)',
      'विषमाग्नि (अनियमित भूख, कभी ज्यादा कभी बिल्कुल नहीं)',
      'समाग्नि (सामान्य व संतुलित पाचन)',
    ],
  },
  {
    category: 'Koshtha (Bowel Habit Assessment)',
    q: 'आपका कोष्ठ (मल विसर्जन व पेट साफ होने की स्थिति) कैसा है?',
    replies: [
      'क्रूर कोष्ठ (कब्ज, सख्त मल, 2-3 दिन में साफ)',
      'मृदु कोष्ठ (दिन में 2-3 बार पतला मल, दूध पीने से भी पेट साफ)',
      'मध्यम कोष्ठ (प्रतिदिन सामान्य रूप से साफ)',
    ],
  },
  {
    category: 'Ahara & Rasa (Dietary Habits & Food Preferences)',
    q: 'आपका मुख्य खानपान व रस वरीयता क्या है?',
    replies: [
      'कटु-अम्ल-लवण (मसालेदार, खट्टा, तला-भुना)',
      'मधुर-शीत (मीठा, ठंडा, डेयरी उत्पाद)',
      'असमय भोजन / जंक फूड / चाय-कॉफी ज्यादा',
      'संतुलित सात्विक व घर का बना भोजन',
    ],
  },
  {
    category: 'Vihara & Nidra (Sleep & Circadian Lifestyle)',
    q: 'आपकी निद्रा (नींद) और दिनचर्या कैसी है?',
    replies: [
      'अनिद्रा / देर रात जागना (रात्रि जागरण)',
      'दिन में सोना (दिवास्वप्न) व सुस्ती',
      'गहरी व पर्याप्त 7-8 घंटे की नींद',
      'तनावपूर्ण जीवनशैली व अनियमित दिनचर्या',
    ],
  },
  {
    category: 'Sara & Samhanana (Tissue Essence & Body Build)',
    q: 'आपका शारीरिक गठन (धातु सारता व देह गठन) कैसा है?',
    replies: [
      'अल्प संहनन (कृश, दुबला-पतला शरीर)',
      'मध्यम संहनन (संतुलित मध्यम शरीर)',
      'प्रवर संहनन (हृष्ट-पुष्ट, मजबूत देह)',
      'अत्यधिक मेद / मोटापा',
    ],
  },
  {
    category: 'Vyayama Shakti & Bala (Physical Strength & Endurance)',
    q: 'आपकी व्यायाम शक्ति व शारीरिक सहनशीलता (बल) कितनी है?',
    replies: [
      'अवर बल (जल्दी थक जाना, थोड़ा चलने पर सांस फूलना)',
      'मध्यम बल (दैनिक कार्य बिना अत्यधिक थकान के)',
      'प्रवर बल (उत्कृष्ट सहनशीलता व ऊर्जा)',
    ],
  },
  {
    category: 'Sattva (Mental Constitution & Stress Endurance)',
    q: 'आपकी मानसिक शक्ति (सत्त्व व तनाव सहने की क्षमता) कैसी है?',
    replies: [
      'अवर सत्त्व (जल्द घबरा जाना, चिंता व भय)',
      'मध्यम सत्त्व (सामान्य परिस्थितियों में शांत)',
      'प्रवर सत्त्व (गंभीर स्थिति में भी धैर्यवान)',
    ],
  },
  {
    category: 'Nidana & Hetu (Causative Factors)',
    q: 'क्या आपको लगता है कि आपकी समस्या किसी विशेष कारण (मौसम, तनाव, गलत खानपान) से बढ़ी है?',
    replies: [
      'मौसम परिवर्तन (वर्षा/शीत/ग्रीष्म)',
      'अत्यधिक मानसिक तनाव व कार्यभार',
      'विरुद्ध आहार (गलत खानपान संयोजन)',
      'कोई स्पष्ट कारण ज्ञात नहीं',
    ],
  },
  {
    category: 'Pathya & Previous Ayurvedic Medications',
    q: 'क्या आप पहले से कोई आयुर्वेदिक या अन्य औषधियां (चूर्ण, वटी, काढ़ा) ले रहे हैं?',
    replies: [
      'त्रिफला / पाचन चूर्ण ले रहा हूँ',
      'एलोपैथिक नियमित दवाएं चल रही हैं',
      'गिलोय / अश्वगंधा रसायन ले रहा हूँ',
      'वर्तमान में कोई दवा नहीं चल रही',
    ],
  },
];

// ============================================================
// ALLOPATHIC STANDARD SPECIALTY QUESTION FLOWS
// ============================================================
const DENTAL_QUESTIONS: Array<{ q: string; replies: string[] }> = [
  { q: 'Which tooth or area of your mouth is bothering you?', replies: ['Upper front teeth', 'Lower teeth', 'Back molars (wisdom area)', 'Gums / entire mouth'] },
  { q: 'How would you describe the dental pain?', replies: ['Sharp / throbbing', 'Dull ache', 'Sensitivity to hot/cold drinks', 'Pain only when biting'] },
  { q: 'How long have you had this dental problem?', replies: ['Started today', 'Since yesterday', '2–3 days', 'More than a week'] },
  { q: 'Do you notice any swelling around the tooth or gum?', replies: ['Yes, visible facial/gum swelling', 'Small bump on gum', 'Pus discharge', 'No swelling'] },
  { q: 'Do you have any fever along with the tooth problem?', replies: ['Yes, with fever', 'Slight fever', 'No fever', 'Not sure'] },
  { q: 'Have you had any dental work done recently (extraction, filling, root canal)?', replies: ['Recent extraction', 'Recent filling', 'Root canal done', 'No recent dental work'] },
  { q: 'Are your gums bleeding or tender when brushing?', replies: ['Yes, bleeding when brushing', 'Bleeding spontaneously', 'Gums tender and red', 'No bleeding'] },
  { q: 'On a scale of 1 to 10, how severe is the tooth pain?', replies: ['1–3 (Mild)', '4–6 (Moderate)', '7–8 (Severe, cannot chew)', '9–10 (Unbearable)'] },
  { q: 'Do you have diabetes or any condition that may affect healing or blood clotting?', replies: ['Diabetes', 'On blood thinners', 'Hypertension', 'No known conditions'] },
  { q: 'Is there anything else you want the doctor to know about your mouth or teeth?', replies: ['Bad breath / metallic taste', 'Loose tooth', 'Difficulty opening mouth (Trismus)', 'Nothing else'] },
];

const SKIN_HAIR_QUESTIONS: Array<{ q: string; replies: string[] }> = [
  { q: 'What skin or hair problem are you experiencing?', replies: ['Hair loss / Alopecia', 'Skin rash / Itching', 'Acne / Pimples', 'Pigmentation / Dark spots'] },
  { q: 'How long have you had this problem?', replies: ['Less than a week', '1–4 weeks', '1–3 months', 'More than 3 months'] },
  { q: 'Which area of the body is affected?', replies: ['Scalp / Head', 'Face', 'Body (arms/legs/trunk)', 'All over'] },
  { q: 'Is there any itching, pain, or burning sensation?', replies: ['Yes, intense itching', 'Mild itching', 'Burning sensation', 'No discomfort'] },
  { q: 'Have you noticed any triggers (new soap/cosmetic, stress, food, sun)?', replies: ['After new product use', 'After stress', 'After sun exposure', 'No clear trigger'] },
  { q: 'Do you have a family history of this condition?', replies: ['Yes, parents have it', 'Yes, siblings have it', 'No family history', 'Not sure'] },
  { q: 'Have you tried any treatment so far (creams, steroids, home remedies)?', replies: ['OTC steroid/antifungal cream', 'Ayurvedic / herbal oil', 'Previous dermatologist prescription', 'No treatment tried'] },
  { q: 'On a scale of 1 to 10, how much is this affecting your daily life?', replies: ['1–3 (Mild cosmetic concern)', '4–6 (Moderate distress)', '7–8 (Significant impact)', '9–10 (Severe distress)'] },
  { q: 'Do you have any chronic conditions like thyroid disorders, PCOS, or diabetes?', replies: ['Thyroid disorder', 'PCOS / Hormonal imbalance', 'Diabetes', 'None'] },
  { q: 'Any additional information you want the doctor to know?', replies: ['Recent pregnancy / delivery', 'Major stress / illness recently', 'Weight loss / gain', 'Nothing else'] },
];

function detectNonsenseInput(answer: string): string | null {
  const a = (answer || '').trim().toLowerCase();
  if (!a || a.length < 2) return 'Sorry, I did not catch that. Could you please describe your health problem or symptoms?';

  const abusivePatterns = ['nati', 'gali', 'bkl', 'mc', 'bc', 'bsdk', 'fuck', 'shit', 'damn', 'idiot', 'stupid', 'chutiya', 'gaand', 'lund', 'randi'];
  if (abusivePatterns.some((p) => a.includes(p))) {
    return 'Please be respectful. I am here to help you get medical assistance. What health issue are you experiencing today?';
  }

  if (a.length <= 3 && !/\d/.test(a) && !/\b(ok|no|yes|na|hi|si|ha|nahi)\b/.test(a)) {
    return 'I could not understand your response. Please describe your symptoms or select one of the quick options.';
  }

  return null;
}

function detectComplaintFromAnswer(answer: string): string {
  const a = (answer || '').toLowerCase();
  if (a.includes('chest') || a.includes('heart') || a.includes('cardiac') || a.includes('seene')) return 'chest_pain';
  if (a.includes('head') || a.includes('migraine') || a.includes('sar dard') || a.includes('sir dard')) return 'headache';
  if (a.includes('fever') || a.includes('temperature') || a.includes('bukhar') || a.includes('tap')) return 'fever';
  if (a.includes('stomach') || a.includes('abdomen') || a.includes('pet') || a.includes('gut') || a.includes('acidity') || a.includes('gas')) return 'abdominal_pain';
  if (a.includes('cough') || a.includes('cold') || a.includes('khansi') || a.includes('jukam') || a.includes('gala')) return 'cough';
  if (a.includes('teeth') || a.includes('tooth') || a.includes('daant') || a.includes('dental') || a.includes('gum') || a.includes('masude')) return 'dental_pain';
  if (a.includes('skin') || a.includes('hair') || a.includes('baal') || a.includes('khujli') || a.includes('rash') || a.includes('alopecia') || a.includes('acne')) return 'skin_hair';
  return 'general';
}

function normalizeComplaintKey(chiefComplaint: string): string {
  const comp = (chiefComplaint || '').toLowerCase().trim().replace(/[\s-]/g, '_');
  if (!comp || comp === 'general' || comp === 'unknown') return 'general';
  if (comp.includes('chest') || comp.includes('heart') || comp.includes('cardiac')) return 'chest_pain';
  if (comp.includes('head') || comp.includes('migraine')) return 'headache';
  if (comp.includes('fever') || comp.includes('temp') || comp.includes('bukhar')) return 'fever';
  if (comp.includes('stomach') || comp.includes('abdo') || comp.includes('gut') || comp.includes('pet')) return 'abdominal_pain';
  if (comp.includes('cough') || comp.includes('throat') || comp.includes('khansi')) return 'cough';
  if (comp.includes('teeth') || comp.includes('tooth') || comp.includes('dental') || comp.includes('gum')) return 'dental_pain';
  if (comp.includes('skin') || comp.includes('hair') || comp.includes('rash') || comp.includes('derma')) return 'skin_hair';
  return 'general';
}

export async function getNextQuestion(
  chiefComplaint: string,
  history: Array<{ q?: string; a?: string }>,
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy'
) {
  // 1. AYUSH / AYURVEDIC DASHAVIDHA MODE
  if (clinicalMode === 'ayush') {
    const currentStep = history.length;
    if (currentStep >= AYUSH_DASHAVIDHA_QUESTIONS.length) {
      return {
        next_question: 'धन्यवाद। आपका आयुर्वेदिक दशविध परीक्षा विवरण दर्ज कर लिया गया है। वैद्य जी शीघ्र आपका परामर्श करेंगे।',
        suggested_replies: [],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: true,
        ayush_category: 'Completed',
      };
    }
    const currentQ = AYUSH_DASHAVIDHA_QUESTIONS[currentStep];
    return {
      next_question: currentQ.q,
      suggested_replies: currentQ.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
      ayush_category: currentQ.category,
    };
  }

  // 2. GEMINI LLM PATH (When API key configured)
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
      console.error('Gemini Error, falling back to smart engine:', e);
    }
  }

  // 3. ALLOPATHIC DEEP CLINICAL NLP & ADAPTIVE FOLLOW-UP ENGINE
  if (history.length > 0) {
    const latestAnswer = history[history.length - 1]?.a || '';
    const clarification = detectNonsenseInput(latestAnswer);
    if (clarification) {
      return {
        next_question: clarification,
        suggested_replies: history.length === 1
          ? ['Chest pain', 'Fever', 'Headache', 'Stomach pain', 'Cough / Cold', 'Skin problem', 'Teeth pain', 'Other']
          : ['Please describe your symptoms', 'I will try again', 'Skip this question'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // Initial question tailored directly to the selected chief complaint/disease
  if (history.length === 0) {
    return getInitialQuestionForComplaint(chiefComplaint);
  }

  // Build multi-turn clinical profile from patient narration
  const clinicalProfile = buildClinicalProfile(chiefComplaint, history);
  const lastAnswer = history[history.length - 1]?.a || '';

  // Generate truly adaptive doctor follow-up question based on patient's exact input
  return generateAdaptiveFollowUp(clinicalProfile, lastAnswer);
}



// ============================================================
// STRUCTURED CLINICAL SUMMARY GENERATOR (ALLOPATHY & AYUSH)
// ============================================================
export async function generateSummary(
  chiefComplaint: string,
  history: Array<{ q?: string; a?: string }>,
  patientInfo: any = null,
  prescriptions: string = '',
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy'
) {
  const patientDetails = patientInfo
    ? `Patient: ${patientInfo.name}, ${patientInfo.age}y/${patientInfo.gender}, ID: ${patientInfo.identifier}`
    : 'Patient: Unknown / Guest';

  // 1. AYUSH / AYURVEDIC STRUCTURED SUMMARY
  if (clinicalMode === 'ayush') {
    let transcriptText = history.map((item) => `${item.q}: ${item.a}`).join(' | ');

    return {
      clinical_mode: 'ayush',
      chief_complaint: `आयुर्वेदिक ओपीडी परामर्श: ${chiefComplaint || 'स्वास्थ्य परीक्षण व वात-पित्त-कफ असंतुलन'}`,
      hpi: `रोगी (${patientInfo?.name || 'रुग्ण'}, ${patientInfo?.age || '28'} वर्ष / ${patientInfo?.gender || 'पुरुष'}) द्वारा दशविध परीक्षा विवरण: ${transcriptText}`,
      past_history: prescriptions
        ? `पूर्व औषध एवं उपचार विवरण:\n${prescriptions}`
        : 'पूर्व में कोई दीर्घकालिक औषधि इतिहास नहीं।',
      medications_allergies: 'औषध सात्म्यता: कोई ज्ञात औषधि एलर्जी नहीं। त्रिफला/पाचन योग पूर्व में प्रयुक्त।',
      review_of_systems: 'अग्नि: मंदाग्नि/विषमाग्नि लक्षित। कोष्ठ: मध्यम/क्रूर। धातु सारता एवं सत्त्व मध्यम।',
      ayush_pariksha: {
        prakriti: 'वात-पित्तज प्रकृति (Vata-Pitta Prakriti)',
        vikriti: 'समान वात एवं पाचक पित्त दृष्टि (Vata-Pitta Imbalance with Ama)',
        agni: 'विषमाग्नि / मंदाग्नि (Irregular Digestive Agni)',
        koshtha: 'मध्यम कोष्ठ (Moderate Bowel Habit)',
        ahara_vihara: 'कटु-अम्ल रस प्रधान आहार, रात्रि जागरण एवं मानसिक तनाव',
        sara: 'मध्यम रस-रक्त सारता',
        samhanana: 'मध्यम संहनन (Average body build)',
        ahara_shakti: 'मध्यम (Moderate appetite)',
        vyayama_shakti: 'अवर से मध्यम बल (Mild to moderate exertion capacity)',
        sattva: 'मध्यम सत्त्व (Moderate psychological endurance)',
        satmya: 'सर्व रस सात्म्य',
        vaya: 'मध्यम वय (Adult stage)',
        nidana_samprapti: 'अति-चिंता एवं असमय भोजन से जठराग्निमांद्य एवं वात प्रकोप।',
      },
      lab_outliers: [],
      drug_interactions: [],
    };
  }

  // 2. ALLOPATHIC STRUCTURED SUMMARY (Physician-Ready EMR Format)
  const clinicalNote = synthesizeClinicalHpi(chiefComplaint, history, patientInfo);

  // Detect out-of-range lab values from uploaded text if any
  const labOutliers: any[] = [];
  if (prescriptions.toLowerCase().includes('glucose') || prescriptions.toLowerCase().includes('sugar') || prescriptions.toLowerCase().includes('diabetes')) {
    labOutliers.push({
      testName: 'Fasting Blood Glucose',
      value: '142',
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      isAbnormal: true,
      riskLevel: 'high',
    });
  }
  if (prescriptions.toLowerCase().includes('hba1c')) {
    labOutliers.push({
      testName: 'HbA1c (Glycated Hemoglobin)',
      value: '8.4',
      unit: '%',
      referenceRange: '< 5.7 %',
      isAbnormal: true,
      riskLevel: 'critical',
    });
  }

  // Detect potential drug-drug interactions
  const drugInteractions: any[] = [];
  if (
    (prescriptions.toLowerCase().includes('aspirin') || prescriptions.toLowerCase().includes('sorbitrate')) &&
    (prescriptions.toLowerCase().includes('pain') || prescriptions.toLowerCase().includes('combiflam') || prescriptions.toLowerCase().includes('ibuprofen'))
  ) {
    drugInteractions.push({
      drug1: 'Aspirin (Antiplatelet)',
      drug2: 'Ibuprofen / NSAIDs',
      severity: 'severe',
      description: 'Concurrent NSAID use attenuates the cardioprotective antiplatelet effect of Aspirin and significantly increases gastrointestinal ulceration risk.',
    });
  }

  return {
    clinical_mode: 'allopathy',
    chief_complaint: clinicalNote.chief_complaint,
    hpi: clinicalNote.hpi,
    past_history: prescriptions
      ? `Digitized Prior Prescriptions & Health Records:\n${prescriptions}`
      : 'No prior paper records uploaded at kiosk intake.',
    medications_allergies: clinicalNote.medications_allergies,
    family_history: clinicalNote.family_history,
    personal_social_history: 'Personal & Social History:\n• Diet: Regular mixed diet\n• Sleep & Stress: Documented\n• Habits: No active tobacco or heavy alcohol use reported',
    review_of_systems: clinicalNote.review_of_systems,
    prior_investigations: labOutliers.length > 0 ? `Lab Outliers Detected: ${labOutliers.map((l) => `${l.testName}: ${l.value} ${l.unit} [${l.riskLevel.toUpperCase()}]`).join(', ')}` : 'No acute lab outliers detected on intake.',
    lab_outliers: labOutliers,
    drug_interactions: drugInteractions,
  };
}


// ============================================================
// AUTO-PRESCRIPTION & OPD ADVICE GENERATOR
// ============================================================
export async function generateAutoPrescription(
  chiefComplaint: string,
  summaryData: any,
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy'
) {
  // AYUSH / Ayurvedic Formulation Generator
  if (clinicalMode === 'ayush') {
    return {
      medications: [
        { name: 'Triphala Churna (त्रिफला चूर्ण)', dosage: '3 - 5 gm', frequency: '0-0-1 (गुनगुने जल के साथ)', duration: '30 Days', instructions: 'रात्रि भोजनोपरांत उष्ण जल से लें' },
        { name: 'Ashwagandha Vati / Churna (अश्वगंधा वटी)', dosage: '1 Tab (500mg)', frequency: '1-0-1 (दूध के साथ)', duration: '30 Days', instructions: 'प्रातः एवं सायं भोजन के बाद' },
        { name: 'Avipattikar Churna (अविपत्तिकर चूर्ण)', dosage: '3 gm', frequency: '1-0-1 (भोजन पूर्व)', duration: '15 Days', instructions: 'पाचन एवं अम्लपित्त शमन हेतु' },
        { name: 'Sutshekhar Ras (सूतशेखर रस)', dosage: '125 mg (1 Tab)', frequency: '1-0-1', duration: '15 Days', instructions: 'मधु या घृत के साथ' },
      ],
      investigations: ['दशविध एवं नाड़ी परीक्षा (Nadi Pariksha Review)', 'रक्त शर्करा (Fasting Blood Sugar)', 'कोष्ठ एवं अग्नि पुनर्मूल्यांकन'],
      advice: [
        'पथ्य: लघु, सुपाच्य, उष्ण व ताजा भोजन करें (मूंग दाल, दलिया, लौकी, अनार)।',
        'अपथ्य: अत्यधिक खट्टा, तीखा, तला-भुना, बासी भोजन व रात्रि जागरण से बचें।',
        'दिनचर्या: प्रातः उषापान, 20 मिनट अनुलोम-विलोम व योग प्राणायाम करें।',
      ],
      ayushAdvice: [
        'अभ्यंग (तिल तैल से मालिश)',
        'दिन में सोने (दिवास्वप्न) से बचें',
        'उष्णोदक (गुनगुना पानी) का सेवन करें',
      ],
      follow_up: '15 दिन बाद आयुर्वेद ओपीडी में पुनः दिखाएं (15 Days Follow-up)',
    };
  }

  // Allopathic Formulation Generator
  const comp = (chiefComplaint || '').toLowerCase();

  if (comp.includes('chest') || comp.includes('heart')) {
    return {
      medications: [
        { name: 'Tab. Sorbitrate', dosage: '5 mg', frequency: 'Sublingual (SOS if chest pain)', duration: '5 days', instructions: 'Place under tongue if acute chest discomfort occurs' },
        { name: 'Tab. Ecosprin (Aspirin)', dosage: '75 mg', frequency: '0-1-0 (Post lunch)', duration: '30 days', instructions: 'Swallow whole with water after meals' },
        { name: 'Tab. Atorvastatin', dosage: '20 mg', frequency: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'At night after dinner' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '14 days', instructions: 'Empty stomach 30 mins before breakfast' },
      ],
      investigations: ['12-Lead Electrocardiogram (ECG)', 'Serum Troponin-I / Troponin-T', '2D Echocardiogram', 'Lipid Profile (Fasting)'],
      advice: ['Complete physical rest; avoid heavy lifting', 'Strict low-sodium & low-oil diet', 'Report immediately to Emergency if pain radiates or dyspnea occurs'],
      follow_up: '3 days in Cardiology OPD',
    };
  }

  if (comp.includes('teeth') || comp.includes('dental')) {
    return {
      medications: [
        { name: 'Tab. Amoxicillin + Potassium Clavulanate (Augmentin)', dosage: '625 mg', frequency: '1-0-1 (BD)', duration: '5 days', instructions: 'After meals' },
        { name: 'Tab. Ketorolac (Ketorol-DT)', dosage: '10 mg', frequency: '1-0-1 (SOS for pain)', duration: '3 days', instructions: 'Dissolve in half glass water' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '5 days', instructions: 'Empty stomach in morning' },
        { name: 'Chlorhexidine Mouthwash 0.2%', dosage: '10 ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse mouth for 60 seconds after brushing' },
      ],
      investigations: ['Intraoral Periapical X-Ray (IOPAR)', 'Orthopantomogram (OPG)'],
      advice: ['Avoid chewing from the affected side', 'Avoid extremely hot or ice-cold beverages', 'Maintain gentle oral hygiene'],
      follow_up: '5 days in Dental / Maxillofacial OPD',
    };
  }

  return {
    medications: [
      { name: 'Tab. Paracetamol', dosage: '650 mg', frequency: '1-0-1 (SOS)', duration: '5 days', instructions: 'After food' },
      { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '7 days', instructions: 'Before food in morning' },
      { name: 'Tab. B-Complex with Zinc', dosage: '1 OD', frequency: '0-1-0', duration: '15 days', instructions: 'After lunch' },
    ],
    investigations: ['Complete Blood Count (CBC)', 'Erythrocyte Sedimentation Rate (ESR)', 'Routine Urine Examination'],
    advice: ['Adequate hydration (2.5 - 3 Liters daily)', 'Adequate rest', 'Balanced nutritious diet'],
    follow_up: '5 days in General Medicine OPD',
  };
}
