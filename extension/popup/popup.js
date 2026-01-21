/**
 * GrantSignal Chrome Extension - Popup Script
 */

// DOM elements
let apiKeySection;
let mainSection;
let apiKeyInput;
let saveApiKeyBtn;
let openAppBtn;
let settingsBtn;
let statusMessage;

/**
 * Initialize popup
 */
async function init() {
  // Get DOM elements
  apiKeySection = document.getElementById('api-key-section');
  mainSection = document.getElementById('main-section');
  apiKeyInput = document.getElementById('api-key-input');
  saveApiKeyBtn = document.getElementById('save-api-key-btn');
  openAppBtn = document.getElementById('open-app-btn');
  settingsBtn = document.getElementById('settings-btn');
  statusMessage = document.getElementById('status-message');

  // Set up event listeners
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  openAppBtn.addEventListener('click', openApp);
  settingsBtn.addEventListener('click', openSettings);

  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });

  // Check if API key is configured
  await checkApiKey();
}

/**
 * Check if API key is configured
 */
async function checkApiKey() {
  try {
    const result = await chrome.storage.sync.get(['apiKey']);

    if (result.apiKey) {
      // API key exists, show main section
      apiKeySection.style.display = 'none';
      mainSection.style.display = 'block';
    } else {
      // No API key, show setup section
      apiKeySection.style.display = 'block';
      mainSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking API key:', error);
    showStatus('Failed to check API key configuration', 'error');
  }
}

/**
 * Save API key
 */
async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();

  // Validate API key format
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  if (!apiKey.startsWith('gs_live_') && !apiKey.startsWith('gs_test_')) {
    showStatus('Invalid API key format. Key should start with gs_live_ or gs_test_', 'error');
    return;
  }

  // Save to storage
  try {
    await chrome.storage.sync.set({ apiKey });

    // Clear input
    apiKeyInput.value = '';

    // Show success message
    showStatus('API key saved successfully!', 'success');

    // Switch to main section
    setTimeout(() => {
      apiKeySection.style.display = 'none';
      mainSection.style.display = 'block';
    }, 1500);
  } catch (error) {
    console.error('Error saving API key:', error);
    showStatus('Failed to save API key', 'error');
  }
}

/**
 * Open GrantSignal app
 */
function openApp() {
  chrome.tabs.create({
    url: 'https://app.grantsignal.com',
  });
}

/**
 * Open settings (API key management)
 */
function openSettings() {
  chrome.tabs.create({
    url: 'https://app.grantsignal.com/settings/api',
  });
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
