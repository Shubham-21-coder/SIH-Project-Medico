export interface ConfirmationStrings {
  title: string;
  description: string;
  playing: string;
  paused: string;
  replay: string;
  patientLabel: string;
  chiefComplaintLabel: string;
  hpiLabel: string;
  editBtn: string;
  confirmBtn: string;
  spokenText: (name: string, complaint: string, isAyush: boolean) => string;
}

export const AUDIO_CONFIRMATION_TRANSLATIONS: Record<string, ConfirmationStrings> = {
  mr: {
    title: '📢 तुमच्या आरोग्य माहितीची पुष्टी करा',
    description: 'कृपया ऑडिओ ऐका किंवा खालील नोंदी तपासून पुष्टी करा की ही माहिती योग्य आहे.',
    playing: '🔊 ऑडिओ सुरू आहे (बोलून दाखवले जात आहे)...',
    paused: '🔈 ऑडिओ थांबवला आहे',
    replay: '🔄 पुन्हा ऐका',
    patientLabel: '👤 रुग्ण:',
    chiefComplaintLabel: '🩺 मुख्य त्रास:',
    hpiLabel: '📝 तपासणी तपशील (HPI):',
    editBtn: '✏️ बदल करा / अधिक माहिती जोडा',
    confirmBtn: '✅ पुष्टी करा आणि डॉक्टरांना पाठवा',
    spokenText: (name, complaint, isAyush) =>
      isAyush
        ? `नमस्कार ${name || 'रुग्ण'} जी. तुमची आयुर्वेदिक तपासणी आणि आरोग्य तपशील नोंदवला गेला आहे. मुख्य त्रास: ${complaint}. ही माहिती योग्य असल्यास कृपया पुष्टी करा.`
        : `नमस्कार ${name || 'रुग्ण'} जी. तुमचा आरोग्य तपशील तयार आहे. मुख्य त्रास: ${complaint}. जर ही माहिती बरोबर असेल तर कृपया खाली पुष्टी करा.`,
  },
  hi: {
    title: '📢 अपने स्वास्थ्य विवरण की पुष्टि करें',
    description: 'कृपया ऑडियो सुनें या नीचे दिए गए विवरण को पढ़कर पुष्टि करें कि यह सही है।',
    playing: '🔊 ऑडियो चल रहा है (बोलकर सुनाया जा रहा है)...',
    paused: '🔈 ऑडियो रोक दिया गया है',
    replay: '🔄 दोबारा सुनें',
    patientLabel: '👤 मरीज:',
    chiefComplaintLabel: '🩺 मुख्य समस्या:',
    hpiLabel: '📝 नैदानिक विवरण (HPI):',
    editBtn: '✏️ उत्तर सुधारें / और जोड़ें',
    confirmBtn: '✅ पुष्टि करें एवं डॉक्टर को भेजें',
    spokenText: (name, complaint, isAyush) =>
      isAyush
        ? `नमस्ते ${name || 'रुग्ण'} जी। आपकी आयुर्वेदिक दशविध परीक्षा और स्वास्थ्य विवरण दर्ज कर लिया गया है। मुख्य समस्या: ${complaint}। क्या यह विवरण सही है? डॉक्टर को भेजने के लिए पुष्टि बटन दबाएं।`
        : `नमस्ते ${name || 'मरीज'} जी। आपका स्वास्थ्य विवरण तैयार है। मुख्य समस्या: ${complaint}। यदि यह सही है तो कृपया नीचे पुष्टि करें।`,
  },
  te: {
    title: '📢 మీ ఆరోగ్య వివరాలను ధృవీకరించండి',
    description: 'దయచేసి ఆడియో వినండి లేదా క్రింది వివరాలను తనిఖీ చేసి సరైనదేనని నిర్ధారించండి.',
    playing: '🔊 ఆడియో ప్లే అవుతోంది (చదివి వినిపించబడుతోంది)...',
    paused: '🔈 ఆడియో పాజ్ చేయబడింది',
    replay: '🔄 మళ్లీ వినండి',
    patientLabel: '👤 రోగి:',
    chiefComplaintLabel: '🩺 ప్రధాన సమస్య:',
    hpiLabel: '📝 క్లినికల్ వివరాలు (HPI):',
    editBtn: '✏️ మార్పులు చేయండి / మరిన్ని వివరాలు',
    confirmBtn: '✅ నిర్ధారించి డాక్టర్‌కు పంపండి',
    spokenText: (name, complaint) =>
      `నమస్కారం ${name || 'రోగి'} గారు. మీ ఆరోగ్య వివరాలు సిద్ధంగా ఉన్నాయి. ప్రధాన సమస్య: ${complaint}. ఇది సరైనదైతే దయచేసి క్రింద నిర్ధారించండి.`,
  },
  ta: {
    title: '📢 உங்கள் மருத்துவ விவரங்களை உறுதிப்படுத்தவும்',
    description: 'தயவுசெய்து ஆடியோவைக் கேளுங்கள் அல்லது கீழே உள்ள விவரங்களைச் சரிபார்க்கவும்.',
    playing: '🔊 ஆடியோ ஒலிக்கிறது (பேசி காட்டப்படுகிறது)...',
    paused: '🔈 ஆடியோ நிறுத்தப்பட்டது',
    replay: '🔄 மீண்டும் கேளுங்கள்',
    patientLabel: '👤 நோயாளி:',
    chiefComplaintLabel: '🩺 முதன்மைப் பிரச்சனை:',
    hpiLabel: '📝 மருத்துவ விவரங்கள் (HPI):',
    editBtn: '✏️ திருத்தவும் / மேலும் சேர்க்கவும்',
    confirmBtn: '✅ உறுதிசெய்து மருத்துவருக்கு அனுப்பவும்',
    spokenText: (name, complaint) =>
      `வணக்கம் ${name || 'நோயாளி'} அவர்களே. உங்கள் மருத்துவ விவரங்கள் தயாராக உள்ளன. முதன்மை பிரச்சனை: ${complaint}. இது சரியானதாக இருந்தால் கீழே உறுதிப்படுத்தவும்.`,
  },
  bn: {
    title: '📢 আপনার শারীরিক বিবরণের নিশ্চিতকরণ করুন',
    description: 'দয়া করে অডিওটি শুনুন অথবা নিচের বিবরণ যাচাই করে নিশ্চিত করুন।',
    playing: '🔊 অডিও চলছে (পড়ে শোনানো হচ্ছে)...',
    paused: '🔈 অডিও থামানো হয়েছে',
    replay: '🔄 পুনরায় শুনুন',
    patientLabel: '👤 রোগী:',
    chiefComplaintLabel: '🩺 মূল সমস্যা:',
    hpiLabel: '📝 শারীরিক বিবরণ (HPI):',
    editBtn: '✏️ সংশোধন করুন / আরও যোগ করুন',
    confirmBtn: '✅ নিশ্চিত করুন এবং ডাক্তারকে পাঠান',
    spokenText: (name, complaint) =>
      `নমস্কার ${name || 'রোগী'} মহাশয়। আপনার স্বাস্থ্য সংক্রান্ত বিবরণ প্রস্তুত হয়েছে। মূল সমস্যা: ${complaint}। এটি সঠিক হলে নিচে নিশ্চিত করুন।`,
  },
  gu: {
    title: '📢 તમારી સ્વાસ્થ્ય વિગતોની પુષ્ટિ કરો',
    description: 'કૃપા કરીને ઑડિઓ સાંભળો અથવા નીચે આપેલી વિગતો તપાસીને પુષ્ટિ કરો.',
    playing: '🔊 ઑડિયો ચાલુ છે (બોલીને સંભળાવવામાં આવી રહ્યું છે)...',
    paused: '🔈 ઑડિયો થોભાવ્યો છે',
    replay: '🔄 ફરી સાંભળો',
    patientLabel: '👤 દર્દી:',
    chiefComplaintLabel: '🩺 મુખ્ય સમસ્યા:',
    hpiLabel: '📝 તબીબી વિગતો (HPI):',
    editBtn: '✏️ સુધારો કરો / વધુ ઉમેરો',
    confirmBtn: '✅ પુષ્ટિ કરો અને ડૉક્ટરને મોકલો',
    spokenText: (name, complaint) =>
      `નમસ્તે ${name || 'દર્દી'} ભાઈ/બહેન. તમારી સ્વાસ્થ્ય વિગતો તૈયાર છે. મુખ્ય સમસ્યા: ${complaint}. જો આ વિગતો સાચી હોય તો કૃપા કરીને નીચે પુષ્ટિ કરો.`,
  },
  kn: {
    title: '📢 ನಿಮ್ಮ ಆರೋಗ್ಯ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ',
    description: 'ದಯವಿಟ್ಟು ಆಡಿಯೋ ಆಲಿಸಿ ಅಥವಾ ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ.',
    playing: '🔊 ಆಡಿಯೋ ಪ್ಲೇ ಆಗುತ್ತಿದೆ...',
    paused: '🔈 ಆಡಿಯೋ ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ',
    replay: '🔄 ಮತ್ತೆ ಆಲಿಸಿ',
    patientLabel: '👤 ರೋಗಿ:',
    chiefComplaintLabel: '🩺 ಮುಖ್ಯ ಸಮಸ್ಯೆ:',
    hpiLabel: '📝 ಆರೋಗ್ಯ ವಿವರಗಳು (HPI):',
    editBtn: '✏️ ತಿದ್ದುಪಡಿ ಮಾಡಿ / ವಿವರ ಸೇರಿಸಿ',
    confirmBtn: '✅ ದೃಢೀಕರಿಸಿ ಮತ್ತು ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಿ',
    spokenText: (name, complaint) =>
      `ನಮಸ್ಕಾರ ${name || 'ರೋಗಿ'} ಅವರೇ. ನಿಮ್ಮ ಆರೋಗ್ಯ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. ಮುಖ್ಯ ಸಮಸ್ಯೆ: ${complaint}. ಇದು ಸರಿಯಾಗಿದ್ದರೆ ದಯವಿಟ್ಟು ದೃಢೀಕರಿಸಿ.`,
  },
  en: {
    title: '📢 Confirm Your Medical Intake Summary',
    description: 'Please listen to the audio readout or review the structured points below before submitting to your doctor.',
    playing: '🔊 Audio Readout Playing...',
    paused: '🔈 Audio Paused',
    replay: '🔄 Replay Audio',
    patientLabel: '👤 Patient:',
    chiefComplaintLabel: '🩺 Chief Complaint:',
    hpiLabel: '📝 Clinical Intake Details (HPI):',
    editBtn: '✏️ Edit / Add More Details',
    confirmBtn: '✅ Confirm & Submit to Doctor',
    spokenText: (name, complaint) =>
      `Hello ${name || 'Patient'}. Your clinical intake summary is ready for doctor review. Chief complaint: ${complaint}. Please confirm to submit this note to your treating physician.`,
  },
};

export function getAudioConfirmationStrings(lang: string = 'en'): ConfirmationStrings {
  return AUDIO_CONFIRMATION_TRANSLATIONS[lang] || AUDIO_CONFIRMATION_TRANSLATIONS.en;
}
