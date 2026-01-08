// Time and timezone utilities using Luxon

// This file will be loaded with Luxon library
// Luxon provides DateTime object globally via window.luxon

/**
 * Parse date range based on preset or custom dates
 * @param {string} preset - RANGE_PRESETS value
 * @param {string} customStartDate - ISO date string (YYYY-MM-DD)
 * @param {string} customEndDate - ISO date string (YYYY-MM-DD)
 * @param {string} sourceZone - IANA timezone
 * @returns {Object} { startDate: DateTime, endDate: DateTime }
 */
function parseDateRange(preset, customStartDate, customEndDate, sourceZone) {
  const { DateTime } = luxon;
  
  let startDate, endDate;
  
  if (preset === RANGE_PRESETS.CUSTOM) {
    // Parse custom dates
    startDate = DateTime.fromISO(customStartDate, { zone: sourceZone }).startOf('day');
    endDate = DateTime.fromISO(customEndDate, { zone: sourceZone }).endOf('day');
  } else if (preset === RANGE_PRESETS.ONE_WEEK) {
    // Next 7 days starting from today
    startDate = DateTime.now().setZone(sourceZone).startOf('day');
    endDate = startDate.plus({ days: 7 }).endOf('day');
  } else if (preset === RANGE_PRESETS.TWO_WEEKS) {
    // Next 14 days starting from today
    startDate = DateTime.now().setZone(sourceZone).startOf('day');
    endDate = startDate.plus({ days: 14 }).endOf('day');
  } else {
    throw new Error('Invalid range preset');
  }
  
  if (!startDate.isValid || !endDate.isValid) {
    throw new Error('Invalid date range');
  }
  
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  return { startDate, endDate };
}

/**
 * Build daily working windows for each day in the range
 * @param {DateTime} startDate - Range start
 * @param {DateTime} endDate - Range end
 * @param {string} dailyStartTime - Time string "HH:mm"
 * @param {string} dailyEndTime - Time string "HH:mm"
 * @param {number[]} daysOfWeek - Array of day numbers (1=Mon, 7=Sun)
 * @param {string} sourceZone - IANA timezone
 * @returns {Array} Array of { date: string, windowStart: DateTime, windowEnd: DateTime }
 */
function buildDailyWindows(startDate, endDate, dailyStartTime, dailyEndTime, daysOfWeek, sourceZone) {
  const { DateTime } = luxon;
  const windows = [];
  
  // Parse time strings
  const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
  const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
  
  // Iterate through each day in the range
  let currentDate = startDate.startOf('day');
  
  while (currentDate <= endDate) {
    // Check if this day of week is enabled
    // Luxon weekday: 1=Monday, 7=Sunday (matches our format)
    if (daysOfWeek.includes(currentDate.weekday)) {
      // Build window for this day
      const windowStart = currentDate.set({ hour: startHour, minute: startMinute });
      const windowEnd = currentDate.set({ hour: endHour, minute: endMinute });
      
      windows.push({
        date: currentDate.toISODate(),
        windowStart: windowStart,
        windowEnd: windowEnd
      });
    }
    
    // Move to next day
    currentDate = currentDate.plus({ days: 1 });
  }
  
  return windows;
}

/**
 * Convert a timestamp to a specific timezone
 * @param {string} isoTimestamp - ISO8601 timestamp
 * @param {string} targetZone - IANA timezone
 * @returns {DateTime} DateTime in target zone
 */
function convertToZone(isoTimestamp, targetZone) {
  const { DateTime } = luxon;
  return DateTime.fromISO(isoTimestamp).setZone(targetZone);
}

/**
 * Format a DateTime for display in email
 * @param {DateTime} dateTime - Luxon DateTime
 * @param {string} format - 'date' | 'time' | 'datetime'
 * @returns {string} Formatted string
 */
function formatDateTime(dateTime, format = 'time') {
  if (format === 'date') {
    // "Mon, Jan 12"
    return dateTime.toFormat('EEE, MMM d');
  } else if (format === 'time') {
    // "10:00 AM"
    return dateTime.toFormat('h:mm a');
  } else if (format === 'datetime') {
    // "Mon, Jan 12 at 10:00 AM"
    return dateTime.toFormat('EEE, MMM d \'at\' h:mm a');
  }
  return dateTime.toISO();
}

/**
 * Get timezone abbreviation for display
 * @param {string} timezone - IANA timezone
 * @returns {string} Abbreviation (e.g., "EST", "PST")
 */
function getTimezoneAbbreviation(timezone) {
  const { DateTime } = luxon;
  const dt = DateTime.now().setZone(timezone);
  return dt.offsetNameShort;
}
