// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Filtering options to reduce noise
  ignoreErrors: [
    // Network errors
    "Failed to fetch",
    "NetworkError",
    "ECONNRESET",
    "ETIMEDOUT",
    // Cancelled requests
    "AbortError",
  ],

  // Configure scope for privacy
  beforeSend(event) {
    // Scrub any potential PII from the event
    if (event.user) {
      // Only keep org ID and user ID, remove any PII
      event.user = {
        id: event.user.id,
      };
    }
    return event;
  },
});
