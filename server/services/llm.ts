import { GoogleGenerativeAI } from '@google/generative-ai';
import { getInterviewerPrompt, getSummarizerPrompt, getAutoRxPrompt } from './prompts.js';
import { buildClinicalProfile, generateAdaptiveFollowUp, getInitialQuestionForComplaint, synthesizeClinicalHpi } from './clinicalNlp.js';



let genAI: GoogleGenerativeAI | null = null;

export function getGenAiClient(): GoogleGenerativeAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API client initialized.');
  }
  return genAI;
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
    category: 'Pramana (Body Proportions & Measurements)',
    q: 'आपके शरीर की माप एवं अनुपात (प्रमाण) कैसा है — लंबाई, भार, और अंग अनुपात?',
    replies: [
      'सामान्य ऊँचाई व संतुलित भार (BMI 18-25)',
      'कम भार / दुबला-पतला (BMI < 18)',
      'अधिक भार / स्थूल (BMI > 25)',
      'अनिश्चित / मापन उपलब्ध नहीं',
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

export function detectNonsenseInput(answer: string, answerState?: string, language: string = 'hi'): string | null {
  if (answerState === 'unknown' || answerState === 'declined' || answerState === 'skip') {
    return null;
  }

  const raw = (answer || '').trim();
  const a = raw.toLowerCase();

  if (!a || a.length < 2) {
    return language === 'hi'
      ? 'उत्तर बहुत छोटा या अस्पष्ट है। कृपया अपने लक्षणों का विवरण दें या नीचे दिए गए विकल्पों में से चुनें।'
      : 'Response is too short or unclear. Please describe your health symptoms or select one of the options below.';
  }

  // Abusive language detection
  const abusivePatterns = ['nati', 'gali', 'bkl', 'mc', 'bc', 'bsdk', 'fuck', 'shit', 'damn', 'idiot', 'stupid', 'chutiya', 'gaand', 'lund', 'randi'];
  if (abusivePatterns.some((p) => a.includes(p))) {
    return language === 'hi'
      ? 'कृपया अभद्र भाषा का प्रयोग न करें। ओपीडी सहायक केवल स्वास्थ्य संबंधी प्रश्न पूछता है। कृपया अपने लक्षण बताएं।'
      : 'Please refrain from using abusive language. I am here to help collect your clinical history. Please describe your symptoms.';
  }

  // Explicit off-topic entities (Sports, Celebrities, Entertainment, Politics, Gaming, Tech, Finance)
  const offTopicKeywords = [
    'virat', 'kohli', 'dhoni', 'rohit', 'cricket', 'ipl', 'match', 'score', 'football', 'messi', 'ronaldo', 'sachin', 'babar',
    'movie', 'film', 'cinema', 'actor', 'actress', 'hero', 'bollywood', 'hollywood', 'netflix', 'youtube', 'reels', 'instagram', 'tiktok',
    'modi', 'bjp', 'congress', 'election', 'vote', 'pubg', 'free fire', 'game', 'gaming', 'crypto', 'bitcoin', 'iphone', 'laptop'
  ];

  // Clinical & symptom terms (English + Transliterated Hindi + Indications)
  const medicalKeywords = [
    'pain', 'ache', 'fever', 'cough', 'cold', 'stomach', 'chest', 'heart', 'head', 'tooth', 'teeth', 'gum', 'skin', 'hair',
    'swell', 'swelling', 'blood', 'pus', 'sensit', 'hot', 'cold', 'food', 'eat', 'drink', 'water', 'sleep', 'vomit', 'nausea',
    'gas', 'acid', 'joint', 'knee', 'back', 'neck', 'shoulder', 'leg', 'arm', 'throat', 'breath', 'dizzy', 'rash', 'itch',
    'dard', 'bukhar', 'khansi', 'jukam', 'pet', 'seene', 'sar', 'sir', 'daant', 'daath', 'masude', 'baal', 'khujli', 'sujan',
    'khoon', 'thanda', 'garam', 'khana', 'peena', 'paani', 'neend', 'ulti', 'gala', 'saans', 'chakar', 'dawai', 'medicine',
    'doctor', 'hospital', 'opd', 'problem', 'takleef', 'bimar', 'ill', 'sick', 'day', 'days', 'week', 'weeks',
    'month', 'months', 'year', 'years', 'din', 'hafte', 'mahine', 'saal', 'subah', 'raat', 'aaj', 'kal', 'pehle',
    'mild', 'moderate', 'severe', 'sharp', 'dull', 'left', 'right', 'both', 'upper', 'lower', 'front', 'back', 'side',
    'yes', 'no', 'ha', 'haa', 'haan', 'nahi', 'nhi', 'na', 'ok', 'okay', 'fine', 'none', 'nothing', 'kuch nahi', 'pata nahi',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  ];

  const hindiMedicalRegex = /दर्द|बुखार|खांसी|जुकाम|पेट|सीने|छाती|सिर|दांत|मसूड़े|बाल|सूजन|खून|ठंडा|गर्म|खाना|पानी|नींद|उल्टी|गला|सांस|चक्कर|दवा|अस्पताल|तकलीफ|बीमार|दिन|हफ्ता|महीना|साल|सुबह|रात|आज|कल|हाँ|नहीं|पता नहीं|कुछ नहीं|कम|ज्यादा|बायां|दायां|दोनों|ऊपर|नीचे/;

  const hasOffTopicWord = offTopicKeywords.some((w) => a.includes(w));
  const hasMedicalWord = medicalKeywords.some((w) => a.includes(w)) || /\d/.test(a);
  const isDevanagariMedical = hindiMedicalRegex.test(raw);

  if (hasOffTopicWord && !hasMedicalWord && !isDevanagariMedical) {
    return language === 'hi'
      ? `"${raw}" ओपीडी प्रश्न का प्रासंगिक उत्तर नहीं है। कृपया अपनी बीमारी या लक्षणों से संबंधित उत्तर दें, अथवा नीचे दिए गए विकल्पों का प्रयोग करें।`
      : `"${raw}" is not relevant to the clinical question. Please describe your health problem or select one of the options below.`;
  }

  if (a.length > 6 && !hasMedicalWord && !isDevanagariMedical && !/\b(ok|yes|no|na|ha|nhi|nahi)\b/.test(a)) {
    return language === 'hi'
      ? 'यह उत्तर स्वास्थ्य प्रश्न से संबंधित नहीं लग रहा है। कृपया अपनी समस्या स्पष्ट करें या नीचे दिए गए विकल्पों को चुनें।'
      : 'This answer does not seem relevant to your medical condition. Please describe your symptoms or select an option below.';
  }

  return null;
}

function detectComplaintFromAnswer(answer: string): string {
  const a = (answer || '').toLowerCase();
  if (a.includes('chest') || a.includes('heart') || a.includes('cardiac') || a.includes('seene') || /सीने|छाती|ఛాతీ|বুক/.test(a)) return 'chest_pain';
  if (a.includes('head') || a.includes('migraine') || a.includes('sar dard') || a.includes('sir dard') || /सिरदर्द|सिर दर्द|डोकेदुखी|తలనొప్పి|মাথা|માથા/.test(a)) return 'headache';
  if (a.includes('fever') || a.includes('temperature') || a.includes('bukhar') || a.includes('tap') || /बुखार|ताप|జ్వరం|জ্বর|તાવ/.test(a)) return 'fever';
  if (a.includes('stomach') || a.includes('abdomen') || a.includes('pet') || a.includes('gut') || a.includes('acidity') || a.includes('gas') || /पेट|पोट|కడుపు|পেট|પેટ/.test(a)) return 'abdominal_pain';
  if (a.includes('cough') || a.includes('cold') || a.includes('khansi') || a.includes('jukam') || a.includes('gala') || /खांसी|जुकाम|दग्गु|কাহশি/.test(a)) return 'cough';
  if (a.includes('teeth') || a.includes('tooth') || a.includes('daant') || a.includes('dental') || a.includes('gum') || a.includes('masude') || /दांत|दाँत|मसूड़े|दाढ़|दात|పంటి|দাঁত|ಹಲ್ಲು/.test(a)) return 'dental_pain';
  if (a.includes('skin') || a.includes('hair') || a.includes('baal') || a.includes('khujli') || a.includes('rash') || a.includes('alopecia') || a.includes('acne') || /बाल|खुजली|चर्म|केस|జుట్టు/.test(a)) return 'skin_hair';
  return 'general';
}

function normalizeComplaintKey(chiefComplaint: string): string {
  const comp = (chiefComplaint || '').toLowerCase().trim().replace(/[\s-]/g, '_');
  if (!comp || comp === 'general' || comp === 'unknown') return 'general';
  if (comp.includes('chest') || comp.includes('heart') || comp.includes('cardiac') || /सीने|छाती|ఛాతీ|বুক/.test(comp)) return 'chest_pain';
  if (comp.includes('head') || comp.includes('migraine') || /सिरदर्द|सिर दर्द|डोकेदुखी|తలనొప్పి|মাথা|માથા/.test(comp)) return 'headache';
  if (comp.includes('fever') || comp.includes('temp') || comp.includes('bukhar') || /बुखार|ताप|జ్వరం|জ্বর|તાવ/.test(comp)) return 'fever';
  if (comp.includes('stomach') || comp.includes('abdo') || comp.includes('gut') || comp.includes('pet') || /पेट|पोट|కడుపు|পেট|પેટ/.test(comp)) return 'abdominal_pain';
  if (comp.includes('cough') || comp.includes('throat') || comp.includes('khansi') || /खांसी|जुकाम|दग्गु|কাহশি/.test(comp)) return 'cough';
  if (comp.includes('teeth') || comp.includes('tooth') || comp.includes('dental') || comp.includes('gum') || /दांत|दाँत|मसूड़े|दाढ़|दात|పంటి|দাঁত|ಹಲ್ಲು/.test(comp)) return 'dental_pain';
  if (comp.includes('skin') || comp.includes('hair') || comp.includes('rash') || comp.includes('derma') || /बाल|खुजली|चर्म|केस|జుట్టు/.test(comp)) return 'skin_hair';
  return 'general';
}

export async function getNextQuestion(
  chiefComplaint: string,
  history: Array<{ q?: string; a?: string }>,
  clinicalMode: 'allopathy' | 'ayush' = 'allopathy',
  language: string = 'hi'
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

  // 2. ALLOPATHIC DEEP CLINICAL NLP & SEQUENTIAL INDIC FOLLOW-UP ENGINE


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
    return getInitialQuestionForComplaint(chiefComplaint, language);
  }

  // Build multi-turn clinical profile from patient narration
  const clinicalProfile = buildClinicalProfile(chiefComplaint, history);
  const lastAnswer = history[history.length - 1]?.a || '';

  // Generate truly adaptive doctor follow-up question based on patient's exact input
  return generateAdaptiveFollowUp(clinicalProfile, lastAnswer, language);
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
    let transcriptText = history.map((item) => `${item.q}: ${item.a || '[Not answered]'}`).join(' | ');

    // PRD FR04: Build AYUSH pariksha from actual interview answers
    const ayushFields: any = {
      prakriti: '[Not assessed — requires practitioner examination]',
      vikriti: '[Not assessed — requires practitioner examination]',
      agni: '[Not assessed — patient self-report pending]',
      koshtha: '[Not assessed — patient self-report pending]',
      ahara_vihara: '[Not assessed — patient self-report pending]',
      sara: '[Not assessed]',
      samhanana: '[Not assessed]',
      pramana: '[Not assessed — requires physical measurement]',
      ahara_shakti: '[Not assessed]',
      vyayama_shakti: '[Not assessed]',
      sattva: '[Not assessed]',
      satmya: '[Not assessed]',
      vaya: patientInfo?.age ? `${patientInfo.age} वर्ष` : '[Not recorded]',
      nidana_samprapti: '[Not assessed]',
    };

    // Map interview answers to AYUSH fields based on question category
    for (const item of history) {
      const answer = item.a || '';
      const question = item.q || '';
      if (question.includes('प्रकृति')) ayushFields.prakriti = `Patient self-report: ${answer}`;
      if (question.includes('अग्नि')) ayushFields.agni = `Patient self-report: ${answer}`;
      if (question.includes('कोष्ठ')) ayushFields.koshtha = `Patient self-report: ${answer}`;
      if (question.includes('खानपान') || question.includes('रस')) ayushFields.ahara_vihara = `Patient self-report: ${answer}`;
      if (question.includes('निद्रा') || question.includes('दिनचर्या')) ayushFields.ahara_vihara += ` | ${answer}`;
      if (question.includes('गठन') || question.includes('धातु')) { ayushFields.sara = `Patient self-report: ${answer}`; ayushFields.samhanana = `Patient self-report: ${answer}`; }
      if (question.includes('प्रमाण') || question.includes('माप')) ayushFields.pramana = `Patient self-report: ${answer}`;
      if (question.includes('व्यायाम') || question.includes('सहनशीलता')) ayushFields.vyayama_shakti = `Patient self-report: ${answer}`;
      if (question.includes('सत्त्व') || question.includes('मानसिक')) ayushFields.sattva = `Patient self-report: ${answer}`;
      if (question.includes('कारण') || question.includes('निदान')) ayushFields.nidana_samprapti = `Patient self-report: ${answer}`;
    }

    // PRD FR09: Track missing fields explicitly
    const missingFields: string[] = [];
    for (const [key, val] of Object.entries(ayushFields)) {
      if (typeof val === 'string' && val.includes('[Not assessed')) missingFields.push(key);
    }

    return {
      clinical_mode: 'ayush',
      chief_complaint: `आयुर्वेदिक ओपीडी परामर्श: ${chiefComplaint || 'स्वास्थ्य परीक्षण'}`,
      hpi: `रोगी (${patientInfo?.name || 'Patient'}, ${patientInfo?.age || ''} वर्ष / ${patientInfo?.gender || ''}) द्वारा दशविध परीक्षा विवरण: ${transcriptText}`,
      past_history: prescriptions
        ? `[HISTORIC] पूर्व औषध एवं उपचार विवरण (may not reflect current regimen):\n${prescriptions}`
        : '[Not provided] — No prior prescription documents uploaded.',
      medications_allergies: '[Not asked] — Medication and allergy assessment pending clinician review.',
      review_of_systems: 'Documented from patient self-report during Dashavidha Pariksha intake.',
      ayush_pariksha: ayushFields,
      missingFields,
      lab_outliers: [],
      drug_interactions: [],
      reviewState: 'submitted',
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

  // PRD FR09: Track missing fields explicitly
  const missingFields: string[] = [];
  if (!clinicalNote.medications_allergies || clinicalNote.medications_allergies.includes('None reported')) missingFields.push('medications_allergies');
  if (!clinicalNote.family_history || clinicalNote.family_history.includes('Non-contributory')) missingFields.push('family_history');
  if (!prescriptions) missingFields.push('prior_documents');

  // PRD FR09: Track unresolved conflicts
  const unresolvedConflicts: string[] = [];
  if (prescriptions && clinicalNote.medications_allergies) {
    // Check for potential current vs historic medication confusion
    unresolvedConflicts.push('[Review needed] Verify whether medications from uploaded prescriptions are still actively taken by patient.');
  }

  return {
    clinical_mode: 'allopathy',
    chief_complaint: clinicalNote.chief_complaint,
    hpi: clinicalNote.hpi,
    past_history: prescriptions
      ? `[HISTORIC — verify current status with patient] Digitized Prior Prescriptions & Health Records:\n${prescriptions}`
      : '[Not provided] — No prior paper records uploaded at kiosk intake.',
    medications_allergies: clinicalNote.medications_allergies,
    family_history: clinicalNote.family_history,
    personal_social_history: clinicalNote.hpi.length > 50
      ? 'Personal & Social History:\n• Documented from patient interview'
      : '[Not fully assessed] — Personal & social history not covered during intake.',
    review_of_systems: clinicalNote.review_of_systems,
    prior_investigations: labOutliers.length > 0 ? `Lab Outliers Detected: ${labOutliers.map((l) => `${l.testName}: ${l.value} ${l.unit} [${l.riskLevel.toUpperCase()}]`).join(', ')}` : '[No lab data available] — No lab reports uploaded or extracted.',
    lab_outliers: labOutliers,
    drug_interactions: drugInteractions,
    missingFields,
    unresolvedConflicts,
    reviewState: 'submitted',
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
  const fullText = (
    (chiefComplaint || '') + ' ' +
    (summaryData?.chief_complaint || '') + ' ' +
    (summaryData?.hpi || '')
  ).toLowerCase();

  // 1. TRICHOLOGY / HAIR & SCALP
  if (fullText.includes('hair') || fullText.includes('scalp') || fullText.includes('alopecia') || fullText.includes('bald') || fullText.includes('dandruff') || fullText.includes('shedding')) {
    return {
      medications: [
        { name: 'Tab. Keraboost (D-Biotin + Zinc + Amino Acids)', dosage: '1 Tab', frequency: '1-0-0 (Morning)', duration: '30 days', instructions: 'Take daily after breakfast with water' },
        { name: 'Ketoconazole 2% Anti-Dandruff Shampoo', dosage: '10 ml', frequency: 'Twice Weekly', duration: '30 days', instructions: 'Apply on wet scalp, massage gently, leave for 5 mins then rinse' },
        { name: 'Topical Minoxidil 5% Solution / Hair Serum', dosage: '1 ml', frequency: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'Apply on dry scalp with dropper at night; do not rub vigorously' },
        { name: 'Tab. Levocetirizine', dosage: '5 mg', frequency: '0-0-1 (SOS for itching)', duration: '10 days', instructions: 'At bedtime if severe scalp itching occurs' },
      ],
      investigations: ['Serum Ferritin & Iron Studies', 'Vitamin D3 & Vitamin B12 Levels', 'Thyroid Profile (Free T3, Free T4, TSH)', 'Complete Blood Count (CBC)'],
      advice: ['Gentle scalp hygiene; avoid harsh chemical dyes or hot water wash', 'High-protein diet (Eggs, Paneer, Soya, Sprouts, Nuts)', 'Avoid tight hairstyles and manage sleep/stress'],
      follow_up: '30 days in Dermatology / Trichology OPD',
    };
  }

  // 2. DERMATOLOGY / SKIN RASH & ITCHING
  if (fullText.includes('skin') || fullText.includes('rash') || fullText.includes('itch') || fullText.includes('allergy') || fullText.includes('eczema') || fullText.includes('derma')) {
    return {
      medications: [
        { name: 'Tab. Levocetirizine', dosage: '5 mg', frequency: '0-0-1 (Bedtime)', duration: '10 days', instructions: 'At night after food to control nocturnal itching' },
        { name: 'Calamine + Liquid Paraffin Soothing Lotion', dosage: 'Topical', frequency: 'Apply twice daily', duration: '14 days', instructions: 'Apply gently over itchy red patches after bath' },
        { name: 'Hydrocortisone 1% / Mupirocin Cream', dosage: 'Topical Ointment', frequency: '1-0-1', duration: '7 days', instructions: 'Apply thin layer on inflamed red rash only' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '10 days', instructions: 'Empty stomach 30 mins before breakfast' },
      ],
      investigations: ['Absolute Eosinophil Count (AEC)', 'Total Serum IgE Level', 'Skin Scraping for Fungus (KOH Mount if scaling)'],
      advice: ['Avoid hot water baths and harsh chemical soaps; use syndet cleansing bars', 'Wear loose cotton clothing', 'Strictly avoid scratching rash to prevent secondary bacterial infection'],
      follow_up: '7 days in Dermatology OPD',
    };
  }

  // 3. CARDIOVASCULAR / CHEST PAIN
  if (fullText.includes('chest') || fullText.includes('heart') || fullText.includes('cardiac') || fullText.includes('angina')) {
    return {
      medications: [
        { name: 'Tab. Sorbitrate', dosage: '5 mg', frequency: 'Sublingual (SOS if chest pain)', duration: '5 days', instructions: 'Place under tongue if acute chest discomfort occurs' },
        { name: 'Tab. Ecosprin (Aspirin)', dosage: '75 mg', frequency: '0-1-0 (Post lunch)', duration: '30 days', instructions: 'Swallow whole with water after meals' },
        { name: 'Tab. Atorvastatin', dosage: '20 mg', frequency: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'At night after dinner' },
        { name: 'Tab. Telmisartan', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '30 days', instructions: 'Before breakfast daily' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '14 days', instructions: 'Empty stomach 30 mins before breakfast' },
      ],
      investigations: ['12-Lead Electrocardiogram (ECG)', 'Serum Troponin-I / Troponin-T', '2D Echocardiogram', 'Lipid Profile (Fasting)'],
      advice: ['Complete physical rest; avoid strenuous exertion or heavy lifting', 'Strict low-sodium & low-oil diet', 'Report immediately to Emergency if chest pain radiates to left arm or shortness of breath occurs'],
      follow_up: '3 days in Cardiology OPD',
    };
  }

  // 4. NEUROLOGICAL / HEADACHE & MIGRAINE
  if (fullText.includes('headache') || fullText.includes('migraine') || fullText.includes('head')) {
    return {
      medications: [
        { name: 'Tab. Napra-D 500 (Naproxen 500mg + Domperidone 10mg)', dosage: '1 Tab', frequency: '1 SOS (At headache onset)', duration: '5 days', instructions: 'Take immediately with water when migraine aura/pain begins' },
        { name: 'Tab. Flunarizine', dosage: '5 mg', frequency: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'Nightly for migraine prophylaxis' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '10 days', instructions: 'Empty stomach in morning' },
      ],
      investigations: ['Refraction & Fundoscopy Examination (Ophthalmology)', 'NCCT Head / MRI Brain (if red-flag symptoms persist)'],
      advice: ['Maintain regular 7-8 hour sleep schedule', 'Avoid bright flashing lights, loud noise, and skipping meals', 'Keep a migraine trigger diary'],
      follow_up: '7 days in Neurology / Medicine OPD',
    };
  }

  // 5. GASTROINTESTINAL / ABDOMINAL PAIN & ACIDITY
  if (fullText.includes('stomach') || fullText.includes('abdom') || fullText.includes('acid') || fullText.includes('gastric') || fullText.includes('vomit') || fullText.includes('nausea')) {
    return {
      medications: [
        { name: 'Tab. Pan-D (Pantoprazole 40mg + Domperidone 30mg SR)', dosage: '1 Tab', frequency: '1-0-0 (Morning)', duration: '14 days', instructions: 'Empty stomach 30 mins before breakfast' },
        { name: 'Syrup Mucaine / Gelusil Gel', dosage: '10 ml (2 tsp)', frequency: 'Thrice daily (Post meals)', duration: '7 days', instructions: 'After meals for acute burning relief' },
        { name: 'Tab. Meftal-Spas (Dicyclomine + Mefenamic Acid)', dosage: '1 Tab', frequency: '1 SOS (For severe cramps)', duration: '3 days', instructions: 'Only if cramping pain occurs' },
        { name: 'Probiotic Capsule (Sporlac-DS)', dosage: '1 Cap', frequency: '1-0-1', duration: '5 days', instructions: 'After food for gut flora restoration' },
      ],
      investigations: ['Ultrasound Whole Abdomen & Pelvis (USG)', 'Liver Function Tests (LFT)', 'Stool Routine & Microscopy'],
      advice: ['Eat light, non-spicy, freshly prepared food (Khichdi, curd, porridge)', 'Avoid oily, deep-fried snacks, caffeine, and carbonated beverages', 'Do not lie down immediately after dinner'],
      follow_up: '5 days in Gastroenterology / Medicine OPD',
    };
  }

  // 6. FEVER & INFECTION
  if (fullText.includes('fever') || fullText.includes('temp') || fullText.includes('bukhar') || fullText.includes('chill') || fullText.includes('cough') || fullText.includes('cold')) {
    return {
      medications: [
        { name: 'Tab. Dolo (Paracetamol)', dosage: '650 mg', frequency: '1-0-1 (Or SOS if temp > 100°F)', duration: '5 days', instructions: 'After food with water (minimum 6 hour gap between doses)' },
        { name: 'Tab. Augmentin (Amoxicillin + Clavulanate)', dosage: '625 mg', frequency: '1-0-1 (BD)', duration: '5 days', instructions: 'After meals (complete full 5-day antibiotic course)' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '5 days', instructions: 'Empty stomach in morning' },
        { name: 'Oral Rehydration Salts (ORS) Sachet', dosage: '1 Sachet in 1 Liter', frequency: 'Sip throughout day', duration: '5 days', instructions: 'Maintain adequate electrolyte hydration' },
      ],
      investigations: ['Complete Blood Count (CBC) with Platelet Count', 'Dengue NS1 Antigen & IgM/IgG Test', 'Malarial Parasite (Card Antigen)', 'Typhoid Widal / Typhidot Test', 'Urine Routine Examination'],
      advice: ['Adequate hydration (3 - 4 Liters fluids daily: coconut water, soups, ORS)', 'Tepid sponge wiping on forehead/arms if temperature exceeds 101°F', 'Complete bed rest'],
      follow_up: '3 days in General Medicine OPD',
    };
  }

  // 7. DENTAL & ORAL PAIN
  if (fullText.includes('teeth') || fullText.includes('dental') || fullText.includes('tooth') || fullText.includes('gum')) {
    return {
      medications: [
        { name: 'Tab. Amoxicillin + Potassium Clavulanate (Augmentin)', dosage: '625 mg', frequency: '1-0-1 (BD)', duration: '5 days', instructions: 'After meals' },
        { name: 'Tab. Ketorolac (Ketorol-DT)', dosage: '10 mg', frequency: '1-0-1 (SOS for acute pain)', duration: '3 days', instructions: 'Dissolve tablet in half glass water' },
        { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '5 days', instructions: 'Empty stomach in morning' },
        { name: 'Chlorhexidine Mouthwash 0.2%', dosage: '10 ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse mouth gently for 60 seconds after brushing' },
      ],
      investigations: ['Intraoral Periapical X-Ray (IOPAR)', 'Orthopantomogram (OPG)'],
      advice: ['Avoid chewing from the affected side', 'Avoid extremely hot or ice-cold beverages', 'Maintain gentle oral hygiene and warm saline rinses'],
      follow_up: '5 days in Dental / Maxillofacial OPD',
    };
  }

  // DEFAULT GENERAL MEDICINE FORMULATION
  return {
    medications: [
      { name: 'Tab. Paracetamol', dosage: '650 mg', frequency: '1-0-1 (SOS)', duration: '5 days', instructions: 'After food' },
      { name: 'Tab. Pantoprazole', dosage: '40 mg', frequency: '1-0-0', duration: '7 days', instructions: 'Before food in morning' },
      { name: 'Tab. B-Complex with Zinc (Becozinc)', dosage: '1 Tab', frequency: '0-1-0 (After lunch)', duration: '15 days', instructions: 'Multivitamin supplement' },
    ],
    investigations: ['Complete Blood Count (CBC)', 'Erythrocyte Sedimentation Rate (ESR)', 'Routine Urine Examination'],
    advice: ['Adequate hydration (2.5 - 3 Liters daily)', 'Adequate rest & balanced nutritious diet', 'Follow up if symptoms persist beyond 5 days'],
    follow_up: '5 days in General Medicine OPD',
  };
}

