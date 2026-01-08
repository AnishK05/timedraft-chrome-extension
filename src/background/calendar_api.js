// Google Calendar API client

/**
 * Fetch free/busy information from Google Calendar
 * @param {Object} params
 * @param {string} params.timeMin - Start time (RFC3339)
 * @param {string} params.timeMax - End time (RFC3339)
 * @param {string} params.timeZone - Timezone for the query
 * @param {string} params.token - OAuth access token
 * @returns {Promise<Array>} Array of busy intervals
 */
async function fetchFreeBusy({ timeMin, timeMax, timeZone, token }) {
  const url = `${CALENDAR_API_BASE}/freeBusy`;
  
  const requestBody = {
    timeMin: timeMin,
    timeMax: timeMax,
    timeZone: timeZone,
    items: [{ id: 'primary' }]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('TimeDraft: Token expired, attempting refresh...');
        const newToken = await refreshToken(token);
        
        // Retry the request with new token
        return await fetchFreeBusy({ timeMin, timeMax, timeZone, token: newToken });
      }
      
      const errorText = await response.text();
      throw new Error(`Calendar API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract busy intervals from the response
    const busyIntervals = [];
    
    if (data.calendars && data.calendars.primary && data.calendars.primary.busy) {
      for (const busyBlock of data.calendars.primary.busy) {
        busyIntervals.push({
          start: busyBlock.start,
          end: busyBlock.end
        });
      }
    }
    
    console.log(`TimeDraft: Found ${busyIntervals.length} busy intervals`);
    return busyIntervals;
    
  } catch (error) {
    console.error('TimeDraft: Calendar API error:', error);
    throw new Error('Unable to fetch calendar data. Please check your internet connection and try again.');
  }
}
