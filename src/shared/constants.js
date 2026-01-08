// Shared constants for TimeDraft extension

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

const RANGE_PRESETS = {
  ONE_WEEK: '1w',
  TWO_WEEKS: '2w',
  CUSTOM: 'custom'
};

const ERROR_MESSAGES = {
  OAUTH_DENIED: 'Calendar access is required to fetch your availability. Please grant permission and try again.',
  API_FAILURE: 'Unable to fetch calendar data. Please try again later.',
  NO_FREE_TIME: "I'm fairly booked during this period. Could you share a few times that work for you?"
};

// Maximum number of free blocks to show per day (for readability)
const MAX_BLOCKS_PER_DAY = 10;
