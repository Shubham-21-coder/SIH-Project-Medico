/**
 * Clinical NLP & Domain-Specific Diagnostic Reasoning Engine for MediKiosk
 * Provides deep clinical branching for Hair/Scalp, Skin, Cardiac, Fever, Dental, and GI complaints
 * with zero robotic repetition and authentic medical logic.
 */

import { getLocalizedItem } from './indicLanguages.js';

export interface ExtractedClinicalSlots {

  symptoms: string[];
  locations: string[];
  qualifiers: string[];
  temporal: string[];
  triggers: string[];
  medications: string[];
  allergies: string[];
  severity: string | null;
  rawInput: string;
}

export interface PatientClinicalProfile {
  primaryComplaint: string;
  allSymptoms: string[];
  locations: string[];
  qualifiers: string[];
  durations: string[];
  triggers: string[];
  medicationsReported: string[];
  allergiesReported: string[];
  severityScore: number | null;
  coveredDimensions: Set<string>;
  askedQuestions: string[];
  turnCount: number;
}

// Medical Dictionary & Lexicon for Clinical Entity Extraction
const SYMPTOM_PATTERNS: Array<{ regex: RegExp; label: string; dimension: string }> = [
  // Trichology / Hair & Scalp
  { regex: /\b(hair|hairfall|hair fall|thinning|bald|baldness|alopecia|shedding|receding|scalp|dandruff|flaking)\b/i, label: 'Hair & Scalp Condition', dimension: 'hair' },
  // Dermatology / Skin
  { regex: /\b(skin|rash|itch|itching|khujli|pimple|acne|spots|boil|allergy|blister|eczema|psoriasis|fungal)\b/i, label: 'Skin Condition', dimension: 'dermatology' },
  // Dental / Oral
  { regex: /(tooth|teeth|toothache|daant|molar|gum|gums|masude|jaw|mouth|tongue|root canal|cavity|दांत|दाँत|मसूड़े|दाढ़|दात|పంటి|దంత|দাঁত|ಹಲ್ಲು)/i, label: 'Tooth / Dental Pain', dimension: 'dental' },
  // Cardiovascular / Thoracic
  { regex: /(chest|heart|cardiac|seene|palpitation|angina|anginal|tightness|heaviness in chest|सीने में दर्द|छाती|ఛాతీ|বুকের ব্যথা)/i, label: 'Chest Discomfort', dimension: 'cardiac' },
  // Neurological / Head
  { regex: /(headache|migraine|sar dard|sir dard|head ache|throbbing head|dizziness|giddiness|vertigo|सिरदर्द|सिर दर्द|डोकेदुखी|తలనొప్పి|মাথা ব্যথা|માથાનો દુખાવો)/i, label: 'Headache / Neurological', dimension: 'neurological' },
  // Infection / Thermoregulation
  { regex: /(fever|temperature|bukhar|tap|chills|shivering|sweats|rigors|pyrexia|बुखार|ताप|ज्वर|జ్వరం|জ্বর|તાવ)/i, label: 'Fever / Infection', dimension: 'fever' },

  // Gastrointestinal / Abdomen
  { regex: /\b(stomach|abdomen|abdominal|pet|tummy|belly|acidity|gas|vomit|vomiting|nausea|loose motion|diarrhea|constipation|cramps|indigestion)\b/i, label: 'Abdominal / GI Distress', dimension: 'gi' },
  // Respiratory
  { regex: /\b(cough|khansi|cold|jukam|throat|gala|sore throat|breath|breathing|shortness of breath|dyspnea|wheezing|phlegm|sputum)\b/i, label: 'Respiratory / Cough', dimension: 'respiratory' },
  // Musculoskeletal / Joint
  { regex: /\b(joint|joints|knee|back|backache|spine|neck|shoulder|body ache|muscle pain|gathiya)\b/i, label: 'Musculoskeletal / Joint Pain', dimension: 'musculoskeletal' },
];

const LOCATION_PATTERNS: Array<{ regex: RegExp; location: string }> = [
  { regex: /\b(hair|scalp|scalp hair|crown|temples|hairline)\b/i, location: 'scalp and hair' },
  { regex: /\b(face|forehead|cheeks|chin|nose)\b/i, location: 'face' },
  { regex: /\b(upper front|front teeth|front tooth|incisor)\b/i, location: 'upper front teeth' },
  { regex: /\b(lower front|bottom teeth|bottom tooth)\b/i, location: 'lower front teeth' },
  { regex: /\b(molar|wisdom|back tooth|back teeth|right molar|left molar|daadh)\b/i, location: 'back molars' },
  { regex: /\b(gum|gums|masude)\b/i, location: 'gums' },
  { regex: /\b(left side of chest|left chest|center of chest|middle of chest|substernal)\b/i, location: 'central / left chest' },
  { regex: /\b(forehead|temple|temples|one side of head|back of head|occipital)\b/i, location: 'forehead / temples' },
  { regex: /\b(upper abdomen|epigastric|lower abdomen|right side of stomach|pelvic)\b/i, location: 'upper / central abdomen' },
  { regex: /\b(arms|legs|hands|feet|whole body|back)\b/i, location: 'body / limbs' },
];

const QUALIFIER_PATTERNS: Array<{ regex: RegExp; qualifier: string }> = [
  { regex: /\b(severe|unbearable|very bad|extreme|bahut jyada|intense|acute)\b/i, qualifier: 'severe' },
  { regex: /\b(mild|slight|little|thoda|manageable)\b/i, qualifier: 'mild' },
  { regex: /\b(moderate|medium|average)\b/i, qualifier: 'moderate' },
  { regex: /\b(sharp|stabbing|piercing|suji jaisa)\b/i, qualifier: 'sharp' },
  { regex: /\b(throbbing|pounding|pulsing|dhadakne jaisa)\b/i, qualifier: 'throbbing' },
  { regex: /\b(burning|jalan|acidic)\b/i, qualifier: 'burning' },
  { regex: /\b(crushing|heavy|heaviness|pressure|weight)\b/i, qualifier: 'crushing / heaviness' },
  { regex: /\b(dull|aching|constant ache)\b/i, qualifier: 'dull aching' },
  { regex: /\b(shedding|thinning|patchy|flaking|dandruff)\b/i, qualifier: 'shedding / thinning' },
  { regex: /\b(comes and goes|intermittent|aata jata)\b/i, qualifier: 'intermittent' },
  { regex: /\b(constant|continuous|hamesha|nonstop)\b/i, qualifier: 'constant' },
];

const TEMPORAL_PATTERNS: Array<{ regex: RegExp; duration: string }> = [
  { regex: /\b(\d+\s*(?:day|days|din))\b/i, duration: 'few days' },
  { regex: /\b(\d+\s*(?:hour|hours|ghante))\b/i, duration: 'few hours' },
  { regex: /\b(\d+\s*(?:week|weeks|hafte))\b/i, duration: 'few weeks' },
  { regex: /\b(\d+\s*(?:month|months|mahine))\b/i, duration: 'few months' },
  { regex: /\b(today|aaj|since morning|subah se)\b/i, duration: 'today / since morning' },
  { regex: /\b(yesterday|kal se|last night)\b/i, duration: 'since yesterday' },
  { regex: /\b(sudden|suddenly|achanak|all of a sudden)\b/i, duration: 'sudden onset' },
];

export function extractClinicalEntities(text: string): ExtractedClinicalSlots {
  const clean = text || '';
  const symptoms: string[] = [];
  const locations: string[] = [];
  const qualifiers: string[] = [];
  const temporal: string[] = [];
  const triggers: string[] = [];
  const medications: string[] = [];
  const allergies: string[] = [];
  let severity: string | null = null;

  for (const s of SYMPTOM_PATTERNS) {
    if (s.regex.test(clean)) {
      symptoms.push(s.label);
    }
  }

  for (const l of LOCATION_PATTERNS) {
    if (l.regex.test(clean)) {
      locations.push(l.location);
    }
  }

  for (const q of QUALIFIER_PATTERNS) {
    if (q.regex.test(clean)) {
      qualifiers.push(q.qualifier);
      if (q.qualifier === 'severe' || q.qualifier === 'mild' || q.qualifier === 'moderate') {
        severity = q.qualifier;
      }
    }
  }

  for (const t of TEMPORAL_PATTERNS) {
    if (t.regex.test(clean)) {
      temporal.push(t.duration);
    }
  }

  if (/\b(sun|sun exposure|stress|soap|oil|cosmetic|shampoo|eating|food|cold water|hot|walking|exercise|product)\b/i.test(clean)) {
    triggers.push(clean);
  }

  if (/\b(paracetamol|dolo|combiflam|aspirin|crocin|antacid|gelusil|pantocid|pan-d|antibiotic|brufen|ibuprofen|medicine|tablet|minoxidil|biotin|ketoconazole|serum)\b/i.test(clean)) {
    medications.push(clean);
  }

  if (/\b(penicillin|sulfa|dust|pollen|no allergy|none|no known allergies|allergic)\b/i.test(clean)) {
    allergies.push(clean);
  }

  return {
    symptoms,
    locations,
    qualifiers,
    temporal,
    triggers,
    medications,
    allergies,
    severity,
    rawInput: clean,
  };
}

export function buildClinicalProfile(
  chiefComplaint: string,
  history: Array<{ q?: string; a?: string }>
): PatientClinicalProfile {
  const profile: PatientClinicalProfile = {
    primaryComplaint: chiefComplaint || 'General Symptoms',
    allSymptoms: [],
    locations: [],
    qualifiers: [],
    durations: [],
    triggers: [],
    medicationsReported: [],
    allergiesReported: [],
    severityScore: null,
    coveredDimensions: new Set<string>(),
    askedQuestions: [],
    turnCount: history.length,
  };

  for (const turn of history) {
    const qText = (turn.q || '').toLowerCase();
    profile.askedQuestions.push(qText);

    // Dimension tracking
    if (/where|location|which part|tooth|teeth|area|scalp|face|body|arm|leg|chest|abdomen|mouth|affected/i.test(qText)) {
      profile.coveredDimensions.add('site');
    }
    if (/when|start|how long|duration|days|hours|week|month|began/i.test(qText)) {
      profile.coveredDimensions.add('onset');
    }
    if (/feel|describe|character|type of|throbbing|sharp|burning|crushing|pressure|dull|band|sensitiv|shedding|thinning|patchy/i.test(qText)) {
      profile.coveredDimensions.add('character');
    }
    if (/spread|radiat|arm|jaw|back|neck|shoulder/i.test(qText)) {
      profile.coveredDimensions.add('radiation');
    }
    if (/swelling|pus|fever|breath|nausea|sweating|itch|itching|bleeding|dandruff|flaking|scales|acne|associated|other symptom/i.test(qText)) {
      profile.coveredDimensions.add('associations');
    }
    if (/better|worse|trigger|eating|cold|hot|movement|soap|oil|cosmetic|sun exposure|stress|shampoo|product|walking|exertion|meals/i.test(qText)) {
      profile.coveredDimensions.add('exacerbating');
    }
    if (/scale|severity|1 to 10|how bad|rate/i.test(qText)) {
      profile.coveredDimensions.add('severity');
    }
    if (/past|condition|diabetes|bp|hypertension|thyroid|pcos|surgery|chronic|history|family/i.test(qText)) {
      profile.coveredDimensions.add('past_history');
    }
    if (/taking|medicine|medication|tablet|took|treatment|cream|shampoo|serum|minoxidil|biotin|antacid|painkiller|kadha/i.test(qText)) {
      profile.coveredDimensions.add('medications');
    }
    // Mark covered dimensions from answer text as well (Smart Volunteer Slot-Filling)
    const aText = (turn.a || '').toLowerCase();
    if (/hair|scalp|face|arm|leg|chest|abdomen|mouth|molar|tooth|teeth/i.test(aText)) {
      profile.coveredDimensions.add('site');
    }
    if (/shedding|thinning|bald|hairline|crushing|sharp|burning|throbbing|cramping/i.test(aText)) {
      profile.coveredDimensions.add('character');
    }
    if (/shampoo|product|oil|stress|sun|chemical|eating|food|walking/i.test(aText)) {
      profile.coveredDimensions.add('exacerbating');
    }
    if (/dandruff|flaking|itching|redness|swelling|fever|cough|chills|nausea|sweat/i.test(aText)) {
      profile.coveredDimensions.add('associations');
    }
    if (/minoxidil|biotin|serum|cream|shampoo|paracetamol|dolo|combiflam|kadha|medicine|tablet|treatment|antacid/i.test(aText)) {
      profile.coveredDimensions.add('medications');
    }
    if (/family|thyroid|pcos|diabetes|hypertension|bp|chronic/i.test(aText)) {
      profile.coveredDimensions.add('past_history');
    }
    if (/penicillin|sulfa|nkda|no known|allergic/i.test(aText)) {
      profile.coveredDimensions.add('allergies');
    }

    const entities = extractClinicalEntities(turn.a || '');

    profile.allSymptoms.push(...entities.symptoms);
    profile.locations.push(...entities.locations);
    profile.qualifiers.push(...entities.qualifiers);
    profile.durations.push(...entities.temporal);
    profile.triggers.push(...entities.triggers);
    profile.medicationsReported.push(...entities.medications);
    profile.allergiesReported.push(...entities.allergies);

    const numMatch = (turn.a || '').match(/\b([1-9]|10)\b/);
    if (numMatch) {
      profile.severityScore = parseInt(numMatch[1], 10);
    }
  }

  profile.allSymptoms = Array.from(new Set(profile.allSymptoms));
  profile.locations = Array.from(new Set(profile.locations));
  profile.qualifiers = Array.from(new Set(profile.qualifiers));
  profile.durations = Array.from(new Set(profile.durations));
  profile.triggers = Array.from(new Set(profile.triggers));

  return profile;
}

export function getInitialQuestionForComplaint(
  chiefComplaint: string,
  language: string = 'en'
): {
  next_question: string;
  suggested_replies: string[];
  red_flag: boolean;
  red_flag_reason: string | null;
  interview_complete: boolean;
} {
  const c = (chiefComplaint || '').toLowerCase().trim();

  if (!c || c === 'general' || c === 'unknown' || c.includes('general') || c.includes('mixed') || c.includes('consultation')) {
    const loc = getLocalizedItem('general_greeting', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('chest') || c.includes('heart') || c.includes('cardiac')) {
    const loc = getLocalizedItem('cardiac_character', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('fever') || c.includes('infection') || c.includes('temp') || c.includes('bukhar') || c.includes('జ్వరం')) {
    const loc = getLocalizedItem('fever_onset', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('skin') || c.includes('hair') || c.includes('rash') || c.includes('derma') || c.includes('జుట్టు') || c.includes('చర్మం')) {
    const loc = getLocalizedItem('hair_site', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('stomach') || c.includes('abdo') || c.includes('pet') || c.includes('gas') || c.includes('acidity') || c.includes('पोट') || c.includes('కడుపు')) {
    const loc = getLocalizedItem('gi_associations', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('dental') || c.includes('tooth') || c.includes('teeth') || c.includes('gum') || c.includes('molar') || c.includes('jaw') || c.includes('दांत') || c.includes('दाँत') || c.includes('मसूड़े') || c.includes('दाढ़') || c.includes('दात') || c.includes('పంటి') || c.includes('দাঁত') || c.includes('ಹಲ್ಲು')) {
    const loc = getLocalizedItem('dental_character', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('head') || c.includes('migraine') || c.includes('सिरदर्द') || c.includes('सिर दर्द') || c.includes('डोकेदुखी') || c.includes('తలనొప్పి') || c.includes('মাথা ব্যথা') || c.includes('માથાનો દુખાવો')) {
    const loc = getLocalizedItem('headache_character', language);
    return {
      next_question: loc.q,
      suggested_replies: loc.replies,
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }


  const loc = getLocalizedItem('general_greeting', language);
  return {
    next_question: loc.q,
    suggested_replies: loc.replies,
    red_flag: false,
    red_flag_reason: null,
    interview_complete: false,
  };
}



/**
 * Intelligent Dynamic Clinical Follow-up Generator with Domain-Specific Medical Logic
 */
export function generateAdaptiveFollowUp(
  profile: PatientClinicalProfile,
  lastAnswer: string,
  language: string = 'en'
): {
  next_question: string;
  suggested_replies: string[];
  red_flag: boolean;
  red_flag_reason: string | null;
  interview_complete: boolean;
} {
  const isHindi = language === 'hi';
  const fullTextSoFar = profile.allSymptoms.join(' ') + ' ' + profile.primaryComplaint + ' ' + profile.askedQuestions.join(' ') + ' ' + lastAnswer;
  const primaryComp = (profile.primaryComplaint || '').toLowerCase();
  
  // 1. Precise Medical Domain Classification (Prioritize primary complaint)
  let domain = 'general';
  if (/hair|scalp|bald|alopecia|shedding|thinning|dandruff|జుట్టు|बाल|केस|চুল/i.test(primaryComp)) {
    domain = 'hair';
  } else if (/skin|rash|itch|pimple|acne|spots|allergy|eczema|खुजली|चर्म|चामडी|ಚರ್ಮ|derma/i.test(primaryComp)) {
    domain = 'dermatology';
  } else if (/tooth|teeth|dental|gum|molar|jaw|दांत|दाँत|मसूड़े|दाढ़|दात|పంటి|দাঁত|ಹಲ್ಲು/i.test(primaryComp)) {
    domain = 'dental';
  } else if (/chest|heart|cardiac|angina|सीने में दर्द|छातीत दुखणे|ఛాతీ నొప్పి|বুকের ব্যথা/i.test(primaryComp)) {
    domain = 'cardiac';
  } else if (/headache|migraine|head|सिरदर्द|सिर दर्द|डोकेदुखी|తలనొప్పి|মাথা ব্যথা|માથાનો દુખાવો/i.test(primaryComp)) {
    domain = 'neurological';
  } else if (/fever|bukhar|temperature|chills|बुखार|ताप|జ్వరం|জ্বর|તાવ/i.test(primaryComp)) {
    domain = 'fever';
  } else if (/stomach|abdomen|pet|acidity|vomit|gas|पेट|पोट|కడుపు|পেট|પેટ/i.test(primaryComp)) {
    domain = 'gi';
  } else {
    // If general greeting, classify from history
    if (/hair|scalp|bald|alopecia|shedding|thinning|dandruff|జుట్టు|बाल|केस|চুল/i.test(fullTextSoFar)) domain = 'hair';
    else if (/skin|rash|itch|pimple|acne|spots|allergy|eczema|खुजली|चर्म|चामडी|ಚರ್ಮ|derma/i.test(fullTextSoFar)) domain = 'dermatology';
    else if (/tooth|teeth|dental|gum|molar|jaw|दांत|दाँत|मसूड़े|दाढ़|दात|పంటి|দাঁত|ಹಲ್ಲು/i.test(fullTextSoFar)) domain = 'dental';
    else if (/chest|heart|cardiac|angina|सीने में दर्द|छातीत दुखणे|ఛాతీ నొప్పి|বুকের ব্যথা/i.test(fullTextSoFar)) domain = 'cardiac';
    else if (/headache|migraine|head|सिरदर्द|सिर दर्द|डोकेदुखी|తలనొప్పి|মাথা ব্যথা|માથાનો દુખાવો/i.test(fullTextSoFar)) domain = 'neurological';
    else if (/fever|bukhar|temperature|chills|बुखार|ताप|జ్వరం|জ্বর|તાવ/i.test(fullTextSoFar)) domain = 'fever';
    else if (/stomach|abdomen|pet|acidity|vomit|gas|पेट|पोट|కడుపు|পেট|પેટ/i.test(fullTextSoFar)) domain = 'gi';
  }

  // 2. Emergency Red Flag Detection
  if (domain === 'cardiac') {
    if (/crush|heavy|radiat|left arm|jaw|sweat|breath|choking/i.test(lastAnswer) || (/chest/i.test(fullTextSoFar) && /left arm|shortness of breath/i.test(lastAnswer))) {
      return {
        next_question: isHindi
          ? '🚨 आपातकालीन चेतावनी: सीने में भारी दबाव और बाएं हाथ में फैलता दर्द हृदय संबंधित आपातकाल हो सकता है। कृपया तुरंत ओपीडी ट्राइएज डेस्क को सूचित करें।'
          : '🚨 EMERGENCY ALERT: Crushing chest discomfort with radiation / shortness of breath requires immediate cardiac evaluation. Please notify the OPD triage desk immediately.',
        suggested_replies: isHindi ? ['आपातकालीन डेस्क को बुलाएं', 'डॉक्टर को तुरंत बताएं'] : ['Call Emergency Desk', 'Notify Doctor Now'],
        red_flag: true,
        red_flag_reason: 'Acute Coronary Syndrome / Myocardial Infarction indicators detected.',
        interview_complete: true,
      };
    }
  } else if (domain === 'neurological') {
    if (/thunderclap|worst ever|sudden|projectile vomit|neck stiff/i.test(lastAnswer)) {
      return {
        next_question: isHindi
          ? '🚨 आपातकालीन चेतावनी: अचानक बिजली के झटके जैसा तेज सिरदर्द तुरंत सीटी स्कैन मूल्यांकन की मांग करता है।'
          : '🚨 URGENT MEDICAL ALERT: A sudden thunderclap severe headache requires urgent non-contrast CT evaluation.',
        suggested_replies: isHindi ? ['आपातकालीन ट्राइएज को अलर्ट करें'] : ['Alert Emergency Triage'],
        red_flag: true,
        red_flag_reason: 'Thunderclap headache suspicious for Subarachnoid Hemorrhage.',
        interview_complete: true,
      };
    }
  }

  // 3. Guaranteed Disease-Specific Clinical Question Sequence Plan
  const DOMAIN_QUESTION_PLAN: Record<string, string[]> = {
    cardiac: ['cardiac_radiation', 'cardiac_exertion', 'cardiac_past_history', 'universal_allergies'],
    fever: ['fever_associations', 'fever_medications', 'universal_chronic', 'universal_allergies'],
    gi: ['gi_medications', 'universal_chronic', 'universal_allergies'],
    hair: ['hair_character', 'hair_trigger', 'hair_dandruff', 'hair_medications', 'universal_chronic', 'universal_allergies'],
    dermatology: ['hair_dandruff', 'hair_trigger', 'hair_medications', 'universal_chronic', 'universal_allergies'],
    dental: ['dental_character', 'dental_trigger', 'universal_chronic', 'universal_allergies'],
    neurological: ['headache_character', 'universal_chronic', 'universal_allergies'],
    general: ['fever_onset', 'fever_associations', 'universal_chronic', 'universal_allergies'],
  };




  const plan = DOMAIN_QUESTION_PLAN[domain] || DOMAIN_QUESTION_PLAN.general;
  const planIndex = Math.max(0, profile.turnCount - 1);

  if (planIndex >= plan.length || profile.turnCount >= 5) {
    const loc = getLocalizedItem('intake_completion', language);
    return {
      next_question: loc.q,
      suggested_replies: [],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: true,
    };
  }

  const nextQuestionKey = plan[planIndex];
  const loc = getLocalizedItem(nextQuestionKey, language);

  return {
    next_question: loc.q,
    suggested_replies: loc.replies,
    red_flag: false,
    red_flag_reason: null,
    interview_complete: false,
  };
}




/**
 * Synthesizes a structured, highly readable, physician-ready Clinical EMR Note (HPI / ROS / PMH)
 * Converts raw interview Q&A into standard hospital EMR bulleted findings.
 */
export function synthesizeClinicalHpi(
  chiefComplaint: string,
  history: Array<{ q?: string; a?: string }>,
  patientInfo?: any
): {
  chief_complaint: string;
  hpi: string;
  review_of_systems: string;
  medications_allergies: string;
  family_history: string;
} {
  const profile = buildClinicalProfile(chiefComplaint, history);

  // Extract key clinical descriptors
  const location = profile.locations.length > 0 ? profile.locations.join(', ') : 'Not localized';
  const duration = profile.durations.length > 0 ? profile.durations.join(', ') : 'Acute presentation';
  let triggers = profile.triggers.length > 0 ? profile.triggers.join(', ') : 'No specific trigger reported';
  const severityStr = profile.severityScore ? `${profile.severityScore}/10 (${profile.severityScore >= 7 ? 'Severe' : profile.severityScore >= 4 ? 'Moderate' : 'Mild'})` : 'Moderate discomfort';


  // Specific answers extraction
  let characterDesc = '';
  let associatedDesc = '';
  let priorTreatmentsDesc = '';
  let allergiesDesc = 'No known drug allergies reported (NKDA).';
  let pastHistDesc = 'No major chronic illnesses reported.';

  for (const turn of history) {
    const q = (turn.q || '').toLowerCase();
    const a = turn.a || '';

    if (/where|location|which part/i.test(q)) {
      // already in location
    } else if (/look like|morphology|character|type of|feel|describe|thinning|shedding/i.test(q)) {
      characterDesc = a;
    } else if (/itching|burning|swelling|pus|fever|cough|chills|dandruff|flaking|scales|associated/i.test(q)) {
      associatedDesc = a;
    } else if (/applied|steroid|ointment|antifungal|creams|anti-allergy|tablet|cetirizine|paracetamol|dolo|minoxidil|serum|remedies|aloe|kadha/i.test(q)) {
      priorTreatmentsDesc = a;
    } else if (/start after|soap|cosmetic|sun|sweat|stress|product|trigger|eating/i.test(q)) {
      triggers = a;
    } else if (/allerg/i.test(q)) {
      allergiesDesc = a.toLowerCase().includes('no') || a.toLowerCase().includes('nkda') || a.toLowerCase().includes('not sure') ? 'No known drug allergies (NKDA)' : a;
    } else if (/family|thyroid|pcos|diabetes|hypertension|bp|chronic|past/i.test(q)) {
      pastHistDesc = a;
    }
  }


  // Determine medical domain for concise chief complaint
  let primaryLabel = chiefComplaint || 'General OPD Symptoms';
  if (profile.allSymptoms.length > 0) {
    primaryLabel = profile.allSymptoms.slice(0, 2).join(' & ');
  }

  const patientHeader = patientInfo
    ? `${patientInfo.name || 'Patient'} (${patientInfo.age || '30'}y / ${patientInfo.gender || 'Male'})`
    : 'Patient';

  // Build clean, high-yield structured HPI Note
  const hpiBullets: string[] = [
    `• Primary Complaint: ${primaryLabel}`,
    `• Anatomical Site & Location: ${location}`,
    `• Duration & Onset: ${duration}`,
    `• Character & Morphology: ${characterDesc || 'Reported as distressing symptoms'}`,
    `• Associated Symptoms: ${associatedDesc || 'No overt systemic red flags'}`,
    `• Triggers & Provoking Factors: ${triggers}`,
    `• Severity Level: ${severityStr}`,
    `• Prior Interventions / Self-Medication: ${priorTreatmentsDesc || 'None reported at intake'}`,
  ];

  const rosBullets: string[] = [
    `• Dermatology / Integumentary: ${location.includes('scalp') || location.includes('face') || location.includes('body') ? 'Active skin/hair involvement as described' : 'Negative'}`,
    `• Cardiovascular: ${location.includes('chest') ? 'Chest discomfort elicited' : 'No chest pain, palpitations, or orthopnea'}`,
    `• Respiratory: ${associatedDesc.toLowerCase().includes('cough') || associatedDesc.toLowerCase().includes('breath') ? 'Cough / dyspnea reported' : 'No acute respiratory distress or hemoptysis'}`,
    `• Gastrointestinal: ${location.includes('abdomen') || associatedDesc.toLowerCase().includes('nausea') ? 'GI symptoms noted' : 'No active vomiting, hematemesis, or melena'}`,
    `• Systemic: No high-grade fever, unexplained weight loss, or syncope reported`,
  ];

  return {
    chief_complaint: `${patientHeader} presents with ${primaryLabel} (${duration}).`,
    hpi: hpiBullets.join('\n'),
    review_of_systems: rosBullets.join('\n'),
    medications_allergies: `Active Regimen & Allergies:\n• Prior Medications / OTC: ${priorTreatmentsDesc || 'None reported'}\n• Known Drug Allergies: ${allergiesDesc}`,
    family_history: `Family & Medical History:\n• Chronic Medical History: ${pastHistDesc}\n• Hereditary / Familial Conditions: Non-contributory`,
  };
}

