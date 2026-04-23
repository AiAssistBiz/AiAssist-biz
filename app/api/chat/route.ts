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
type TimeOfDay = "morning" | "afternoon" | "evening" | null;

interface Intent {
  type: IntentType;
  sentiment: Sentiment;
  isAffirmative: boolean;
  bookingIntent: boolean;
  flexibleAvailability: boolean;
  availabilityMentioned: string | null;
  timeOfDay: TimeOfDay;
  requestingLaterTime: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  state: State;
  businessType: string | null;
  businessDisplayPhrase: string | null;
  businessDescription: string | null;
  painPoints: string[];
  objections: string[];
  topicsRaised: string[];
  questionsAsked: string[];
  lastAssistantAction: AssistantAction;
  bookingIntentConfirmed: boolean;
  bookingConfirmed: boolean;
  proposedTime: string | null;
  confirmedTime: string | null;
  availabilityMentioned: string | null;
  contactCollected: { name: string | null; email: string | null; phone: string | null };
  engagementLevel: number;
  trustScore: number;
  messageCount: number;
  history: Message[];
  lastActive: number;
  webhookFiredAt: string[];
}

const sessionStore = new Map<string, Session>();

// ─── Session Management ───────────────────────────────────────────────────────

function getSession(id: string): Session | null {
  const s = sessionStore.get(id);
  if (!s) return null;
  if (Date.now() - s.lastActive > SESSION_TTL) {
    sessionStore.delete(id);
    return null;
  }
  return s;
}

function createSession(): Session {
  return {
    state: "discovery",
    businessType: null,
    businessDisplayPhrase: null,
    businessDescription: null,
    painPoints: [],
    objections: [],
    topicsRaised: [],
    questionsAsked: [],
    lastAssistantAction: "general",
    bookingIntentConfirmed: false,
    bookingConfirmed: false,
    proposedTime: null,
    confirmedTime: null,
    availabilityMentioned: null,
    contactCollected: { name: null, email: null, phone: null },
    engagementLevel: 0,
    trustScore: 0,
    messageCount: 0,
    history: [],
    lastActive: Date.now(),
    webhookFiredAt: [],
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_DISPLAY_MAP: Record<string, string> = {
  medspa: "med spa",
  home_services: "home service business",
  restaurant: "restaurant",
  healthcare: "healthcare practice",
  beauty: "salon",
  real_estate: "real estate business",
  fitness: "fitness studio",
};

const STATE_ORDER: State[] = [
  "discovery",
  "problem_awareness",
  "education",
  "consideration",
  "booking",
  "contact_capture",
  "conversion",
];

// ─── Input Normalization ──────────────────────────────────────────────────────

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
    .replace(/\bmanging\b/g, "managing")
    .replace(/\borganiing\b/g, "organizing")
    .trim();
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidEmail(str: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str.trim());
}

// ─── Time Helpers ─────────────────────────────────────────────────────────────

function detectTimeOfDay(t: string): TimeOfDay {
  if (/\b(afternoon|after lunch|after noon|pm\b|2pm|3pm|lunchtime|midday after)\b/.test(t)) return "afternoon";
  if (/\b(morning|am\b|early|9am|10am|before noon|before lunch)\b/.test(t)) return "morning";
  if (/\b(evening|after work|after 5|6pm|7pm)\b/.test(t)) return "evening";
  return null;
}

function detectRequestingLaterTime(t: string): boolean {
  return (
    /\b(afternoon|later|after lunch|any(thing)? (later|in the afternoon)|pm\b|later in the day|later slot|evening)\b/.test(t) &&
    /\b(do you have|anything|any slots?|available|can we do|how about|got anything|is there)\b/.test(t)
  );
}

function getProposedTimeSlot(day: string, timeOfDay: TimeOfDay): string {
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  if (timeOfDay === "afternoon") return `${cap} at 2:00 PM`;
  if (timeOfDay === "morning") return `${cap} at 10:00 AM`;
  if (timeOfDay === "evening") return `${cap} at 5:00 PM`;
  return `${cap} at 10:00 AM`;
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

function scoreSentiment(t: string): Sentiment {
  const positive = (
    t.match(/\b(great|love|yes|yeah|yep|yup|definitely|interested|perfect|exactly|excited|sounds good|absolutely|sure|okay|ok\b|works|monday|tuesday|wednesday|thursday|friday|anytime|lets|go ahead|do it|book|schedule|ready|please|i'?m in|for sure)\b/g) || []
  ).length;
  const negative = (
    t.match(/\b(no\b|not\b|don't|bad|hate|doubt|skeptical|tried|waste|expensive|annoyed|cancel|stop|nevermind|not interested)\b/g) || []
  ).length;
  return positive > negative ? "positive" : negative > positive ? "negative" : "neutral";
}

function detectIntent(msg: string, session: Session): Intent {
  const raw = msg.toLowerCase();
  const t = normalizeInput(msg);

  const affirmativeRe = /^(yes|yeah|yep|yup|sure|okay|ok|absolutely|definitely|sounds good|let'?s do it|let'?s go|do it|i'?m in|please|yes please|of course|go ahead|that works|perfect|great|cool|alright|for sure|sounds great|works for me)\b/;
  const shortAffirmativeRe = /\b(yes|yeah|yep|yup|sure|ok|okay|please|do it|let'?s go|i'?m in)\b/;
  const bookingSignalsRe = /\b(book (it|me|a call|a time)|schedule (a call|me|it)|call me|set (it|me) up|sign me up|get started|let'?s talk|set up a call|i'?m ready to (talk|start|book)|yes lets?|let'?s do (monday|tuesday|wednesday|thursday|friday|this|that))\b/;
  const flexibleRe = /\b(anytime|whenever|open all day|flexible|doesn'?t matter|whatever works|any day|all day)\b/;
  const dayRe = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/;

  const wordCount = t.replace(/[^a-z ]/g, "").trim().split(" ").length;
  const isAffirmative =
    affirmativeRe.test(t) ||
    (wordCount <= 4 && shortAffirmativeRe.test(t));

  const bookingRelatedLastAction = [
    "asked_booking_interest",
    "offered_call",
    "asked_time_preference",
    "proposed_time",
    "asked_contact_details",
  ].includes(session.lastAssistantAction);

  const contextualBookingIntent = isAffirmative && bookingRelatedLastAction;
  const explicitBookingIntent = bookingSignalsRe.test(t) || bookingSignalsRe.test(raw);
  const flexibleAvailability = flexibleRe.test(t);
  const dayMatch = t.match(dayRe);
  const availabilityMentioned = dayMatch ? dayMatch[0] : null;
  const bookingIntent = contextualBookingIntent || explicitBookingIntent || session.bookingIntentConfirmed;
  const timeOfDay = detectTimeOfDay(t);
  const requestingLaterTime = detectRequestingLaterTime(t);

  let type: IntentType = "general";
  if (bookingIntent || flexibleAvailability || availabilityMentioned || requestingLaterTime) type = "booking";
  else if (/\b(price|cost|how much|fee|afford|budget|rates?|pay|plan)\b/.test(t)) type = "pricing";
  else if (/\b(how (does|do|it|this)|what is|explain|process|set.?up|demo|show me|integrate)\b/.test(t)) type = "how_it_works";
  else if (/\b(my (business|company|clinic|spa|salon|shop|team|store)|we (are|have|run|do)|our (clients?|customers?|team)|i (own|have|run|operate|just opened|opened) a)\b/.test(t)) type = "business_context";
  else if (/\b(just (looking|curious|wondering)|not sure|maybe|thinking about|comparing|researching)\b/.test(t)) type = "browsing";

  return {
    type,
    sentiment: scoreSentiment(t),
    isAffirmative,
    bookingIntent,
    flexibleAvailability,
    availabilityMentioned,
    timeOfDay,
    requestingLaterTime,
  };
}

// ─── Context Extraction ───────────────────────────────────────────────────────

function extractBusinessPhrase(msg: string): string | null {
  const patterns = [
    /\bi (?:just )?(?:opened|own|have|run|operate) (?:a |an )?([a-z ]{3,40}?)(?:\s*!|\s*,|\s*\.|\s+and|\s+i |\s+we |\s*$)/i,
    /\bmy ([a-z ]{3,40}?) (?:business|company|shop|studio|salon|clinic|practice)\b/i,
    /\bi(?:'?m| am) (?:a |an )?([a-z ]{3,40}?) (?:owner|operator)\b/i,
  ];
  for (const re of patterns) {
    const m = msg.match(re);
    if (m?.[1]) {
      const phrase = m[1].trim().toLowerCase();
      if (phrase.length >= 3 && phrase.length <= 40) return phrase;
    }
  }
  return null;
}

function extractContext(msg: string, session: Session): void {
  const t = normalizeInput(msg);

  if (!session.businessDisplayPhrase) {
    const explicit = extractBusinessPhrase(msg);
    if (explicit) session.businessDisplayPhrase = explicit;
  }

  if (!session.businessType) {
    if (/\b(medspa|med spa|aesthetic|botox|filler|laser|skin care|cosmetic|clinic)\b/.test(t)) session.businessType = "medspa";
    else if (/\b(plumb|plumber|hvac|electrician|electric|roofing|roofer|landscap|lawn|cleaning|pest|handyman|contractor|remodel|painting|painter|carpenter|flooring|gutters?|siding|windows?|doors?|garage)\b/.test(t)) session.businessType = "home_services";
    else if (/\b(restaurant|cafe|food|dining|catering|bar\b|bakery)\b/.test(t)) session.businessType = "restaurant";
    else if (/\b(dental|dentist|orthodont|chiro|physio|therapy|therapist|medical|doctor|urgent care|pharmacy)\b/.test(t)) session.businessType = "healthcare";
    else if (/\b(salon|barber|barbershop|nail|lash|spa\b|massage|wax|beauty|wellness)\b/.test(t)) session.businessType = "beauty";
    else if (/\b(real estate|realtor|broker|property|mortgage|rental)\b/.test(t)) session.businessType = "real_estate";
    else if (/\b(studio|gym|fitness|yoga|dance|pilates|crossfit)\b/.test(t)) session.businessType = "fitness";
  }

  if (!session.businessDescription && session.businessType) {
    session.businessDescription = msg.slice(0, 200);
  }

  const pains: [RegExp, string][] = [
    [/\b(leads?|lead gen|generating leads?|get (more )?clients?|get (more )?customers?|traffic|inquir|prospects?)\b/, "lead generation"],
    [/\b(manag|managing|management|organize|organiz|track|handle|overwhelm|busy|manual|automat|save time|bandwidth|handling leads?|organizing leads?)\b/, "lead management"],
    [/\b(follow.?up|response time|ghost|slow reply|missed calls?)\b/, "follow-up speed"],
    [/\b(booking conversion|no.?show|cancell|appointment)\b/, "booking conversion"],
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
  const emailMatch = msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] ?? null;
  const phoneMatch = msg.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  const phone = phoneMatch?.[0] ?? null;

  const namedMatch = msg.match(/\b(?:my name is|i'?m|i am|call me|it'?s|name'?s)\s+([a-zA-Z]+(?:\s[a-zA-Z]+)?)/i);
  const bareNameMatch =
    !namedMatch &&
    (session.state === "contact_capture" || session.state === "booking" || session.bookingIntentConfirmed)
      ? msg.match(/^([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:\d|\()/)
      : null;

  const name = namedMatch?.[1] ?? bareNameMatch?.[1] ?? null;

  if (email && isValidEmail(email) && !session.contactCollected.email) session.contactCollected.email = email;
  if (phone && !session.contactCollected.phone) session.contactCollected.phone = phone;
  if (name && !session.contactCollected.name) session.contactCollected.name = name;
}

// ─── Scoring & Transitions ────────────────────────────────────────────────────

function updateScores(session: Session, intent: Intent): void {
  const delta: Record<IntentType, number> = {
    business_context: 3,
    how_it_works: 2,
    pricing: 2,
    browsing: 0,
    booking: 4,
    general: 1,
  };
  session.engagementLevel += delta[intent.type] ?? 1;
  if (intent.sentiment === "positive") session.engagementLevel += 1;
  if (intent.bookingIntent) session.engagementLevel += 2;
  if (session.painPoints.length > 0) session.trustScore += 1;
  if (session.messageCount > 3) session.trustScore += 1;
  if (intent.sentiment === "negative") session.trustScore = Math.max(0, session.trustScore - 1);
}

function transition(session: Session, intent: Intent): void {
  const { state, painPoints, businessType } = session;
  const currentIndex = STATE_ORDER.indexOf(state);
  const hasValidContact = !!(session.contactCollected.email || session.contactCollected.phone);

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
    booking: () => (hasValidContact ? "conversion" : "contact_capture"),
    contact_capture: () => (hasValidContact ? "conversion" : "contact_capture"),
    conversion: () => "conversion",
  };

  const next = (map[state] ?? (() => state))();
  const nextIndex = STATE_ORDER.indexOf(next);
  session.state = nextIndex >= currentIndex ? next : state;
}

// ─── Reply Generation ─────────────────────────────────────────────────────────

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

function getBusinessDisplay(session: Session): string {
  if (session.businessDisplayPhrase) return session.businessDisplayPhrase;
  if (session.businessType) return BUSINESS_DISPLAY_MAP[session.businessType] ?? session.businessType.replace(/_/g, " ");
  return "your business";
}

function tone(session: Session): string {
  const tones: Record<string, string> = {
    medspa: "Warm, unhurried, concierge-level. Never clinical, never pushy.",
    home_services: "Direct, practical, confident. Busy tradespeople respect straight talk. Cut to what matters fast.",
    restaurant: "Personable and energetic. Match their passion.",
    healthcare: "Calm, professional, empathetic. Lead with trust.",
    beauty: "Warm and relatable. Human-first.",
    real_estate: "Sharp, results-oriented. Speed and clarity.",
    fitness: "Energetic and motivating. These owners care about their community.",
  };
  return (session.businessType && tones[session.businessType]) || "Sharp, warm, and direct. A trusted advisor—confident without being pushy.";
}

function buildDeterministicReply(session: Session, intent: Intent): string | null {
  if (session.bookingConfirmed) return null;

  const { contactCollected, availabilityMentioned, painPoints } = session;
  const hasPhone = !!contactCollected.phone;
  const hasEmail = !!contactCollected.email;
  const hasValidContact = hasPhone || hasEmail;
  const hasName = !!contactCollected.name;
  const displayName = hasName ? contactCollected.name! : null;
  const businessDisplay = getBusinessDisplay(session);
  const painSummary = painPoints.length ? painPoints.join(" and ") : "your needs";

  // Requesting a different time after one was already proposed
  if (session.proposedTime && intent.requestingLaterTime && !hasValidContact) {
    const day = availabilityMentioned
      ?? session.proposedTime.split(" ")[0].toLowerCase();
    const newTime = `${day.charAt(0).toUpperCase() + day.slice(1)} at 2:00 PM`;
    session.proposedTime = newTime;
    session.lastAssistantAction = "proposed_time";
    return `How about ${newTime}? Just let me know and I'll grab your contact details.`;
  }

  // Affirmative after a proposed time — lock it in
  if (
    session.proposedTime &&
    !session.confirmedTime &&
    intent.isAffirmative &&
    !hasValidContact &&
    session.lastAssistantAction === "proposed_time"
  ) {
    session.confirmedTime = session.proposedTime;
    session.lastAssistantAction = "asked_contact_details";
    return `${session.confirmedTime} it is. What's the best name, phone number, and email to put on the booking?`;
  }

  // Booking complete — confirm
  if (session.bookingIntentConfirmed && hasValidContact) {
    const time = session.confirmedTime ?? session.proposedTime ?? "the scheduled time";
    const nameGreeting = displayName ? `, ${displayName}` : "";
    const contactParts = [contactCollected.phone, contactCollected.email].filter(Boolean).join(" and ");
    session.bookingConfirmed = true;
    session.state = "conversion";
    session.lastAssistantAction = "confirmed_booking";
    return `Perfect${nameGreeting} — you're all set for ${time}. I've got ${contactParts} on file. Someone from our team will reach out to help with ${painSummary}.`;
  }

  // Partial contact — missing email
  if (session.bookingIntentConfirmed && (hasPhone || hasName) && !hasEmail) {
    const time = session.confirmedTime ?? session.proposedTime ?? "the call";
    const haveParts = [displayName, contactCollected.phone].filter(Boolean).join(" and ");
    session.lastAssistantAction = "asked_contact_details";
    return `I've got ${haveParts} for ${time}. What's the best email to attach to the booking?`;
  }

  // Partial contact — missing phone
  if (session.bookingIntentConfirmed && hasEmail && !hasPhone) {
    const time = session.confirmedTime ?? session.proposedTime ?? "the call";
    session.lastAssistantAction = "asked_contact_details";
    return `I've got ${contactCollected.email} for ${time}. What's the best phone number to include?`;
  }

  // Availability given — propose time slot
  if (session.bookingIntentConfirmed && !hasValidContact && availabilityMentioned && !session.proposedTime) {
    const slot = getProposedTimeSlot(availabilityMentioned, intent.timeOfDay);
    session.proposedTime = slot;
    session.lastAssistantAction = "proposed_time";
    return `${slot} works — what's the best name, phone number, and email to put on the booking?`;
  }

  // Booking intent confirmed but no availability or contact yet
  if (session.bookingIntentConfirmed && !hasValidContact && !availabilityMentioned && !session.proposedTime) {
    session.lastAssistantAction = "asked_time_preference";
    return `I've got you as a ${businessDisplay} looking for help with ${painSummary}. What day works for a quick call, and what name, phone number, and email should I put on it?`;
  }

  return null;
}

function buildPrompt(session: Session): string {
  const { state, engagementLevel, trustScore, messageCount, painPoints, availabilityMentioned, objections, contactCollected } = session;
  const businessDisplay = getBusinessDisplay(session);
  const hasEmail = !!contactCollected.email;
  const hasPhone = !!contactCollected.phone;

  const knownFacts = [
    session.businessDisplayPhrase
      ? `- Business: ${businessDisplay}`
      : session.businessType
      ? `- Business type: ${businessDisplay}`
      : null,
    painPoints.length ? `- Pain points: ${painPoints.join(", ")}` : null,
    availabilityMentioned ? `- Availability: ${availabilityMentioned}` : null,
    session.confirmedTime
      ? `- Confirmed time: ${session.confirmedTime}`
      : session.proposedTime
      ? `- Proposed time: ${session.proposedTime}`
      : null,
    contactCollected.name ? `- Name: ${contactCollected.name}` : null,
    contactCollected.email ? `- Email: ${contactCollected.email}` : null,
    contactCollected.phone ? `- Phone: ${contactCollected.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const stageInstructions: Record<State, string> = {
    discovery: `You don't know their business or needs yet. Ask one clear question. If they told you in this message, acknowledge it and move forward immediately.`,
    problem_awareness: `You know their situation. Confirm it briefly and signal you can help. Do NOT re-ask anything already known.`,
    education: `Give 1–2 concrete sentences on how AI automation solves their specific problem. No generic pitches.`,
    consideration: `They're engaged. Ask if they'd like to book a quick call with the team.`,
    booking: availabilityMentioned
      ? `They said ${availabilityMentioned} works. Propose a specific time and ask for name, phone, and email.`
      : `They want to book. Ask what day works and get their name, phone, and email in the same message.`,
    contact_capture:
      hasPhone || hasEmail
        ? `You have partial contact info. Ask only for what's still missing: ${[!contactCollected.name && "name", !hasPhone && "phone", !hasEmail && "email"].filter(Boolean).join(", ")}.`
        : `Ask for their name, best phone number, and email to complete the booking. One natural ask.`,
    conversion: `Booking is confirmed. Briefly confirm the time and contact details, and let them know the team will reach out.`,
  };

  return [
    `You are a concise, human-like assistant for a company that helps local businesses grow with AI-powered automation. Your job: qualify inbound leads and book them for a sales call. You are a smart human receptionist—not a consultant, not a chatbot.`,
    ``,
    `Tone: ${tone(session)}`,
    ``,
    knownFacts ? `CONFIRMED FACTS — NEVER ASK FOR THESE AGAIN:\n${knownFacts}` : `You don't know their business yet. Find out first.`,
    ``,
    `Stage: ${state} | Message #${messageCount} | Engagement: ${engagementLevel} | Trust: ${trustScore}/5`,
    ``,
    `Your next move:\n${stageInstructions[state]}`,
    objections.length ? `\nThey've expressed concern about: ${objections.join(", ")}. Acknowledge once briefly, then move forward.` : "",
    ``,
    `Hard rules:`,
    `- NEVER ask for anything already in CONFIRMED FACTS.`,
    `- NEVER use raw internal labels like "beauty" or "home_services" — always use the natural display name.`,
    `- NEVER restart discovery after booking intent is confirmed.`,
    `- If user said yes to a booking offer, proceed directly to scheduling and contact capture.`,
    `- If user gave time-of-day preference (e.g. "afternoon"), propose a matching time slot (afternoon = 2:00 PM, morning = 10:00 AM, evening = 5:00 PM).`,
    `- Once contact details are provided during booking, CONFIRM the booking — unless email or phone is still missing.`,
    `- Do NOT confirm booking until you have at least a phone number or valid email.`,
    `- A valid email must contain @ and a proper domain like .com. A domain name alone is NOT a valid email.`,
    `- Max 2–3 sentences. Direct and human.`,
    `- No filler openers: no "Absolutely!", "Great question!", "Of course!", "Certainly!"`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

function getWebhookTrigger(session: Session): string | null {
  const hasContact = !!(session.contactCollected.email || session.contactCollected.phone);

  if (session.bookingConfirmed && !session.webhookFiredAt.includes("booking_confirmed")) {
    session.webhookFiredAt.push("booking_confirmed");
    return "booking_confirmed";
  }
  if (hasContact && !session.webhookFiredAt.includes("contact_captured")) {
    session.webhookFiredAt.push("contact_captured");
    return "contact_captured";
  }
  if (session.bookingIntentConfirmed && !session.webhookFiredAt.includes("booking_intent")) {
    session.webhookFiredAt.push("booking_intent");
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
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) {
    console.warn("[webhook] GOOGLE_SHEETS_WEBHOOK_URL not set");
    return;
  }

  const status = session.bookingConfirmed
    ? "booking_confirmed"
    : session.contactCollected.email || session.contactCollected.phone
    ? "contact_captured"
    : session.bookingIntentConfirmed
    ? "booking_in_progress"
    : "new";

  const wantsBooking =
    session.bookingIntentConfirmed || ["booking", "contact_capture", "conversion"].includes(session.state)
      ? "yes"
      : "no";

  const serviceInterest = [
    session.businessDisplayPhrase ?? (session.businessType ? BUSINESS_DISPLAY_MAP[session.businessType] : null),
    session.painPoints.length ? session.painPoints.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const payload = {
    sessionId,
    timestamp: new Date().toISOString(),
    channel: "website",
    name: session.contactCollected.name ?? "",
    phone: session.contactCollected.phone ?? "",
    email: session.contactCollected.email ?? "",
    serviceInterest,
    originalMessage,
    aiReply,
    wantsBooking,
    needsHuman: session.bookingConfirmed ? "no" : "yes",
    status,
    scheduledTime: session.confirmedTime ?? session.proposedTime ?? "",
    trigger,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[webhook] fired (${trigger}) status:`, res.status);
  } catch (err) {
    console.error("[webhook] failed:", err);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function extractQuestion(text: string): string | null {
  const match = text.match(/[^.!?]*\?/);
  return match ? match[0].trim() : null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, sessionId } = body as { message?: string; sessionId?: string };

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session: Session = getSession(sessionId) ?? createSession();
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

    const deterministicReply = buildDeterministicReply(session, intent);
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
      if (!reply) return NextResponse.json({ error: "No response from model" }, { status: 500 });
      session.lastAssistantAction = inferLastAssistantAction(reply);
    }

    const webhookTrigger = getWebhookTrigger(session);
    if (webhookTrigger) {
      // Fire and forget — don't block the response
      fireWebhook(sessionId, session, message, reply, webhookTrigger).catch((err) =>
        console.error("[webhook] unhandled error:", err)
      );
    }

    const q = extractQuestion(reply);
    if (q) session.questionsAsked.push(q);
    if (session.questionsAsked.length > 5) session.questionsAsked = session.questionsAsked.slice(-5);

    session.history.push({ role: "assistant", content: reply });
    sessionStore.set(sessionId, session);

    const response: Record<string, unknown> = { reply };

    if (process.env.NODE_ENV === "development") {
      response.debug = {
        state: session.state,
        intent,
        lastAssistantAction: session.lastAssistantAction,
        bookingIntentConfirmed: session.bookingIntentConfirmed,
        bookingConfirmed: session.bookingConfirmed,
        proposedTime: session.proposedTime,
        confirmedTime: session.confirmedTime,
        engagementLevel: session.engagementLevel,
        trustScore: session.trustScore,
        painPoints: session.painPoints,
        businessType: session.businessType,
        businessDisplayPhrase: session.businessDisplayPhrase,
        availabilityMentioned: session.availabilityMentioned,
        contactCollected: session.contactCollected,
        deterministicReplyUsed: !!deterministicReply,
        webhookTrigger,
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}