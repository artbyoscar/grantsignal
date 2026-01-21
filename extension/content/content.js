/**
 * GrantSignal Chrome Extension - Content Script
 * Runs on Google Docs pages to inject the memory search button
 */

// Configuration
const GRANTSIGNAL_API_URL = 'https://app.grantsignal.com/api/v1';
const BUTTON_ID = 'grantsignal-memory-button';
const POPUP_ID = 'grantsignal-memory-popup';

// State
let isGoogleDoc = false;
let popupOpen = false;
let apiKey = null;

/**
 * Detect if we're on a Google Docs document
 */
function detectGoogleDoc() {
  const url = window.location.href;
  const isDocUrl = url.includes('docs.google.com/document');
  const hasEditor = document.querySelector('.kix-appview-editor') !== null;

  isGoogleDoc = isDocUrl && hasEditor;
  return isGoogleDoc;
}

/**
 * Create and inject the floating GrantSignal button
 */
function injectButton() {
  // Check if button already exists
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>GrantSignal</span>
  `;
  button.title = 'Search organizational memory';

  button.addEventListener('click', togglePopup);

  document.body.appendChild(button);
  console.log('GrantSignal: Button injected');
}

/**
 * Create and inject the search popup
 */
function createPopup() {
  if (document.getElementById(POPUP_ID)) {
    return;
  }

  const popup = document.createElement('div');
  popup.id = POPUP_ID;
  popup.innerHTML = `
    <div class="gs-popup-header">
      <h3>Search Organizational Memory</h3>
      <button class="gs-close-btn" id="gs-close-popup">&times;</button>
    </div>
    <div class="gs-popup-body">
      <div class="gs-search-container">
        <input
          type="text"
          id="gs-search-input"
          placeholder="Search documents, grants, and past applications..."
          autocomplete="off"
        />
        <button id="gs-search-btn">Search</button>
      </div>
      <div id="gs-api-key-setup" class="gs-setup-notice" style="display: none;">
        <p>To use this extension, you need to set up your API key:</p>
        <ol>
          <li>Go to <a href="https://app.grantsignal.com/settings/api" target="_blank">GrantSignal Settings</a></li>
          <li>Generate an API key with "extension:memory_search" scope</li>
          <li>Enter it below:</li>
        </ol>
        <div class="gs-api-key-input">
          <input type="password" id="gs-api-key-input" placeholder="gs_live_..." />
          <button id="gs-save-api-key">Save</button>
        </div>
      </div>
      <div id="gs-results"></div>
    </div>
  `;

  document.body.appendChild(popup);

  // Event listeners
  document.getElementById('gs-close-popup').addEventListener('click', closePopup);
  document.getElementById('gs-search-btn').addEventListener('click', performSearch);
  document.getElementById('gs-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  document.getElementById('gs-save-api-key').addEventListener('click', saveApiKey);

  console.log('GrantSignal: Popup created');
}

/**
 * Toggle popup visibility
 */
function togglePopup() {
  popupOpen = !popupOpen;
  const popup = document.getElementById(POPUP_ID);

  if (!popup) {
    createPopup();
  }

  const popupElement = document.getElementById(POPUP_ID);
  if (popupOpen) {
    popupElement.classList.add('gs-open');
    checkApiKey();
  } else {
    popupElement.classList.remove('gs-open');
  }
}

/**
 * Close popup
 */
function closePopup() {
  popupOpen = false;
  const popup = document.getElementById(POPUP_ID);
  if (popup) {
    popup.classList.remove('gs-open');
  }
}

/**
 * Check if API key is configured
 */
async function checkApiKey() {
  const result = await chrome.storage.sync.get(['apiKey']);
  apiKey = result.apiKey;

  const setupNotice = document.getElementById('gs-api-key-setup');
  const resultsContainer = document.getElementById('gs-results');

  if (!apiKey) {
    setupNotice.style.display = 'block';
    resultsContainer.style.display = 'none';
  } else {
    setupNotice.style.display = 'none';
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<p class="gs-placeholder">Enter a search query to find relevant content from your organization</p>';
  }
}

/**
 * Save API key to storage
 */
async function saveApiKey() {
  const input = document.getElementById('gs-api-key-input');
  const key = input.value.trim();

  if (!key) {
    alert('Please enter an API key');
    return;
  }

  if (!key.startsWith('gs_live_') && !key.startsWith('gs_test_')) {
    alert('Invalid API key format. Key should start with gs_live_ or gs_test_');
    return;
  }

  await chrome.storage.sync.set({ apiKey: key });
  apiKey = key;
  input.value = '';

  checkApiKey();
  showNotification('API key saved successfully!', 'success');
}

/**
 * Perform search using GrantSignal API
 */
async function performSearch() {
  const searchInput = document.getElementById('gs-search-input');
  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  if (!apiKey) {
    showNotification('Please configure your API key first', 'error');
    return;
  }

  const resultsContainer = document.getElementById('gs-results');
  resultsContainer.innerHTML = '<div class="gs-loading">Searching...</div>';

  try {
    const response = await fetch(`${GRANTSIGNAL_API_URL}/documents/search?query=${encodeURIComponent(query)}&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your settings.');
      }
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    displayResults(data.data.results);
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `<div class="gs-error">${error.message}</div>`;
  }
}

/**
 * Display search results
 */
function displayResults(results) {
  const resultsContainer = document.getElementById('gs-results');

  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '<p class="gs-no-results">No results found. Try a different search query.</p>';
    return;
  }

  const resultsHTML = results.map(result => `
    <div class="gs-result-item">
      <div class="gs-result-header">
        <h4>${escapeHtml(result.document.name)}</h4>
        <span class="gs-result-score">${Math.round(result.score * 100)}% match</span>
      </div>
      <p class="gs-result-excerpt">${escapeHtml(result.excerpt || 'No excerpt available')}</p>
      <div class="gs-result-actions">
        <button class="gs-copy-btn" data-text="${escapeHtml(result.excerpt || '')}">
          Copy to Clipboard
        </button>
      </div>
    </div>
  `).join('');

  resultsContainer.innerHTML = resultsHTML;

  // Add copy button event listeners
  document.querySelectorAll('.gs-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.target.getAttribute('data-text');
      copyToClipboard(text);
    });
  });
}

/**
 * Copy text to clipboard with rich formatting support
 */
async function copyToClipboard(text) {
  try {
    // Create a temporary element to preserve formatting
    const tempElement = document.createElement('div');
    tempElement.innerHTML = text;
    document.body.appendChild(tempElement);

    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Copy to clipboard
    document.execCommand('copy');

    // Clean up
    selection.removeAllRanges();
    document.body.removeChild(tempElement);

    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showNotification('Failed to copy to clipboard', 'error');
  }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `gs-notification gs-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('gs-show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('gs-show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize the extension
 */
function init() {
  console.log('GrantSignal: Content script loaded');

  // Check if we're on a Google Doc
  if (detectGoogleDoc()) {
    console.log('GrantSignal: Google Doc detected, injecting button');
    injectButton();
  }

  // Watch for navigation changes (Google Docs is a SPA)
  const observer = new MutationObserver(() => {
    if (detectGoogleDoc() && !document.getElementById(BUTTON_ID)) {
      injectButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
