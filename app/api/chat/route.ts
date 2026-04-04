import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SESSION_TTL = 30 * 60 * 1000;

type State = "discovery" | "problem_awareness" | "education" | "consideration" | "booking" | "contact_capture" | "conversion";
type Sentiment = "positive" | "negative" | "neutral";
type IntentType = "pricing" | "how_it_works" | "business_context" | "browsing" | "booking" | "general";
type AssistantAction =
  | "asked_business_type"
  | "asked_pain_points"
  | "asked_booking_interest"
  | "offered_call"
  | "asked_time_preference"
  | "asked_contact_details"
  | "proposed_time"
  | "confirmed_booking"
  | "general";

interface Intent {
  type: IntentType;
  sentiment: Sentiment;
  isAffirmative: boolean;
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
  lastAssistantAction: AssistantAction;
  availabilityMentioned: string | null;
  contactCollected: { name: string | null; email: string | null; phone: string | null };
  engagementLevel: number;
  trustScore: number;
  messageCount: number;
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
    lastAssistantAction: "general",
    availabilityMentioned: null,
    contactCollected: { name: null, email: null, phone: null },
    engagementLevel: 0,
    trustScore: 0,
    messageCount: 0,
    history: [],
    lastActive: Date.now(),
  };
}

function normalizeInput(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/\bye+s?\b/g, "yes")
    .replace(/\bya+\b/g, "yeah")
    .replace(/\byup+\b/g, "yup")
    .replace(/\bsure+\b/g, "sure")
    .replace(/\bokay+\b/g, "okay")
    .replace(/ye\s+s\b/g, "yes")
    .replace(/ye\s+splease/g, "yes please")
    .trim();
}

function detectIntent(msg: string, session: Session): Intent {
  const raw = msg.toLowerCase();
  const t = normalizeInput(msg);

  const affirmativePatterns = /^(yes|yeah|yep|yup|sure|okay|ok|absolutely|definitely|sounds good|let'?s do it|let'?s go|do it|i'?m in|please|yes please|of course|go ahead|that works|perfect|great|cool|alright|for sure)\b/;
  const bookingSignals = /\b(book (it|me|a call|a time)|schedule (a call|me|it)|call me|set (it|me) up|sign me up|get started|let'?s talk|set up a call|i'?m ready to (talk|start|book)|yes lets?|let'?s do (monday|tuesday|wednesday|thursday|friday|this|that))\b/;
  const flexibleSignals = /\b(anytime|any time|whenever|open all day|flexible|doesn'?t matter|whatever works|any day|all day|open)\b/;
  const dayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/;

  const isAffirmative = affirmativePatterns.test(t) || (t.length < 20 && /\b(yes|yeah|yep|yup|sure|ok|okay|please|do it)\b/.test(t));

  const contextualBookingIntent =
    isAffirmative &&
    (session.lastAssistantAction === "asked_booking_interest" ||
      session.lastAssistantAction === "offered_call" ||
      session.lastAssistantAction === "asked_time_preference" ||
      session.lastAssistantAction === "proposed_time");

  const explicitBookingIntent = bookingSignals.test(t) || bookingSignals.test(raw);
  const bookingIntent = contextualBookingIntent || explicitBookingIntent;

  const flexibleAvailability = flexibleSignals.test(t);
  const dayMatch = t.match(dayPattern);
  const availabilityMentioned = dayMatch ? dayMatch[0] : null;

  let type: IntentType = "general";
  if (bookingIntent || flexibleAvailability || availabilityMentioned) type = "booking";
  else if (/\b(price|cost|how much|fee|afford|budget|rates?|pay|plan)\b/.test(t)) type = "pricing";
  else if (/\b(how (does|do|it|this)|what is|explain|process|set.?up|demo|show me|integrate)\b/.test(t)) type = "how_it_works";
  else if (/\b(my (business|company|clinic|spa|salon|shop|team|store)|we (are|have|run|do)|our (clients?|customers?|team)|i (own|have|run|operate) a)\b/.test(t)) type = "business_context";
  else if (/\b(just (looking|curious|wondering)|not sure|maybe|thinking about|comparing|researching)\b/.test(t)) type = "browsing";

  return {
    type,
    sentiment: scoreSentiment(t),
    isAffirmative,
    bookingIntent,
    flexibleAvailability,
    availabilityMentioned,
  };
}

function scoreSentiment(t: string): Sentiment {
  const p = (t.match(/\b(great|love|yes|yeah|yep|yup|definitely|interested|perfect|exactly|excited|sounds good|absolutely|sure|okay|ok\b|works|monday|tuesday|wednesday|thursday|friday|anytime|lets|go ahead|do it|book|schedule|ready|please|i'?m in|for sure)\b/g) || []).length;
  const n = (t.match(/\b(no\b|not\b|don't|bad|hate|doubt|skeptical|tried|waste|expensive|annoyed|cancel|stop|nevermind|not interested)\b/g) || []).length;
  return p > n ? "positive" : n > p ? "negative" : "neutral";
}

function extractContext(msg: string, session: Session): void {
  const t = normalizeInput(msg);

  if (!session.businessType) {
    if (/\b(medspa|med spa|aesthetic|botox|filler|laser|skin care|beauty|wellness|cosmetic|clinic)\b/.test(t)) session.businessType = "medspa";
    else if (/\b(plumb|plumber|hvac|electrician|electric|roofing|roofer|landscap|lawn|cleaning|pest|handyman|contractor|remodel|painting|painter|carpenter|flooring|gutters?|siding|windows?|doors?|garage)\b/.test(t)) session.businessType = "home_services";
    else if (/\b(restaurant|cafe|food|dining|catering|bar\b|bakery)\b/.test(t)) session.businessType = "restaurant";
    else if (/\b(dental|dentist|orthodont|chiro|physio|therapy|therapist|medical|doctor|urgent care|pharmacy)\b/.test(t)) session.businessType = "healthcare";
    else if (/\b(salon|barber|barbershop|nail|lash|spa\b|massage|wax)\b/.test(t)) session.businessType = "beauty";
    else if (/\b(real estate|realtor|broker|property|mortgage|rental)\b/.test(t)) session.businessType = "real_estate";
  }

  const pains: [RegExp, string][] = [
    [/\b(leads?|lead gen|generating leads|get (more )?clients?|get (more )?customers?|traffic|inquir|prospects?)\b/, "lead generation"],
    [/\b(follow.?up|response time|ghost|slow reply|missed calls?)\b/, "follow-up speed"],
    [/\b(booking conversion|no.?show|cancell|appointment)\b/, "booking conversion"],
    [/\b(manag|managing|management|organize|track|handle|overwhelm|busy|manual|automat|save time|bandwidth)\b/, "lead management"],
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

function extractContact(msg: string, session: Session): void {
  const email = (msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || null;
  const phone = (msg.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/) || [])[0] || null;
  const name = (msg.match(/\b(?:my name is|i'?m|i am|call me|it'?s|name'?s)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) || [])[1] || null;

  if (email) session.contactCollected.email = email;
  if (phone) session.contactCollected.phone = phone;
  if (name) session.contactCollected.name = name;
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

  const stateOrder: State[] = ["discovery", "problem_awareness", "education", "consideration", "booking", "contact_capture", "conversion"];
  const currentIndex = stateOrder.indexOf(state);

  const map: Record<State, () => State> = {
    discovery: () => {
      if (intent.bookingIntent) return "booking";
      if (businessType && painPoints.length >= 1) return "consideration";
      if (businessType || painPoints.length >= 1) return "problem_awareness";
      return "discovery";
    },
    problem_awareness: () => {
      if (intent.bookingIntent) return "booking";
      if (intent.sentiment === "positive" || intent.isAffirmative) return "consideration";
      return "problem_awareness";
    },
    education: () => {
      if (intent.bookingIntent) return "booking";
      if (intent.sentiment === "positive" || intent.isAffirmative) return "consideration";
      return "education";
    },
    consideration: () => {
      if (intent.bookingIntent || intent.isAffirmative) return "booking";
      return "consideration";
    },
    booking: () => {
      const hasAllContact = session.contactCollected.email || session.contactCollected.phone;
      if (hasAllContact) return "conversion";
      return "contact_capture";
    },
    contact_capture: () => {
      const hasAllContact = session.contactCollected.email || session.contactCollected.phone;
      if (hasAllContact) return "conversion";
      return "contact_capture";
    },
    conversion: () => "conversion",
  };

  const next = (map[state] ?? (() => state))();
  const nextIndex = stateOrder.indexOf(next);
  session.state = nextIndex >= currentIndex ? next : state;
}

function inferLastAssistantAction(text: string): AssistantAction {
  const t = text.toLowerCase();
  if (/what.*(kind|type).*(business|industry|do you run|do you do)/i.test(t)) return "asked_business_type";
  if (/what.*(challeng|struggl|pain|problem|issue|need help)/i.test(t)) return "asked_pain_points";
  if (/(like to (book|schedule)|want to (book|schedule)|book a (call|time|meeting)|schedule a (call|time|meeting)|set up a (call|time|meeting))/i.test(t)) return "asked_booking_interest";
  if (/(would you like|want to connect|speak with|talk to|hop on a call|set up a call|book a call)/i.test(t)) return "offered_call";
  if (/(what (day|time|days|times)|when (work|are you|is good)|availability|prefer.*time)/i.test(t)) return "asked_time_preference";
  if (/(name|email|phone|number|contact|reach you|put on)/i.test(t)) return "asked_contact_details";
  if (/(pencil you in|put you down|11|2 pm|am|scheduled for|booked for)/i.test(t)) return "proposed_time";
  if (/(looking forward|see you|our team will|someone will reach|will be in touch)/i.test(t)) return "confirmed_booking";
  return "general";
}

function tone(businessType: string | null): string {
  const tones: Record<string, string> = {
    medspa: "Warm, unhurried, concierge-level. Never clinical, never pushy.",
    home_services: "Direct, practical, confident. Busy tradespeople respect straight talk. Cut to what matters fast.",
    restaurant: "Personable and energetic. Match their passion.",
    healthcare: "Calm, professional, empathetic. Lead with trust.",
    beauty: "Warm and relatable. Human-first.",
    real_estate: "Sharp, results-oriented. Speed and clarity.",
  };
  return (businessType && tones[businessType]) || "Sharp, warm, and direct. A trusted advisor—confident without being pushy.";
}

function buildPrompt(session: Session): string {
  const { state, engagementLevel, trustScore, messageCount, businessType, painPoints, availabilityMentioned, objections, contactCollected } = session;

  const knownFacts = [
    businessType ? `- Business type: ${businessType}` : null,
    painPoints.length ? `- Pain points: ${painPoints.join(", ")}` : null,
    availabilityMentioned ? `- Availability they mentioned: ${availabilityMentioned}` : null,
    contactCollected.name ? `- Their name: ${contactCollected.name}` : null,
    contactCollected.email ? `- Their email: ${contactCollected.email}` : null,
    contactCollected.phone ? `- Their phone: ${contactCollected.phone}` : null,
  ].filter(Boolean).join("\n");

  const hasContact = contactCollected.email || contactCollected.phone;

  const stageInstructions: Record<State, string> = {
    discovery: `You don't know their business or needs yet. Ask one clear question to find out. If they told you in this message, acknowledge it and move forward immediately.`,
    problem_awareness: `You know their situation. Briefly confirm it and signal you can help. Do NOT ask them to restate what they already shared.`,
    education: `Give 1–2 sentences on how AI automation solves their specific problem. Be concrete, not generic. Create interest, not information overload.`,
    consideration: `They're engaged. Stop explaining. Ask if they'd like to book a quick call with the team to see how this works for their specific situation.`,
    booking: availabilityMentioned
      ? `They've indicated ${availabilityMentioned} works. Propose a specific time (e.g. "I can put you down for ${availabilityMentioned} at 11:00 AM or 2:00 PM") and ask for their name, phone number, and email to confirm it.`
      : `They want to book. If they gave a day, propose a time. If not, ask what day works and what name/number/email to put on it. Keep it natural and brief.`,
    contact_capture: hasContact
      ? `You have some contact info. Ask for whatever is still missing (${!contactCollected.name ? "name, " : ""}${!contactCollected.phone ? "phone, " : ""}${!contactCollected.email ? "email" : ""}). Keep it to one natural ask.`
      : `You need their contact details to complete the booking. Ask naturally for their name, best phone number, and email. One ask, conversational tone.`,
    conversion: `Booking is done. Confirm the details warmly and let them know the team will be in touch. Keep it brief and human.`,
  };

  return [
    `You are a concise, human-like assistant for a company that helps local businesses grow with AI-powered automation. Your job: qualify inbound leads and book them for a sales call. You are a smart human receptionist—not a consultant, not a chatbot.`,
    ``,
    `Tone: ${tone(businessType)}`,
    ``,
    knownFacts
      ? `CONFIRMED FACTS ABOUT THIS PERSON (do not ask for this again under any circumstances):\n${knownFacts}`
      : `You don't know their business yet. Find out first.`,
    ``,
    `Conversation stage: ${state} | Message #${messageCount} | Engagement: ${engagementLevel} | Trust: ${trustScore}/5`,
    ``,
    `What to do right now:\n${stageInstructions[state]}`,
    objections.length ? `\nThey've expressed concern about: ${objections.join(", ")}. Acknowledge briefly before moving forward.` : "",
    ``,
    `Non-negotiable rules:`,
    `- NEVER ask for information already listed in CONFIRMED FACTS.`,
    `- NEVER go back to discovery questions after booking intent is confirmed.`,
    `- If the user said yes to a booking offer, treat it as confirmed booking intent and proceed to scheduling.`,
    `- Max 2–3 sentences per response.`,
    `- No filler openers: no "Absolutely!", "Great question!", "Of course!", "Certainly!"`,
    `- Sound like a sharp, helpful human—not a bot.`,
  ].filter(Boolean).join("\n");
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

    const intent = detectIntent(message, session);

    if (intent.availabilityMentioned && !session.availabilityMentioned) {
      session.availabilityMentioned = intent.availabilityMentioned;
    }

    extractContext(message, session);
    extractContact(message, session);
    updateScores(session, intent);
    transition(session, intent);

    await fireWebhook({
      sessionId,
      name: session.contactCollected.name,
      email: session.contactCollected.email,
      phone: session.contactCollected.phone,
      businessType: session.businessType,
      painPoints: session.painPoints.join(", "),
      state: session.state,
      engagementLevel: session.engagementLevel,
      trustScore: session.trustScore,
      messageCount: session.messageCount,
      availabilityMentioned: session.availabilityMentioned,
      wantsCall: ["booking", "contact_capture", "conversion", "consideration"].includes(session.state) ? "yes" : "no",
      needsHuman: ["booking", "contact_capture", "conversion"].includes(session.state) ? "yes" : "no",
      lastMessage: message,
      lastAssistantAction: session.lastAssistantAction,
    });

    session.history.push({ role: "user", content: message });
    if (session.history.length > 24) session.history = session.history.slice(-24);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildPrompt(session) },
        ...session.history,
      ],
      temperature: 0.7,
      max_tokens: 200,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return NextResponse.json({ error: "No response" }, { status: 500 });

    session.lastAssistantAction = inferLastAssistantAction(reply);

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
          lastAssistantAction: session.lastAssistantAction,
          engagementLevel: session.engagementLevel,
          trustScore: session.trustScore,
          painPoints: session.painPoints,
          businessType: session.businessType,
          availabilityMentioned: session.availabilityMentioned,
          contactCollected: session.contactCollected,
        },
      }),
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}