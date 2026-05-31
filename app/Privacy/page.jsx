export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#030d14", minHeight: "100vh", padding: "80px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", color: "#777", fontWeight: 300, lineHeight: 1.9, fontSize: 15 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, background: "#00BFFF", transform: "rotate(45deg)" }} />
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.12em", color: "#fff" }}>AI ASSIST</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 300, color: "#fff", marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: "#333" }}>Last updated: May 31, 2026</p>
        </div>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>1. Information We Collect</h2>
          <p>When you submit a form on our website, we collect your first name, last name, business name, website URL, phone number, and email address. This information is used solely to contact you about our services and schedule consultations.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>2. SMS Communications</h2>
          <p>By providing your phone number, you consent to receive SMS text messages from AI Assist regarding your inquiry, appointment reminders, and follow-up communications. Message and data rates may apply. You can opt out at any time by replying STOP to any message. For help, reply HELP.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>3. How We Use Your Information</h2>
          <p>We use the information you provide to respond to your inquiry, schedule and confirm consultations, send service-related communications via email and SMS, and improve our services. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>4. Data Security</h2>
          <p>We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. Your data is stored securely and accessed only by authorized personnel.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>5. Your Rights</h2>
          <p>You may request to access, update, or delete your personal information at any time by contacting us at hello@aiassist.biz. You may also opt out of SMS communications at any time by replying STOP.</p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>6. Contact</h2>
          <p>If you have any questions about this Privacy Policy, contact us at:<br />
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
