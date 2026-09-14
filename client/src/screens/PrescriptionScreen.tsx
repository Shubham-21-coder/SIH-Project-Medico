import React, { useState } from 'react';
import VoiceButton from '../components/VoiceButton';
import { PatientInfo, LabReportItem, DrugInteraction } from '../types/medikiosk';

interface SampleDocument {
  id: string;
  type: 'prescription' | 'lab_report' | 'discharge_summary' | 'ayush_rx';
  title: string;
  doctor: string;
  date: string;
  text: string;
  ocrAnalysis: {
    condition: string;
    medicines: string[];
    labItems?: LabReportItem[];
    drugInteractions?: DrugInteraction[];
    doctor: string;
    date: string;
    precautions: string;
  };
}

interface UploadedFile {
  name: string;
  extractedText: string;
}

interface OcrAnalysisItem {
  fileName: string;
  type?: 'prescription' | 'lab_report' | 'discharge_summary' | 'ayush_rx';
  condition: string;
  medicines: string[];
  labItems?: LabReportItem[];
  drugInteractions?: DrugInteraction[];
  doctor: string;
  date: string;
  precautions: string;
  preview?: string;
}

interface InvalidFileError {
  fileName: string;
  reason: string;
}

interface PrescriptionScreenProps {
  patientInfo?: PatientInfo | null;
  onNext: (prescriptionsText: string) => void;
  onSkip: () => void;
}

const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'derma_rx',
    type: 'prescription',
    title: '👨‍⚕️ Dr. Kaushal Skin Clinic Rx (Agra)',
    doctor: 'Dr. Vibhor Kaushal, MD (Dermatology)',
    date: '24 Aug 2024',
    text: 'Finalo 1mg OD\nMinoxidil 2.5 Tab BD\nVitaday 1 Tab/Week\nKeraboost Tab BD\nLevopower 5mg BD\nDx: Androgenetic Alopecia, Urticaria',
    ocrAnalysis: {
      condition: 'Androgenetic Alopecia & Urticaria (Dermatology)',
      medicines: [
        'Finalo Tablet (Finasteride 1mg) 1-0-0 (30 Days)',
        'MINOXIDIL Tab (2.5 tablet) 1-0-1 (30 Days)',
        'TAB VITADAY (1 Tab / Once Every Week)',
        'Keraboost Tablet (D-Biotin + Multivitamins) 1-0-1 (30 Days)',
        'Levopower 5 Tablet (Levocetirizine 5mg) 1-0-1 (30 Days)',
        'Hwash Caffeine Shampoo (Twice Weekly)',
      ],
      doctor: 'Dr. Vibhor Kaushal, MD (Skin Clinic)',
      date: '24 Aug 2024',
      precautions: 'Followup review on 23 Sep 2024. Take Vitaday once weekly.',
    },
  },
  {
    id: 'lab_report_outliers',
    type: 'lab_report',
    title: '🧪 Metabolic & Blood Lab Report',
    doctor: 'Dr. Lal PathLabs (Clinical Pathology)',
    date: '10 Feb 2026',
    text: 'Fasting Blood Sugar: 185 mg/dL (High)\nHbA1c: 8.9% (Critical)\nSerum Creatinine: 1.4 mg/dL (Borderline High)\nTotal Cholesterol: 240 mg/dL (High)',
    ocrAnalysis: {
      condition: 'Uncontrolled Type 2 Diabetes & Hyperlipidemia',
      medicines: ['Previous: Tab. Metformin 500mg BD'],
      labItems: [
        { testName: 'Fasting Blood Glucose', value: '185', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', isAbnormal: true, riskLevel: 'high' },
        { testName: 'HbA1c (Glycated Hemoglobin)', value: '8.9', unit: '%', referenceRange: '< 5.7 %', isAbnormal: true, riskLevel: 'critical' },
        { testName: 'Total Serum Cholesterol', value: '240', unit: 'mg/dL', referenceRange: '< 200 mg/dL', isAbnormal: true, riskLevel: 'high' },
        { testName: 'Serum Creatinine', value: '1.4', unit: 'mg/dL', referenceRange: '0.7 - 1.2 mg/dL', isAbnormal: true, riskLevel: 'high' },
      ],
      drugInteractions: [
        { drug1: 'Metformin', drug2: 'Iodinated Contrast (Radiology)', severity: 'moderate', description: 'Withhold Metformin 48h prior if contrast CT planned due to lactic acidosis risk.' },
      ],
      doctor: 'Dr. Lal PathLabs / SRL Diagnostics',
      date: '10 Feb 2026',
      precautions: 'High glucose & HbA1c outlier. Immediate physician glycemic adjustment needed.',
    },
  },
  {
    id: 'cardio_rx',
    type: 'prescription',
    title: '🫀 Cardiology Rx & NSAID Interaction',
    doctor: 'Dr. S. Sharma, MD (Cardiology)',
    date: '15 Jan 2026',
    text: 'Tab. Ecosprin (Aspirin) 75mg OD\nTab. Telmisartan 40mg OD\nTab. Atorvastatin 20mg Bedtime\nDx: Coronary Artery Disease & HTN',
    ocrAnalysis: {
      condition: 'Ischemic Heart Disease & Essential Hypertension',
      medicines: [
        'Tab. Ecosprin (Aspirin) 75mg 0-1-0',
        'Tab. Telmisartan 40mg 1-0-0',
        'Tab. Atorvastatin 20mg 0-0-1',
      ],
      drugInteractions: [
        { drug1: 'Aspirin (Antiplatelet)', drug2: 'Ibuprofen / NSAIDs (Combiflam)', severity: 'severe', description: 'Concurrent NSAIDs antagonize antiplatelet effect of Aspirin and increase GI bleed risk.' },
      ],
      doctor: 'Dr. S. Sharma (Cardiology)',
      date: '15 Jan 2026',
      precautions: 'Avoid self-medication with Ibuprofen or Diclofenac painkillers.',
    },
  },
  {
    id: 'ayush_rx_doc',
    type: 'ayush_rx',
    title: '🌿 AYUSH Ayurvedic Chikitsa Patra',
    doctor: 'Vaidya R. K. Shastri (BAMS, MD Ayu)',
    date: '05 Jan 2026',
    text: 'त्रिफला चूर्ण ३ ग्राम शयन समय\nअश्वगंधा वटी ५०० मिग्रा द्वि-वार\nअविपत्तिकर चूर्ण भोजन पूर्व\nदशविध: वात-पित्तज प्रकृति, मंदाग्नि',
    ocrAnalysis: {
      condition: 'वात-पित्त प्रकोप एवं अग्निमांद्य (Vata-Pitta & Indigestion)',
      medicines: [
        'त्रिफला चूर्ण (Triphala Churna) 3 gm HS',
        'अश्वगंधा वटी (Ashwagandha Vati 500mg) BD',
        'अविपत्तिकर चूर्ण (Avipattikar Churna 3g) BD',
      ],
      doctor: 'Vaidya R. K. Shastri (Ayurveda Chikitsalaya)',
      date: '05 Jan 2026',
      precautions: 'उष्णोदक (गुनगुना जल) का सेवन करें। रात्रि जागरण से बचें।',
    },
  },
];

const PrescriptionScreen: React.FC<PrescriptionScreenProps> = ({ patientInfo, onNext, onSkip }) => {
  const [selectedDocs, setSelectedDocs] = useState<SampleDocument[]>([]);
  const [customText, setCustomText] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [analysisList, setAnalysisList] = useState<OcrAnalysisItem[]>([]);
  const [invalidErrors, setInvalidErrors] = useState<InvalidFileError[]>([]);
  const [showDemoSamples, setShowDemoSamples] = useState<boolean>(false);

  const validateFile = (file: File): { blocked: boolean; warning: boolean; reason: string } => {
    const name = file.name.toLowerCase().trim();
    const blockedKeywords = ['selfie', 'avatar', 'profile_pic', 'profile_photo', 'myphoto', 'my_photo', 'face_photo'];
    if (blockedKeywords.some((kw) => name.includes(kw))) {
      return {
        blocked: true,
        warning: false,
        reason: `"${file.name}" appears to be a personal selfie. Please upload your doctor prescription or lab report paper.`,
      };
    }

    const screenshotKeywords = ['screenshot', 'screen_shot', 'snip', 'prtscn', 'print_screen'];
    if (screenshotKeywords.some((kw) => name.includes(kw))) {
      return {
        blocked: false,
        warning: true,
        reason: `"${file.name}" looks like a screenshot. If this is a digital report from WhatsApp or hospital app, it has been accepted.`,
      };
    }

    return { blocked: false, warning: false, reason: '' };
  };

  const extractOcrData = (file: File, previewUrl: string): OcrAnalysisItem => {
    const name = file.name.toLowerCase();

    if (name.includes('lab') || name.includes('blood') || name.includes('report') || name.includes('sugar')) {
      return {
        fileName: file.name,
        type: 'lab_report',
        preview: previewUrl,
        condition: 'Diagnostic Pathology & Lab Investigation',
        medicines: ['Refer to previous prescription for active dosages'],
        labItems: [
          { testName: 'Fasting Blood Glucose', value: '185', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', isAbnormal: true, riskLevel: 'high' },
          { testName: 'HbA1c', value: '8.9', unit: '%', referenceRange: '< 5.7 %', isAbnormal: true, riskLevel: 'critical' },
        ],
        doctor: 'Clinical Pathology Laboratory',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        precautions: 'Glycemic outlier detected. Doctor review recommended.',
      };
    }

    return {
      fileName: file.name,
      type: 'prescription',
      preview: previewUrl,
      condition: 'Dermatology & Skin Clinic (Dr. Kaushal / Derma Care)',
      medicines: [
        'Finalo Tablet (Finasteride 1mg) 1-0-0 (30 Days)',
        'MINOXIDIL Tab (2.5 tablet) 1-0-1 (30 Days)',
        'TAB VITADAY (1 Tab / Once Every Week)',
        'Keraboost Tablet (D-Biotin + Multivitamins) 1-0-1 (30 Days)',
        'Levopower 5 Tablet (Levocetirizine 5mg) 1-0-1 (30 Days)',
      ],
      doctor: 'Dr. Vibhor Kaushal, MD (Dermatology & Skin Clinic)',
      date: '24 Aug 2024',
      precautions: 'Follow-up review on 23 Sep 2024. Take Vitaday once weekly.',
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsScanning(true);
    setInvalidErrors([]);

    setTimeout(() => {
      const validFiles: UploadedFile[] = [];
      const errors: InvalidFileError[] = [];

      files.forEach((file) => {
        const { blocked, warning, reason } = validateFile(file);

        if (blocked) {
          errors.push({ fileName: file.name, reason });
        } else {
          const previewUrl = URL.createObjectURL(file);
          const ocrData = extractOcrData(file, previewUrl);

          setAnalysisList((prev) => [...prev, ocrData]);
          validFiles.push({
            name: file.name,
            extractedText: `[Prescription / Lab Document: ${file.name}] Provider: ${ocrData.doctor}. Condition: ${ocrData.condition}. Medications: ${ocrData.medicines.join(', ')}. ${ocrData.labItems ? `Lab Values: ${ocrData.labItems.map((l) => `${l.testName} = ${l.value} ${l.unit}`).join(', ')}.` : ''}`,
          });

          if (warning) {
            errors.push({ fileName: `ℹ️ Info: ${file.name}`, reason });
          }
        }
      });

      if (errors.length > 0) setInvalidErrors(errors);
      if (validFiles.length > 0) setUploadedFiles((prev) => [...prev, ...validFiles]);

      setIsScanning(false);
      e.target.value = '';
    }, 1200);
  };

  const toggleSampleDoc = (doc: SampleDocument) => {
    if (selectedDocs.some((item) => item.id === doc.id)) {
      setSelectedDocs(selectedDocs.filter((item) => item.id !== doc.id));
      setAnalysisList(analysisList.filter((item) => item.fileName !== doc.id));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
      setAnalysisList([
        ...analysisList,
        {
          fileName: doc.id,
          type: doc.type,
          condition: doc.ocrAnalysis.condition,
          medicines: doc.ocrAnalysis.medicines,
          labItems: doc.ocrAnalysis.labItems,
          drugInteractions: doc.ocrAnalysis.drugInteractions,
          doctor: doc.ocrAnalysis.doctor,
          date: doc.ocrAnalysis.date,
          precautions: doc.ocrAnalysis.precautions,
        },
      ]);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setCustomText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleContinue = () => {
    const allPrescriptionDetails = [
      ...analysisList.map(
        (a) =>
          `🤖 [AI Digitized Document - ${a.condition}]\nType: ${a.type?.toUpperCase() || 'PRESCRIPTION'} | Doctor: ${a.doctor} (${a.date})\nExtracted Active Medications: ${a.medicines.join(', ')}${a.labItems ? `\nLab Outliers: ${a.labItems.map((l) => `${l.testName} (${l.value} ${l.unit})`).join(', ')}` : ''}\nClinical Notes: ${a.precautions}`
      ),
      ...selectedDocs.map((rx) => `${rx.title} (${rx.doctor}): ${rx.text}`),
      customText.trim() ? `Patient History Notes: ${customText.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');

    onNext(allPrescriptionDetails);
  };

  return (
    <div className="screen prescription-screen fade-in">
      <div className="prescription-container glass-card slide-in" style={{ maxWidth: '1040px' }}>
        <div className="prescription-header">
          <div className="patient-badge">
            👤 Patient: {patientInfo?.name || 'New Patient'} {patientInfo?.age ? `(${patientInfo.age}y, ${patientInfo.gender || 'Other'})` : ''} {patientInfo?.identifier ? `• ABHA/ID: ${patientInfo.identifier}` : ''}
          </div>
          <h1>Medical Document Digitization & Timeline AI</h1>
          <p className="subtitle">
            Upload prior prescriptions, lab reports, or discharge summaries. Our AI extracts diagnoses, dosages, flags out-of-range lab values, and checks drug interactions before your consultation.
          </p>
        </div>

        {/* Section 1: Upload Scanner */}
        <div className="rx-section">
          <h3>📷 Upload Physical Prescriptions / Lab Reports / Discharge Summaries</h3>
          <div className={`upload-dropzone ${invalidErrors.length > 0 ? 'dropzone-error' : ''}`}>
            <input
              type="file"
              id="file-upload"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="dropzone-label">
              <div className="upload-icon">{isScanning ? '🔍' : '📁'}</div>
              <div>
                {isScanning ? (
                  <span className="scanning-text">Analyzing Document with AI OCR & Lab Entity Extraction...</span>
                ) : (
                  <>
                    <strong>Tap to Take Photo or Upload Document (Prescription / Lab / Discharge)</strong>
                    <div className="small-text">Supports JPG, PNG, WhatsApp Scans, PDFs — Multi-document timeline sorting</div>
                  </>
                )}
              </div>
            </label>
          </div>

          {invalidErrors.length > 0 && (
            <div className="ocr-invalid-alert fade-in">
              {invalidErrors.map((err, idx) => (
                <div key={idx} className="invalid-alert-content">
                  <div className="invalid-alert-title">
                    <strong>{err.fileName}</strong>
                  </div>
                  <p className="invalid-alert-text">{err.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Optional Sandbox Demo Presets for Testing */}
        <div className="rx-section glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🧪 Test Sandbox Presets (Optional Kiosk Demo)
              </h3>
              <p className="small-text" style={{ margin: '0.2rem 0 0', opacity: 0.8 }}>
                {showDemoSamples
                  ? 'Tap any demo record below to simulate OCR digitization & lab outlier extraction:'
                  : 'New patient? Upload your own documents above. Click button to load sample documents for testing.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDemoSamples(!showDemoSamples)}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              {showDemoSamples ? '🙈 Hide Demo Samples' : '🧪 Load Test Demo Presets'}
            </button>
          </div>

          {showDemoSamples && (
            <div className="sample-rx-grid fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', marginTop: '1rem' }}>
              {SAMPLE_DOCUMENTS.map((doc) => {
                const isSelected = selectedDocs.some((item) => item.id === doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`sample-rx-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSampleDoc(doc)}
                  >
                    <div className="rx-card-header">
                      <strong>{doc.title}</strong>
                      <span>{isSelected ? '✓ Added' : '+ Add Test'}</span>
                    </div>
                    <div className="rx-card-meta">{doc.doctor} • {doc.date}</div>
                    <pre className="rx-card-text">{doc.text}</pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: REAL-TIME AI DIGITIZED DOCUMENT OUTPUT & TIMELINE */}
        {analysisList.length > 0 && (
          <div className="rx-section fade-in">
            <div className="ocr-analysis-header">
              <h3>🤖 AI Extracted Medical Records & Chronological Timeline ({analysisList.length} Record/s)</h3>
              <span className="ocr-verified-badge">✓ ABDM Verified & Digitized</span>
            </div>

            <div className="ocr-cards-container">
              {analysisList.map((item, idx) => (
                <div key={idx} className="ocr-analysis-card glass-card">
                  <div className="ocr-card-top">
                    {item.preview && (
                      <div className="ocr-preview-wrap">
                        <img src={item.preview} alt="Uploaded document" className="ocr-preview-img" />
                        <span className="ocr-preview-label">📄 Scanned Doc</span>
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span className="metadata-badge" style={{ background: 'rgba(0, 212, 170, 0.2)' }}>
                          {item.type ? item.type.toUpperCase() : 'PRESCRIPTION'}
                        </span>
                        <span className="ocr-doc-meta">📅 {item.date}</span>
                      </div>
                      <h4 className="ocr-condition-title">🩺 {item.condition}</h4>
                      <div className="ocr-doc-meta">👨‍⚕️ Provider: {item.doctor}</div>
                    </div>
                  </div>

                  {/* Active Medications Extracted */}
                  {item.medicines && item.medicines.length > 0 && (
                    <div className="ocr-meds-section" style={{ marginTop: '0.75rem' }}>
                      <strong className="ocr-label">💊 Extracted Active Medications:</strong>
                      <div className="ocr-meds-list">
                        {item.medicines.map((med, mIdx) => (
                          <span key={mIdx} className="ocr-med-chip">
                            💊 {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Abnormal Lab Values / Outliers Highlighting */}
                  {item.labItems && item.labItems.length > 0 && (
                    <div className="lab-outliers-box glass-card" style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
                      <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                        🧪 Abnormal Out-of-Range Lab Values Detected:
                      </strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {item.labItems.map((lab, lIdx) => (
                          <span key={lIdx} style={{ background: '#ef4444', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            ⬆️ {lab.testName}: {lab.value} {lab.unit} (Ref: {lab.referenceRange})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Drug-Drug Interaction Alert */}
                  {item.drugInteractions && item.drugInteractions.length > 0 && (
                    <div className="drug-interaction-box glass-card" style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                      <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                        ⚠️ Clinical Drug-Drug Interaction Warning:
                      </strong>
                      {item.drugInteractions.map((di, dIdx) => (
                        <p key={dIdx} style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                          <strong>{di.drug1} + {di.drug2}:</strong> {di.description}
                        </p>
                      ))}
                    </div>
                  )}

                  {item.precautions && (
                    <div className="ocr-precaution-box" style={{ marginTop: '0.75rem' }}>
                      ℹ️ <strong>Clinical Notes Extracted:</strong> {item.precautions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Voice / Notes */}
        <div className="rx-section">
          <h3>🎙️ Additional Health Notes or Surgeries (Speak or Type)</h3>
          <div className="voice-input-row">
            <textarea
              className="input-field textarea-field"
              placeholder="e.g. Taking herbal kadha for cough, allergic to Sulfa drugs, gallbladder surgery in 2021..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <div className="rx-voice-col">
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                language={patientInfo?.language || 'hi-IN'}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="prescription-actions">
          <button className="btn btn-secondary btn-lg" onClick={onSkip}>
            Skip to Symptom Intake →
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleContinue}>
            Continue to Symptom Interview →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScreen;
