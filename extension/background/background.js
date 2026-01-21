/**
 * GrantSignal Chrome Extension - Background Service Worker
 * Handles background tasks and communication between content scripts and popup
 */

// Configuration
const GRANTSIGNAL_API_URL = 'https://app.grantsignal.com/api/v1';

/**
 * Install event - runs when extension is installed
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('GrantSignal extension installed:', details.reason);

  if (details.reason === 'install') {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: 'https://app.grantsignal.com/settings/api',
    });
  }
});

/**
 * Message handler for communication between content script and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'search':
      handleSearch(request.query, request.apiKey)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
      return true; // Keep channel open for async response

    case 'getApiKey':
      chrome.storage.sync.get(['apiKey'], (result) => {
        sendResponse({ apiKey: result.apiKey });
      });
      return true;

    case 'setApiKey':
      chrome.storage.sync.set({ apiKey: request.apiKey }, () => {
        sendResponse({ success: true });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Handle search request to GrantSignal API
 */
async function handleSearch(query, apiKey) {
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  try {
    const response = await fetch(
      `${GRANTSIGNAL_API_URL}/documents/search?query=${encodeURIComponent(query)}&limit=10`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Search failed: ${response.statusText}`);
      }
    }

    const data = await response.json();
    return { results: data.data.results };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Handle browser action click (when user clicks extension icon)
 */
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a Google Docs page
  if (tab.url && tab.url.includes('docs.google.com')) {
    // Send message to content script to toggle popup
    chrome.tabs.sendMessage(tab.id, { action: 'togglePopup' });
  } else {
    // Open GrantSignal in new tab
    chrome.tabs.create({
      url: 'https://app.grantsignal.com',
    });
  }
});

console.log('GrantSignal background service worker loaded');
