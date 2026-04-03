export function detectIntent(message = "") {
  const text = message.toLowerCase().trim();

  const result = {
    type: "general",
    sentiment: "neutral",
    confidence: 0.5,
  };

  if (/\b(price|pricing|cost|how much|investment|fee|fees|monthly|budget|afford)\b/i.test(text)) {
    result.type = "pricing";
    result.confidence = 0.9;

  } else if (/\b(how does it work|how it works|how do(es)? this work|process|setup|installation|implementation|integration|technical)\b/i.test(text)) {
    result.type = "how_it_works";
    result.confidence = 0.85;

  } else if (/\b(just looking|browsing|curious|checking it out|exploring|researching|maybe later|i'?ll think about it)\b/i.test(text)) {
    result.type = "browsing";
    result.confidence = 0.75;

  } else if (/\b(business|company|clients|customers|leads|sales|revenue|grow|scale|staff|team|employees)\b/i.test(text)) {
    result.type = "business_context";
    result.confidence = 0.65;
  }

  if (/\b(sounds good|interesting|cool|nice|great|perfect|that makes sense|definitely|absolutely|love that|excited|ready)\b/i.test(text)) {
    result.sentiment = "positive";

  } else if (/\b(not really|don'?t think so|maybe not|skeptical|concerned|worried|too expensive|too much|not sure|unsure)\b/i.test(text)) {
    result.sentiment = "negative";
  }

  return result;
}