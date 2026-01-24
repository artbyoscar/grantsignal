// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
