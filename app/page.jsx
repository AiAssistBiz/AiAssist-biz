"use client";

import { useEffect, useRef, useState } from "react";

const BLUE = "#00BFFF";
const BLUE_LIGHT = "#7DDFFF";
const BLUE_DIM = "#0073A8";

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
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
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

function BlueButton({ children, secondary = false, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        letterSpacing: "0.18em",
        fontSize: 13,
        textTransform: "uppercase",
        fontWeight: 600,
        padding: secondary ? "14px 36px" : "16px 44px",
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
      }}
    >
      {children}
    </button>
  );
}

function StatusCard() {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #071825, #040f1a)",
        border: "1px solid #222",
        padding: "36px 32px",
        position: "relative",
        boxShadow: `0 0 80px rgba(0,191,255,0.07), 0 32px 64px rgba(0,0,0,0.6)`,
      }}
    >
      {[
        { pos: "top-0 left-0",    brd: "border-t border-l" },
        { pos: "top-0 right-0",   brd: "border-t border-r" },
        { pos: "bottom-0 left-0", brd: "border-b border-l" },
        { pos: "bottom-0 right-0",brd: "border-b border-r" },
      ].map(({ pos, brd }, i) => (
        <span key={i} className={`absolute ${pos} ${brd} w-5 h-5`} style={{ borderColor: BLUE }} />
      ))}

      <div className="flex items-center gap-2 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: BLUE }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: BLUE }} />
        </span>
        <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>
          Live — Active Now
        </span>
      </div>

      {[
        { label: "Calls Handled This Week", value: "247" },
        { label: "Average Response Time",   value: "< 2s" },
        { label: "Appointments Booked",     value: "89" },
      ].map(({ label, value }) => (
        <div key={label} className="mb-6 last:mb-0">
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#555", textTransform: "uppercase", marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 36, fontWeight: 300, color: "#fff", lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ height: 1, marginTop: 16, background: "#0d2030" }} />
        </div>
      ))}

      <div className="mt-8 flex items-center gap-3">
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BLUE}40, transparent)` }} />
        <span style={{ fontSize: 10, letterSpacing: "0.25em", color: BLUE_DIM, textTransform: "uppercase" }}>
          Your Business. Always On.
        </span>
      </div>
    </div>
  );
}

function HowCard({ title, body, delay }) {
  return (
    <FadeSection delay={delay}>
      <div
        style={{
          background: "linear-gradient(160deg, #071020 0%, #040f1a 100%)",
          border: "1px solid #0d2030",
          transition: "border-color 0.3s",
          padding: "40px 28px",
          textAlign: "center",
          height: "100%",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${BLUE}55`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#0d2030")}
      >
        <div style={{ width: 32, height: 2, background: `linear-gradient(90deg, ${BLUE}, transparent)`, margin: "0 auto 28px" }} />
        <h3 style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 14, letterSpacing: "0.02em" }}>
          {title}
        </h3>
        <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "#666", fontWeight: 300 }}>
          {body}
        </p>
      </div>
    </FadeSection>
  );
}

export default function LuxuryLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#030d14", minHeight: "100vh" }}>

      {/* Keyframes injected only after client mount — eliminates hydration mismatch */}
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
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "0 48px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(3,13,20,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid #091a28" : "1px solid transparent",
          transition: "all 0.5s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, background: BLUE, transform: "rotate(45deg)" }} />
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "0.12em", color: "#fff" }}>
            AI ASSIST
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {["About", "Services", "Results", "Contact"].map(item => (
            <a
              key={item}
              href="#"
              style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#666", textDecoration: "none", transition: "color 0.3s" }}
              onMouseEnter={e => (e.target.style.color = BLUE)}
              onMouseLeave={e => (e.target.style.color = "#666")}
            >
              {item}
            </a>
          ))}
        </div>
        <BlueButton>Get Started</BlueButton>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "100vh",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `radial-gradient(ellipse 80% 60% at 60% 50%, #071825 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%", right: "8%",
            width: 480, height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: 80,
            alignItems: "center",
            paddingTop: 100,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left */}
          <div>
            <div className="hero-headline">
              <EyebrowLabel>White Glove Concierge Service</EyebrowLabel>
              <h1
                style={{
                  fontSize: "clamp(52px, 6vw, 88px)",
                  fontWeight: 300,
                  lineHeight: 1.06,
                  letterSpacing: "-0.01em",
                  color: "#fff",
                  marginBottom: 28,
                }}
              >
                Never Miss
                <br />
                <span className="ai-shimmer">Another</span>
                <br />
                Opportunity.
              </h1>
            </div>

            <div className="hero-sub">
              <p style={{ fontSize: 17, fontWeight: 300, lineHeight: 1.85, color: "#888", maxWidth: 480, marginBottom: 48 }}>
                Your clients expect an exceptional experience at every touchpoint.
                We ensure every call, every inquiry, every moment is handled with
                the same precision you bring to your work.
              </p>
            </div>

            <div className="hero-ctas" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <BlueButton>Reserve Your Spot</BlueButton>
              <BlueButton secondary>See How It Works</BlueButton>
            </div>


          </div>

          {/* Right — Status Card */}
          <div className="hero-card">
            <StatusCard />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: 120,
            background: "linear-gradient(transparent, #030d14)",
            zIndex: 0,
          }}
        />
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: "120px 48px", position: "relative" }}>
        <GoldRule className="mb-20" />
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <FadeSection>
            <EyebrowLabel>The Reality</EyebrowLabel>
            <h2
              style={{
                fontSize: "clamp(38px, 4.5vw, 62px)",
                fontWeight: 300,
                lineHeight: 1.15,
                color: "#fff",
                marginBottom: 28,
                letterSpacing: "-0.01em",
              }}
            >
              Every Unanswered Call Is a
              <span style={{ color: BLUE, fontStyle: "italic" }}> Client Lost</span>
            </h2>
          </FadeSection>
          <FadeSection delay={150}>
            <p style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.9, color: "#666", marginBottom: 56 }}>
              High-end clients do not leave voicemails. They do not call back.
              When they reach you, they expect a seamless, immediate, and
              personalized response — or they move on to someone who can deliver that.
            </p>
          </FadeSection>
          <FadeSection delay={250}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                background: "#091a28",
                border: "1px solid #0d2030",
              }}
            >
              {[
                { stat: "78%", label: "of callers won't leave a message" },
                { stat: "62%", label: "won't call a second time" },
                { stat: "3×",  label: "higher close rate when answered live" },
              ].map(({ stat, label }) => (
                <div key={label} style={{ background: "#040f1a", padding: "40px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: 52, fontWeight: 300, color: BLUE, lineHeight: 1, marginBottom: 12 }}>
                    {stat}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "#555", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
        <GoldRule className="mt-20" />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeSection>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <EyebrowLabel>The Process</EyebrowLabel>
              <h2 style={{ fontSize: "clamp(34px, 4vw, 56px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.01em" }}>
                Effortless. Invisible. Exceptional.
              </h2>
            </div>
          </FadeSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#071020" }}>
            <HowCard title="We Learn Your Voice"  body="Before anything goes live, we study how you communicate — your tone, your language, your standards. Your clients will never know they're not speaking directly with you." delay={0} />
            <HowCard title="Every Call, Covered"  body="Morning, evening, weekends — every inbound call is received by someone who knows your business as intimately as you do. No voicemail, no hold music, no second chances." delay={120} />
            <HowCard title="You Stay in Control"  body="Detailed summaries, booked appointments, and seamless handoffs delivered directly to you. You remain fully informed while never being interrupted." delay={240} />
          </div>
        </div>
      </section>

      {/* ── MISSED CALL ── */}
      <section style={{ padding: "120px 48px", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800, height: 400,
            background: `radial-gradient(ellipse, ${BLUE}14 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeSection>
            <div
              style={{
                border: "1px solid #0d2030",
                background: "linear-gradient(160deg, #050e18, #030d14)",
                padding: "80px 80px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 80,
                alignItems: "center",
                position: "relative",
              }}
            >
              {[
                { pos: "top-0 left-0",     brd: "border-t border-l" },
                { pos: "top-0 right-0",    brd: "border-t border-r" },
                { pos: "bottom-0 left-0",  brd: "border-b border-l" },
                { pos: "bottom-0 right-0", brd: "border-b border-r" },
              ].map(({ pos, brd }, i) => (
                <span key={i} className={`absolute ${pos} ${brd} w-8 h-8`} style={{ borderColor: `${BLUE}40` }} />
              ))}

              {/* Left */}
              <div>
                <EyebrowLabel>The Cost of Silence</EyebrowLabel>
                <h2 style={{ fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 300, color: "#fff", lineHeight: 1.18, marginBottom: 24 }}>
                  What Does a
                  <br />
                  <span style={{ color: BLUE, fontStyle: "italic" }}>Missed Call</span>
                  <br />
                  Actually Cost You?
                </h2>
                <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "#666" }}>
                  A single missed call from the right client could represent
                  thousands in lost revenue — and an irreparably damaged reputation.
                  In your industry, word travels fast.
                </p>
              </div>

              {/* Right */}
              <div>
                {[
                  { icon: "◈", title: "The Referral That Didn't Wait", body: "A top client refers their colleague. You miss the call. The colleague books with your competitor. That's one relationship — and potentially many more — gone quietly." },
                  { icon: "◈", title: "The Inquiry With a Deadline",   body: "Some opportunities expire within hours. A prospective client evaluating three firms calls all of them at once. The first to respond professionally wins." },
                  { icon: "◈", title: "The Impression That Lasts",     body: "Even if they do leave a message, the standard has already been set. First impressions are made — or broken — in the very first moment." },
                ].map(({ icon, title, body }, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 20,
                      marginBottom: i < 2 ? 32 : 0,
                      paddingBottom: i < 2 ? 32 : 0,
                      borderBottom: i < 2 ? "1px solid #091a28" : "none",
                    }}
                  >
                    <div style={{ fontSize: 16, color: BLUE, flexShrink: 0, marginTop: 2, fontFamily: "monospace" }}>
                      {icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 17, fontWeight: 600, color: "#ddd", marginBottom: 8 }}>{title}</h4>
                      <p style={{ fontSize: 13.5, fontWeight: 300, lineHeight: 1.75, color: "#555" }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "140px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, height: 300,
            background: `radial-gradient(ellipse, ${BLUE}14 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeSection>
            <EyebrowLabel>Begin Your Experience</EyebrowLabel>
            <h2
              style={{
                fontSize: "clamp(44px, 5.5vw, 76px)",
                fontWeight: 300,
                color: "#fff",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 28,
              }}
            >
              Your Business
              <br />
              Deserves to Be
              <br />
              <span className="ai-shimmer">Always Present.</span>
            </h2>
          </FadeSection>
          <FadeSection delay={150}>
            <p style={{ fontSize: 17, fontWeight: 300, lineHeight: 1.9, color: "#666", marginBottom: 52 }}>
              We take on a limited number of clients each quarter to ensure
              every engagement receives the attention it deserves.
              Request your consultation today.
            </p>
          </FadeSection>
          <FadeSection delay={280}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <BlueButton>Request a Consultation</BlueButton>
              <BlueButton secondary>Learn More</BlueButton>
            </div>
            <p style={{ marginTop: 28, fontSize: 12, letterSpacing: "0.1em", color: "#1a3a52", textTransform: "uppercase" }}>
              Intelligent · Responsive · No Commitment Required
            </p>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid #071825",
          padding: "40px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, background: BLUE, transform: "rotate(45deg)" }} />
          <span style={{ fontSize: 16, letterSpacing: "0.12em", color: "#333" }}>AI ASSIST</span>
        </div>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "#0e2235", textTransform: "uppercase" }}>
          © 2026 AI Assist · All Rights Reserved
        </p>
        <div style={{ display: "flex", gap: 32 }}>
          {["Privacy", "Terms", "Contact"].map(item => (
            <a
              key={item}
              href="#"
              style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0e2235", textDecoration: "none", transition: "color 0.3s" }}
              onMouseEnter={e => (e.target.style.color = BLUE)}
              onMouseLeave={e => (e.target.style.color = "#0e2235")}
            >
              {item}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}