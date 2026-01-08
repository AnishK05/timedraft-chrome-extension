// TimeDraft Background Service Worker

// Import Luxon library first (must be before other imports that use it)
importScripts('../lib/luxon.min.js');

// Import other modules
importScripts('../shared/constants.js');
importScripts('./google_auth.js');
importScripts('./calendar_api.js');
importScripts('./time_utils.js');
importScripts('./availability.js');
importScripts('./format.js');

console.log('TimeDraft: Background service worker loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AVAILABILITY') {
    console.log('TimeDraft: Received GET_AVAILABILITY request');
    
    // Handle async processing
    handleGetAvailability(message.payload)
      .then((formattedText) => {
        sendResponse({
          type: 'AVAILABILITY_RESULT',
          formattedText: formattedText
        });
      })
      .catch((error) => {
        console.error('TimeDraft: Error processing availability:', error);
        sendResponse({
          type: 'AVAILABILITY_ERROR',
          error: error.message
        });
      });
    
    // Return true to indicate async response
    return true;
  }
});

/**
 * Main handler for availability request
 */
async function handleGetAvailability(payload) {
  try {
    // Step 1: Get OAuth token
    console.log('TimeDraft: Getting access token...');
    const token = await getValidToken();
    
    // Step 2: Parse date range
    console.log('TimeDraft: Parsing date range...');
    const { startDate, endDate } = parseDateRange(
      payload.rangePreset,
      payload.customStartDate,
      payload.customEndDate,
      payload.sourceTimezone
    );
    
    // Step 3: Build daily working windows
    console.log('TimeDraft: Building daily windows...');
    const dailyWindows = buildDailyWindows(
      startDate,
      endDate,
      payload.dailyStartTime,
      payload.dailyEndTime,
      payload.daysOfWeek,
      payload.sourceTimezone
    );
    
    if (dailyWindows.length === 0) {
      throw new Error('No valid days found in the selected date range.');
    }
    
    // Step 4: Fetch busy times from Calendar API
    console.log('TimeDraft: Fetching calendar data...');
    const busyIntervals = await fetchFreeBusy({
      timeMin: startDate.toISO(),
      timeMax: endDate.toISO(),
      timeZone: payload.sourceTimezone,
      token: token
    });
    
    // Step 5: Compute free time slots
    console.log('TimeDraft: Computing availability...');
    const freeSlots = computeAvailability(
      dailyWindows,
      busyIntervals,
      payload.minDuration,
      payload.sourceTimezone
    );
    
    // Step 6: Format the output text
    console.log('TimeDraft: Formatting text...');
    const formattedText = formatAvailabilityText(
      freeSlots,
      payload.outputTimezone,
      payload.rangePreset
    );
    
    console.log('TimeDraft: Processing complete');
    return formattedText;
    
  } catch (error) {
    console.error('TimeDraft: Error in handleGetAvailability:', error);
    throw error;
  }
}

