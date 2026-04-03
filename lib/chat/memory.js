import { detectIntent } from './intent.js';

export function createDefaultMemory() {
  return {
    state: 'discovery',
    businessType: null,
    industry: null,
    painPoints: [],
    objections: [],
    engagementLevel: 0,
    messageCount: 0,
    lastContactRequest: null,
    conversationTopics: [],
    userPreferences: {},
    contactProvided: false,
    qualified: false,
    trustScore: 0
  };
}

export function updateEngagement(memory, message = '') {
  const intent = detectIntent(message);

  let engagementIncrease = 1;

  // Primary intent bonuses
  if (intent.type === 'business_context') {
    engagementIncrease += 1;
  }

  if (intent.type === 'how_it_works') {
    engagementIncrease += 1.5;
  }

  if (intent.type === 'pricing') {
    engagementIncrease += 1.5;
  }

  if (intent.type === 'browsing') {
    engagementIncrease -= 0.5;
  }

  // Sentiment layer
  if (intent.sentiment === 'positive') {
    engagementIncrease += 2;
  }

  if (intent.sentiment === 'negative') {
    engagementIncrease -= 1;
  }

  // Longer messages usually mean more engagement
  if (message.trim().length > 50) {
    engagementIncrease += 0.5;
  }

  memory.engagementLevel = Math.max(0, memory.engagementLevel + engagementIncrease);
  memory.messageCount += 1;

  // Trust score capped at 10
  memory.trustScore = Math.min(10, memory.engagementLevel / 2);

  return memory;
}

export function extractBusinessType(message = '', currentBusinessType = null) {
  const lowerMessage = message.toLowerCase();

  const businessPatterns = {
    medspa: /medspa|med spa|spa|aesthetic|cosmetic|beauty|dermatology|aesthetics/i,
    plumbing: /plumbing|plumber/i,
    roofing: /roofing|roofer|roof repair|roofing company/i,
    hvac: /hvac|heating|cooling|air conditioning/i,
    electrician: /electrician|electrical/i,
    landscaping: /landscaping|landscape|lawn care|yard work/i,
    painting: /painting|painter/i,
    cleaning: /cleaning|cleaner|janitorial/i,
    contractor: /contractor|construction|remodel|builder/i,
    restaurant: /restaurant|food service|cafe|dining/i,
    retail: /retail|store|shop|boutique/i,
    professional: /lawyer|attorney|accountant|consultant|agency|firm/i
  };

  for (const [type, pattern] of Object.entries(businessPatterns)) {
    if (pattern.test(lowerMessage)) {
      return type;
    }
  }

  return currentBusinessType;
}

export function extractPainPoints(message = '', existingPainPoints = []) {
  const lowerMessage = message.toLowerCase();
  const newPainPoints = [...existingPainPoints];

  const painPointPatterns = {
    missed_calls: /missed call|can'?t answer|unavailable|busy|after hours|miss calls|unanswered calls/i,
    slow_response: /slow response|slow replies|delay|not getting back|late reply|follow up|follow-up/i,
    lost_leads: /lose leads|losing leads|missed opportunities|potential customers|lost leads/i,
    overwhelmed: /overwhelmed|too busy|can'?t keep up|stretched thin|swamped/i,
    staffing: /short staff|not enough people|hiring|staff issues|understaffed/i,
    competition: /competition|competitors|losing to others/i,
    cost: /expensive|cost too much|budget|afford/i,
    time: /time consuming|takes too long|not enough time/i
  };

  for (const [painPoint, pattern] of Object.entries(painPointPatterns)) {
    if (pattern.test(lowerMessage) && !newPainPoints.includes(painPoint)) {
      newPainPoints.push(painPoint);
    }
  }

  return newPainPoints;
}