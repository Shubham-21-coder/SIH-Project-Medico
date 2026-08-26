/**
 * Clinical NLP & Domain-Specific Diagnostic Reasoning Engine for MediKiosk
 * Provides deep clinical branching for Hair/Scalp, Skin, Cardiac, Fever, Dental, and GI complaints
 * with zero robotic repetition and authentic medical logic.
 */

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
  { regex: /\b(tooth|teeth|toothache|daant|molar|gum|gums|masude|jaw|mouth|tongue|root canal|cavity)\b/i, label: 'Tooth / Dental Pain', dimension: 'dental' },
  // Cardiovascular / Thoracic
  { regex: /\b(chest|heart|cardiac|seene|palpitation|angina|anginal|tightness|heaviness in chest)\b/i, label: 'Chest Discomfort', dimension: 'cardiac' },
  // Neurological / Head
  { regex: /\b(headache|migraine|sar dard|sir dard|head ache|throbbing head|dizziness|giddiness|vertigo)\b/i, label: 'Headache / Neurological', dimension: 'neurological' },
  // Infection / Thermoregulation
  { regex: /\b(fever|temperature|bukhar|tap|chills|shivering|sweats|rigors|pyrexia)\b/i, label: 'Fever / Infection', dimension: 'fever' },
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

export function getInitialQuestionForComplaint(chiefComplaint: string): {
  next_question: string;
  suggested_replies: string[];
  red_flag: boolean;
  red_flag_reason: string | null;
  interview_complete: boolean;
} {
  const c = (chiefComplaint || '').toLowerCase().trim();

  if (!c || c === 'general' || c === 'unknown' || c.includes('general') || c.includes('mixed') || c.includes('consultation')) {
    return {
      next_question: 'Hello! What health issue or symptoms are you experiencing today?',
      suggested_replies: ['Chest pain', 'Fever', 'Headache', 'Stomach pain', 'Cough / Cold', 'Skin problem', 'Teeth pain', 'Other'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('chest') || c.includes('heart') || c.includes('cardiac')) {
    return {
      next_question: 'Where exactly in your chest do you feel the pain, and is it a crushing pressure, sharp, or burning sensation?',
      suggested_replies: ['Center of chest (Crushing pressure)', 'Left side radiating to arm', 'Burning / acidity sensation', 'Sharp stabbing pain'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('head') || c.includes('migraine')) {
    return {
      next_question: 'Where is the headache located, and is it a throbbing pulse on one side or a tight band around your head?',
      suggested_replies: ['One side throbbing (Migraine)', 'Forehead & sinus pressure', 'Tight band around head', 'Back of head and neck'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('fever') || c.includes('infection') || c.includes('temp')) {
    return {
      next_question: 'When did your fever start, and how high has your body temperature been?',
      suggested_replies: ['Started today (99-100°F)', 'Since 2-3 days (101-103°F)', 'High fever with chills/shivering', 'More than a week'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('dental') || c.includes('tooth') || c.includes('teeth') || c.includes('gum')) {
    return {
      next_question: 'Which specific tooth or area of your mouth is hurting (e.g., back molars, front teeth, or gums)?',
      suggested_replies: ['Back molars (wisdom area)', 'Upper front teeth', 'Lower jaw / teeth', 'Gums / Bleeding area'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('skin') || c.includes('hair') || c.includes('rash') || c.includes('derma')) {
    return {
      next_question: 'Which part of your body is affected — is it hair/scalp, facial skin, or a rash on your body?',
      suggested_replies: ['Hair / Scalp issue', 'Face (Acne / spots)', 'Arms / Legs rash', 'All over body itching'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (c.includes('abdo') || c.includes('stomach') || c.includes('gastric') || c.includes('gi')) {
    return {
      next_question: 'Where in your abdomen is the discomfort, and is it related to meals (acidity burning, cramping, or nausea)?',
      suggested_replies: ['Upper stomach / Acidity burning', 'Lower abdomen cramps', 'Nausea / vomiting with pain', 'General bloated feeling'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  return {
    next_question: 'Hello! What health issue or symptoms are you experiencing today?',
    suggested_replies: ['Chest pain', 'Fever', 'Headache', 'Stomach pain', 'Cough / Cold', 'Skin problem', 'Teeth pain', 'Other'],
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
  lastAnswer: string
): {
  next_question: string;
  suggested_replies: string[];
  red_flag: boolean;
  red_flag_reason: string | null;
  interview_complete: boolean;
} {
  const fullTextSoFar = profile.allSymptoms.join(' ') + ' ' + profile.primaryComplaint + ' ' + profile.askedQuestions.join(' ') + ' ' + lastAnswer;
  const lastAnsLower = (lastAnswer || '').toLowerCase();

  // 1. Precise Medical Domain Classification
  let domain = 'general';
  if (/hair|scalp|bald|alopecia|shedding|thinning|dandruff/i.test(fullTextSoFar)) {
    domain = 'hair';
  } else if (/skin|rash|itch|pimple|acne|spots|allergy|eczema/i.test(fullTextSoFar) || /skin|derma/i.test(profile.primaryComplaint)) {
    domain = 'dermatology';
  } else if (/tooth|teeth|dental|gum|molar|jaw/i.test(fullTextSoFar) || /dental/i.test(profile.primaryComplaint)) {
    domain = 'dental';
  } else if (/chest|heart|cardiac|angina/i.test(fullTextSoFar) || /chest/i.test(profile.primaryComplaint)) {
    domain = 'cardiac';
  } else if (/headache|migraine|head/i.test(fullTextSoFar) || /headache/i.test(profile.primaryComplaint)) {
    domain = 'neurological';
  } else if (/fever|bukhar|temperature|chills/i.test(fullTextSoFar) || /fever/i.test(profile.primaryComplaint)) {
    domain = 'fever';
  } else if (/stomach|abdomen|pet|acidity|vomit|gas/i.test(fullTextSoFar) || /abdom/i.test(profile.primaryComplaint)) {
    domain = 'gi';
  }

  // 2. Varied, Natural Acknowledgment (NO repetitive phrases!)
  let ack = '';
  if (/product|shampoo|oil/i.test(lastAnsLower)) {
    ack = 'Noted that this began after using the product/shampoo.';
  } else if (/sun exposure/i.test(lastAnsLower)) {
    ack = 'Understood that sun exposure triggered this.';
  } else if (/severe|unbearable|bahut/i.test(lastAnsLower)) {
    ack = 'Noted the high severity of discomfort.';
  } else if (profile.turnCount % 2 === 1 && profile.turnCount > 1) {
    ack = 'Understood.';
  }

  const prefix = ack ? `${ack} ` : '';

  // 3. Emergency Red Flag Detection
  if (domain === 'cardiac') {
    if (/crush|heavy|radiat|left arm|jaw|sweat|breath|choking/i.test(lastAnswer) || (/chest/i.test(fullTextSoFar) && /left arm|shortness of breath/i.test(lastAnswer))) {
      return {
        next_question: '🚨 EMERGENCY ALERT: Crushing chest discomfort with radiation / shortness of breath requires immediate cardiac evaluation. Please notify the OPD triage desk immediately.',
        suggested_replies: ['Call Emergency Desk', 'Notify Doctor Now'],
        red_flag: true,
        red_flag_reason: 'Acute Coronary Syndrome / Myocardial Infarction indicators detected.',
        interview_complete: true,
      };
    }
  } else if (domain === 'neurological') {
    if (/thunderclap|worst ever|sudden|projectile vomit|neck stiff/i.test(lastAnswer)) {
      return {
        next_question: '🚨 URGENT MEDICAL ALERT: A sudden thunderclap severe headache requires urgent non-contrast CT evaluation.',
        suggested_replies: ['Alert Emergency Triage'],
        red_flag: true,
        red_flag_reason: 'Thunderclap headache suspicious for Subarachnoid Hemorrhage.',
        interview_complete: true,
      };
    }
  }

  // 4. Interview Completion Trigger (~5-6 focused turns)
  if (profile.turnCount >= 6 || (profile.coveredDimensions.has('past_history') && profile.coveredDimensions.has('medications') && profile.coveredDimensions.has('allergies'))) {
    return {
      next_question: `${prefix}Thank you. I have structured your comprehensive medical intake note. The physician will review these findings with you momentarily.`,
      suggested_replies: [],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: true,
    };
  }

  const alreadyAsked = (keyword: string) => {
    return profile.askedQuestions.some((q) => q.includes(keyword.toLowerCase()));
  };

  // ==========================================
  // DOMAIN 1: TRICHOLOGY / HAIR & SCALP
  // ==========================================
  if (domain === 'hair') {
    if (!profile.coveredDimensions.has('character') && !alreadyAsked('thinning') && !alreadyAsked('shedding')) {
      return {
        next_question: `${prefix}Are you noticing heavy hair shedding while washing/combing, or visible thinning / bald patches on your scalp?`,
        suggested_replies: ['Heavy shedding while washing/brushing', 'Gradual thinning on crown / parting', 'Circular bald patches (Alopecia)', 'Hairline receding at temples'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('exacerbating') && !alreadyAsked('shampoo') && !alreadyAsked('stress') && !alreadyAsked('product')) {
      return {
        next_question: `${prefix}Did this start after using a new shampoo, hair oil, or chemical treatment, or following major illness/stress?`,
        suggested_replies: ['After new product / shampoo', 'Triggered by stress / post-illness', 'Started gradually over months', 'Dietary change / deficiency'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('associations') && !alreadyAsked('dandruff') && !alreadyAsked('itching') && !alreadyAsked('flaking')) {
      return {
        next_question: `${prefix}Do you have visible dandruff, white flaking, redness, or severe scalp itching?`,
        suggested_replies: ['Severe itching & oily dandruff', 'Dry white flakes / scaling', 'Redness & tender scalp', 'No dandruff or itching'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('medications') && !alreadyAsked('minoxidil') && !alreadyAsked('serum') && !alreadyAsked('biotin')) {
      return {
        next_question: `${prefix}Have you tried any treatments like anti-dandruff shampoos (Ketoconazole), Minoxidil, hair serums, or Biotin supplements?`,
        suggested_replies: ['Anti-dandruff shampoo / oils', 'Took Biotin / multivitamins', 'Tried Minoxidil / serums', 'No treatments tried yet'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('past_history') && !alreadyAsked('family') && !alreadyAsked('thyroid') && !alreadyAsked('pcos')) {
      return {
        next_question: `${prefix}Is there a family history of early hair loss, or any known thyroid or PCOS/hormonal issues?`,
        suggested_replies: ['Family history of baldness', 'Thyroid disorder', 'PCOS / hormonal issue', 'No family history / normal'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('allergies') && !alreadyAsked('allergies')) {
      return {
        next_question: `${prefix}Do you have any known allergies to hair dyes, shampoos, or prescription medications?`,
        suggested_replies: ['No known allergies (NKDA)', 'Allergic to hair dye (PPD)', 'Allergic to specific drugs', 'Not sure'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // DOMAIN 2: DERMATOLOGY / SKIN RASH
  // ==========================================
  if (domain === 'dermatology') {
    if (!profile.coveredDimensions.has('site') && !alreadyAsked('where is the rash')) {
      return {
        next_question: `${prefix}Where is the rash located, and does it look like red patches, raised pimples, or dry scaling?`,
        suggested_replies: ['Face / forehead breakouts', 'Arms & legs red rash', 'Body patches / scaling', 'Localized itchy bump'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('associations') && !alreadyAsked('itching') && !alreadyAsked('burning')) {
      return {
        next_question: `${prefix}Is there intense itching, burning sensation, or oozing from the rash?`,
        suggested_replies: ['Severe itching (worse at night)', 'Burning sensation & heat', 'Dry scaling without itch', 'Mild manageable itch'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('exacerbating') && !alreadyAsked('soap') && !alreadyAsked('sun')) {
      return {
        next_question: `${prefix}Did this condition start after using any new soap, cosmetic, or after sun exposure/sweat?`,
        suggested_replies: ['After new cosmetic / soap', 'After sun exposure / sweating', 'After eating certain foods', 'No clear trigger'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('medications') && !alreadyAsked('creams') && !alreadyAsked('ointments')) {
      return {
        next_question: `${prefix}Have you applied any steroid creams, antifungal ointments, or taken anti-allergy tablets (like Cetirizine)?`,
        suggested_replies: ['Applied OTC steroid / antifungal cream', 'Took Cetirizine / allergy tablet', 'Home remedies / Aloe vera', 'Haven\'t used anything yet'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // DOMAIN 3: CARDIOVASCULAR / CHEST PAIN
  // ==========================================
  if (domain === 'cardiac') {
    if (!profile.coveredDimensions.has('character') && !alreadyAsked('describe the chest')) {
      return {
        next_question: `${prefix}How would you describe the chest discomfort — is it a heavy crushing pressure, sharp stabbing, or burning sensation?`,
        suggested_replies: ['Crushing / heavy pressure', 'Burning acidity sensation', 'Sharp / stabbing pain', 'Dull continuous ache'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('radiation') && !alreadyAsked('spread to your')) {
      return {
        next_question: `${prefix}Does this pain spread to your left arm, shoulder, jaw, neck, or back?`,
        suggested_replies: ['Yes, spreads to left arm', 'Yes, to jaw and neck', 'Yes, to my back', 'No, stays in center of chest'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('exacerbating') && !alreadyAsked('aggravated by walking')) {
      return {
        next_question: `${prefix}Is the chest pain aggravated by walking or climbing stairs, and does resting relieve it?`,
        suggested_replies: ['Worse with exertion / walking', 'Better with rest', 'Worse with deep breath', 'Constant regardless of rest'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('past_history') && !alreadyAsked('hypertension') && !alreadyAsked('blood pressure')) {
      return {
        next_question: `${prefix}Do you have a history of high blood pressure, diabetes, high cholesterol, or prior heart issues?`,
        suggested_replies: ['Hypertension (High BP)', 'Diabetes Mellitus', 'Prior heart stent / angioplasty', 'No chronic conditions'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // DOMAIN 4: DENTAL / ORAL
  // ==========================================
  if (domain === 'dental') {
    if (!profile.coveredDimensions.has('character') && !alreadyAsked('tooth pain feel')) {
      return {
        next_question: `${prefix}Does the tooth pain shoot sharply with cold/hot drinks, or is it a continuous throbbing ache when biting down?`,
        suggested_replies: ['Sharp sensitivity to cold / hot', 'Severe pain on biting down', 'Continuous throbbing ache', 'Dull continuous pain'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('associations') && !alreadyAsked('swelling')) {
      return {
        next_question: `${prefix}Do you notice any visible swelling in your cheek/gum, bleeding, or difficulty opening your mouth?`,
        suggested_replies: ['Noticeable swelling on cheek/gum', 'Bleeding when brushing', 'Difficulty opening mouth', 'No swelling or bleeding'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // DOMAIN 5: FEVER / INFECTION
  // ==========================================
  if (domain === 'fever') {
    if (!profile.coveredDimensions.has('associations') && !alreadyAsked('cough') && !alreadyAsked('chills')) {
      return {
        next_question: `${prefix}Do you have chills/shivering, cough, sore throat, or burning sensation while urinating?`,
        suggested_replies: ['Shivering & severe body aches', 'Cough & sore throat', 'Burning urination', 'Nausea / vomiting'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
    if (!profile.coveredDimensions.has('medications') && !alreadyAsked('paracetamol')) {
      return {
        next_question: `${prefix}Have you taken Paracetamol (like Dolo/Crocin), and does the temperature come down after taking it?`,
        suggested_replies: ['Took Paracetamol (fever drops temporarily)', 'Took Paracetamol (no relief)', 'Home remedies / Kadha only', 'Haven\'t taken any medicine'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // DOMAIN 6: GASTROINTESTINAL / ABDOMEN
  // ==========================================
  if (domain === 'gi') {
    if (!profile.coveredDimensions.has('associations') && !alreadyAsked('vomiting') && !alreadyAsked('loose')) {
      return {
        next_question: `${prefix}Do you have burning acidity, nausea/vomiting, loose stools, or constipation?`,
        suggested_replies: ['Severe burning acidity & nausea', 'Cramping with loose stools', 'Bloating & constipation', 'Only stomach pain'],
        red_flag: false,
        red_flag_reason: null,
        interview_complete: false,
      };
    }
  }

  // ==========================================
  // UNIVERSAL FINAL QUESTIONS (Relevant, Logical)
  // ==========================================
  if (!profile.coveredDimensions.has('past_history') && !alreadyAsked('diabetes') && !alreadyAsked('chronic')) {
    return {
      next_question: `${prefix}Do you have any existing chronic conditions like Diabetes, High BP, or Thyroid disorder?`,
      suggested_replies: ['Diabetes Mellitus', 'Hypertension / High BP', 'Thyroid disorder', 'No chronic conditions'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (!profile.coveredDimensions.has('medications') && !alreadyAsked('regular daily') && !alreadyAsked('prescriptions')) {
    return {
      next_question: `${prefix}Are you currently taking any regular prescription medicines or supplements?`,
      suggested_replies: ['Taking daily prescription meds', 'Taking supplements / vitamins', 'Ayurvedic / home remedies', 'No regular medicines'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  if (!profile.coveredDimensions.has('allergies') && !alreadyAsked('drug allergies')) {
    return {
      next_question: `${prefix}Do you have any known drug allergies (such as Penicillin, Sulfa drugs, or Aspirin)?`,
      suggested_replies: ['No known drug allergies (NKDA)', 'Allergic to Penicillin', 'Allergic to Sulfa / NSAIDs', 'Not sure'],
      red_flag: false,
      red_flag_reason: null,
      interview_complete: false,
    };
  }

  return {
    next_question: `${prefix}Thank you for answering all questions. Your clinical intake is complete and ready for the doctor.`,
    suggested_replies: [],
    red_flag: false,
    red_flag_reason: null,
    interview_complete: true,
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

