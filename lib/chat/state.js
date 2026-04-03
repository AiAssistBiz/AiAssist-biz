export const STATES = {
  DISCOVERY: 'discovery',
  PROBLEM_AWARENESS: 'problem_awareness',
  EDUCATION: 'education',
  VALUE_REALIZATION: 'value_realization',
  CONSIDERATION: 'consideration',
  CONVERSION: 'conversion'
};

export function updateState(memory, intent) {
  const { state, businessType, painPoints, engagementLevel } = memory;

  switch (state) {
    case STATES.DISCOVERY:
      if (businessType) {
        return STATES.PROBLEM_AWARENESS;
      }
      break;

    case STATES.PROBLEM_AWARENESS:
      if (
        painPoints.length > 0 ||
        engagementLevel >= 3 ||
        intent.type === 'business_context'
      ) {
        return STATES.EDUCATION;
      }
      break;

    case STATES.EDUCATION:
      if (
        engagementLevel >= 4 &&
        (intent.sentiment === 'positive' || intent.type === 'how_it_works')
      ) {
        return STATES.VALUE_REALIZATION;
      }
      break;

    case STATES.VALUE_REALIZATION:
      if (
        engagementLevel >= 6 &&
        (
          intent.sentiment === 'positive' ||
          intent.type === 'pricing' ||
          intent.type === 'how_it_works'
        )
      ) {
        return STATES.CONSIDERATION;
      }
      break;

    case STATES.CONSIDERATION:
      if (
        engagementLevel >= 8 &&
        (intent.type === 'pricing' || intent.sentiment === 'positive')
      ) {
        return STATES.CONVERSION;
      }
      break;

    case STATES.CONVERSION:
      return STATES.CONVERSION;
  }

  return state;
}