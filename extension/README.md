# GrantSignal Chrome Extension

A Chrome extension that allows you to search your organizational memory while writing in Google Docs.

## Features

- **Google Docs Integration**: Automatically detects when you're working in Google Docs
- **Floating Search Button**: Quick access to your organizational memory without leaving your document
- **Semantic Search**: Search across all your grants, documents, and past applications using natural language
- **Copy to Clipboard**: Easily copy relevant content directly into your document with rich formatting support
- **Secure API Authentication**: Uses your GrantSignal API key with scoped permissions

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the [GrantSignal Extension](https://chrome.google.com/webstore) page
2. Click "Add to Chrome"
3. Follow the setup instructions

### Manual Installation (Development)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension` directory from this repository

## Setup

### 1. Generate an API Key
1. Go to [GrantSignal Settings → API Keys](https://app.grantsignal.com/settings/api)
2. Click "Create API Key"
3. Give it a name like "Chrome Extension"
4. Select the following scope:
   - `extension:memory_search` - Search organizational memory
5. Copy the generated API key (starts with `gs_live_` or `gs_test_`)

### 2. Configure the Extension
1. Click the GrantSignal extension icon in your Chrome toolbar
2. Paste your API key into the setup form
3. Click "Save"

## Usage

### In Google Docs
1. Open any Google Docs document
2. You'll see a floating "GrantSignal" button in the bottom-right corner
3. Click the button to open the search panel
4. Enter your search query (e.g., "sustainability metrics", "youth programming outcomes")
5. Browse the results and click "Copy to Clipboard" to use the content

### Popup (Any Page)
1. Click the extension icon in your Chrome toolbar
2. Access quick actions:
   - **Open GrantSignal**: Launch the main app in a new tab
   - **Settings**: Manage your API key and permissions

## Permissions

The extension requires the following permissions:

- **activeTab**: To interact with the current Google Docs tab
- **storage**: To securely store your API key
- **Host access to docs.google.com**: To inject the search button in Google Docs
- **Host access to app.grantsignal.com**: To make API requests

## Security

- Your API key is stored locally in Chrome's secure sync storage
- All API requests use HTTPS encryption
- The extension only has access to Google Docs pages you explicitly visit
- API keys can be revoked at any time from the GrantSignal dashboard

## Troubleshooting

### Button doesn't appear in Google Docs
- Make sure you're on a Google Docs **document** page (not Sheets or Slides)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions/`

### Search returns no results
- Verify your API key is valid and has the correct scopes
- Check that your organization has uploaded documents to GrantSignal
- Ensure your API key hasn't been revoked

### API key is invalid
- Make sure you copied the entire key (should start with `gs_live_` or `gs_test_`)
- Verify the key has the `extension:memory_search` scope
- Check if the key has been revoked in the GrantSignal dashboard

## Development

### File Structure
```
extension/
├── manifest.json           # Extension configuration (Manifest V3)
├── background/
│   └── background.js       # Background service worker
├── content/
│   ├── content.js          # Content script for Google Docs
│   └── content.css         # Styles for injected UI
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup functionality
├── icons/
│   ├── icon16.png          # 16x16 icon
│   ├── icon32.png          # 32x32 icon
│   ├── icon48.png          # 48x48 icon
│   └── icon128.png         # 128x128 icon
└── README.md               # This file
```

### Building for Production
1. Update the version in `manifest.json`
2. Remove any console.log statements
3. Test thoroughly in Chrome
4. Zip the `extension` directory
5. Upload to Chrome Web Store Developer Dashboard

### API Integration
The extension uses the GrantSignal REST API:
- Base URL: `https://app.grantsignal.com/api/v1`
- Endpoint: `GET /documents/search`
- Authentication: Bearer token (API key)
- Required scope: `extension:memory_search`

## Support

For issues, questions, or feature requests:
- Email: support@grantsignal.com
- GitHub Issues: [github.com/grantsignal/extension](https://github.com/grantsignal/extension)
- Documentation: [docs.grantsignal.com](https://docs.grantsignal.com)

## Privacy Policy

The GrantSignal Chrome Extension:
- Does not collect or store any personal information
- Only accesses Google Docs pages when you explicitly visit them
- Only sends search queries you explicitly enter to the GrantSignal API
- Stores your API key locally in Chrome's secure storage
- Does not share your data with third parties

## License

Copyright © 2024 GrantSignal. All rights reserved.

## Changelog

### Version 1.0.0 (2024)
- Initial release
- Google Docs integration
- Semantic document search
- Copy to clipboard functionality
- Secure API key management
