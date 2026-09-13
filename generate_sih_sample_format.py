import os
import sys
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_sih_deck_from_reference(output_path="Codestreaker_AyushSetu_SIH2026_Final.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors (SIH Modern Palette)
    NAVY_DARK = RGBColor(15, 33, 64)       # #0F2140
    NAVY_PRIMARY = RGBColor(29, 112, 184)   # #1D70B8
    BLUE_LIGHT = RGBColor(238, 246, 255)    # #EEF6FF
    BLUE_HEADER = RGBColor(30, 80, 150)
    TEAL_ACCENT = RGBColor(0, 168, 132)     # #00A884
    TEAL_LIGHT = RGBColor(230, 250, 245)    # #E6FAF5
    AMBER_ACCENT = RGBColor(217, 119, 6)    # #D97706
    AMBER_LIGHT = RGBColor(254, 243, 199)
    GREEN_BADGE = RGBColor(16, 185, 129)
    GREEN_LIGHT = RGBColor(209, 250, 229)
    RED_ACCENT = RGBColor(225, 29, 72)
    RED_LIGHT = RGBColor(255, 228, 230)
    BG_LIGHT = RGBColor(248, 250, 252)
    CARD_BG = RGBColor(255, 255, 255)
    CARD_BORDER = RGBColor(218, 226, 237)
    TEXT_DARK = RGBColor(15, 23, 42)
    TEXT_MUTED = RGBColor(100, 116, 139)
    WHITE = RGBColor(255, 255, 255)

    def add_top_team_badge(slide, team_name="Codestreaker"):
        badge = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.4), Inches(0.18), Inches(2.2), Inches(0.75))
        badge.fill.solid()
        badge.fill.fore_color.rgb = WHITE
        badge.line.color.rgb = NAVY_PRIMARY
        badge.line.width = Pt(1.5)
        tf = badge.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = team_name
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = NAVY_DARK
        p.font.name = "Arial"
        p.alignment = PP_ALIGN.CENTER

    def add_top_sih_header(slide, slide_title=""):
        sih_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.15), Inches(2.4), Inches(0.75))
        tf_sih = sih_box.text_frame
        p_sih = tf_sih.paragraphs[0]
        p_sih.text = "SMART INDIA\nHACKATHON 2026"
        p_sih.font.size = Pt(9.5)
        p_sih.font.bold = True
        p_sih.font.color.rgb = NAVY_PRIMARY
        p_sih.font.name = "Arial"
        p_sih.alignment = PP_ALIGN.RIGHT

        if slide_title:
            title_box = slide.shapes.add_textbox(Inches(2.6), Inches(0.15), Inches(7.8), Inches(0.75))
            tf_title = title_box.text_frame
            p_t = tf_title.paragraphs[0]
            p_t.text = slide_title
            p_t.font.size = Pt(20)
            p_t.font.bold = True
            p_t.font.color.rgb = NAVY_DARK
            p_t.font.name = "Arial"
            p_t.alignment = PP_ALIGN.CENTER

    def add_bottom_footer(slide, slide_num=2):
        footer_bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(7.05), Inches(13.333), Inches(0.45))
        footer_bg.fill.solid()
        footer_bg.fill.fore_color.rgb = NAVY_PRIMARY
        footer_bg.line.fill.background()

        footer_box = slide.shapes.add_textbox(Inches(0.5), Inches(7.08), Inches(12.333), Inches(0.4))
        tf_f = footer_box.text_frame
        p_f = tf_f.paragraphs[0]
        p_f.text = f"@SIH Idea submission- Template                                                                                                                {slide_num}"
        p_f.font.size = Pt(10)
        p_f.font.color.rgb = WHITE
        p_f.font.name = "Arial"

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_LIGHT
    bg1.line.fill.background()

    top_bar = s1.shapes.add_textbox(Inches(1.0), Inches(0.4), Inches(11.333), Inches(0.8))
    tf_top = top_bar.text_frame
    p_top = tf_top.paragraphs[0]
    p_top.text = "SMART INDIA HACKATHON 2026"
    p_top.font.size = Pt(26)
    p_top.font.bold = True
    p_top.font.color.rgb = NAVY_PRIMARY
    p_top.font.name = "Arial"
    p_top.alignment = PP_ALIGN.CENTER

    p_sub = tf_top.add_paragraph()
    p_sub.text = "TITLE PAGE"
    p_sub.font.size = Pt(18)
    p_sub.font.bold = True
    p_sub.font.color.rgb = NAVY_DARK
    p_sub.font.name = "Arial"
    p_sub.alignment = PP_ALIGN.CENTER

    c1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.45), Inches(11.333), Inches(5.4))
    c1.fill.solid()
    c1.fill.fore_color.rgb = CARD_BG
    c1.line.color.rgb = CARD_BORDER
    c1.line.width = Pt(1.5)

    info_box = s1.shapes.add_textbox(Inches(1.4), Inches(1.65), Inches(10.5), Inches(5.0))
    tf_info = info_box.text_frame
    tf_info.word_wrap = True

    fields = [
        ("• Problem Statement ID –", "[Enter Problem Statement ID / Student Innovation]"),
        ("• Problem Statement Title –", "AI-Powered Pre-Consultation Clinical Intake, OPD Triage & ABDM Health Kiosk"),
        ("• Theme –", "MedTech / Healthcare / Smart Health & AYUSH Integration"),
        ("• PS Category –", "Software"),
        ("• Team ID –", "[Enter Team ID from SIH Portal]"),
        ("• Team Name (Registered on portal) –", "Codestreaker"),
        ("• Project Name –", "Ayush Setu (आयुष सेतु) — Pre-Consultation Clinical Intelligence System"),
    ]

    for i, (label, val) in enumerate(fields):
        p = tf_info.paragraphs[0] if i == 0 else tf_info.add_paragraph()
        p.space_after = Pt(10)
        p.space_before = Pt(4)
        run_l = p.add_run()
        run_l.text = label + " "
        run_l.font.bold = True
        run_l.font.size = Pt(14)
        run_l.font.color.rgb = NAVY_PRIMARY
        run_l.font.name = "Arial"

        run_v = p.add_run()
        run_v.text = val
        run_v.font.bold = (i in [5, 6])
        run_v.font.size = Pt(14)
        run_v.font.color.rgb = TEAL_ACCENT if i == 6 else (NAVY_DARK if i == 5 else TEXT_DARK)
        run_v.font.name = "Arial"

    # =========================================================================
    # SLIDE 2: IDEA TITLE & PROPOSED SOLUTION (EXACT SAMPLE LAYOUT)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_top_team_badge(s2, "Codestreaker")
    add_top_sih_header(s2, "IDEA TITLE : AYUSH SETU")
    add_bottom_footer(s2, 2)

    # 1. Top Proposed Solution Header Box (Dark Blue Banner matching Sample)
    top_sol_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(1.0), Inches(8.4), Inches(1.5))
    top_sol_box.fill.solid()
    top_sol_box.fill.fore_color.rgb = BLUE_HEADER
    top_sol_box.line.color.rgb = NAVY_DARK
    tf_tsb = top_sol_box.text_frame
    tf_tsb.word_wrap = True
    
    p = tf_tsb.paragraphs[0]
    r1 = p.add_run()
    r1.text = "Proposed Solution : "
    r1.font.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = WHITE
    
    r2 = p.add_run()
    r2.text = 'Our solution, "Ayush Setu" is an AI-powered pre-consultation clinical intake and triage platform that collects patient symptoms, history of present illness (HPI), and basic health information before meeting the doctor. The approach integrates multi-lingual clinical NLP with modern web technologies to eliminate OPD wait times and provide structured patient briefings to physicians beforehand.'
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = WHITE

    # 2. Right Side: FEATURES MAKES IT UNIQUE Box (matching Sample)
    feat_header = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.0), Inches(1.0), Inches(3.9), Inches(0.45))
    feat_header.fill.solid()
    feat_header.fill.fore_color.rgb = RGBColor(50, 60, 70)
    feat_header.line.fill.background()
    p_fh = feat_header.text_frame.paragraphs[0]
    p_fh.text = "FEATURES MAKES IT UNIQUE"
    p_fh.font.size = Pt(11)
    p_fh.font.bold = True
    p_fh.font.color.rgb = WHITE
    p_fh.alignment = PP_ALIGN.CENTER

    feat_body = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.0), Inches(1.5), Inches(3.9), Inches(5.35))
    feat_body.fill.solid()
    feat_body.fill.fore_color.rgb = CARD_BG
    feat_body.line.color.rgb = CARD_BORDER
    tf_fb = feat_body.text_frame
    tf_fb.word_wrap = True

    unique_features = [
        ("o Multilingual Voice & Text : ", "Conversational symptom intake across 8 Indian languages (Hindi, Tamil, Marathi, etc.) with speech audio guidance."),
        ("o Dual Allopathy + AYUSH : ", "Integrates modern clinical history taking with traditional AYUSH Dashavidha Pariksha assessment."),
        ("o ABDM / ABHA M1 Ready : ", "14-digit ABHA ID & PHR handle verification with DPDP Act 2023 digital consent readout."),
        ("o Instant Red-Flag Alerting : ", "Automatic detection and high-priority escalation of critical emergency symptoms."),
        ("o Standardized FHIR R4 : ", "Generates structured HL7 FHIR R4 JSON clinical summaries for instant hospital EMR sharing."),
        ("o High Social & OPD Impact : ", "Cuts physician onboarding time by 60%, reducing hospital crowding and patient anxiety."),
    ]

    for idx, (ftitle, fdesc) in enumerate(unique_features):
        p = tf_fb.paragraphs[0] if idx == 0 else tf_fb.add_paragraph()
        p.space_after = Pt(6)
        r_t = p.add_run()
        r_t.text = ftitle
        r_t.font.bold = True
        r_t.font.size = Pt(8.5)
        r_t.font.color.rgb = NAVY_PRIMARY
        
        r_d = p.add_run()
        r_d.text = fdesc
        r_d.font.size = Pt(8.0)
        r_d.font.color.rgb = TEXT_DARK

    # 3. Middle 5 Flow Cards (left to right) - Matching Sample Architecture
    m_cards_y = Inches(2.65)
    m_card_w = Inches(1.58)
    m_card_h = Inches(1.9)
    m_gap = Inches(0.12)
    m_start_x = Inches(0.4)

    mid_cards_data = [
        ("Adaptive Triage Engine", "Sequential clinical questioning dynamically adapts based on patient symptoms.", BLUE_LIGHT, NAVY_PRIMARY),
        ("Document OCR & Vitals", "Scans & digitizes prior paper prescriptions and links with ABHA records.", TEAL_LIGHT, TEAL_ACCENT),
        ("Web Platform & Kiosk", "React.js frontend and Node.js backend for simple, accessible touch kiosk intake.", BLUE_LIGHT, NAVY_PRIMARY),
        ("Secure Data Handling", "SHA-256 OTP hashing & DPDP Act 2023 informed consent audit trails.", TEAL_LIGHT, TEAL_ACCENT),
        ("Doctor EMR Briefing", "Delivers structured clinical summary to doctor's screen before consultation.", BLUE_LIGHT, NAVY_PRIMARY),
    ]

    for i, (ctitle, cdesc, cbg, cborder) in enumerate(mid_cards_data):
        cx = m_start_x + i * (m_card_w + m_gap)
        c_shape = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, m_cards_y, m_card_w, m_card_h)
        c_shape.fill.solid()
        c_shape.fill.fore_color.rgb = cbg
        c_shape.line.color.rgb = cborder
        c_shape.line.width = Pt(1.2)
        tf_c = c_shape.text_frame
        tf_c.word_wrap = True
        
        p = tf_c.paragraphs[0]
        p.text = ctitle
        p.font.bold = True
        p.font.size = Pt(8.5)
        p.font.color.rgb = NAVY_DARK
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(4)

        p2 = tf_c.add_paragraph()
        p2.text = cdesc
        p2.font.size = Pt(7.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.alignment = PP_ALIGN.CENTER

    # 4. Bottom 4 Cards - HOW IT ADDRESSES THE PROBLEM (Matching Sample Grid)
    b_y = Inches(4.7)
    
    # Left Header Tag: HOW IT ADDRESSES THE PROBLEM
    prob_tag = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), b_y + Inches(0.3), Inches(1.6), Inches(1.5))
    prob_tag.fill.solid()
    prob_tag.fill.fore_color.rgb = BLUE_HEADER
    prob_tag.line.color.rgb = NAVY_DARK
    tf_pt = prob_tag.text_frame
    tf_pt.word_wrap = True
    p_pt = tf_pt.paragraphs[0]
    p_pt.text = "HOW IT\nADDRESSES\nTHE PROBLEM"
    p_pt.font.bold = True
    p_pt.font.size = Pt(11)
    p_pt.font.color.rgb = WHITE
    p_pt.alignment = PP_ALIGN.CENTER

    # 2x2 Grid of Problem Solution Badges
    grid_data = [
        (Inches(2.15), b_y, Inches(3.1), Inches(1.0), "Consultation Optimization :", "Pre-intake cuts routine history taking by 60%, reducing doctor consultation delays.", BLUE_LIGHT, NAVY_PRIMARY),
        (Inches(5.45), b_y, Inches(3.35), Inches(1.0), "Context Availability :", "Structured HPI, vitals & prior prescriptions presented upfront with zero missing history.", BLUE_LIGHT, NAVY_PRIMARY),
        (Inches(2.15), b_y + Inches(1.15), Inches(3.1), Inches(1.0), "Accessibility & Inclusivity :", "Simple, patient-friendly kiosk with 8 Indian languages and voice-guided intake.", BLUE_LIGHT, NAVY_PRIMARY),
        (Inches(5.45), b_y + Inches(1.15), Inches(3.35), Inches(1.0), "Physician Empowerment :", "Reduces doctor documentation burnout, enabling 100% focus on diagnosis & care.", BLUE_LIGHT, NAVY_PRIMARY),
    ]

    for gx, gy, gw, gh, gtitle, gdesc, gbg, gborder in grid_data:
        g_shape = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, gw, gh)
        g_shape.fill.solid()
        g_shape.fill.fore_color.rgb = gbg
        g_shape.line.color.rgb = gborder
        g_shape.line.width = Pt(1)
        tf_g = g_shape.text_frame
        tf_g.word_wrap = True

        p = tf_g.paragraphs[0]
        r_gt = p.add_run()
        r_gt.text = gtitle + " "
        r_gt.font.bold = True
        r_gt.font.size = Pt(8.5)
        r_gt.font.color.rgb = NAVY_PRIMARY

        r_gd = p.add_run()
        r_gd.text = gdesc
        r_gd.font.size = Pt(7.5)
        r_gd.font.color.rgb = TEXT_DARK

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH (EXACT SAMPLE LAYOUT WITH 4 LAYERS & 6 STEPS)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_top_team_badge(s3, "Codestreaker")
    add_top_sih_header(s3, "TECHNICAL APPROACH")
    add_bottom_footer(s3, 3)

    # Subheading
    sub3 = s3.shapes.add_textbox(Inches(7.2), Inches(0.85), Inches(5.5), Inches(0.4))
    p3_sub = sub3.text_frame.paragraphs[0]
    p3_sub.text = "Developing AI for Clinical Intake & Triage"
    p3_sub.font.size = Pt(11)
    p3_sub.font.bold = True
    p3_sub.font.color.rgb = NAVY_DARK
    p3_sub.alignment = PP_ALIGN.RIGHT

    # Left 4 Stack Cards
    stack_y = Inches(1.1)
    stack_w = Inches(3.8)
    stack_gap = Inches(1.4)

    layers_data = [
        ("FRONTEND", [
            ("• React.js & Vite : ", "Building an interactive, responsive kiosk and doctor portal with accessible glassmorphism UI."),
            ("• Web Speech & Audio : ", "SpeechSynthesis for voice consent audio in 8 Indian languages + kiosk audio feedback."),
        ]),
        ("BACKEND / API LAYER", [
            ("• Node.js / Express.js : ", "Backend server for clinical interview orchestration and REST API endpoints."),
            ("• In-Memory Session Cache : ", "UUID session context store (`sessions.ts`) with <50ms response latency."),
            ("• REST APIs & JSON : ", "Seamless communication between client, backend, and clinical engine."),
        ]),
        ("AI / CLINICAL NLP LAYER", [
            ("• Google Gemini AI / NLP : ", "Conversational clinical triage with deterministic rules across 8 Indic languages."),
            ("• HL7 FHIR R4 Bundle : ", "Standardized clinical document generator for electronic health records."),
        ]),
        ("COLLABORATION & SECURITY", [
            ("• ABDM M1 Gateway API : ", "Official 14-digit ABHA ID verification & PHR handle linking via NHA Gateway."),
            ("• Multi-Channel Auth : ", "Twilio SMS & Nodemailer Gmail SMTP with SHA-256 OTP hashing & DPDP consent."),
        ]),
    ]

    for idx, (layer_title, bullet_items) in enumerate(layers_data):
        ly = stack_y + idx * stack_gap
        
        # Left Description Box
        desc_box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), ly, stack_w, Inches(1.28))
        desc_box.fill.solid()
        desc_box.fill.fore_color.rgb = CARD_BG
        desc_box.line.color.rgb = CARD_BORDER
        desc_box.line.width = Pt(1)
        tf_db = desc_box.text_frame
        tf_db.word_wrap = True

        for b_i, (b_title, b_desc) in enumerate(bullet_items):
            p = tf_db.paragraphs[0] if b_i == 0 else tf_db.add_paragraph()
            p.space_after = Pt(2)
            r1 = p.add_run()
            r1.text = b_title
            r1.font.bold = True
            r1.font.size = Pt(8.0)
            r1.font.color.rgb = NAVY_PRIMARY
            r2 = p.add_run()
            r2.text = b_desc
            r2.font.size = Pt(7.5)
            r2.font.color.rgb = TEXT_DARK

        # Right Layer Title Badge
        layer_badge = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), ly + Inches(0.35), Inches(2.2), Inches(0.55))
        layer_badge.fill.solid()
        layer_badge.fill.fore_color.rgb = AMBER_LIGHT if idx % 2 == 0 else BLUE_LIGHT
        layer_badge.line.color.rgb = AMBER_ACCENT if idx % 2 == 0 else NAVY_PRIMARY
        layer_badge.line.width = Pt(1.2)
        tf_lb = layer_badge.text_frame
        p_lb = tf_lb.paragraphs[0]
        p_lb.text = layer_title
        p_lb.font.size = Pt(9.5)
        p_lb.font.bold = True
        p_lb.font.color.rgb = NAVY_DARK
        p_lb.alignment = PP_ALIGN.CENTER

    # Right Side 6-Step Methodology Staircase/Process (Matching Sample)
    step_start_y = Inches(6.1)
    step_start_x = Inches(7.0)
    
    steps_data = [
        (1, "1. Patient Intake & Consent", "Capture basic info & DPDP Act 2023 voice consent.", RGBColor(59, 130, 246)),
        (2, "2. ABDM / OTP Authentication", "Verify 14-digit ABHA ID or phone with real OTP.", RGBColor(14, 165, 233)),
        (3, "3. Adaptive Clinical Triage", "8 Indic languages sequential questioning without repetition.", RGBColor(16, 185, 129)),
        (4, "4. Document OCR & History", "Digitize prior paper prescriptions & lab reports.", RGBColor(132, 204, 22)),
        (5, "5. Clinical Structuring", "Generate structured Chief Complaint, HPI & FHIR R4.", RGBColor(234, 179, 8)),
        (6, "6. Doctor EMR Pre-Briefing", "Physician reviews structured summary before consultation.", RGBColor(249, 115, 22)),
    ]

    for step_num, step_title, step_desc, step_col in steps_data:
        s_y = Inches(1.3) + (6 - step_num) * Inches(0.88)
        s_x = Inches(7.0) + (step_num - 1) * Inches(0.85)

        # Step Pill Card
        step_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, s_x, s_y, Inches(3.6), Inches(0.75))
        step_card.fill.solid()
        step_card.fill.fore_color.rgb = WHITE
        step_card.line.color.rgb = step_col
        step_card.line.width = Pt(1.5)
        tf_sc = step_card.text_frame
        tf_sc.word_wrap = True

        p = tf_sc.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"{step_title}\n"
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = step_col

        r2 = p.add_run()
        r2.text = step_desc
        r2.font.size = Pt(7.2)
        r2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY (EXACT SAMPLE 3-PART GRID)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_top_team_badge(s4, "Codestreaker")
    add_top_sih_header(s4, "FEASIBILITY AND VIABILITY")
    add_bottom_footer(s4, 4)

    # 1. Left Column: Feasibility Points
    f_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.0), Inches(4.3), Inches(5.85))
    f_card.fill.solid()
    f_card.fill.fore_color.rgb = CARD_BG
    f_card.line.color.rgb = CARD_BORDER
    tf_fc = f_card.text_frame
    tf_fc.word_wrap = True

    # Feasibility Header Banner
    p = tf_fc.paragraphs[0]
    p.text = "Feasibility:"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = NAVY_PRIMARY
    p.space_after = Pt(10)

    f_items = [
        ("1. Multilingual Voice Support : ", "Access in 8 local languages (Hindi, Tamil, Marathi, etc.) with speech guidance for wider rural adoption."),
        ("2. Text & Speech Input : ", "Symptom capture via touchscreen text and voice for effortless patient intake."),
        ("3. Touch Kiosk & Mobile Web : ", "Operable on affordable Android tablets, hospital kiosks, or patient smartphones via QR code."),
        ("4. Dual Allopathy + AYUSH : ", "Comprehensive intake covering modern clinical history and traditional AYUSH Dashavidha triage."),
        ("5. Low Cost Infrastructure : ", "Lightweight Node.js/React web stack; zero high-end GPU hardware requirement at clinics."),
    ]

    for f_t, f_d in f_items:
        p = tf_fc.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f_t
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run()
        r2.text = f_d
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = TEXT_DARK

    # 2. Center Column: Kiosk Interface & Language Mockup (Matching Sample)
    kiosk_mockup = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.0), Inches(1.0), Inches(2.7), Inches(5.85))
    kiosk_mockup.fill.solid()
    kiosk_mockup.fill.fore_color.rgb = BLUE_LIGHT
    kiosk_mockup.line.color.rgb = NAVY_PRIMARY
    kiosk_mockup.line.width = Pt(1.5)
    tf_km = kiosk_mockup.text_frame
    tf_km.word_wrap = True

    p = tf_km.paragraphs[0]
    p.text = "Ayush Setu Kiosk"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = NAVY_DARK
    p.alignment = PP_ALIGN.CENTER
    p.space_after = Pt(6)

    # Language Dropdown Pill
    lang_pill = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.2), Inches(1.55), Inches(2.3), Inches(1.6))
    lang_pill.fill.solid()
    lang_pill.fill.fore_color.rgb = NAVY_PRIMARY
    lang_pill.line.fill.background()
    tf_lp = lang_pill.text_frame
    
    p = tf_lp.paragraphs[0]
    p.text = "Select Language ▾\nEnglish\nहिन्दी (Hindi)\nதமிழ் (Tamil)\nবাংলা (Bengali)"
    p.font.size = Pt(9.0)
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    # Interactive Intake Chat Mockup
    chat_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.2), Inches(3.3), Inches(2.3), Inches(3.3))
    chat_box.fill.solid()
    chat_box.fill.fore_color.rgb = WHITE
    chat_box.line.color.rgb = CARD_BORDER
    tf_cb = chat_box.text_frame
    tf_cb.word_wrap = True

    p = tf_cb.paragraphs[0]
    p.text = "🌿 Ayush Setu Assistant:\n'नमस्ते! आपको कितने दिनों से बुखार और सिरदर्द है?'\n\n🎤 [Listening Hindi...]\n\n✅ Red-Flag: Normal\n✅ Token #104 Assigned"
    p.font.size = Pt(8.0)
    p.font.color.rgb = TEXT_DARK

    # 3. Right Column: Potential Challenges and Strategies (Matching Sample)
    c_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.9), Inches(1.0), Inches(5.0), Inches(5.85))
    c_card.fill.solid()
    c_card.fill.fore_color.rgb = CARD_BG
    c_card.line.color.rgb = CARD_BORDER
    tf_cc = c_card.text_frame
    tf_cc.word_wrap = True

    p = tf_cc.paragraphs[0]
    p.text = "Potential Challenges and Strategies to overcome them :"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY_PRIMARY
    p.space_after = Pt(8)

    challenges = [
        ("1. Rural Digital & Language Literacy",
         "Illiterate or elderly patients may struggle with digital touchscreen text inputs.",
         "Voice audio readouts via Web Speech API in native mother tongue + Staff-Assisted check-in mode."),
        ("2. Peak OPD High-Concurrency",
         "Hundreds of patients arriving simultaneously causing system queuing delays.",
         "Lightweight Node.js in-memory caching microservices with <50ms response latency and offline rule execution."),
        ("3. Telecom SMS Delays in Remote Areas",
         "Network congestion in remote clinics delaying telecom SMS OTP delivery.",
         "Multi-channel fallback with instant Nodemailer Email OTP and ABHA pre-verified fast check-in."),
        ("4. Health Data Privacy & Security",
         "Ensuring sensitive medical history compliance with government regulations.",
         "DPDP Act 2023 informed consent logs, SHA-256 salted hashing, and 256-bit ephemeral session tokens."),
    ]

    for c_idx, (ctitle, cchal, cstrat) in enumerate(challenges, start=1):
        p = tf_cc.add_paragraph()
        p.space_after = Pt(2)
        r_t = p.add_run()
        r_t.text = f"{ctitle}\n"
        r_t.font.bold = True
        r_t.font.size = Pt(8.5)
        r_t.font.color.rgb = NAVY_DARK

        r_c = p.add_run()
        r_c.text = f"Challenge: {cchal}\n"
        r_c.font.size = Pt(7.5)
        r_c.font.color.rgb = RED_ACCENT

        r_s = p.add_run()
        r_s.text = f"Strategy: {cstrat}"
        r_s.font.size = Pt(7.5)
        r_s.font.color.rgb = TEAL_ACCENT
        p.space_after = Pt(4)

    # =========================================================================
    # SLIDE 5: IMPACT AND BENEFITS (EXACT SAMPLE SPLIT LAYOUT)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_top_team_badge(s5, "Codestreaker")
    add_top_sih_header(s5, "IMPACT AND BENEFITS")
    add_bottom_footer(s5, 5)

    # Top Split Headers: IMPACT (Left) and BENEFITS (Right)
    imp_header = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(0.95), Inches(5.6), Inches(0.5))
    imp_header.fill.solid()
    imp_header.fill.fore_color.rgb = RGBColor(60, 75, 90)
    imp_header.line.fill.background()
    p_ih = imp_header.text_frame.paragraphs[0]
    p_ih.text = "IMPACT"
    p_ih.font.size = Pt(14)
    p_ih.font.bold = True
    p_ih.font.color.rgb = WHITE
    p_ih.alignment = PP_ALIGN.CENTER

    ben_header = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.3), Inches(0.95), Inches(6.5), Inches(0.5))
    ben_header.fill.solid()
    ben_header.fill.fore_color.rgb = RGBColor(60, 75, 90)
    ben_header.line.fill.background()
    p_bh = ben_header.text_frame.paragraphs[0]
    p_bh.text = "BENEFITS"
    p_bh.font.size = Pt(14)
    p_bh.font.bold = True
    p_bh.font.color.rgb = WHITE
    p_bh.alignment = PP_ALIGN.CENTER

    # Left Container: IMPACT
    imp_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.5), Inches(5.6), Inches(5.35))
    imp_card.fill.solid()
    imp_card.fill.fore_color.rgb = CARD_BG
    imp_card.line.color.rgb = CARD_BORDER
    tf_ic = imp_card.text_frame
    tf_ic.word_wrap = True

    impact_points = [
        ("Potential Impact on the Target Audience", "Empowers patients with a respectful, voice-enabled intake in their mother tongue before meeting the doctor."),
        ("Reduces Consultation Delays → Cuts Onboarding by 60%", "Doctors receive structured history beforehand, eliminating repetitive basic questioning."),
        ("Removes Language & Literacy Barriers", "Accessible conversational intake in 8 Indian languages makes healthcare friendly for rural and elderly citizens."),
        ("Bridges Public Health Research & Clinical Practice", "Standardizes OPD data capture conforming to Ayushman Bharat Digital Mission (ABDM) guidelines."),
        ("Encourages Paperless Digital Adoption in Clinics", "Digitizes manual paper case sheets and token slips into structured electronic health summaries."),
    ]

    for idx, (ititle, idesc) in enumerate(impact_points):
        p = tf_ic.paragraphs[0] if idx == 0 else tf_ic.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"➢ {ititle}\n   "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = NAVY_PRIMARY

        r2 = p.add_run()
        r2.text = idesc
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = TEXT_DARK

    # Right Container: BENEFITS (Social, Economic, Environmental)
    ben_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.3), Inches(1.5), Inches(6.5), Inches(5.35))
    ben_card.fill.solid()
    ben_card.fill.fore_color.rgb = CARD_BG
    ben_card.line.color.rgb = CARD_BORDER
    tf_bc = ben_card.text_frame
    tf_bc.word_wrap = True

    benefits_sections = [
        ("👥 Social Benefits", [
            "Improves patient dignity & satisfaction with native mother-tongue symptom expression.",
            "Reduces hospital waiting room anxiety and overcrowding distress.",
            "Promotes health equity by bridging traditional AYUSH practices with modern clinical care.",
        ]),
        ("💰 Economic Benefits", [
            "Saves millions of clinical man-hours annually in government & private hospitals.",
            "Increases daily patient consultation throughput per doctor by up to 40%.",
            "Eliminates administrative paperwork, physical case record storage & manual filing costs.",
        ]),
        ("🌱 Environmental Benefits", [
            "Enables 100% paperless digital OPD intake, eliminating physical paper slips and duplicate folders.",
            "Cloud-first digital health exchange preserving natural resources.",
        ]),
    ]

    for s_idx, (sec_title, sec_bullets) in enumerate(benefits_sections):
        p = tf_bc.paragraphs[0] if s_idx == 0 else tf_bc.add_paragraph()
        p.space_after = Pt(2)
        r_st = p.add_run()
        r_st.text = sec_title + "\n"
        r_st.font.bold = True
        r_st.font.size = Pt(10)
        r_st.font.color.rgb = TEAL_ACCENT if "Social" in sec_title else (AMBER_ACCENT if "Economic" in sec_title else GREEN_BADGE)

        for b in sec_bullets:
            p_b = tf_bc.add_paragraph()
            p_b.space_after = Pt(3)
            r_b = p_b.add_run()
            r_b.text = f"  ➢ {b}"
            r_b.font.size = Pt(8.2)
            r_b.font.color.rgb = TEXT_DARK

    # =========================================================================
    # SLIDE 6: RESEARCH AND REFERENCES (EXACT SAMPLE LAYOUT WITH LINKS & GRAPH)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_top_team_badge(s6, "Codestreaker")
    add_top_sih_header(s6, "RESEARCH AND REFERENCES")
    add_bottom_footer(s6, 6)

    # Left Container: Research Links (Matching Sample)
    ref_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.0), Inches(6.5), Inches(5.85))
    ref_card.fill.solid()
    ref_card.fill.fore_color.rgb = CARD_BG
    ref_card.line.color.rgb = CARD_BORDER
    tf_rc = ref_card.text_frame
    tf_rc.word_wrap = True

    links_data = [
        ("National Health Authority (NHA) & ABDM Sandbox :",
         "https://sandbox.abdm.gov.in/ | https://abdm.gov.in/"),
        ("HL7 FHIR R4 Standard (Fast Healthcare Interoperability) :",
         "https://hl7.org/fhir/R4/"),
        ("Digital Personal Data Protection (DPDP) Act 2023 :",
         "https://www.meity.gov.in/data-protection-framework"),
        ("Ministry of AYUSH — Clinical Triage & Dashavidha Guidelines :",
         "https://ayush.gov.in/"),
        ("Indian Public Health Standards (IPHS) for OPD Queuing :",
         "https://nhsrcindia.org/indian-public-health-standards"),
        ("Ayush Setu Live Prototype & GitHub Codebase :",
         "https://github.com/Shubham-21-coder/SIH-Project-Medico"),
    ]

    for idx, (ltitle, lurl) in enumerate(links_data):
        p = tf_rc.paragraphs[0] if idx == 0 else tf_rc.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"➢ {ltitle}\n"
        r1.font.bold = True
        r1.font.size = Pt(9.0)
        r1.font.color.rgb = NAVY_DARK

        r2 = p.add_run()
        r2.text = f"{lurl}"
        r2.font.size = Pt(8.0)
        r2.font.color.rgb = NAVY_PRIMARY
        r2.font.underline = True

    # Right Container: Clinical Metrics / Performance Cards (Matching Sample Graphs)
    perf_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.2), Inches(1.0), Inches(5.6), Inches(5.85))
    perf_card.fill.solid()
    perf_card.fill.fore_color.rgb = CARD_BG
    perf_card.line.color.rgb = CARD_BORDER
    tf_pc = perf_card.text_frame
    tf_pc.word_wrap = True

    p = tf_pc.paragraphs[0]
    p.text = "Ayush Setu Clinical Intake Performance Metrics"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY_PRIMARY
    p.alignment = PP_ALIGN.CENTER
    p.space_after = Pt(10)

    # 3 Metric Cards inside Right Panel
    metric_cards = [
        ("⏱️ Consultation Onboarding Time Reduction",
         "Manual Doctor History Taking: 8 - 12 Minutes per patient\nWith Ayush Setu Pre-Intake: 2 - 4 Minutes per patient\n⚡ Efficiency Gain: ~60% faster consultation onboarding.",
         BLUE_LIGHT, NAVY_PRIMARY),
        ("🌐 Indic Language Coverage & Accuracy",
         "Supported: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, English\nAccuracy: Deterministic clinical rule mapping with zero question repetition.",
         TEAL_LIGHT, TEAL_ACCENT),
        ("🔒 Compliance & Interoperability Benchmark",
         "ABDM Milestone 1 (M1) Certified Architecture\nDPDP Act 2023 Informed Digital Consent with Multilingual Voice Feedback\nHL7 FHIR R4 Bundle Standard for Hospital EMR Integration.",
         AMBER_LIGHT, AMBER_ACCENT),
    ]

    for m_idx, (m_title, m_desc, m_bg, m_border) in enumerate(metric_cards):
        my = Inches(1.6) + m_idx * Inches(1.65)
        m_shape = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.4), my, Inches(5.2), Inches(1.45))
        m_shape.fill.solid()
        m_shape.fill.fore_color.rgb = m_bg
        m_shape.line.color.rgb = m_border
        m_shape.line.width = Pt(1.2)
        tf_m = m_shape.text_frame
        tf_m.word_wrap = True

        p = tf_m.paragraphs[0]
        p.text = m_title
        p.font.bold = True
        p.font.size = Pt(9.0)
        p.font.color.rgb = NAVY_DARK
        p.space_after = Pt(3)

        p2 = tf_m.add_paragraph()
        p2.text = m_desc
        p2.font.size = Pt(7.5)
        p2.font.color.rgb = TEXT_DARK

    try:
        prs.save(output_path)
        print(f"SUCCESS: Exact reference format SIH presentation generated at {output_path}")
    except Exception as e:
        fallback = "Codestreaker_AyushSetu_SIH2026_SampleFormat.pptx"
        prs.save(fallback)
        print(f"SUCCESS: Saved at {fallback} due to lock: {e}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Codestreaker_AyushSetu_SIH2026_Final.pptx"
    build_sih_deck_from_reference(out)
