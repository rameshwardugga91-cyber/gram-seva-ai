import React, { useState, useRef, useEffect } from "react";

const DEPARTMENTS = [
  { id: "road", label: "सड़क एवं निर्माण", office: "लोक निर्माण विभाग (PWD)", designation: "कार्यपालन अभियंता, लोक निर्माण विभाग" },
  { id: "water", label: "पानी एवं हैंडपंप", office: "जनस्वास्थ्य यांत्रिकी विभाग (PHE)", designation: "उप अभियंता, जनस्वास्थ्य यांत्रिकी विभाग" },
  { id: "electricity", label: "बिजली", office: "छत्तीसगढ़ राज्य विद्युत वितरण कंपनी", designation: "कनिष्ठ अभियंता, विद्युत वितरण केंद्र" },
  { id: "ration", label: "राशन एवं PDS", office: "खाद्य एवं नागरिक आपूर्ति विभाग", designation: "खाद्य निरीक्षक / जिला आपूर्ति अधिकारी" },
  { id: "pension", label: "पेंशन एवं योजना", office: "समाज कल्याण विभाग", designation: "जिला समाज कल्याण अधिकारी" },
  { id: "health", label: "स्वास्थ्य", office: "स्वास्थ्य एवं परिवार कल्याण विभाग", designation: "मुख्य चिकित्सा एवं स्वास्थ्य अधिकारी (CMHO)" },
  { id: "school", label: "शिक्षा", office: "शिक्षा विभाग / जिला शिक्षा अधिकारी", designation: "जिला शिक्षा अधिकारी" },
  { id: "agriculture", label: "कृषि एवं किसान", office: "कृषि विभाग", designation: "उप संचालक कृषि" },
  { id: "housing", label: "आवास योजना", office: "ग्रामीण विकास विभाग / PM आवास योजना", designation: "जनपद पंचायत CEO" },
  { id: "forest", label: "वन एवं भूमि/राजस्व", office: "राजस्व एवं वन विभाग", designation: "तहसीलदार / रेंज अधिकारी" },
  { id: "employment", label: "मनरेगा एवं रोजगार", office: "मनरेगा / जनपद पंचायत", designation: "कार्यक्रम अधिकारी, मनरेगा" },
  { id: "other", label: "अन्य समस्या", office: "जिला कलेक्टर कार्यालय", designation: "माननीय जिला कलेक्टर महोदय" },
];

const STEPS = ["समस्या", "जानकारी", "पत्र"];

export default function GramSevaAI() {
  const [step, setStep] = useState(0);
  const [dept, setDept] = useState(null);
  const [customDeptName, setCustomDeptName] = useState("");
  const [problem, setProblem] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("नारायणपुर");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const letterRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseProblemRef = useRef("");

  const shouldListenRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      if (finalTranscript) {
        baseProblemRef.current = (baseProblemRef.current + " " + finalTranscript).trim();
      }
      setProblem((baseProblemRef.current + " " + interimTranscript).trim());
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      shouldListenRef.current = false;
      setListening(false);
    };
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setListening(false);
    } else {
      baseProblemRef.current = problem;
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {}
    }
  }

  function toggleSpeakLetter() {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function shareOnWhatsApp() {
    const text = letterRef.current ? letterRef.current.innerText : letter;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  const canGoToInfo = dept && problem.trim().length > 8;
  const canGenerate = name.trim() && village.trim() && district.trim();

  function generateLetter() {
    setLoading(true);
    setError("");
    try {
      const deptObj = DEPARTMENTS.find((d) => d.id === dept);
      const isCustom = dept === "other" && customDeptName.trim();
      const officeName = isCustom ? customDeptName.trim() : deptObj.office;
      const designationName = isCustom ? `संबंधित अधिकारी, ${customDeptName.trim()}` : deptObj.designation;
      const subjectLabel = isCustom ? customDeptName.trim() : deptObj.label;
      const today = new Date().toLocaleDateString("hi-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const text = `सेवा में,
${designationName},
${officeName},
जिला - ${district}

विषय: ${subjectLabel} से संबंधित समस्या के समाधान हेतु आवेदन

महोदय/महोदया,

सविनय निवेदन है कि मैं ${name}, ग्राम ${village}, जिला ${district} का/की निवासी हूँ। मैं आपका ध्यान निम्नलिखित समस्या की ओर आकर्षित करना चाहता/चाहती हूँ:

${problem}

अतः आपसे विनम्र अनुरोध है कि उपरोक्त समस्या का शीघ्र संज्ञान लेते हुए आवश्यक कार्रवाई करने का कष्ट करें, ताकि ग्रामवासियों को इससे राहत मिल सके। इस संबंध में की गई किसी भी कार्रवाई की जानकारी नीचे दिए गए संपर्क सूत्र पर देने का कष्ट करें।

आपकी इस कृपा के लिए सदैव आभारी रहूँगा/रहूँगी।

धन्यवाद सहित,

नाम: ${name}
गाँव: ${village}
जिला: ${district}
मोबाइल नंबर: ${phone || "उल्लेख नहीं"}
दिनांक: ${today}`;

      setLetter(text);
      setStep(2);
    } catch (e) {
      setError("पत्र बनाने में दिक्कत आई। कृपया दोबारा कोशिश करें।");
    } finally {
      setLoading(false);
    }
  }

  function copyLetter() {
    if (!letterRef.current) return;
    const text = letterRef.current.innerText;

    const showCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const fallbackCopy = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) {
          showCopied();
        } else {
          setError("कॉपी नहीं हो पाया। पत्र को हाथ से चुनकर (select) कॉपी करें।");
        }
      } catch (e) {
        setError("कॉपी नहीं हो पाया। पत्र को हाथ से चुनकर (select) कॉपी करें।");
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function resetAll() {
    setStep(0);
    setDept(null);
    setProblem("");
    setLetter("");
    setError("");
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .gs-root { font-family: 'Noto Sans Devanagari', sans-serif; }
        .gs-serif { font-family: 'Noto Serif Devanagari', serif; }
        .gs-fade { animation: gsFade 0.45s ease both; }
        @keyframes gsFade { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        .gs-stamp { animation: gsStamp 0.6s cubic-bezier(.2,1.4,.4,1) both; }
        @keyframes gsStamp { 0% { opacity: 0; transform: scale(2.2) rotate(-14deg);} 60% { opacity: 1; } 100% { opacity: 1; transform: scale(1) rotate(-8deg);} }
        .gs-card-btn:hover { border-color: #d4af37 !important; background: rgba(212,175,55,0.08) !important; }
        .gs-primary:hover { filter: brightness(1.08); }
        .gs-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .gs-textarea:focus, .gs-input:focus { outline: none; border-color: #d4af37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
        .gs-link-btn:hover { text-decoration: underline; }
        .gs-mic-btn:hover { filter: brightness(1.1); }
        .gs-secondary:hover { background: rgba(212,175,55,0.1) !important; }
        @media (prefers-reduced-motion: reduce) {
          .gs-fade, .gs-stamp { animation: none !important; }
        }
      `}</style>

      <div className="gs-root" style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.emblem}>ग्रा</div>
            <div>
              <h1 className="gs-serif" style={styles.title}>ग्राम सेवा AI</h1>
              <p style={styles.subtitle}>अपनी समस्या बताइए, हम औपचारिक शिकायत पत्र बना देंगे</p>
            </div>
          </div>
        </header>

        <nav style={styles.stepper} aria-label="प्रगति">
          {STEPS.map((s, i) => (
            <div key={s} style={styles.stepItem}>
              <div
                style={{
                  ...styles.stepDot,
                  background: i <= step ? "linear-gradient(145deg, #e8ce7b, #b5892f)" : "rgba(255,255,255,0.08)",
                  color: i <= step ? "#201a0d" : "#7d7a74",
                }}
              >
                {i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: i <= step ? "#f0dfa8" : "#7d7a74" }}>{s}</span>
              {i < STEPS.length - 1 && <div style={styles.stepLine} />}
            </div>
          ))}
        </nav>

        <main style={styles.card}>
          {step === 0 && (
            <div className="gs-fade">
              <h2 style={styles.sectionTitle}>यह समस्या किस विभाग से जुड़ी है?</h2>
              <div style={styles.deptGrid}>
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d.id}
                    className="gs-card-btn"
                    onClick={() => setDept(d.id)}
                    style={{
                      ...styles.deptCard,
                      borderColor: dept === d.id ? "#d4af37" : "rgba(212,175,55,0.25)",
                      background: dept === d.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span style={styles.deptLabel}>{d.label}</span>
                    <span style={styles.deptOffice}>{d.office}</span>
                  </button>
                ))}
              </div>

              {dept === "other" && (
                <div style={{ marginBottom: 18 }}>
                  <label style={styles.label} htmlFor="customDept">विभाग/कार्यालय का नाम लिखें (यदि पता हो)</label>
                  <input
                    id="customDept"
                    className="gs-input"
                    value={customDeptName}
                    onChange={(e) => setCustomDeptName(e.target.value)}
                    placeholder="जैसे: वन विभाग, सहकारी बैंक, नगर पंचायत आदि"
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="problem">अपनी समस्या यहाँ लिखिए (जैसे आप किसी को बोलते हैं, वैसे ही)</label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="gs-mic-btn"
                    style={{
                      ...styles.micBtn,
                      background: listening ? "#c0392b" : "linear-gradient(145deg, #e8ce7b, #b5892f)",
                    }}
                    aria-pressed={listening}
                  >
                    {listening ? "⏹ रोकें" : "🎤 बोलकर लिखें"}
                  </button>
                )}
              </div>
              {listening && <p style={styles.listeningHint}>सुन रहा हूँ... अपनी समस्या बोलिए</p>}
              <textarea
                id="problem"
                className="gs-textarea"
                value={problem}
                onChange={(e) => { setProblem(e.target.value); baseProblemRef.current = e.target.value; }}
                placeholder="उदाहरण: हमारे गाँव खंडाम में पिछले 3 महीने से हैंडपंप खराब है, पानी लाने के लिए 2 किलोमीटर दूर जाना पड़ता है..."
                rows={5}
                style={styles.textarea}
              />

              <div style={styles.footerRow}>
                <span style={styles.hint}>{problem.trim().length}/8 अक्षर न्यूनतम</span>
                <button
                  className="gs-primary"
                  disabled={!canGoToInfo}
                  onClick={() => setStep(1)}
                  style={styles.primaryBtn}
                >
                  आगे बढ़ें →
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="gs-fade">
              <h2 style={styles.sectionTitle}>आपकी जानकारी</h2>
              <p style={styles.helperText}>यह जानकारी पत्र के नीचे लिखी जाएगी, ताकि अधिकारी आपसे संपर्क कर सकें।</p>

              <div style={styles.formGrid}>
                <Field label="पूरा नाम *" value={name} onChange={setName} placeholder="जैसे: रामेश्वर नेताम" />
                <Field label="गाँव *" value={village} onChange={setVillage} placeholder="जैसे: खंडाम" />
                <Field label="जिला *" value={district} onChange={setDistrict} placeholder="नारायणपुर" />
                <Field label="मोबाइल नंबर (वैकल्पिक)" value={phone} onChange={setPhone} placeholder="10 अंकों का नंबर" />
              </div>

              {error && <p style={styles.errorText}>{error}</p>}

              <div style={styles.footerRow}>
                <button className="gs-link-btn" onClick={() => setStep(0)} style={styles.textBtn}>← वापस</button>
                <button
                  className="gs-primary"
                  disabled={!canGenerate || loading}
                  onClick={generateLetter}
                  style={styles.primaryBtn}
                >
                  {loading ? "पत्र बन रहा है..." : "पत्र बनाइए"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="gs-fade">
              <div style={styles.letterWrap}>
                <div style={styles.stamp} className="gs-stamp">स्वीकृत ✓</div>
                <div ref={letterRef} style={styles.letterPaper} className="gs-serif">
                  {letter.split("\n").map((line, i) => (
                    <p key={i} style={styles.letterLine}>{line || "\u00A0"}</p>
                  ))}
                </div>
              </div>

              {error && <p style={styles.errorText}>{error}</p>}

              <div style={styles.actionsGrid}>
                <button className="gs-secondary" onClick={toggleSpeakLetter} style={styles.secondaryBtn}>
                  {speaking ? "⏹ रोकें" : "🔊 पत्र सुनें"}
                </button>
                <button className="gs-secondary" onClick={shareOnWhatsApp} style={styles.secondaryBtn}>
                  📤 WhatsApp पर भेजें
                </button>
              </div>

              <div style={styles.footerRow}>
                <button className="gs-link-btn" onClick={resetAll} style={styles.textBtn}>+ नई शिकायत बनाएं</button>
                <button className="gs-primary" onClick={copyLetter} style={styles.primaryBtn}>
                  {copied ? "कॉपी हो गया ✓" : "पत्र कॉपी करें"}
                </button>
              </div>
            </div>
          )}
        </main>

        <footer style={styles.pageFooter}>
          बनाया गया छत्तीसगढ़ के गाँवों के लिए — ग्राम सेवा AI
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        className="gs-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #15151a 0%, #1c1c22 45%, #201b14 100%)",
    backgroundImage:
      "radial-gradient(circle at 15% 8%, rgba(212,175,55,0.10), transparent 42%), radial-gradient(circle at 88% 92%, rgba(212,175,55,0.07), transparent 45%), linear-gradient(160deg, #15151a 0%, #1c1c22 45%, #201b14 100%)",
    padding: "28px 16px 60px",
  },
  container: { maxWidth: 640, margin: "0 auto" },
  header: { marginBottom: 22 },
  headerRow: { display: "flex", alignItems: "center", gap: 14 },
  emblem: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #e8ce7b, #b5892f)",
    color: "#201a0d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 20,
    flexShrink: 0,
    boxShadow: "0 3px 10px rgba(212,175,55,0.35)",
  },
  title: { margin: 0, fontSize: 26, color: "#f0dfa8", fontWeight: 700, letterSpacing: 0.3 },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#a8a5ac" },
  stepper: { display: "flex", alignItems: "center", marginBottom: 18 },
  stepItem: { display: "flex", alignItems: "center", flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    transition: "background 0.3s",
  },
  stepLabel: { marginLeft: 8, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },
  stepLine: { flex: 1, height: 2, background: "rgba(212,175,55,0.18)", margin: "0 10px" },
  card: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(212,175,55,0.28)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  sectionTitle: { margin: "0 0 14px", fontSize: 18, color: "#f0dfa8", fontWeight: 700 },
  deptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 20,
  },
  deptCard: {
    border: "1.5px solid rgba(212,175,55,0.25)",
    borderRadius: 12,
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    transition: "all 0.15s",
    fontFamily: "inherit",
    background: "rgba(255,255,255,0.03)",
  },
  deptLabel: { fontSize: 14, fontWeight: 700, color: "#f0e6c8" },
  deptOffice: { fontSize: 11.5, color: "#9a968f" },
  label: { display: "block", fontSize: 13.5, fontWeight: 600, color: "#e3d4a3", marginBottom: 6 },
  labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  micBtn: {
    color: "#201a0d",
    border: "none",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
    background: "linear-gradient(145deg, #e8ce7b, #b5892f)",
  },
  listeningHint: { fontSize: 12.5, color: "#e0a05a", fontWeight: 600, margin: "0 0 6px" },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 },
  secondaryBtn: {
    background: "rgba(255,255,255,0.04)",
    color: "#e5c76b",
    border: "1.5px solid rgba(212,175,55,0.5)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    border: "1.5px solid rgba(212,175,55,0.25)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    resize: "vertical",
    color: "#f0e6c8",
    background: "rgba(0,0,0,0.25)",
  },
  input: {
    width: "100%",
    border: "1.5px solid rgba(212,175,55,0.25)",
    borderRadius: 12,
    padding: "10px 13px",
    fontSize: 14.5,
    fontFamily: "inherit",
    color: "#f0e6c8",
    background: "rgba(0,0,0,0.25)",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 },
  fieldWrap: { marginBottom: 4 },
  hint: { fontSize: 12.5, color: "#7d7a74" },
  helperText: { fontSize: 13.5, color: "#a8a5ac", margin: "-6px 0 16px" },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 12,
  },
  primaryBtn: {
    background: "linear-gradient(145deg, #e8ce7b, #b5892f)",
    color: "#201a0d",
    border: "none",
    borderRadius: 10,
    padding: "11px 22px",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "filter 0.15s",
    boxShadow: "0 4px 14px rgba(212,175,55,0.25)",
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#a8a5ac",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  errorText: { color: "#e0785a", fontSize: 13, marginTop: 8 },
  letterWrap: { position: "relative" },
  stamp: {
    position: "absolute",
    top: -14,
    right: -6,
    border: "3px solid #b5892f",
    color: "#8a6a24",
    borderRadius: "50%",
    width: 84,
    height: 84,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 1.2,
    transform: "rotate(-8deg)",
    background: "rgba(255,255,255,0.9)",
    zIndex: 2,
  },
  letterPaper: {
    background: "#fffdf7",
    border: "1px solid #e4ded0",
    borderRadius: 8,
    padding: "26px 24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    maxHeight: 480,
    overflowY: "auto",
  },
  letterLine: { margin: "0 0 8px", fontSize: 15.5, lineHeight: 1.75, color: "#2a2618" },
  pageFooter: { textAlign: "center", marginTop: 26, fontSize: 12, color: "#7d7a74" },
};

