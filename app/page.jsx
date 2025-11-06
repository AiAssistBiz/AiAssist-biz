"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Bot,
  BookOpen,
  CheckCircle2,
  Star,
  MousePointerClick,
  Phone,
  Calendar,
  MessageCircle,
  FileText,
} from "lucide-react";
import "./globals.css";

/* ----------------- Small UI Helpers ----------------- */

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
      {children}
    </span>
  );
}

function Section({ id, className = "", children }) {
  return (
    <section id={id} className={`w-full py-16 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

function Container({ className = "", children }) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ----------------- Tool 1: ADA Audit ----------------- */

function AdaAuditTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setEmailSent(false);

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Please enter a full URL starting with http:// or https://");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Audit failed. Please try again.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message || "Something went wrong while running the audit."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEmailSubmit(e) {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setEmailSent(true);

    // Later: POST to /api/lead and pipe into Zapier / CRM
    console.log("ADA lead captured:", { url, email, result });
  }

  return (
    <Section id="ada-audit" className="bg-slate-50">
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Free ADA Compliance Audit</h2>
          <p className="text-slate-600 mb-8">
            Enter your website URL to get a quick automated accessibility check.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full sm:w-2/3 border border-slate-300 rounded-md px-3 py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Scanning..." : "Run Audit"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-8 text-left bg-white rounded-2xl shadow-sm p-6">
              <p className="text-lg font-semibold mb-2">
                Score:{" "}
                <span className="text-emerald-600">{result.score}/100</span>
              </p>
              <p className="text-sm text-slate-600 mb-4">
                This is a quick automated health check, not a full legal opinion,
                but it highlights important accessibility risks on the page.
              </p>

              <ul className="space-y-2">
                {result.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-semibold capitalize">
                      {issue.type.replace("_", " ")}:
                    </span>{" "}
                    {issue.message}{" "}
                    <span className="uppercase text-xs text-slate-500">
                      ({issue.severity})
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-700 mb-3">
                  Want a full breakdown + Loom walkthrough of your risks and fixes?
                  Drop your email and we’ll send it.
                </p>
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full sm:flex-1 border border-slate-300 rounded-md px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                  >
                    Send me the full report
                  </button>
                </form>
                {emailSent && (
                  <p className="mt-2 text-xs text-emerald-600">
                    Got it. You’ll get your full audit and Loom shortly.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

/* ------------- Tool 2: AI Receptionist Demo ------------- */

function generateReceptionistReply(message) {
  const text = message.toLowerCase();

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Hi! I’m your AI receptionist. I can help with bookings, pricing, and basic questions about your services.";
  }

  if (text.includes("price") || text.includes("cost") || text.includes("pricing")) {
    return "Most clients start between $97–$497/month depending on volume and channels. I can connect you with the team to confirm exact pricing for your business.";
  }

  if (text.includes("book") || text.includes("demo") || text.includes("appointment")) {
    return "I can book you into our calendar. What day of the week usually works best, and mornings or afternoons?";
  }

  if (text.includes("hours") || text.includes("open")) {
    return "We effectively cover you 24/7. After-hours calls and chats are answered by the AI receptionist so you don’t lose leads.";
  }

  return "Got it. I’ve noted that. I can also answer questions about pricing, availability, and what’s included in the service.";
}

function ReceptionistDemo() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hey there 👋 I’m your AI receptionist. Ask me about pricing, booking, or how I handle calls.",
    },
  ]);
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { from: "user", text: trimmed };
    const botMsg = { from: "bot", text: generateReceptionistReply(trimmed) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }

  return (
    <Section id="receptionist">
      <Container>
        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Bot className="h-7 w-7 text-emerald-600" />
              AI Receptionist – Live Chat Demo
            </h2>
            <p className="mt-3 text-slate-600">
              This simulates how your AI receptionist would handle website chat.
              For your real offer, we plug into voice, SMS, and your calendar/CRM.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                24/7 response to inbound leads
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                Qualifies, routes, and books appointments
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                Custom script + tone matched to your brand
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              Chat with the AI receptionist
            </div>
            <div className="h-64 overflow-y-auto rounded-xl border border-slate-100 p-3 bg-slate-50 text-sm space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      m.from === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={handleSubmit}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pricing, booking, or hours…"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------- Tool 3: Docs → AI Knowledgebase Demo --------- */

const DEMO_DOCS = [
  {
    title: "Onboarding process",
    keywords: ["onboard", "onboarding", "start", "setup"],
    answer:
      "We start with a 30–45 minute onboarding call to collect your branding, workflows, FAQs, and access to your systems. Most clients are live within 7–14 days.",
  },
  {
    title: "What’s included in ADA compliance",
    keywords: ["ada", "compliance", "accessibility", "widget"],
    answer:
      "We scan your site, fix critical accessibility issues on key pages, install an accessibility widget, and provide a dated compliance statement plus monthly rescan reports.",
  },
  {
    title: "What’s included in AI receptionist",
    keywords: ["receptionist", "calls", "chat", "sms"],
    answer:
      "We set up an always-on AI receptionist that can answer common questions, qualify leads, route urgent issues to you, and book appointments directly on your calendar.",
  },
  {
    title: "What’s included in Docs → AI KB",
    keywords: ["knowledge", "docs", "faq", "pdf", "kb"],
    answer:
      "You upload PDFs, SOPs, FAQs and we train a private AI assistant that answers questions with citations back to your docs. You can embed it on your site or an internal portal.",
  },
];

function findDocAnswer(question) {
  const q = question.toLowerCase();

  for (const doc of DEMO_DOCS) {
    if (doc.keywords.some((kw) => q.includes(kw))) {
      return doc.answer;
    }
  }

  return (
    "This is a simple demo. In production, your AI assistant would search across all of your uploaded PDFs, SOPs, and FAQs and answer with citations."
  );
}

function KnowledgebaseDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);

  function handleAsk(e) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const a = findDocAnswer(trimmed);
    setAnswer(a);
    setHistory((prev) => [{ q: trimmed, a }, ...prev]);
    setQuestion("");
  }

  return (
    <Section id="knowledgebase" className="bg-slate-50">
      <Container>
        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="h-7 w-7 text-emerald-600" />
              Docs → AI Knowledgebase
            </h2>
            <p className="mt-3 text-slate-600">
              This demo pretends your SOPs, PDFs, and FAQs are already loaded.
              In the real service, we’d ingest your documents and train a private AI on them.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                Deflect repetitive support questions
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                Answers grounded in your own docs
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                Embed on your site or in a portal
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Ask your docs a question
            </div>
            <form
              onSubmit={handleAsk}
              className="flex flex-col gap-2 mb-3"
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about onboarding, ADA, receptionist, or docs…"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="self-start rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Ask
              </button>
            </form>

            {answer && (
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
                {answer}
              </div>
            )}

            {history.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Recent questions
                </p>
                <ul className="space-y-2 text-xs text-slate-700 max-h-32 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">Q:</span> {item.q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----------------- Main Page Layout ----------------- */

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-100 bg-white/80">
        <Container className="flex h-16 items-center justify-between">
          <a href="#home" className="text-xl font-semibold tracking-tight">
            <span className="text-slate-900">AI</span>
            <span className="text-emerald-600">Assist</span>
            <span className="text-slate-900">.biz</span>
          </a>
          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#services"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Services
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Pricing
            </a>
            <a
              href="#ada-audit"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ADA Audit
            </a>
            <a
              href="#receptionist"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              AI Receptionist
            </a>
            <a
              href="#knowledgebase"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Knowledgebase
            </a>
            <a
              href="#contact"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Contact
            </a>
            <a
              href="#book"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Book Demo
            </a>
          </div>
        </Container>
      </nav>

      {/* Hero */}
      <Section id="home" className="bg-gradient-to-b from-white to-slate-50">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <Badge>
                14-day delivery • ADA • AI Receptionist • AI Knowledgebase
              </Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Protect. Automate.{" "}
                <span className="text-emerald-600">Scale</span>.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                We make small businesses compliant, convert every missed lead with a
                24/7 AI receptionist, and turn your documents into an AI expert.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#ada-audit"
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-white shadow-sm hover:bg-emerald-500"
                >
                  Run Free ADA Audit
                </a>
                <a
                  href="#book"
                  className="rounded-xl border border-slate-200 px-6 py-3 text-slate-900 shadow-sm hover:bg-white/60"
                >
                  Book a Free Demo
                </a>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> No code for you
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Cancel anytime
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> U.S. based
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-emerald-100 via-white to-transparent blur-2xl" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-5 w-5" /> ADA Shield
                  </div>
                  <div className="text-sm text-slate-600">
                    Automated scan → quick fixes → verification badge for your footer.
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <Bot className="h-5 w-5" /> AI Receptionist
                  </div>
                  <div className="text-sm text-slate-600">
                    Answers calls/chats 24/7, qualifies leads, and books meetings.
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white md:col-span-2">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <BookOpen className="h-5 w-5" /> Docs → AI Knowledgebase
                  </div>
                  <div className="text-sm text-slate-600">
                    Upload PDFs, SOPs, FAQs. Your branded AI answers with citations.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Services */}
      <Section id="services">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              How we future-proof your business
            </h2>
            <p className="mt-3 text-slate-600">
              Compliance. Conversion. Intelligence. Delivered fast.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> ADA Web Compliance
              </div>
              <p className="mt-3 text-slate-600">
                Scan + fix key issues. Add an accessibility widget. Publish a
                verification badge.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Contrast &amp; headings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Keyboard nav &amp; forms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Monthly rescan report
                </li>
              </ul>
              <div className="pt-3">
                <a
                  href="#ada-audit"
                  className="text-emerald-600 hover:underline"
                >
                  Run free audit →
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5" /> AI Receptionist
              </div>
              <p className="mt-3 text-slate-600">
                Answer calls/texts/chats 24/7. Qualify, route, and book appointments automatically.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> CRM + calendar integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Multi-language support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> After-hours capture boost
                </li>
              </ul>
              <div className="pt-3">
                <a href="#receptionist" className="text-emerald-600 hover:underline">
                  Try live chat →
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Docs → AI Knowledgebase
              </div>
              <p className="mt-3 text-slate-600">
                Turn PDFs, SOPs, and FAQs into an AI assistant that answers with citations.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Embed on site or portal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Deflect repetitive tickets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Monthly content refresh
                </li>
              </ul>
              <div className="pt-3">
                <a
                  href="#knowledgebase"
                  className="text-emerald-600 hover:underline"
                >
                  Ask your docs →
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="bg-slate-50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Simple, scalable pricing
            </h2>
            <p className="mt-3 text-slate-600">
              Start with one, scale to all three. Cancel anytime.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="text-xl font-bold">Launch</div>
              <div className="text-3xl font-bold mt-1">
                $97
                <span className="text-base font-medium text-slate-500">
                  /mo
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">+ $497 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> ADA scan
                  &amp; fix plan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accessibility
                  widget
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Badge + monthly report
                </li>
              </ul>
              <a
                href="#ada-audit"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800"
              >
                Start Free Audit
              </a>
            </div>
            <div className="rounded-2xl border-2 border-emerald-500 p-6 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">Automate</div>
                <Badge>Most Popular</Badge>
              </div>
              <div className="text-3xl font-bold mt-1">
                $197
                <span className="text-base font-medium text-slate-500">
                  /mo
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">+ $997 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Everything
                  in Launch
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 24/7 receptionist
                  (voice/chat/SMS)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> CRM + calendar booking
                </li>
              </ul>
              <a
                href="#receptionist"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
              >
                Try AI Receptionist
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="text-xl font-bold">Scale</div>
              <div className="text-3xl font-bold mt-1">
                $497
                <span className="text-base font-medium text-slate-500">
                  /mo
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">+ $1497 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Everything
                  in Automate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Docs → AI knowledgebase
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Custom
                  dashboard + SLAs
                </li>
              </ul>
              <a
                href="#knowledgebase"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-white/60"
              >
                Ask Your Docs
              </a>
            </div>
          </div>
        </Container>
      </Section>

      {/* Tools */}
      <AdaAuditTool />
      <ReceptionistDemo />
      <KnowledgebaseDemo />

      {/* Results */}
      <Section id="results">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Results that speak
            </h2>
            <p className="mt-3 text-slate-600">
              Case studies and real outcomes from small businesses like yours.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Dental Clinic
              </div>
              <p className="mt-2 text-sm text-slate-700">
                <strong>ADA Risk → 0</strong> within 72 hours. +12% organic
                traffic after accessibility fixes.
              </p>
              <div className="flex items-center gap-1 text-amber-500 mt-2">
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5" /> Roofing Company
              </div>
              <p className="mt-2 text-sm text-slate-700">
                <strong>+42% more booked jobs</strong> with 24/7 AI receptionist
                catching after-hours calls.
              </p>
              <div className="flex items-center gap-1 text-amber-500 mt-2">
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> B2B Agency
              </div>
              <p className="mt-2 text-sm text-slate-700">
                <strong>-55% support time</strong> after docs → AI knowledgebase
                deflected repetitive Qs.
              </p>
              <div className="flex items-center gap-1 text-amber-500 mt-2">
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* How It Works */}
      <Section id="how" className="bg-slate-50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Plug &amp; play in 3 steps
            </h2>
            <p className="mt-3 text-slate-600">
              We handle the heavy lifting. You get results.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <MousePointerClick className="h-5 w-5" /> 1) Scan &amp; Audit
              </div>
              <p className="text-slate-600 mt-2">
                Run a free ADA audit or book a demo. We record a 90-sec Loom with findings.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5" /> 2) Deploy &amp; Configure
              </div>
              <p className="text-slate-600 mt-2">
                We install the widget, AI receptionist, and knowledgebase with your brand.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" /> 3) Optimize &amp; Scale
              </div>
              <p className="text-slate-600 mt-2">
                Monthly reports and tweaks. Add channels and docs as you grow.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact / Book Demo */}
      <Section id="contact">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Let’s get your systems online
            </h2>
            <p className="mt-3 text-slate-600">
              Tell us about your business. We’ll reply with a quick Loom and next steps.
            </p>
          </div>
          <div
            id="book"
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(
                  "Form submitted (demo). Wire this up to Zapier, Make, or your backend to capture leads."
                );
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-1">
                <label className="text-sm text-slate-700">Name</label>
                <input
                  required
                  placeholder="Jane Doe"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">Website URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">Message</label>
                <textarea
                  rows={4}
                  placeholder="What do you want to achieve in the next 30 days?"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  By submitting, you agree to our terms &amp; privacy.
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-6 py-2 text-white"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <Container className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} AI Assist — All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="text-slate-600 hover:text-slate-900">
              Terms
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900">
              Privacy
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900">
              Accessibility
            </a>
          </div>
        </Container>
      </footer>
    </div>
  );
}
