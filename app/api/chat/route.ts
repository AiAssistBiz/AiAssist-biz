import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SESSION_TTL = 30 * 60 * 1000;

type State = "discovery" | "problem_awareness" | "education" | "value_realization" | "consideration" | "conversion";
type Sentiment = "positive" | "negative" | "neutral";
type IntentType = "pricing" | "how_it_works" | "business_context" | "browsing" | "general";

interface Intent {
  type: IntentType;
  sentiment: Sentiment;
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
    history: [],
    lastActive: Date.now(),
  };
}

function detectIntent(msg: string): Intent {
  const t = msg.toLowerCase();
  if (/\b(price|cost|how much|fee|afford|budget|rates?|pay|plan)\b/.test(t)) return { type: "pricing", sentiment: scoreSentiment(t) };
  if (/\b(how (does|do|it|this)|what is|explain|process|set.?up|demo|show me|integrate)\b/.test(t)) return { type: "how_it_works", sentiment: scoreSentiment(t) };
  if (/\b(my (business|company|clinic|spa|salon|shop|team|store)|we (are|have|run|do)|our (clients?|customers?|team))\b/.test(t)) return { type: "business_context", sentiment: scoreSentiment(t) };
  if (/\b(just (looking|curious|wondering)|not sure|maybe|thinking about|comparing|researching)\b/.test(t)) return { type: "browsing", sentiment: scoreSentiment(t) };
  return { type: "general", sentiment: scoreSentiment(t) };
}

function scoreSentiment(t: string): Sentiment {
  const p = (t.match(/\b(great|love|yes|definitely|interested|perfect|exactly|excited|sounds good|absolutely)\b/g) || []).length;
  const n = (t.match(/\b(no\b|not\b|don't|bad|hate|doubt|skeptical|tried|waste|expensive|annoyed|problem|issue)\b/g) || []).length;
  return p > n ? "positive" : n > p ? "negative" : "neutral";
}

function extractContext(msg: string, session: Session): void {
  const t = msg.toLowerCase();

  if (!session.businessType) {
    if (/\b(medspa|med spa|aesthetic|botox|filler|laser|skin|beauty|wellness|cosmetic|clinic)\b/.test(t)) session.businessType = "medspa";
    else if (/\b(plumb|hvac|electric|roofing|landscap|cleaning|pest|handyman|contractor|remodel|painting)\b/.test(t)) session.businessType = "home_services";
    else if (/\b(restaurant|cafe|food|dining|catering)\b/.test(t)) session.businessType = "restaurant";
    else if (/\b(dental|dentist|orthodont|chiro|physio|therapy|medical)\b/.test(t)) session.businessType = "healthcare";
  }

  const pains: [RegExp, string][] = [
    [/\b(leads?|clients?|customers?|traffic|inquir|prospects?)\b/, "lead generation"],
    [/\b(follow.?up|response time|ghost|slow reply|missed calls?)\b/, "follow-up speed"],
    [/\b(book|appointment|schedul|calendar|no.?show|cancell)\b/, "booking conversion"],
    [/\b(staff|overwhelm|busy|manual work|automat|save time|bandwidth)\b/, "operational efficiency"],
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
  if (/\b(timeline|how (long|fast|quick)|when (can|will|do))\b/.test(t)) add("timeline");
}

function updateScores(session: Session, intent: Intent): void {
  const delta: Record<IntentType, number> = { business_context: 3, how_it_works: 2, pricing: 2, browsing: 0, general: 1 };
  session.engagementLevel += delta[intent.type] ?? 1;
  if (intent.sentiment === "positive") session.engagementLevel += 1;
  if (session.painPoints.length > 0) session.trustScore += 1;
  if (session.messageCount > 3) session.trustScore += 1;
  if (intent.sentiment === "negative") session.trustScore = Math.max(0, session.trustScore - 1);
}

function transition(session: Session, intent: Intent): void {
  const { state, engagementLevel, painPoints, businessType, trustScore, objections } = session;

  const map: Record<State, () => State> = {
    discovery: () => (businessType || intent.type === "business_context" || engagementLevel >= 3) ? "problem_awareness" : "discovery",
    problem_awareness: () => (painPoints.length >= 1 && engagementLevel >= 5) || intent.type === "how_it_works" ? "education" : "problem_awareness",
    education: () => {
      if (engagementLevel >= 8 && trustScore >= 2) return "value_realization";
      if (intent.type === "pricing" && engagementLevel >= 6) return "consideration";
      return "education";
    },
    value_realization: () => (intent.type === "pricing" || intent.sentiment === "positive") ? "consideration" : "value_realization",
    consideration: () => (objections.length === 0 && trustScore >= 4 && intent.sentiment === "positive") ? "conversion" : "consideration",
    conversion: () => "conversion",
  };

  session.state = (map[state] ?? (() => state))();
}

function tone(businessType: string | null): string {
  const tones: Record<string, string> = {
    medspa: "Your tone is warm, unhurried, and concierge-level attentive. These clients value discretion and feeling truly understood. Never clinical, never sales-y.",
    home_services: "Be direct, grounded, and practical. These are busy people who respect straight answers and no fluff. Sound like someone who knows the trade.",
    restaurant: "Be personable and energetic. These owners are passionate about their craft. Match their energy—practical but enthusiastic.",
    healthcare: "Be calm, professional, and empathetic. Practitioners are cautious. Lead with trust and specificity, not enthusiasm.",
  };
  return (businessType && tones[businessType]) || "You're sharp, warm, and genuinely curious. You speak like a trusted advisor—confident without being pushy, interested without being eager.";
}

function stageContext(session: Session): string {
  const { state, painPoints, objections, topicsRaised, questionsAsked } = session;

  const alreadyCovered = topicsRaised.length > 0
    ? `Topics already in this conversation: ${topicsRaised.join(", ")}. Don't re-introduce them unless the user brings them up.`
    : "";
  const recentQ = questionsAsked.length > 0
    ? `Your last question was: "${questionsAsked[questionsAsked.length - 1]}". Don't ask something similar.`
    : "";

  const stages: Record<State, string> = {
    discovery: `You're in early conversation. Be curious and observant. If you ask something, make it one good question—but only if it flows naturally. ${recentQ}`,
    problem_awareness: `You have some context on them. Reflect, go deeper. You're trying to understand the full picture before offering anything. ${recentQ}`,
    education: `You can start connecting what you know about them to what's possible. Use framing and examples—not feature lists. ${alreadyCovered}`,
    value_realization: `Help them arrive at their own insight about the cost of staying stuck. Guide, don't lecture.`,
    consideration: `They're interested. Be direct and calm.${objections.length ? ` They've expressed hesitation around: ${objections.join(", ")}—address naturally, not defensively.` : ""} Start moving toward a next step and naturally ask for their name and best contact (email or phone) so someone can follow up.`,
    conversion: `They're ready. Ask for their name and best email or phone number to lock in the next step. Keep it casual and natural—just one easy ask, like a human would do it.`,
  };

  const painLine = painPoints.length ? `\nKnown pain points: ${painPoints.join(", ")}. Weave in only where genuinely relevant.` : "";

  return stages[state] + painLine + (alreadyCovered && state !== "education" ? `\n${alreadyCovered}` : "");
}

function buildPrompt(session: Session): string {
  const { state, engagementLevel, trustScore, messageCount } = session;

  const trustLine = trustScore >= 4
    ? "Trust is high—you can be more direct and specific."
    : trustScore <= 1
    ? "Trust is still forming. Stay light, curious, and genuine."
    : "";

  return [
    `You are a senior-level AI assistant for a company that helps local businesses grow through AI-powered automation. You handle inbound conversations with the instincts of a skilled human operator—not a bot.`,
    ``,
    tone(session.businessType),
    ``,
    `State: ${state} | Message: ${messageCount} | Engagement: ${engagementLevel} | Trust: ${trustScore}/5`,
    stageContext(session),
    trustLine,
    ``,
    `How you sound:`,
    `- Write like a thoughtful person, not an assistant. Vary your rhythm and structure.`,
    `- Some responses are statements. Some are questions. Some are both. Mix it naturally.`,
    `- Never open with filler: no "Absolutely!", "Great question!", "Of course!", "Certainly!", "That's a great point!"`,
    `- Don't repeat ideas you've already expressed. Don't rephrase the same value proposition.`,
    `- Build on what the user said—reference specifics when possible.`,
    `- When you do ask a question, ask only one. Make it count.`,
    `- If they're skeptical or guarded, slow down and acknowledge before anything else.`,
    `- 2–4 sentences is the target. Occasionally a single sentence is fine.`,
    `- Each response should move the conversation forward slightly—avoid staying at the same level for multiple turns.`,
  ].filter(Boolean).join("\n");
}

function detectContact(msg: string) {
  return {
    email: (msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || null,
    phone: (msg.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/) || [])[0] || null,
    name: (msg.match(/\b(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) || [])[1] || null,
  };
}

function isConversionSignal(session: Session, intent: Intent): boolean {
  return session.engagementLevel >= 6 ||
    session.state === "conversion" ||
    session.state === "consideration" ||
    (intent.sentiment === "positive" && session.trustScore >= 2);
}

async function fireWebhook(data: Record<string, unknown>): Promise<void> {
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) return;
  try {
    await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString(), source: "ai-chat" }),
    });
  } catch {}
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
    extractContext(message, session);
    updateScores(session, intent);
    trackTopic(session, intent, message);
    transition(session, intent);

    const contact = detectContact(message);
    const hasContact = contact.email || contact.phone;

    await fireWebhook({
      sessionId,
      ...contact,
      businessType: session.businessType,
      painPoints: session.painPoints,
      state: session.state,
      engagementLevel: session.engagementLevel,
      trustScore: session.trustScore,
      messageCount: session.messageCount,
      triggerType: hasContact ? "contact_provided" : session.state,
    });

    session.history.push({ role: "user", content: message });
    if (session.history.length > 24) session.history = session.history.slice(-24);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildPrompt(session) },
        ...session.history,
      ],
      temperature: 0.75,
      max_tokens: 230,
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
