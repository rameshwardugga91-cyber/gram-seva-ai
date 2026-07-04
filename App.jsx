import React, { useState, useRef, useEffect } from "react";

const DEPARTMENTS = [
  { id: "road", label: "सड़क एवं निर्माण", office: "लोक निर्माण विभाग (PWD)", designation: "कार्यपालन अभियंता, लोक निर्माण विभाग" },
  { id: "water", label: "पानी एवं हैंडपंप", office: "जनस्वास्थ्य यांत्रिकी विभाग (PHE)", designation: "उप अभियंता, जनस्वास्थ्य यांत्रिकी विभाग" },
  { id: "electricity", label: "बिजली", office: "छत्तीसगढ़ राज्य विद्युत वितरण कंपनी", designation: "कनिष्ठ अभियंता, विद्युत वितरण केंद्र" },
  { id: "ration", label: "राशन एवं PDS", office: "खाद्य एवं नागरिक आपूर्ति विभाग", designation: "खाद्य निरीक्षक / जिला आपूर्ति अधिकारी" },
  { id: "pension", label: "पेंशन एवं योजना", office: "समाज कल्याण विभाग", designation: "जिला समाज कल्याण अधिकारी" },
  { id: "health", label: "स्वास्थ्य", office: "स्वास्थ्य एवं परिवार कल्याण विभाग", designation: "मुख्य चिकित्सा एवं स्वास्थ्य अधिकारी (CMHO)" },
  { id: "school", label: "शिक्षा", office: "शिक्षा विभाग / जिला शिक्षा अधिकारी", designation: "जिला शिक्षा अधिकारी" },
  { id: "other", label: "अन्य समस्या", office: "जिला कलेक्टर कार्यालय", designation: "माननीय जिला कलेक्टर महोदय" },
];

const STEPS = ["समस्या", "जानकारी", "पत्र"];

export default function GramSevaAI() {
  const [step, setStep] = useState(0);
  const [dept, setDept] = useState(null);
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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
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
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      baseProblemRef.current = problem;
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

  async function generateLetter() {
    setLoading(true);
    setError("");
    try {
      const deptObj = DEPARTMENTS.find((d) => d.id === dept);
      const today = new Date().toLocaleDateString("hi-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const prompt = `आप एक अनुभवी भारतीय सरकारी पत्र-लेखक हैं। नीचे दी गई जानकारी के आधार पर एक औपचारिक, विनम्र और प्रभावी शिकायत पत्र हिंदी में लिखें, जो ग्रामीण नागरिक की ओर से संबंधित सरकारी विभाग को भेजा जाएगा।

विभाग: ${deptObj.office}
समस्या का विवरण (नागरिक के शब्दों में): ${problem}
नाम: ${name}
गाँव: ${village}
जिला: ${district}
मोबाइल नंबर: ${phone || "उल्लेख नहीं"}
आज की तारीख: ${today}

पत्र में शामिल हों:
- सेवा में (प्रति) - उचित अधिकारी का पदनाम
- विषय पंक्ति
- सम्मानजनक संबोधन
- समस्या का स्पष्ट, तथ्यात्मक और विनम्र वर्णन (नागरिक के विवरण को व्यवस्थित व औपचारिक भाषा में ढालें, कुछ भी मनगढ़ंत तथ्य न जोड़ें)
- स्पष्ट अनुरोध कि क्या कार्रवाई चाहिए
- धन्यवाद के साथ समापन
- नीचे नाम, गाँव, जिला, मोबाइल नंबर, तारीख

केवल पत्र का पूरा टेक्स्ट दें — कोई अतिरिक्त टिप्पणी, कोई भूमिका, कोई मार्कडाउन प्रतीक (जैसे ** या #) नहीं।`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data?.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      if (!text) throw new Error("empty");
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
        .gs-card-btn:hover { border-color: #2f5233 !important; background: #f4f1e6 !important; }
        .gs-primary:hover { background: #24401f !important; }
        .gs-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .gs-textarea:focus, .gs-input:focus { outline: none; border-color: #2f5233 !important; box-shadow: 0 0 0 3px rgba(47,82,51,0.15); }
        .gs-link-btn:hover { text-decoration: underline; }
        .gs-mic-btn:hover { filter: brightness(1.1); }
        .gs-secondary:hover { background: #f4f1e6 !important; }
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
                  background: i <= step ? "#2f5233" : "#e4ded0",
                  color: i <= step ? "#fdfbf4" : "#8a8371",
                }}
              >
                {i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: i <= step ? "#2f2a1e" : "#a29c8a" }}>{s}</span>
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
                      borderColor: dept === d.id ? "#2f5233" : "#ddd6c3",
                      background: dept === d.id ? "#f4f1e6" : "#fdfbf4",
                    }}
                  >
                    <span style={styles.deptLabel}>{d.label}</span>
                    <span style={styles.deptOffice}>{d.office}</span>
                  </button>
                ))}
              </div>

              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="problem">अपनी समस्या यहाँ लिखिए (जैसे आप किसी को बोलते हैं, वैसे ही)</label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="gs-mic-btn"
                    style={{
                      ...styles.micBtn,
                      background: listening ? "#9b2d23" : "#2f5233",
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
    background: "#f4f1e6",
    backgroundImage:
      "radial-gradient(circle at 15% 10%, rgba(47,82,51,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(155,45,35,0.05), transparent 40%)",
    padding: "28px 16px 60px",
  },
  container: { maxWidth: 640, margin: "0 auto" },
  header: { marginBottom: 22 },
  headerRow: { display: "flex", alignItems: "center", gap: 14 },
  emblem: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#2f5233",
    color: "#fdfbf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 20,
    flexShrink: 0,
    boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
  },
  title: { margin: 0, fontSize: 26, color: "#2f2a1e", fontWeight: 700 },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#6b6455" },
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
  stepLine: { flex: 1, height: 2, background: "#e4ded0", margin: "0 10px" },
  card: {
    background: "#fdfbf4",
    border: "1px solid #e4ded0",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 2px 10px rgba(47,42,30,0.06)",
  },
  sectionTitle: { margin: "0 0 14px", fontSize: 18, color: "#2f2a1e", fontWeight: 700 },
  deptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 20,
  },
  deptCard: {
    border: "1.5px solid #ddd6c3",
    borderRadius: 10,
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  deptLabel: { fontSize: 14, fontWeight: 700, color: "#2f2a1e" },
  deptOffice: { fontSize: 11.5, color: "#7a7361" },
  label: { display: "block", fontSize: 13.5, fontWeight: 600, color: "#3d3826", marginBottom: 6 },
  labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  micBtn: {
    color: "#fdfbf4",
    border: "none",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  listeningHint: { fontSize: 12.5, color: "#9b2d23", fontWeight: 600, margin: "0 0 6px" },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 },
  secondaryBtn: {
    background: "#fdfbf4",
    color: "#2f5233",
    border: "1.5px solid #2f5233",
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    border: "1.5px solid #ddd6c3",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    resize: "vertical",
    color: "#2f2a1e",
    background: "#fff",
  },
  input: {
    width: "100%",
    border: "1.5px solid #ddd6c3",
    borderRadius: 10,
    padding: "10px 13px",
    fontSize: 14.5,
    fontFamily: "inherit",
    color: "#2f2a1e",
    background: "#fff",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 },
  fieldWrap: { marginBottom: 4 },
  hint: { fontSize: 12.5, color: "#a29c8a" },
  helperText: { fontSize: 13.5, color: "#7a7361", margin: "-6px 0 16px" },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 12,
  },
  primaryBtn: {
    background: "#2f5233",
    color: "#fdfbf4",
    border: "none",
    borderRadius: 9,
    padding: "11px 22px",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#6b6455",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  errorText: { color: "#9b2d23", fontSize: 13, marginTop: 8 },
  letterWrap: { position: "relative" },
  stamp: {
    position: "absolute",
    top: -14,
    right: -6,
    border: "3px solid #9b2d23",
    color: "#9b2d23",
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
    background: "rgba(255,255,255,0.85)",
    zIndex: 2,
  },
  letterPaper: {
    background: "#fffdf7",
    border: "1px solid #e4ded0",
    borderRadius: 6,
    padding: "26px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    maxHeight: 480,
    overflowY: "auto",
  },
  letterLine: { margin: "0 0 8px", fontSize: 15.5, lineHeight: 1.75, color: "#2a2618" },
  pageFooter: { textAlign: "center", marginTop: 26, fontSize: 12, color: "#a29c8a" },
};
