// TimeDraft Popup Script

console.log('TimeDraft: Popup loaded');

// Get user's timezone and set as default
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Mapping of detected timezones to dropdown options
const timezoneMapping = {
  'America/New_York': 'America/New_York',
  'America/Detroit': 'America/New_York',
  'America/Indiana/Indianapolis': 'America/New_York',
  'America/Kentucky/Louisville': 'America/New_York',
  'America/Chicago': 'America/Chicago',
  'America/Indiana/Knox': 'America/Chicago',
  'America/Menominee': 'America/Chicago',
  'America/Denver': 'America/Denver',
  'America/Boise': 'America/Denver',
  'America/Phoenix': 'America/Phoenix',
  'America/Los_Angeles': 'America/Los_Angeles',
  'America/Anchorage': 'America/Anchorage',
  'America/Juneau': 'America/Anchorage',
  'Pacific/Honolulu': 'Pacific/Honolulu'
};

// Set the default timezone based on user's detected timezone
const mappedTimezone = timezoneMapping[userTimezone] || 'America/New_York';
document.getElementById('sourceTimezone').value = mappedTimezone;
document.getElementById('outputTimezone').value = mappedTimezone;

// Handle custom date range toggle
const rangeInputs = document.querySelectorAll('input[name="range"]');
const customDatesDiv = document.getElementById('customDates');

rangeInputs.forEach(input => {
  input.addEventListener('change', (e) => {
    customDatesDiv.style.display = e.target.value === 'custom' ? 'flex' : 'none';
  });
});

// Handle form submission
const form = document.getElementById('availabilityForm');
const resultSection = document.getElementById('resultSection');
const loadingSection = document.getElementById('loadingSection');
const generateBtn = document.getElementById('generateBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Collect form data
  const payload = {
    rangePreset: document.querySelector('input[name="range"]:checked').value,
    customStartDate: document.getElementById('customStartDate').value,
    customEndDate: document.getElementById('customEndDate').value,
    dailyStartTime: document.getElementById('dailyStartTime').value,
    dailyEndTime: document.getElementById('dailyEndTime').value,
    minDuration: parseInt(document.getElementById('minDuration').value),
    daysOfWeek: Array.from(document.querySelectorAll('input[name="dayOfWeek"]:checked'))
      .map(cb => parseInt(cb.value)),
    sourceTimezone: document.getElementById('sourceTimezone').value.trim(),
    outputTimezone: document.getElementById('outputTimezone').value.trim()
  };
  
  // Validate
  if (!validatePayload(payload)) {
    return;
  }
  
  // Show loading
  form.style.display = 'none';
  loadingSection.style.display = 'block';
  
  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'GET_AVAILABILITY',
      payload: payload
    });
    
    if (response.type === 'AVAILABILITY_ERROR') {
      throw new Error(response.error);
    }
    
    // Show result
    loadingSection.style.display = 'none';
    resultSection.style.display = 'block';
    document.getElementById('resultText').textContent = response.formattedText;
    
  } catch (error) {
    console.error('TimeDraft: Error:', error);
    loadingSection.style.display = 'none';
    form.style.display = 'block';
    showError(error.message || 'An error occurred. Please try again.');
  }
});

// Copy to clipboard button
document.getElementById('copyBtn').addEventListener('click', async () => {
  const text = document.getElementById('resultText').textContent;
  const statusMsg = document.getElementById('statusMessage');
  
  try {
    await navigator.clipboard.writeText(text);
    statusMsg.textContent = '✓ Copied to clipboard!';
    statusMsg.className = 'status-message success';
    
    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 3000);
  } catch (error) {
    console.error('Copy failed:', error);
    statusMsg.textContent = '✗ Copy failed. Please select and copy manually.';
    statusMsg.className = 'status-message error';
  }
});

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
  resultSection.style.display = 'none';
  form.style.display = 'block';
  document.getElementById('statusMessage').style.display = 'none';
});

// Validation function
function validatePayload(payload) {
  // Check days selected
  if (payload.daysOfWeek.length === 0) {
    showError('Please select at least one day of the week.');
    return false;
  }
  
  // Check custom dates
  if (payload.rangePreset === 'custom') {
    if (!payload.customStartDate || !payload.customEndDate) {
      showError('Please select both start and end dates.');
      return false;
    }
    if (payload.customStartDate >= payload.customEndDate) {
      showError('Start date must be before end date.');
      return false;
    }
  }
  
  // Check working hours
  if (payload.dailyStartTime >= payload.dailyEndTime) {
    showError('Start time must be before end time.');
    return false;
  }
  
  // Timezones are always valid from dropdown
  return true;
}

// Show error message
function showError(message) {
  const statusMsg = document.getElementById('statusMessage');
  statusMsg.textContent = message;
  statusMsg.className = 'status-message error';
  statusMsg.style.display = 'block';
  
  setTimeout(() => {
    statusMsg.style.display = 'none';
  }, 5000);
}

