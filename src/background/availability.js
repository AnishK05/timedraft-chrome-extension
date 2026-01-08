// Core availability computation algorithm

/**
 * Compute free time slots from daily windows and busy intervals
 * @param {Array} dailyWindows - Array of { date, windowStart, windowEnd }
 * @param {Array} busyIntervals - Array of { start, end } ISO timestamps
 * @param {number} minDurationMinutes - Minimum duration for a free slot
 * @param {string} sourceZone - Source timezone
 * @returns {Object} Map of date -> array of free slots
 */
function computeAvailability(dailyWindows, busyIntervals, minDurationMinutes, sourceZone) {
  const { DateTime } = luxon;
  const freeSlotsByDate = {};
  
  // Convert busy intervals to DateTime objects
  const busyBlocks = busyIntervals.map(interval => ({
    start: DateTime.fromISO(interval.start),
    end: DateTime.fromISO(interval.end)
  }));
  
  // Process each daily window
  for (const window of dailyWindows) {
    const { date, windowStart, windowEnd } = window;
    
    // Find busy blocks that overlap with this window
    const overlappingBusy = [];
    
    for (const busy of busyBlocks) {
      // Check for overlap
      if (busy.start < windowEnd && busy.end > windowStart) {
        // Calculate the intersection
        const overlapStart = DateTime.max(busy.start, windowStart);
        const overlapEnd = DateTime.min(busy.end, windowEnd);
        
        if (overlapStart < overlapEnd) {
          overlappingBusy.push({
            start: overlapStart,
            end: overlapEnd
          });
        }
      }
    }
    
    // Sort and merge overlapping busy blocks
    const mergedBusy = mergeIntervals(overlappingBusy);
    
    // Compute free blocks by subtracting busy from window
    const freeBlocks = subtractBusyFromWindow(windowStart, windowEnd, mergedBusy);
    
    // Filter by minimum duration
    const filteredBlocks = freeBlocks.filter(block => {
      const durationMinutes = block.end.diff(block.start, 'minutes').minutes;
      return durationMinutes >= minDurationMinutes;
    });
    
    // Store if there are any free blocks
    if (filteredBlocks.length > 0) {
      freeSlotsByDate[date] = filteredBlocks;
    }
  }
  
  return freeSlotsByDate;
}

/**
 * Merge overlapping or adjacent intervals
 * @param {Array} intervals - Array of { start, end } DateTime objects
 * @returns {Array} Merged intervals
 */
function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  
  const merged = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];
    
    // Check if intervals overlap or are adjacent
    if (current.start <= lastMerged.end) {
      // Merge by extending the end time
      lastMerged.end = DateTime.max(lastMerged.end, current.end);
    } else {
      // No overlap, add as new interval
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Subtract busy intervals from a time window to get free blocks
 * @param {DateTime} windowStart - Window start
 * @param {DateTime} windowEnd - Window end
 * @param {Array} busyBlocks - Sorted, merged busy intervals
 * @returns {Array} Free blocks
 */
function subtractBusyFromWindow(windowStart, windowEnd, busyBlocks) {
  const { DateTime } = luxon;
  const freeBlocks = [];
  
  let cursor = windowStart;
  
  for (const busy of busyBlocks) {
    // If there's a gap between cursor and busy start, that's free time
    if (cursor < busy.start) {
      freeBlocks.push({
        start: cursor,
        end: busy.start
      });
    }
    
    // Move cursor to end of busy block
    cursor = DateTime.max(cursor, busy.end);
  }
  
  // Check if there's free time after the last busy block
  if (cursor < windowEnd) {
    freeBlocks.push({
      start: cursor,
      end: windowEnd
    });
  }
  
  return freeBlocks;
}
