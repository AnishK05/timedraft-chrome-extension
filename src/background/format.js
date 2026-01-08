// Format availability slots into email text

/**
 * Format free slots into human-readable email text
 * @param {Object} freeSlotsByDate - Map of date -> array of { start, end } DateTime objects
 * @param {string} outputTimezone - IANA timezone for display
 * @param {string} rangePreset - The range preset used
 * @returns {string} Formatted text ready to insert into email
 */
function formatAvailabilityText(freeSlotsByDate, outputTimezone, rangePreset) {
  const { DateTime } = luxon;
  
  // Check if we have any free slots
  const dates = Object.keys(freeSlotsByDate).sort();
  
  if (dates.length === 0) {
    return ERROR_MESSAGES.NO_FREE_TIME;
  }
  
  // Get timezone abbreviation for display
  const tzAbbr = getTimezoneAbbreviation(outputTimezone);
  
  // Build the header
  let text = '';
  
  if (rangePreset === RANGE_PRESETS.ONE_WEEK) {
    text += `Here are a few times that work for me over the next week (${tzAbbr}):\n\n`;
  } else if (rangePreset === RANGE_PRESETS.TWO_WEEKS) {
    text += `Here are a few times that work for me over the next 2 weeks (${tzAbbr}):\n\n`;
  } else {
    text += `Here are a few times that work for me (${tzAbbr}):\n\n`;
  }
  
  // Format each day's availability
  for (const date of dates) {
    const slots = freeSlotsByDate[date];
    
    // Limit to top N blocks per day for readability
    const limitedSlots = slots.slice(0, MAX_BLOCKS_PER_DAY);
    
    // Convert slots to output timezone
    const convertedSlots = limitedSlots.map(slot => ({
      start: slot.start.setZone(outputTimezone),
      end: slot.end.setZone(outputTimezone)
    }));
    
    // Format the date
    const dateLabel = formatDateTime(convertedSlots[0].start, 'date');
    
    // Format the time ranges
    const timeRanges = convertedSlots.map(slot => {
      const startTime = formatDateTime(slot.start, 'time');
      const endTime = formatDateTime(slot.end, 'time');
      return `${startTime}–${endTime}`;
    }).join(', ');
    
    text += `${dateLabel}: ${timeRanges}\n`;
  }
  
  // Add closing line
  text += `\nIf none of these work, feel free to share a few times that do.`;
  
  return text;
}

/**
 * Format a single time slot for display
 * @param {DateTime} start - Start time
 * @param {DateTime} end - End time
 * @param {string} timezone - Display timezone
 * @returns {string} Formatted time range
 */
function formatTimeSlot(start, end, timezone) {
  const startInZone = start.setZone(timezone);
  const endInZone = end.setZone(timezone);
  
  const startTime = formatDateTime(startInZone, 'time');
  const endTime = formatDateTime(endInZone, 'time');
  
  return `${startTime}–${endTime}`;
}

/**
 * Format duration in a human-readable way
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
}

