// TimeDraft Popup Script

console.log('TimeDraft: Popup loaded');

// Constants for localStorage
const STORAGE_KEY = 'timedraft_preferences';

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

// Friendly timezone names for display
const timezoneDisplayNames = {
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Phoenix': 'Arizona Time (MST)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Anchorage': 'Alaska Time (AKT)',
  'Pacific/Honolulu': 'Hawaii Time (HST)'
};

// Set the default output timezone based on user's detected timezone
const mappedTimezone = timezoneMapping[userTimezone] || 'America/New_York';
document.getElementById('outputTimezone').value = mappedTimezone;

// Display the detected timezone to the user
const displayName = timezoneDisplayNames[mappedTimezone] || userTimezone;
document.getElementById('detectedTimezone').textContent = displayName;

// Handle date range button toggle
const rangeButtons = document.querySelectorAll('.toggle-btn');
const customDatesDiv = document.getElementById('customDates');
let selectedRange = '1w';

// Load saved preferences
loadPreferences();

rangeButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    // Remove active class from all buttons
    rangeButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Store selected value
    selectedRange = e.target.dataset.value;
    
    // Show/hide custom dates
    customDatesDiv.style.display = selectedRange === 'custom' ? 'flex' : 'none';
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
    rangePreset: selectedRange,
    customStartDate: document.getElementById('customStartDate').value,
    customEndDate: document.getElementById('customEndDate').value,
    dailyStartTime: document.getElementById('dailyStartTime').value,
    dailyEndTime: document.getElementById('dailyEndTime').value,
    minDuration: parseInt(document.getElementById('minDuration').value),
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // All days of the week (Mon-Sun) including weekends
    sourceTimezone: mappedTimezone, // Use auto-detected timezone
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
const copyBtn = document.getElementById('copyBtn');
const originalCopyText = '📋 Copy to Clipboard';
const copiedText = '✓ Copied!';

copyBtn.addEventListener('click', async () => {
  const text = document.getElementById('resultText').textContent;
  
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = copiedText;
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.textContent = originalCopyText;
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy failed:', error);
    copyBtn.textContent = '✗ Copy failed';
    copyBtn.classList.add('error');
    
    setTimeout(() => {
      copyBtn.textContent = originalCopyText;
      copyBtn.classList.remove('error');
    }, 3000);
  }
});

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
  resultSection.style.display = 'none';
  form.style.display = 'block';
  // Reset copy button state
  copyBtn.textContent = originalCopyText;
  copyBtn.classList.remove('copied', 'error');
});

// Validation function
function validatePayload(payload) {
  // Check custom dates
  if (payload.rangePreset === 'custom') {
    if (!payload.customStartDate || !payload.customEndDate) {
      showError('Please select both start and end dates.');
      return false;
    }
    if (payload.customStartDate > payload.customEndDate) {
      showError('Start date cannot be after end date.');
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

// Save preferences to localStorage
function savePreferences() {
  const preferences = {
    rangePreset: selectedRange,
    customStartDate: document.getElementById('customStartDate').value,
    customEndDate: document.getElementById('customEndDate').value,
    dailyStartTime: document.getElementById('dailyStartTime').value,
    dailyEndTime: document.getElementById('dailyEndTime').value,
    minDuration: document.getElementById('minDuration').value,
    outputTimezone: document.getElementById('outputTimezone').value,
    saveEnabled: document.getElementById('savePreferences').checked
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    console.log('TimeDraft: Preferences saved', preferences);
  } catch (error) {
    console.error('TimeDraft: Failed to save preferences', error);
  }
}

// Load preferences from localStorage
function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    const preferences = JSON.parse(saved);
    console.log('TimeDraft: Loading preferences', preferences);
    
    // Restore checkbox state
    if (preferences.saveEnabled) {
      document.getElementById('savePreferences').checked = true;
      
      // Restore range preset
      if (preferences.rangePreset) {
        selectedRange = preferences.rangePreset;
        rangeButtons.forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.value === preferences.rangePreset) {
            btn.classList.add('active');
          }
        });
        
        // Show/hide custom dates
        customDatesDiv.style.display = preferences.rangePreset === 'custom' ? 'flex' : 'none';
      }
      
      // Restore custom dates
      if (preferences.customStartDate) {
        document.getElementById('customStartDate').value = preferences.customStartDate;
      }
      if (preferences.customEndDate) {
        document.getElementById('customEndDate').value = preferences.customEndDate;
      }
      
      // Restore working hours
      if (preferences.dailyStartTime) {
        document.getElementById('dailyStartTime').value = preferences.dailyStartTime;
      }
      if (preferences.dailyEndTime) {
        document.getElementById('dailyEndTime').value = preferences.dailyEndTime;
      }
      
      // Restore minimum duration
      if (preferences.minDuration) {
        document.getElementById('minDuration').value = preferences.minDuration;
      }
      
      // Restore output timezone
      if (preferences.outputTimezone) {
        document.getElementById('outputTimezone').value = preferences.outputTimezone;
      }
    }
  } catch (error) {
    console.error('TimeDraft: Failed to load preferences', error);
  }
}

// Handle preference changes
document.getElementById('savePreferences').addEventListener('change', (e) => {
  if (e.target.checked) {
    savePreferences();
  } else {
    // Clear saved preferences when unchecked
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('TimeDraft: Preferences cleared');
    } catch (error) {
      console.error('TimeDraft: Failed to clear preferences', error);
    }
  }
});

// Auto-save when any preference changes (if save checkbox is checked)
const autoSaveInputs = [
  'customStartDate',
  'customEndDate',
  'dailyStartTime',
  'dailyEndTime',
  'minDuration',
  'outputTimezone'
];

autoSaveInputs.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', () => {
      if (document.getElementById('savePreferences').checked) {
        savePreferences();
      }
    });
  }
});

// Also save when range buttons are clicked
rangeButtons.forEach(button => {
  const originalListener = button.onclick;
  button.addEventListener('click', () => {
    if (document.getElementById('savePreferences').checked) {
      // Use setTimeout to ensure selectedRange is updated first
      setTimeout(() => savePreferences(), 0);
    }
  });
});

