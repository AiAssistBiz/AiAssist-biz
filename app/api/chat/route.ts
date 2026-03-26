import { NextRequest } from "next/server";

const systemPrompt = `
You are the AI Assist lead conversion assistant.

Your job is to qualify website visitors, identify lost leads, and convert them into contacts.

Rules:
- Keep responses under 2 sentences
- Always move the conversation forward
- Ask one question per message
- Be confident, not passive
- Do not act like support

Flow:
1. Identify business type
2. Identify if they miss calls or leads
3. Highlight lost revenue
4. Position AI Assist as solution
5. Capture contact info

Trigger for lead capture:
- After 2–3 user messages
- OR if user mentions business, leads, calls, or interest

When triggered:
- First acknowledge the business type or situation specifically
- Then ask for contact info

Example pattern:
"Got it — service businesses like tile companies lose a lot of jobs and revenue when they can't answer calls.
What's the best number or email to send you a quick breakdown?"

Rules:
- Keep acknowledgment under 1 sentence
- Adjust tone to match business type (trades vs hospitality vs professional)
- Keep language simple and natural - avoid corporate wording
- For trades: use "jobs" and "revenue"
- For hospitality: use "bookings" and "money"
- Second sentence remains the contact ask

Tone:
- sharp
- modern
- direct
- conversational

Never end without a question.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, name, email, phone } = body;

    // Use conversation history if provided, otherwise use single message
    const messageArray = Array.isArray(messages) ? messages : [{ role: "user", content: body.message || "" }];
    const latestUserMessage = messageArray[messageArray.length - 1]?.content || "";

    // Hard lead capture trigger logic
    const userMessageCount = messageArray.filter((m) => m.role === "user").length;

    const shouldForceCapture =
      userMessageCount >= 2 ||
      /business|company|clients|leads|calls|appointments|service|owner|book|booking|missed call|follow-up/i.test(latestUserMessage);

    // Build OpenAI messages with system prompt and optional capture instruction
    let openaiMessages = [
      { role: "system", content: systemPrompt }
    ];

    // Add capture instruction if triggered
    if (shouldForceCapture) {
      openaiMessages.push({
        role: "system",
        content: `
The user is qualified.

You MUST ask for their phone number or email in your next response.

Do not continue general conversation.
Do not explain the product further.
Do not ask unrelated questions.

Your next message should move directly to collecting contact information.
`
      });
    }

    // Add conversation history
    openaiMessages = openaiMessages.concat(messageArray);

    if (!latestUserMessage || typeof latestUserMessage !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Log debug info
    console.log("[DEBUG] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("[DEBUG] GOOGLE_SHEET_WEBHOOK_URL exists:", !!process.env.GOOGLE_SHEET_WEBHOOK_URL);
    console.log("[DEBUG] Latest user message:", latestUserMessage);
    console.log("[DEBUG] Message history length:", messageArray.length);

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return Response.json({ 
        reply: "Thanks for reaching out — AI Assist helps businesses capture leads, answer FAQs, and book appointments automatically. Want a quick demo?",
        wants_booking: "yes",
        needs_human: "no"
      }, { status: 200 });
    }

    // Call OpenAI API with conversation history
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 100,
        temperature: 0.6,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return Response.json({ 
        reply: "Something went wrong — try again in a moment.",
        wants_booking: "no",
        needs_human: "yes"
      }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    console.log("[DEBUG] OpenAI reply generated:", !!openaiData.choices?.[0]?.message?.content);

    const reply = openaiData.choices[0]?.message?.content || "I'm here to help you capture and convert more leads automatically. Do you run a business?";

    // Infer booking intent and human request from latest user message
    const wants_booking = /\b(demo|book|schedule|appointment|interested|ready|sign up)\b/i.test(latestUserMessage) ? "yes" : "no";
    const needs_human = /\b(human|person|agent|representative|speak to someone)\b/i.test(latestUserMessage) ? "yes" : "no";

    // Add contact detection
    const contactProvided = /\b(\+?\d{7,}|\S+@\S+\.\S+)\b/.test(latestUserMessage);

    console.log("[DEBUG] Inferred wants_booking:", wants_booking, "needs_human:", needs_human, "contactProvided:", contactProvided);

    // Log to Google Sheets (fire and forget)
    try {
      if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
        const webhookPayload = {
          channel: "website",
          name: name || "",
          phone: phone || "",
          email: email || "",
          service_interest: "AI Assist",
          original_message: latestUserMessage,
          ai_reply: reply,
          wants_booking,
          needs_human,
          status: contactProvided ? "captured" : "new"
        };
        
        console.log("[DEBUG] Sending webhook payload:", JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch(process.env.GOOGLE_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        
        if (!webhookResponse.ok) {
          const webhookErrorText = await webhookResponse.text();
          console.error("[DEBUG] Webhook failed:", webhookResponse.status, webhookErrorText);
        } else {
          console.log("[DEBUG] Webhook logged successfully");
        }
      } else {
        console.log("[DEBUG] GOOGLE_SHEET_WEBHOOK_URL missing - skipping webhook");
      }
    } catch (logError) {
      console.error("[DEBUG] Webhook logging error:", logError);
      // Don't fail whole request if logging fails
    }

    return Response.json({
      reply,
      wants_booking,
      needs_human
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ 
      reply: "Something went wrong — try again in a moment.",
      wants_booking: "no",
      needs_human: "yes"
    }, { status: 500 });
  }
}
