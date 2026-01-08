// Google OAuth authentication handler

/**
 * Get an OAuth access token for Google Calendar API
 * @param {boolean} interactive - Whether to show OAuth prompt to user
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      { 
        interactive: interactive
      },
      (token) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('TimeDraft: OAuth error:', error);
          
          if (error.includes('OAuth2 not granted') || error.includes('User did not approve')) {
            reject(new Error('Calendar access is required to fetch your availability. Please grant permission and try again.'));
          } else {
            reject(new Error('Authentication failed: ' + error));
          }
          return;
        }
        
        if (!token) {
          reject(new Error('No access token received'));
          return;
        }
        
        console.log('TimeDraft: Access token obtained');
        resolve(token);
      }
    );
  });
}

/**
 * Remove a cached token (e.g., if it's expired or invalid)
 * @param {string} token - The token to remove
 * @returns {Promise<void>}
 */
async function removeToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      resolve();
      return;
    }
    
    chrome.identity.removeCachedAuthToken({ token: token }, () => {
      if (chrome.runtime.lastError) {
        console.error('TimeDraft: Error removing token:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      console.log('TimeDraft: Token removed from cache');
      resolve();
    });
  });
}

/**
 * Get a valid access token, refreshing if necessary
 * @returns {Promise<string>} Valid access token
 */
async function getValidToken() {
  try {
    // Try to get token non-interactively first
    const token = await getAccessToken(true);
    return token;
  } catch (error) {
    // If that fails, the error will be thrown to caller
    throw error;
  }
}

/**
 * Retry getting a token after removing the cached one
 * Useful when API returns 401 (token expired)
 * @param {string} oldToken - The expired token
 * @returns {Promise<string>} New access token
 */
async function refreshToken(oldToken) {
  await removeToken(oldToken);
  return await getAccessToken(true);
}
