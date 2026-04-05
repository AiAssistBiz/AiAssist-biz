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
  businessDescription: string | null;
  painPoints: string[];
  objections: string[];
  topicsRaised: string[];
  questionsAsked: string[];
  lastAssistantAction: AssistantAction;
  bookingIntentConfirmed: boolean;
  bookingConfirmed: boolean;
  proposedTime: string | null;
  availabilityMentioned: string | null;
  contactCollected: { name: string | null; email: string | null; phone: string | null };
  engagementLevel: number;
  trustScore: number;
  messageCount: number;
  history: Message[];
  lastActive: number;
  webhookFiredAt: Set<string>;
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
    businessDescription: null,
    painPoints: [],
    objections: [],
    topicsRaised: [],
    questionsAsked: [],
    lastAssistantAction: "general",
    bookingIntentConfirmed: false,
    bookingConfirmed: false,
    proposedTime: null,
    availabilityMentioned: null,
    contactCollected: { name: null, email: null, phone: null },
    engagementLevel: 0,
    trustScore: 0,
    messageCount: 0,
    history: [],
    lastActive: Date.now(),
    webhookFiredAt: new Set(),
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
    .replace(/ye\s+s?\s*please/g, "yes please")
    .replace(/\bat\s+any\s+time\b/g, "anytime")
    .replace(/\bany\s+time\b/g, "anytime")
    .trim();
}

function detectIntent(msg: string, session: Session): Intent {
  const raw = msg.toLowerCase();
  const t = normalizeInput(msg);

  const affirmativeRe = /^(yes|yeah|yep|yup|sure|okay|ok|absolutely|definitely|sounds good|let'?s do it|let'?s go|do it|i'?m in|please|yes please|of course|go ahead|that works|perfect|great|cool|alright|for sure|sounds great|works for me)\b/;
  const shortAffirmativeRe = /\b(yes|yeah|yep|yup|sure|ok|okay|please|do it|let'?s go|i'?m in)\b/;
  const bookingSignalsRe = /\b(book (it|me|a call|a time)|schedule (a call|me|it)|call me|set (it|me) up|sign me up|get started|let'?s talk|set up a call|i'?m ready to (talk|start|book)|yes lets?|let'?s do (monday|tuesday|wednesday|thursday|friday|this|that))\b/;
  const flexibleRe = /\b(anytime|whenever|open all day|flexible|doesn'?t matter|whatever works|any day|all day)\b/;
  const dayRe = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/;

  const isAffirmative =
    affirmativeRe.test(t) ||
    (t.replace(/[^a-z ]/g, "").trim().split(" ").length <= 4 && shortAffirmativeRe.test(t));

  const bookingRelatedLastAction =
    session.lastAssistantAction === "asked_booking_interest" ||
    session.lastAssistantAction === "offered_call" ||
    session.lastAssistantAction === "asked_time_preference" ||
    session.lastAssistantAction === "proposed_time" ||
    session.lastAssistantAction === "asked_contact_details";

  const contextualBookingIntent = isAffirmative && bookingRelatedLastAction;
  const explicitBookingIntent = bookingSignalsRe.test(t) || bookingSignalsRe.test(raw);
  const flexibleAvailability = flexibleRe.test(t);
  const dayMatch = t.match(dayRe);
  const availabilityMentioned = dayMatch ? dayMatch[0] : null;
  const bookingIntent = contextualBookingIntent || explicitBookingIntent || session.bookingIntentConfirmed;

  let type: IntentType = "general";
  if (bookingIntent || flexibleAvailability || availabilityMentioned) type = "booking";
  else if (/\b(price|cost|how much|fee|afford|budget|rates?|pay|plan)\b/.test(t)) type = "pricing";
  else if (/\b(how (does|do|it|this)|what is|explain|process|set.?up|demo|show me|integrate)\b/.test(t)) type = "how_it_works";
  else if (/\b(my (business|company|clinic|spa|salon|shop|team|store)|we (are|have|run|do)|our (clients?|customers?|team)|i (own|have|run|operate) a)\b/.test(t)) type = "business_context";
  else if (/\b(just (looking|curious|wondering)|not sure|maybe|thinking about|comparing|researching)\b/.test(t)) type = "browsing";

  return { type, sentiment: scoreSentiment(t), isAffirmative, bookingIntent, flexibleAvailability, availabilityMentioned };
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

  if (!session.businessDescription && session.businessType) {
    session.businessDescription = msg.slice(0, 200);
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

  const namedMatch = msg.match(/\b(?:my name is|i'?m|i am|call me|it'?s|name'?s)\s+([a-zA-Z]+(?:\s[a-zA-Z]+)?)/i);
  const bareNameMatch = !namedMatch && (session.state === "contact_capture" || session.state === "booking" || session.bookingIntentConfirmed)
    ? msg.match(/^([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:\d|\()/)
    : null;

  const name = namedMatch ? namedMatch[1] : (bareNameMatch ? bareNameMatch[1] : null);

  if (email && !session.contactCollected.email) session.contactCollected.email = email;
  if (phone && !session.contactCollected.phone) session.contactCollected.phone = phone;
  if (name && !session.contactCollected.name) session.contactCollected.name = name;
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
      if (session.contactCollected.email || session.contactCollected.phone) return "conversion";
      return "contact_capture";
    },
    contact_capture: () => {
      if (session.contactCollected.email || session.contactCollected.phone) return "conversion";
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
  if (/(pencil you in|put you down|10:00|11:00|2:00|:00 am|:00 pm|scheduled for|booked for)/i.test(t)) return "proposed_time";
  if (/(looking forward|see you|our team will|someone will reach|will be in touch|you're all set|you're set)/i.test(t)) return "confirmed_booking";
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

function buildDeterministicReply(session: Session): string | null {
  const { bookingIntentConfirmed, bookingConfirmed, contactCollected, availabilityMentioned, painPoints, businessType } = session;

  if (bookingConfirmed) return null;

  const hasPhone = !!contactCollected.phone;
  const hasEmail = !!contactCollected.email;
  const hasContact = hasPhone || hasEmail;
  const hasName = !!contactCollected.name;

  const businessSummary = businessType ? businessType.replace(/_/g, " ") : "your business";
  const painSummary = painPoints.length ? painPoints.join(" and ") : "your needs";
  const timeSlot = session.proposedTime || (availabilityMentioned ? `${availabilityMentioned} at 10:00 AM` : null);

  if (bookingIntentConfirmed && hasContact) {
    const nameGreeting = hasName ? `, ${contactCollected.name}` : "";
    const timePhrase = timeSlot ? `for ${timeSlot}` : "for the call";
    const contactDetails = [contactCollected.phone, contactCollected.email].filter(Boolean).join(" and ");

    session.bookingConfirmed = true;
    session.state = "conversion";
    session.lastAssistantAction = "confirmed_booking";

    return `Perfect${nameGreeting} — you're all set ${timePhrase}. I've got ${contactDetails} on file. Someone from our team will reach out to help with ${painSummary}.`;
  }

  if (bookingIntentConfirmed && !hasContact && availabilityMentioned && !session.proposedTime) {
    const day = availabilityMentioned.charAt(0).toUpperCase() + availabilityMentioned.slice(1);
    session.proposedTime = `${availabilityMentioned} at 10:00 AM`;
    session.lastAssistantAction = "proposed_time";
    return `${day} works — I can put you down for 10:00 AM. What's the best name, phone number, and email to put on the booking?`;
  }

  if (bookingIntentConfirmed && !hasContact && !availabilityMentioned && !session.proposedTime) {
    session.lastAssistantAction = "asked_time_preference";
    return `I've got you as a ${businessSummary} looking for help with ${painSummary}. What day works for a quick call, and what name, phone number, and email should I put on it?`;
  }

  return null;
}

function buildPrompt(session: Session): string {
  const { state, engagementLevel, trustScore, messageCount, businessType, painPoints, availabilityMentioned, objections, contactCollected } = session;

  const knownFacts = [
    businessType ? `- Business type: ${businessType.replace(/_/g, " ")}` : null,
    painPoints.length ? `- Pain points: ${painPoints.join(", ")}` : null,
    availabilityMentioned ? `- Availability: ${availabilityMentioned}` : null,
    session.proposedTime ? `- Proposed time: ${session.proposedTime}` : null,
    contactCollected.name ? `- Name: ${contactCollected.name}` : null,
    contactCollected.email ? `- Email: ${contactCollected.email}` : null,
    contactCollected.phone ? `- Phone: ${contactCollected.phone}` : null,
  ].filter(Boolean).join("\n");

  const hasContact = contactCollected.email || contactCollected.phone;

  const stageInstructions: Record<State, string> = {
    discovery: `You don't know their business or needs yet. Ask one clear question. If they told you in this message, acknowledge it and move forward immediately.`,
    problem_awareness: `You know their situation. Confirm it briefly and signal you can help. Do NOT re-ask anything already known.`,
    education: `Give 1–2 concrete sentences on how AI automation solves their specific problem. No generic pitches.`,
    consideration: `They're engaged. Ask if they'd like to book a quick call with the team.`,
    booking: availabilityMentioned
      ? `They said ${availabilityMentioned} works. Propose 10:00 AM on that day and ask for name, phone, and email.`
      : `They want to book. Ask what day works and get their name, phone, and email in the same message.`,
    contact_capture: hasContact
      ? `You have partial contact info. Ask only for what's still missing: ${[!contactCollected.name && "name", !contactCollected.phone && "phone", !contactCollected.email && "email"].filter(Boolean).join(", ")}.`
      : `Ask for their name, best phone number, and email to complete the booking. One natural ask.`,
    conversion: `Booking is confirmed. Briefly confirm the time and contact details, and let them know the team will reach out.`,
  };

  return [
    `You are a concise, human-like assistant for a company that helps local businesses grow with AI-powered automation. Your job: qualify inbound leads and book them for a sales call. You are a smart human receptionist—not a consultant, not a chatbot.`,
    ``,
    `Tone: ${tone(businessType)}`,
    ``,
    knownFacts
      ? `CONFIRMED FACTS — NEVER ASK FOR THESE AGAIN:\n${knownFacts}`
      : `You don't know their business yet. Find out first.`,
    ``,
    `Stage: ${state} | Message #${messageCount} | Engagement: ${engagementLevel} | Trust: ${trustScore}/5`,
    ``,
    `Your next move:\n${stageInstructions[state]}`,
    objections.length ? `\nThey've expressed concern about: ${objections.join(", ")}. Acknowledge once briefly, then move forward.` : "",
    ``,
    `Hard rules:`,
    `- NEVER ask for anything already in CONFIRMED FACTS.`,
    `- NEVER restart discovery after booking intent is confirmed.`,
    `- If user said yes to a booking offer, proceed directly to scheduling and contact capture.`,
    `- If user gave availability, propose a time immediately.`,
    `- Once contact details are provided during booking, CONFIRM the booking — do not ask discovery questions.`,
    `- Max 2–3 sentences. Direct and human.`,
    `- No filler openers: no "Absolutely!", "Great question!", "Of course!", "Certainly!"`,
  ].filter(Boolean).join("\n");
}

function getWebhookTrigger(session: Session): string | null {
  const hasContact = !!(session.contactCollected.email || session.contactCollected.phone);

  if (session.bookingConfirmed && !session.webhookFiredAt.has("booking_confirmed")) {
    session.webhookFiredAt.add("booking_confirmed");
    return "booking_confirmed";
  }
  if (hasContact && !session.webhookFiredAt.has("contact_captured")) {
    session.webhookFiredAt.add("contact_captured");
    return "contact_captured";
  }
  if (session.bookingIntentConfirmed && !session.webhookFiredAt.has("booking_intent")) {
    session.webhookFiredAt.add("booking_intent");
    return "booking_intent";
  }
  return null;
}

async function fireWebhook(
  sessionId: string,
  session: Session,
  originalMessage: string,
  aiReply: string,
  trigger: string
): Promise<void> {
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn("[webhook] GOOGLE_SHEETS_WEBHOOK_URL not set");
    return;
  }

  const status = session.bookingConfirmed
    ? "booking_confirmed"
    : (session.contactCollected.email || session.contactCollected.phone)
    ? "contact_captured"
    : session.bookingIntentConfirmed
    ? "booking_in_progress"
    : "new";

  const wantsBooking = session.bookingIntentConfirmed ||
    ["booking", "contact_capture", "conversion"].includes(session.state)
    ? "yes" : "no";

  const needsHuman = session.bookingConfirmed ? "no" : "yes";

  const serviceInterest = [
    session.businessType ? session.businessType.replace(/_/g, " ") : null,
    session.painPoints.length ? session.painPoints.join(", ") : null,
  ].filter(Boolean).join(" — ");

  const payload = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    channel: "website",
    name: session.contactCollected.name || "",
    phone: session.contactCollected.phone || "",
    email: session.contactCollected.email || "",
    service_interest: serviceInterest,
    original_message: originalMessage,
    ai_reply: aiReply,
    wants_booking: wantsBooking,
    needs_human: needsHuman,
    status,
    scheduled_time: session.proposedTime || "",
    trigger,
  };

  try {
    const res = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[webhook] fired (${trigger}) status:`, res.status);
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

    if (intent.bookingIntent && !session.bookingIntentConfirmed) {
      session.bookingIntentConfirmed = true;
    }

    extractContext(message, session);
    extractContact(message, session);
    updateScores(session, intent);
    transition(session, intent);

    session.history.push({ role: "user", content: message });
    if (session.history.length > 24) session.history = session.history.slice(-24);

    const deterministicReply = buildDeterministicReply(session);

    let reply: string;

    if (deterministicReply) {
      reply = deterministicReply;
    } else {
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

      reply = completion.choices[0]?.message?.content?.trim() ?? "";
      if (!reply) return NextResponse.json({ error: "No response" }, { status: 500 });
      session.lastAssistantAction = inferLastAssistantAction(reply);
    }

    const webhookTrigger = getWebhookTrigger(session);
    if (webhookTrigger) {
      await fireWebhook(sessionId, session, message, reply, webhookTrigger);
    }

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
          bookingIntentConfirmed: session.bookingIntentConfirmed,
          bookingConfirmed: session.bookingConfirmed,
          proposedTime: session.proposedTime,
          engagementLevel: session.engagementLevel,
          trustScore: session.trustScore,
          painPoints: session.painPoints,
          businessType: session.businessType,
          availabilityMentioned: session.availabilityMentioned,
          contactCollected: session.contactCollected,
          deterministicReplyUsed: !!deterministicReply,
          webhookTrigger,
        },
      }),
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
