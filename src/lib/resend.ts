import { Resend } from "resend";

// Create a mock/noop client for development when API key is not set
const createResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }

  // Return a mock client for development
  console.warn("[Resend] RESEND_API_KEY not set - emails will be logged but not sent");

  return {
    emails: {
      send: async (options: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
      }) => {
        console.log("[Resend Mock] Would send email:", {
          from: options.from,
          to: options.to,
          subject: options.subject,
        });
        return { data: { id: `mock-${Date.now()}` }, error: null };
      },
    },
  };
};

export const resend = createResendClient();

export const FROM_EMAIL = process.env.FROM_EMAIL || "GrantSignal <noreply@grantsignal.com>";
