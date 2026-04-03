export const PERSONALITIES = {
  MEDSPA: {
    name: 'medspa',
    tone: 'polished, warm, premium, concierge-like',
    vocabulary: {
      clients: 'patients',
      appointments: 'consultations',
      services: 'treatments',
      revenue: 'practice growth',
      business: 'practice',
      staff: 'care team',
      leads: 'patient inquiries'
    },
    style: 'elegant, reassuring, professional yet approachable',
    pacing: 'thoughtful, not rushed'
  },

  HOME_SERVICES: {
    name: 'home_services',
    tone: 'conversational, trustworthy, practical, helpful',
    vocabulary: {
      clients: 'customers',
      appointments: 'jobs',
      services: 'work',
      revenue: 'income',
      business: 'business',
      staff: 'team',
      leads: 'calls'
    },
    style: 'down-to-earth, reliable, straightforward',
    pacing: 'steady, efficient'
  },

  GENERAL: {
    name: 'general',
    tone: 'friendly, informative, human, trust-building',
    vocabulary: {
      clients: 'clients',
      appointments: 'appointments',
      services: 'services',
      revenue: 'revenue',
      business: 'business',
      staff: 'team',
      leads: 'inquiries'
    },
    style: 'balanced, professional, approachable',
    pacing: 'natural, responsive'
  }
};

export function detectIndustry(message = '') {
  const lowerMessage = message.toLowerCase().trim();

  // Medspa / aesthetics
  if (
    /\b(medspa|med spa|aesthetic|aesthetics|cosmetic|botox|filler|fillers|laser treatment|facial|facials|skincare|dermatology|derm clinic|injectables)\b/i.test(lowerMessage)
  ) {
    return PERSONALITIES.MEDSPA;
  }

  // Home services
  if (
    /\b(plumbing|plumber|roofing|roofer|hvac|heating|cooling|air conditioning|electrician|electrical|landscaping|landscape|painting|painter|cleaning service|janitorial|contractor|construction|remodeling|home repair)\b/i.test(lowerMessage)
  ) {
    return PERSONALITIES.HOME_SERVICES;
  }

  return PERSONALITIES.GENERAL;
}