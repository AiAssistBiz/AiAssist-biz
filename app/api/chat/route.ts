import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SESSION_TTL = 30 * 60 * 1000;

type State = "discovery" | "problem_awareness" | "education" | "consideration" | "conversion";
type Sentiment = "positive" | "negative" | "neutral";
type IntentType = "pricing" | "how_it_works" | "business_context" | "browsing" | "booking" | "general";

interface Intent {
  type: IntentType;
  sentiment: Sentiment;
  bookingIntent: boolean;
  flexibleAvailability: boolean;
  availabilityMentioned: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  state: State;
  businessType: string | null;
  painPoints: string[];
  objections: string[];
  topicsRaised: string[];
  questionsAsked: string[];
  engagementLevel: number;
  trustScore: number;
  messageCount: number;
  availabilityMentioned: string | null;
  history: Message[];
  lastActive: number;
}

const sessionStore = new Map<string, Session>();

function getSession(id: string): Session | null {
  const s = sessionStore.get(id);
  if (!s) return null;
  if (Date.now() - s.lastActive > SESSION_TTL) { sessionStore.delete(id); return null; }
  return s;
}

function createSession(): Session {
  return {
    state: "discovery",
    businessType: null,
    painPoints: [],
    objections: [],
    topicsRaised: [],
    questionsAsked: [],
    engagementLevel: 0,
    trustScore: 0,
    messageCount: 0,
    availabilityMentioned: null,
    history: [],
    lastActive: Date.now(),
  };
}

function detectIntent(msg: string): Intent {
  const t = msg.toLowerCase();

  const bookingSignals = /\b(yes lets?|let'?s do (it|monday|tuesday|wednesday|thursday|friday|this|that)|book (it|me|a call)|schedule (a call|me|it|this)|call me|set (it|me) up|monday|tuesday|wednesday|thursday|friday|sign me up|i'?m in|let'?s go|do it|i'?m ready|set up a call|get started)\b/;
  const flexibleSignals = /\b(anytime|any time|whenever|open all day|flexible|doesn'?t matter|either|whatever works|any day|all day)\b/;
  const dayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/;

  const bookingIntent = bookingSignals.test(t);
  const flexibleAvailability = flexibleSignals.test(t);
  const dayMatch = t.match(dayPattern);
  const availabilityMentioned = dayMatch ? dayMatch[0] : null;

  let type: IntentType = "general";
  if (bookingIntent || flexibleAvailability || availabilityMentioned) type = "booking";
  else if (/\b(price|cost|how much|fee|afford|budget|rates?|pay|plan)\b/.test(t)) type = "pricing";
  else if (/\b(how (does|do|it|this)|what is|explain|process|set.?up|demo|show me|integrate)\b/.test(t)) type = "how_it_works";
  else if (/\b(my (business|company|clinic|spa|salon|shop|team|store)|we (are|have|run|do)|our (clients?|customers?|team)|i (own|have|run|operate) a)\b/.test(t)) type = "business_context";
  else if (/\b(just (looking|curious|wondering)|not sure|maybe|thinking about|comparing|researching)\b/.test(t)) type = "browsing";

  return { type, sentiment: scoreSentiment(t), bookingIntent, flexibleAvailability, availabilityMentioned };
}

function scoreSentiment(t: string): Sentiment {
  const p = (t.match(/\b(great|love|yes|yeah|yep|yup|definitely|interested|perfect|exactly|excited|sounds good|absolutely|sure|ok\b|okay|works|monday|tuesday|wednesday|thursday|friday|anytime|let'?s|lets|go ahead|do it|sign me|set it|book|schedule|ready|please|i'?m in)\b/g) || []).length;
  const n = (t.match(/\b(no\b|not\b|don't|bad|hate|doubt|skeptical|tried|waste|expensive|annoyed|cancel|stop|nevermind|not interested)\b/g) || []).length;
  return p > n ? "positive" : n > p ? "negative" : "neutral";
}

function extractContext(msg: string, session: Session): void {
  const t = msg.toLowerCase();

  if (!session.businessType) {
    if (/\b(medspa|med spa|aesthetic|botox|filler|laser|skin care|beauty|wellness|cosmetic|clinic)\b/.test(t)) session.businessType = "medspa";
    else if (/\b(plumb|plumber|hvac|electrician|electric|roofing|roofer|landscap|lawn|cleaning|pest|handyman|contractor|remodel|painting|painter|carpenter|flooring|gutters?|siding|windows?|doors?|garage)\b/.test(t)) session.businessType = "home_services";
    else if (/\b(restaurant|cafe|food|dining|catering|bar\b|bakery)\b/.test(t)) session.businessType = "restaurant";
    else if (/\b(dental|dentist|orthodont|chiro|physio|therapy|therapist|medical|doctor|urgent care|pharmacy)\b/.test(t)) session.businessType = "healthcare";
    else if (/\b(salon|barber|barbershop|nail|lash|spa\b|massage|wax)\b/.test(t)) session.businessType = "beauty";
    else if (/\b(real estate|realtor|broker|property|mortgage|rental)\b/.test(t)) session.businessType = "real_estate";
  }

  const pains: [RegExp, string][] = [
    [/\b(leads?|clients?|customers?|traffic|inquir|prospects?|generat)\b/, "lead generation"],
    [/\b(follow.?up|response time|ghost|slow reply|missed calls?)\b/, "follow-up speed"],
    [/\b(book|appointment|schedul|calendar|no.?show|cancell)\b/, "booking conversion"],
    [/\b(staff|overwhelm|busy|manual work|automat|save time|bandwidth|manag)\b/, "lead management"],
    [/\b(review|reputation|rating|google|trust|credib)\b/, "reputation management"],
    [/\b(revenue|sales|grow|scale|profit|income)\b/, "revenue growth"],
  ];

  for (const [re, pain] of pains) {
    if (re.test(t) && !session.painPoints.includes(pain)) session.painPoints.push(pain);
  }

  const objections: [RegExp, string][] = [
    [/\b(too expensive|can't afford|cost too much|out of budget)\b/, "price"],
    [/\b(tried (before|it|something similar)|didn't work|seen (this|similar))\b/, "skepticism"],
    [/\b(not ready|not now|bad timing|later|busy right now)\b/, "timing"],
    [/\b(need to think|talk to|not my decision|check with)\b/, "authority"],
  ];

  for (const [re, obj] of objections) {
    if (re.test(t) && !session.objections.includes(obj)) session.objections.push(obj);
  }
}

function trackTopic(session: Session, intent: Intent, msg: string): void {
  const t = msg.toLowerCase();
  const add = (topic: string) => { if (!session.topicsRaised.includes(topic)) session.topicsRaised.push(topic); };
  if (intent.type !== "general") add(intent.type);
  if (/\b(roi|return|result|outcome|case study|success)\b/.test(t)) add("roi");
  if (/\b(compet|vs\b|alternative|other (options?|tools?|platforms?))\b/.test(t)) add("alternatives");
}

function updateScores(session: Session, intent: Intent): void {
  const delta: Record<IntentType, number> = { business_context: 3, how_it_works: 2, pricing: 2, browsing: 0, booking: 4, general: 1 };
  session.engagementLevel += delta[intent.type] ?? 1;
  if (intent.sentiment === "positive") session.engagementLevel += 1;
  if (intent.bookingIntent) session.engagementLevel += 2;
  if (session.painPoints.length > 0) session.trustScore += 1;
  if (session.messageCount > 3) session.trustScore += 1;
  if (intent.sentiment === "negative") session.trustScore = Math.max(0, session.trustScore - 1);
}

function transition(session: Session, intent: Intent): void {
  const { state, painPoints, businessType } = session;

  const stateOrder: State[] = ["discovery", "problem_awareness", "education", "consideration", "conversion"];
  const currentIndex = stateOrder.indexOf(state);

  const map: Record<State, () => State> = {
    discovery: () => {
      if (intent.bookingIntent || intent.type === "booking") return "conversion";
      if (businessType && painPoints.length >= 1) return "consideration";
      if (businessType || painPoints.length >= 1) return "problem_awareness";
      return "discovery";
    },
    problem_awareness: () => {
      if (intent.bookingIntent || intent.type === "booking") return "conversion";
      if (intent.sentiment === "positive") return "education";
      return "problem_awareness";
    },
    education: () => {
      if (intent.bookingIntent || intent.type === "booking") return "conversion";
      if (intent.sentiment === "positive") return "consideration";
      return "education";
    },
    consideration: () => {
      if (intent.bookingIntent || intent.sentiment === "positive") return "conversion";
      return "consideration";
    },
    conversion: () => "conversion",
  };

  const next = (map[state] ?? (() => state))();
  const nextIndex = stateOrder.indexOf(next);
  session.state = nextIndex >= currentIndex ? next : state;
}

function tone(businessType: string | null): string {
  const tones: Record<string, string> = {
    medspa: "Warm, unhurried, concierge-level. Clients here value feeling understood. Never clinical, never pushy.",
    home_services: "Direct, practical, confident. Busy tradespeople respect straight talk. Cut to what matters fast.",
    restaurant: "Personable and energetic. These owners are passionate—match their energy.",
    healthcare: "Calm, professional, empathetic. Lead with trust and specificity.",
    beauty: "Warm and relatable. These owners care deeply about client relationships.",
    real_estate: "Sharp and results-oriented. Speed and clarity matter most.",
  };
  return (businessType && tones[businessType]) || "Sharp, warm, and direct. You speak like a trusted advisor—confident without being pushy.";
}

function buildPrompt(session: Session): string {
  const { state, engagementLevel, trustScore, messageCount, businessType, painPoints, availabilityMentioned, objections } = session;

  const knownContext = [
    businessType ? `- Business type: ${businessType}` : null,
    painPoints.length ? `- Pain points: ${painPoints.join(", ")}` : null,
    availabilityMentioned ? `- Availability mentioned: ${availabilityMentioned}` : null,
  ].filter(Boolean).join("\n");

  const stageInstructions: Record<State, string> = {
    discovery: `You don't yet know their business or needs. Ask one clear question to find out. If they already told you in this message, acknowledge it and move forward instead.`,
    problem_awareness: `You know their situation. Briefly confirm you understand it and signal you can help. Do NOT ask them to restate what they already shared.`,
    education: `Give 1-2 sentences on how AI automation solves their specific problem. Be concrete. Don't lecture.`,
    consideration: `They're clearly interested. Stop explaining. Ask for their name and best contact (phone or email) to connect them with the team. One natural ask.`,
    conversion: `Your only job is booking. If they gave availability, propose a concrete time slot (e.g. "I can put you down for 11 AM — what's the best name, phone, and email for the booking?"). If you already have contact info, confirm someone will reach out. Nothing else.`,
  };

  return [
    `You are a concise, human-like assistant for a company that helps local businesses grow with AI-powered automation. Your job: qualify inbound leads and book them for a sales call. You are not a consultant—you are a smart receptionist who moves things forward.`,
    ``,
    `Tone: ${tone(businessType)}`,
    ``,
    knownContext ? `WHAT YOU ALREADY KNOW:\n${knownContext}\n\nNEVER ask them to repeat this information. Use it in every response.` : `You don't know their business yet. Find out in your first response.`,
    ``,
    `Stage: ${state} | Message #${messageCount} | Engagement: ${engagementLevel} | Trust: ${trustScore}/5`,
    stageInstructions[state],
    objections.length ? `They've expressed: ${objections.join(", ")}. Address calmly and briefly before moving forward.` : "",
    ``,
    `Hard rules:`,
    `- Max 2–3 sentences. Be direct.`,
    `- Never re-ask for info they already gave.`,
    `- No filler: no "Absolutely!", "Great question!", "Of course!", "Certainly!"`,
    `- When they show booking intent or give availability, immediately move to proposing a time and collecting contact info.`,
    `- Sound like a sharp human, not a bot.`,
  ].filter(Boolean).join("\n");
}

function detectContact(msg: string) {
  return {
    email: (msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || null,
    phone: (msg.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/) || [])[0] || null,
    name: (msg.match(/\b(?:my name is|i'?m|i am|call me|it'?s)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) || [])[1] || null,
  };
}

async function fireWebhook(data: Record<string, unknown>): Promise<void> {
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn("[webhook] GOOGLE_SHEETS_WEBHOOK_URL not set");
    return;
  }
  try {
    const res = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString(), source: "ai-chat" }),
    });
    console.log("[webhook] status:", res.status);
  } catch (err) {
    console.error("[webhook] failed:", err);
  }
}

function extractQuestion(text: string): string | null {
  const match = text.match(/[^.!?]*\?/);
  return match ? match[0].trim() : null;
}

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json();
    if (!message || !sessionId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const session: Session = getSession(sessionId) || createSession();
    session.messageCount++;
    session.lastActive = Date.now();

    const intent = detectIntent(message);

    if (intent.availabilityMentioned && !session.availabilityMentioned) {
      session.availabilityMentioned = intent.availabilityMentioned;
    }

    extractContext(message, session);
    updateScores(session, intent);
    trackTopic(session, intent, message);
    transition(session, intent);

    const contact = detectContact(message);
    const hasContact = !!(contact.email || contact.phone);

    await fireWebhook({
      sessionId,
      ...contact,
      businessType: session.businessType,
      painPoints: session.painPoints.join(", "),
      state: session.state,
      engagementLevel: session.engagementLevel,
      trustScore: session.trustScore,
      messageCount: session.messageCount,
      availabilityMentioned: session.availabilityMentioned,
      wantsCall: session.state === "conversion" || session.state === "consideration" ? "yes" : "no",
      needsHuman: session.state === "conversion" ? "yes" : "no",
      triggerType: hasContact ? "contact_provided" : session.state,
      lastMessage: message,
    });

    session.history.push({ role: "user", content: message });
    if (session.history.length > 24) session.history = session.history.slice(-24);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildPrompt(session) },
        ...session.history,
      ],
      temperature: 0.72,
      max_tokens: 200,
      presence_penalty: 0.4,
      frequency_penalty: 0.35,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return NextResponse.json({ error: "No response" }, { status: 500 });

    const q = extractQuestion(reply);
    if (q) session.questionsAsked.push(q);
    if (session.questionsAsked.length > 5) session.questionsAsked = session.questionsAsked.slice(-5);

    session.history.push({ role: "assistant", content: reply });
    sessionStore.set(sessionId, session);

    return NextResponse.json({
      reply,
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          state: session.state,
          intent,
          engagementLevel: session.engagementLevel,
          trustScore: session.trustScore,
          painPoints: session.painPoints,
          businessType: session.businessType,
          availabilityMentioned: session.availabilityMentioned,
          topicsRaised: session.topicsRaised,
          questionsAsked: session.questionsAsked,
        },
      }),
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}