export default function TermsOfService() {
  return (
    <div style={{ background: "#030d14", minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", color: "#777", fontWeight: 300, lineHeight: 1.9, fontSize: 15 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, background: "#00BFFF", transform: "rotate(45deg)" }} />
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.12em", color: "#fff" }}>AI ASSIST</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 300, color: "#fff", marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: "#333" }}>Last updated: May 31, 2026</p>
        </div>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>1. Acceptance of Terms</h2>
          <p>By accessing or using the AI Assist website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>2. Services</h2>
          <p>AI Assist provides done-for-you AI automation systems for local businesses including AI chat assistants, missed call text-back, lead capture, and appointment booking services. Service details, pricing, and deliverables are outlined in individual client agreements.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>3. Payment Terms</h2>
          <p>Services are billed on a monthly subscription basis plus a one-time setup fee. Payments are due at the start of each billing cycle. Failure to pay may result in suspension of services. Setup fees are non-refundable once onboarding has begun.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>4. Cancellation</h2>
          <p>You may cancel your subscription at any time with 30 days written notice. Cancellations take effect at the end of the current billing period. No refunds are issued for partial months.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>5. Client Responsibilities</h2>
          <p>You are responsible for providing accurate business information, timely responses during onboarding, and ensuring your use of AI Assist services complies with applicable laws and regulations in your jurisdiction.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>6. Limitation of Liability</h2>
          <p>AI Assist is not liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid by you in the three months prior to the claim.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>7. Intellectual Property</h2>
          <p>All content, systems, and materials provided by AI Assist remain the intellectual property of AI Assist unless explicitly transferred in writing. You may not resell or redistribute our systems without written permission.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>8. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. Continued use of our services after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>9. Contact</h2>
          <p>Questions about these Terms? Contact us at:<br />
            <span style={{ color: "#00BFFF" }}>hello@aiassist.biz</span><br />
            AI Assist · Sacramento, CA
          </p>
        </section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #071825" }}>
          <a href="/" style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0073A8", textDecoration: "none" }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
