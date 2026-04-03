import { NextRequest } from "next/server";
import { createDefaultMemory, updateEngagement, extractBusinessType, extractPainPoints } from "../../../lib/chat/memory.js";
import { detectIntent } from "../../../lib/chat/intent.js";
import { detectIndustry, PERSONALITIES } from "../../../lib/chat/personality.js";
import { updateState, STATES } from "../../../lib/chat/state.js";
import { buildSystemPrompt } from "../../../lib/chat/prompt.js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, name, email, phone, memory: existingMemory } = body;

    // Use conversation history if provided, otherwise use single message
    const messageArray = Array.isArray(messages) ? messages : [{ role: "user", content: body.message || "" }];
    const latestUserMessage = messageArray[messageArray.length - 1]?.content || "";

    if (!latestUserMessage || typeof latestUserMessage !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Initialize or update memory
    let memory = existingMemory || createDefaultMemory();
    
    // Update memory with new information
    memory.businessType = extractBusinessType(latestUserMessage, memory.businessType);
    memory.painPoints = extractPainPoints(latestUserMessage, memory.painPoints);
    memory = updateEngagement(memory, latestUserMessage);
    
    // Detect intent and industry
    const intent = detectIntent(latestUserMessage);
    const industry = detectIndustry(latestUserMessage);
    memory.industry = industry.name;
    
    // Update conversation state
    memory.state = updateState(memory, intent);
    
    // Check if contact was provided in this message
    const contactProvided = /\b(\+?\d{7,}|\S+@\S+\.\S+)\b/.test(latestUserMessage);
    if (contactProvided) {
      memory.contactProvided = true;
      memory.qualified = true;
    }
    
    // Add topic to conversation history
    if (intent.type !== 'general') {
      memory.conversationTopics.push(intent.type);
    }

    // Build dynamic system prompt
    const systemPrompt = buildSystemPrompt(memory, industry);

    // Build OpenAI messages
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messageArray
    ];

    // Log debug info
    console.log("[DEBUG] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("[DEBUG] GOOGLE_SHEET_WEBHOOK_URL exists:", !!process.env.GOOGLE_SHEET_WEBHOOK_URL);
    console.log("[DEBUG] Latest user message:", latestUserMessage);
    console.log("[DEBUG] Message history length:", messageArray.length);
    console.log("[DEBUG] Conversation state:", memory.state);
    console.log("[DEBUG] Engagement level:", memory.engagementLevel);
    console.log("[DEBUG] Intent detected:", intent.type);

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return Response.json({ 
        reply: "I'm here to help you capture and convert more leads automatically. What kind of business do you run?",
        wants_booking: "yes",
        needs_human: "no",
        memory
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
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return Response.json({ 
        reply: "Something went wrong — try again in a moment.",
        wants_booking: "no",
        needs_human: "yes",
        memory
      }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    console.log("[DEBUG] OpenAI reply generated:", !!openaiData.choices?.[0]?.message?.content);

    const reply = openaiData.choices[0]?.message?.content || "I'm here to help you capture and convert more leads automatically. What kind of business do you run?";

    // Infer booking intent and human request from latest user message
    const wants_booking = /\b(demo|book|schedule|appointment|interested|ready|sign up)\b/i.test(latestUserMessage) ? "yes" : "no";
    const needs_human = /\b(human|person|agent|representative|speak to someone)\b/i.test(latestUserMessage) ? "yes" : "no";

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
          status: contactProvided ? "captured" : "new",
          conversation_state: memory.state,
          engagement_level: memory.engagementLevel,
          business_type: memory.businessType,
          pain_points: memory.painPoints.join(', ') || 'none'
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
      needs_human,
      memory
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ 
      reply: "Something went wrong — try again in a moment.",
      wants_booking: "no",
      needs_human: "yes",
      memory: createDefaultMemory()
    }, { status: 500 });
  }
}
