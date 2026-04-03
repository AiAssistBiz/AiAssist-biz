"use client";

import { useEffect, useRef, useState } from "react";

const BLUE        = "#00BFFF";
const BLUE_LIGHT  = "#7DDFFF";
const BLUE_DIM    = "#0073A8";

const WEBHOOK_URL  = "https://script.google.com/macros/s/AKfycbzUSz7eas1uF3_YVMD3_9XVDIGxxsLlPuHlDC0UVzHTEc80X_PpCXppcO6FsiLSRA/exec";
const CALENDLY_URL = "https://calendly.com/frontdesk-aiassist/med-spa-consultation";

// ── Utilities ────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeSection({ children, delay = 0, className = "" }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(36px)",
      transition: `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function GoldRule({ className = "" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)`, flex: 1 }} />
    </div>
  );
}

function EyebrowLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-2 mb-5">
      <span style={{ display: "block", width: 28, height: 1, background: BLUE }} />
      <span style={{ letterSpacing: "0.22em", fontSize: 11, color: BLUE, textTransform: "uppercase", fontWeight: 500 }}>
        {children}
      </span>
      <span style={{ display: "block", width: 28, height: 1, background: BLUE }} />
    </div>
  );
}

function BlueButton({ children, secondary = false, onClick, fullWidth = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        letterSpacing: "0.15em",
        fontSize: 13,
        textTransform: "uppercase",
        fontWeight: 600,
        width: fullWidth ? "100%" : "auto",
        padding: "15px 32px",
        border: secondary ? `1px solid ${hov ? BLUE_LIGHT : "#555"}` : "none",
        background: secondary
          ? "transparent"
          : hov
          ? `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE})`
          : `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})`,
        color: secondary ? (hov ? BLUE_LIGHT : "#aaa") : "#020d14",
        cursor: "pointer",
        transition: "all 0.35s ease",
        position: "relative",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ── Booking Modal ────────────────────────────────────────────

function BookingModal({ onClose }) {
  const [step, setStep]      = useState("form");
  const [submitting, setSub] = useState(false);
  const [error, setError]    = useState("");
  const [form, setForm]      = useState({
    firstName: "", lastName: "", businessName: "",
    website: "", phone: "", email: "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const allFilled = Object.values(form).every(v => v.trim() !== "");

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
    setSub(true);
    setError("");
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString() }),
      });
      setStep("calendar");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSub(false);
    }
  };

  const calendlyEmbed = `${CALENDLY_URL}?embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&name=${encodeURIComponent(form.firstName + " " + form.lastName)}&email=${encodeURIComponent(form.email)}&phone=${encodeURIComponent(form.phone)}`;

  const inputStyle = {
    width: "100%", background: "#040f1a", border: "1px solid #0d2030",
    color: "#fff", fontSize: 14, padding: "12px 16px", outline: "none",
    borderRadius: 6, transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block", fontSize: 11, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "#555", marginBottom: 6,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: step === "calendar" ? 780 : 560,
          maxHeight: "90vh",
          background: "linear-gradient(160deg, #071825, #030d14)",
          border: "1px solid #0d2030",
          borderRadius: 16,
          boxShadow: `0 0 80px rgba(0,191,255,0.08), 0 32px 64px rgba(0,0,0,0.7)`,
        }}
      >
        {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos,brd],i) => (
          <span key={i} className={`absolute ${pos} ${brd} w-5 h-5`} style={{ borderColor: `${BLUE}50` }} />
        ))}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #0d2030" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 6, height: 6, background: BLUE, transform: "rotate(45deg)" }} />
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.1em", color: "#fff", textTransform: "uppercase" }}>
                {step === "form" ? "Get Your Free AI Lead Audit" : "Pick a Time"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#0073A8", letterSpacing: "0.05em" }}>
              {step === "form" ? "Tell us about your business — takes 60 seconds." : "Choose a time that works for you."}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "#0d2030" }}>
          <div style={{ height: "100%", width: step === "form" ? "50%" : "100%", background: `linear-gradient(90deg, ${BLUE}, ${BLUE_LIGHT})`, transition: "width 0.6s ease" }} />
        </div>

        {/* Step 1 — Form */}
        {step === "form" && (
          <div className="overflow-y-auto px-6 py-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>First Name</label>
                <input style={inputStyle} value={form.firstName} onChange={set("firstName")} placeholder="Jane"
                  onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input style={inputStyle} value={form.lastName} onChange={set("lastName")} placeholder="Smith"
                  onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input style={inputStyle} value={form.businessName} onChange={set("businessName")} placeholder="Glow Med Spa"
                onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={set("website")} placeholder="https://yoursite.com"
                onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="(916) 555-0100" type="tel"
                onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} value={form.email} onChange={set("email")} placeholder="jane@yoursite.com" type="email"
                onFocus={e => (e.target.style.borderColor = `${BLUE}66`)} onBlur={e => (e.target.style.borderColor = "#0d2030")} />
            </div>
            {error && <p style={{ fontSize: 13, color: "#ff6b6b", textAlign: "center" }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!allFilled || submitting}
              style={{
                marginTop: 8, padding: "15px", borderRadius: 6, width: "100%",
                background: allFilled && !submitting ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})` : "#0d2030",
                color: allFilled && !submitting ? "#020d14" : "#333",
                border: "none", fontSize: 13, fontWeight: 700,
                letterSpacing: "0.16em", textTransform: "uppercase",
                cursor: allFilled && !submitting ? "pointer" : "not-allowed", transition: "all 0.3s",
              }}
            >
              {submitting ? "Saving your info..." : "Continue to Scheduling →"}
            </button>
            <p style={{ fontSize: 11, color: "#1a3a52", textAlign: "center", letterSpacing: "0.08em" }}>
              Your info goes directly to our team. No spam, ever.
            </p>
          </div>
        )}

        {/* Step 2 — Calendly */}
        {step === "calendar" && (
          <div className="flex-1 overflow-hidden" style={{ minHeight: 600 }}>
            <iframe src={calendlyEmbed} width="100%" height="100%" frameBorder="0"
              style={{ minHeight: 600, display: "block" }} title="Schedule your consultation" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatusCard ───────────────────────────────────────────────

function StatusCard() {
  return (
    <div style={{
      background: "linear-gradient(145deg, #071825, #040f1a)",
      border: "1px solid #222", padding: "32px 28px", position: "relative",
      boxShadow: `0 0 80px rgba(0,191,255,0.07), 0 32px 64px rgba(0,0,0,0.6)`,
    }}>
      {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos,brd],i) => (
        <span key={i} className={`absolute ${pos} ${brd} w-5 h-5`} style={{ borderColor: BLUE }} />
      ))}
      <div className="flex items-center gap-2 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: BLUE }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: BLUE }} />
        </span>
        <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>Live — Active Now</span>
      </div>
      {[
        { label: "Leads Captured This Week", value: "247" },
        { label: "Average Response Time",    value: "< 2s" },
        { label: "Appointments Booked",      value: "89" },
      ].map(({ label, value }) => (
        <div key={label} className="mb-6 last:mb-0">
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#555", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: "#fff", lineHeight: 1 }}>{value}</div>
          <div style={{ height: 1, marginTop: 16, background: "#0d2030" }} />
        </div>
      ))}
      <div className="mt-8 flex items-center gap-3">
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BLUE}40, transparent)` }} />
        <span style={{ fontSize: 10, letterSpacing: "0.25em", color: BLUE_DIM, textTransform: "uppercase" }}>Your Business. Always On.</span>
      </div>
    </div>
  );
}

// ── HowCard ──────────────────────────────────────────────────

function HowCard({ title, body, delay }) {
  return (
    <FadeSection delay={delay}>
      <div
        style={{ background: "linear-gradient(160deg, #071020 0%, #040f1a 100%)", border: "1px solid #0d2030", transition: "border-color 0.3s", padding: "40px 28px", textAlign: "center", height: "100%" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${BLUE}55`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#0d2030")}
      >
        <div style={{ width: 32, height: 2, background: `linear-gradient(90deg, ${BLUE}, transparent)`, margin: "0 auto 28px" }} />
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 14, letterSpacing: "0.02em" }}>{title}</h3>
        <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "#666", fontWeight: 300 }}>{body}</p>
      </div>
    </FadeSection>
  );
}

// ── ServiceCard ───────────────────────────────────────────────

function ServiceCard({ title, subtitle, bullets, delay }) {
  return (
    <FadeSection delay={delay}>
      <div
        className="h-full"
        style={{ background: "linear-gradient(160deg, #071020 0%, #040f1a 100%)", border: "1px solid #0d2030", transition: "border-color 0.3s", padding: "36px 28px" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${BLUE}55`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#0d2030")}
      >
        <div style={{ width: 28, height: 2, background: `linear-gradient(90deg, ${BLUE}, transparent)`, marginBottom: 20 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "0.02em" }}>{title}</h3>
        <p style={{ fontSize: 13, color: BLUE_DIM, marginBottom: 20, fontStyle: "italic" }}>{subtitle}</p>
        <ul className="flex flex-col gap-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: BLUE, fontSize: 12, marginTop: 2, flexShrink: 0 }}>▹</span>
              <span style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </FadeSection>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function LuxuryLandingPage() {
  const [scrolled,   setScrolled]  = useState(false);
  const [mounted,    setMounted]   = useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [showModal,  setShowModal] = useState(false);
  const [chatReady,  setChatReady] = useState(false);

  // Section refs for nav scroll
  const aboutRef    = useRef(null);
  const servicesRef = useRef(null);
  const resultsRef  = useRef(null);
  const howRef      = useRef(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    // Wait for Widget to mount before allowing chat open
    const timer = setTimeout(() => setChatReady(true), 1500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  const openChat = () => {
    const btn = document.querySelector("[aria-label='Toggle chat']");
    if (btn) {
      btn.click();
    } else {
      // fallback: try after short delay in case widget hasn't mounted yet
      setTimeout(() => {
        const retryBtn = document.querySelector("[aria-label='Toggle chat']");
        if (retryBtn) retryBtn.click();
      }, 500);
    }
  };

  const scrollTo = (ref) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: "#030d14", minHeight: "100vh" }}>

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}

      {mounted && (
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          .ai-shimmer {
            background: linear-gradient(90deg, ${BLUE_DIM} 0%, ${BLUE} 35%, ${BLUE_LIGHT} 50%, ${BLUE} 65%, ${BLUE_DIM} 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 4s linear infinite;
          }
          .hero-headline { animation: fadeUp 1.1s cubic-bezier(.22,1,.36,1) 0.2s  both; }
          .hero-sub      { animation: fadeUp 1.1s cubic-bezier(.22,1,.36,1) 0.45s both; }
          .hero-ctas     { animation: fadeUp 1.1s cubic-bezier(.22,1,.36,1) 0.65s both; }
          .hero-card     { animation: fadeUp 1.1s cubic-bezier(.22,1,.36,1) 0.5s  both; }
        `}</style>
      )}

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 72,
        background: scrolled ? "rgba(3,13,20,0.96)" : "rgba(3,13,20,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #091a28" : "1px solid transparent",
        transition: "all 0.5s ease",
      }}>
        <div className="flex items-center justify-between h-full px-5 md:px-12 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, background: BLUE, transform: "rotate(45deg)" }} />
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.12em", color: "#fff" }}>AI ASSIST</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {[["About", aboutRef], ["Services", servicesRef], ["Results", resultsRef], ["Contact", null]].map(([label, ref]) => (
              <button key={label} onClick={() => ref ? scrollTo(ref) : null}
                style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#666", background: "none", border: "none", cursor: "pointer", transition: "color 0.3s" }}
                onMouseEnter={e => (e.target.style.color = BLUE)}
                onMouseLeave={e => (e.target.style.color = "#666")}
              >{label}</button>
            ))}
          </div>
          <div className="hidden md:block">
            <button onClick={() => setShowModal(true)} style={{
              letterSpacing: "0.16em", fontSize: 12, textTransform: "uppercase", fontWeight: 600,
              padding: "10px 28px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})`,
              color: "#020d14", border: "none", cursor: "pointer", borderRadius: 2,
            }}>Get Started</button>
          </div>
          {/* Hamburger */}
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span style={{ display: "block", width: 22, height: 1.5, background: menuOpen ? BLUE : "#888", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(2px, 4px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 1.5, background: menuOpen ? BLUE : "#888", opacity: menuOpen ? 0 : 1, transition: "all 0.3s" }} />
            <span style={{ display: "block", width: 22, height: 1.5, background: menuOpen ? BLUE : "#888", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(2px, -4px)" : "none" }} />
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: "rgba(3,13,20,0.98)", borderBottom: "1px solid #091a28", padding: "20px 24px 28px" }} className="md:hidden flex flex-col gap-5">
            {[["About", aboutRef], ["Services", servicesRef], ["Results", resultsRef], ["Contact", null]].map(([label, ref]) => (
              <button key={label} onClick={() => ref ? scrollTo(ref) : setMenuOpen(false)}
                style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >{label}</button>
            ))}
            <button onClick={() => { setMenuOpen(false); setShowModal(true); }} style={{
              marginTop: 8, letterSpacing: "0.16em", fontSize: 12, textTransform: "uppercase", fontWeight: 600,
              padding: "14px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})`,
              color: "#020d14", border: "none", cursor: "pointer", width: "100%", borderRadius: 2,
            }}>Get Started</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden flex items-center" style={{ minHeight: "100vh", padding: "0 20px" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: `radial-gradient(ellipse 80% 60% at 60% 50%, #071825 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", top: "10%", right: "8%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`, zIndex: 0, pointerEvents: "none" }} />

        <div className="w-full max-w-screen-xl mx-auto relative z-10 pt-24 pb-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <div className="hero-headline">
              <EyebrowLabel>AI-Powered Lead Recovery</EyebrowLabel>
              <h1 style={{ fontSize: "clamp(34px, 5.5vw, 72px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff", marginBottom: 24 }}>
                Never Miss Another Lead Again with an{" "}
                <span className="ai-shimmer">AI Assist</span>
              </h1>
            </div>
            <div className="hero-sub">
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.85, color: "#888", marginBottom: 28 }}>
                AI Assist installs a 24/7 AI assistant that answers inquiries, captures leads, and books appointments automatically — so you stop losing revenue to missed calls and slow responses.
              </p>
              <ul className="flex flex-col gap-2 mb-8">
                {[
                  "Respond to every lead in seconds",
                  "Capture contact info automatically",
                  "Book more appointments without extra staff",
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span style={{ color: BLUE, fontSize: 13, flexShrink: 0 }}>▹</span>
                    <span style={{ fontSize: 15, color: "#999" }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-ctas flex flex-col sm:flex-row gap-3">
              <BlueButton onClick={() => setShowModal(true)} fullWidth>Get Your Free AI Lead Audit</BlueButton>
            </div>
          </div>
          <div className="hero-card hidden sm:block">
            <StatusCard />
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(transparent, #030d14)", zIndex: 0 }} />
      </section>

      {/* ── ABOUT ── */}
      <section ref={aboutRef} className="relative px-5 md:px-12 py-16 md:py-28">
        <GoldRule className="mb-12 md:mb-20" />
        <div className="max-w-3xl mx-auto text-center">
          <FadeSection>
            <EyebrowLabel>About AI Assist</EyebrowLabel>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, lineHeight: 1.2, color: "#fff", marginBottom: 32, letterSpacing: "-0.01em" }}>
              Most businesses don&apos;t have a lead problem.
              <br />
              <span style={{ color: BLUE, fontStyle: "italic" }}>They have a response problem.</span>
            </h2>
          </FadeSection>
          <FadeSection delay={150}>
            <div className="flex flex-col gap-5 text-left" style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "#777" }}>
              <p>Every missed call, delayed reply, or unanswered question is a lost customer — gone to the next business that responded faster. <strong style={{ color: "#aaa", fontWeight: 500 }}>AI Assist fixes that.</strong></p>
              <p>We install an AI-powered assistant directly into your business that responds instantly, qualifies leads, captures contact information, and helps book appointments — 24/7.</p>
              <p style={{ color: "#555" }}>No delays. No missed opportunities. No leads slipping through the cracks.</p>
              <p>This isn&apos;t software you have to learn or manage. It&apos;s a <strong style={{ color: "#aaa", fontWeight: 500 }}>done-for-you system</strong> built around one goal: turn more of your existing traffic into paying customers.</p>
              <p style={{ color: BLUE_DIM, fontStyle: "italic" }}>Because the businesses that win aren&apos;t the ones with the most leads — they&apos;re the ones that respond first.</p>
            </div>
          </FadeSection>
        </div>
        <GoldRule className="mt-12 md:mt-20" />
      </section>

      {/* ── SERVICES ── */}
      <section ref={servicesRef} className="px-5 md:px-12 py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 md:mb-16">
              <EyebrowLabel>What We Do</EyebrowLabel>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em" }}>
                Everything You Need to Stop Losing Leads
              </h2>
            </div>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "#071020" }}>
            <ServiceCard
              title="AI Assistant Installation"
              subtitle="Done-For-You"
              bullets={[
                "Instantly responds to website inquiries",
                "Answers common questions about your services",
                "Qualifies leads based on intent",
                "Captures name, phone, and email automatically",
                "Routes hot prospects to booking",
              ]}
              delay={0}
            />
            <ServiceCard
              title="AI Receptionist"
              subtitle="Missed Call Recovery"
              bullets={[
                "Customer calls → no answer",
                "AI instantly sends a text",
                "Conversation continues automatically",
                "Lead gets qualified and booked",
              ]}
              delay={120}
            />
            <ServiceCard
              title="Automated Follow-Up System"
              subtitle="Never Lose a Lead Again"
              bullets={[
                "Instant first response",
                "Smart follow-up sequences",
                "Re-engagement of cold leads",
                "Consistent communication without manual effort",
              ]}
              delay={240}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howRef} className="px-5 md:px-12 py-16 md:py-24" style={{ background: "#040f1a" }}>
        <div className="max-w-screen-xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 md:mb-16">
              <EyebrowLabel>The Process</EyebrowLabel>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em" }}>
                Simple. Automatic. Effective.
              </h2>
            </div>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "#071020" }}>
            <HowCard title="We Install Your System" body="We build and configure your AI assistant around your business — your tone, your services, your goals. You don't touch a thing." delay={0} />
            <HowCard title="Every Lead Gets a Response" body="The moment someone reaches out — by call, text, or web inquiry — your AI responds instantly, 24/7. No delays, no missed opportunities." delay={120} />
            <HowCard title="Leads Convert Automatically" body="Prospects are qualified, captured, and guided to book — all without you lifting a finger. You just show up to confirmed appointments." delay={240} />
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section ref={resultsRef} className="relative px-5 md:px-12 py-16 md:py-28">
        <GoldRule className="mb-12 md:mb-20" />
        <div className="max-w-2xl mx-auto text-center">
          <FadeSection>
            <EyebrowLabel>Results</EyebrowLabel>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, lineHeight: 1.2, color: "#fff", marginBottom: 16, letterSpacing: "-0.01em" }}>
              This Is Not &ldquo;Nice-to-Have&rdquo; Automation.
            </h2>
            <p style={{ fontSize: 18, fontStyle: "italic", color: BLUE, marginBottom: 32 }}>This is revenue recovery.</p>
          </FadeSection>
          <FadeSection delay={150}>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "#666", marginBottom: 44 }}>
              What clients typically see after installing AI Assist:
            </p>
          </FadeSection>
          <FadeSection delay={250}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: "#091a28", border: "1px solid #0d2030" }}>
              {[
                { stat: "30–70%", label: "increase in lead response speed" },
                { stat: "↓ Missed", label: "significant reduction in missed opportunities" },
                { stat: "More Booked", label: "appointments without hiring extra staff" },
                { stat: "Higher", label: "conversion rates from existing traffic" },
              ].map(({ stat, label }) => (
                <div key={label} style={{ background: "#040f1a", padding: "36px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 600, color: BLUE, lineHeight: 1, marginBottom: 10 }}>{stat}</div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "#555", letterSpacing: "0.04em", lineHeight: 1.6 }}>{label}</p>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
        <GoldRule className="mt-12 md:mt-20" />
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-5 md:px-12 py-20 md:py-36 text-center relative overflow-hidden">
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 280, background: `radial-gradient(ellipse, ${BLUE}14 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div className="max-w-2xl mx-auto relative z-10">
          <FadeSection>
            <EyebrowLabel>Get Started Today</EyebrowLabel>
            <h2 style={{ fontSize: "clamp(32px, 5.5vw, 68px)", fontWeight: 300, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
              Ready to Stop<br />
              <span className="ai-shimmer">Losing Leads?</span>
            </h2>
          </FadeSection>
          <FadeSection delay={150}>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "#666", marginBottom: 40 }}>
              Install a system that responds instantly, follows up automatically, and turns missed opportunities into booked appointments — starting this week.
            </p>
          </FadeSection>
          <FadeSection delay={280}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm sm:max-w-none mx-auto">
              <BlueButton onClick={() => setShowModal(true)}>Get Your Free AI Lead Audit</BlueButton>
            </div>
            <p style={{ marginTop: 24, fontSize: 11, letterSpacing: "0.1em", color: "#1a3a52", textTransform: "uppercase" }}>
              No commitment required · Setup this week · Cancel anytime
            </p>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between px-5 md:px-12 py-8" style={{ borderTop: "1px solid #071825" }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 6, height: 6, background: BLUE, transform: "rotate(45deg)" }} />
          <span style={{ fontSize: 14, letterSpacing: "0.12em", color: "#333" }}>AI ASSIST</span>
        </div>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "#0e2235", textTransform: "uppercase", textAlign: "center" }}>
          © 2026 AI Assist · All Rights Reserved
        </p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Contact"].map(item => (
            <a key={item} href="#"
              style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0e2235", textDecoration: "none", transition: "color 0.3s" }}
              onMouseEnter={e => (e.target.style.color = BLUE)}
              onMouseLeave={e => (e.target.style.color = "#0e2235")}
            >{item}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}
