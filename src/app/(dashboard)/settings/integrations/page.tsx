"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Plus, Copy, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";

interface ServiceIntegration {
  name: string;
  description: string;
  envCheck: string; // environment variable name (checked server-side)
  connected: boolean;
  comingSoon?: boolean;
}

const SERVICE_INTEGRATIONS: ServiceIntegration[] = [
  { name: "Amazon S3", description: "Document storage", envCheck: "AWS_S3_BUCKET", connected: true },
  { name: "Pinecone", description: "Vector search for RAG", envCheck: "PINECONE_API_KEY", connected: true },
  { name: "Anthropic Claude", description: "AI content generation", envCheck: "ANTHROPIC_API_KEY", connected: true },
  { name: "Inngest", description: "Background job processing", envCheck: "INNGEST_EVENT_KEY", connected: true },
  { name: "Resend", description: "Transactional email", envCheck: "RESEND_API_KEY", connected: true },
  { name: "Sentry", description: "Error tracking", envCheck: "SENTRY_DSN", connected: true },
  { name: "Salesforce", description: "CRM integration", envCheck: "", connected: false, comingSoon: true },
  { name: "Submittable", description: "Grant submissions", envCheck: "", connected: false, comingSoon: true },
];

export default function IntegrationsSettingsPage() {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch real API keys from the webhooks router (or apiKeys if a dedicated router exists)
  const { data: webhooks, isLoading: webhooksLoading } = api.webhooks.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc]">Integrations</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage your connected services and webhook endpoints
        </p>
      </div>

      {/* Service Status Cards */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">
          Service Status
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="rounded-lg border border-slate-700 bg-[#0f172a] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#f8fafc]">
                    {integration.name}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>
                </div>
                {integration.comingSoon ? (
                  <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-[#94a3b8]">
                    Coming Soon
                  </span>
                ) : integration.connected ? (
                  <span className="rounded-full bg-[#22c55e]/10 px-2 py-1 text-xs font-medium text-[#22c55e]">
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-[#94a3b8]">
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#f8fafc]">Webhooks</h3>
            <p className="text-xs text-slate-500 mt-1">
              Receive real-time notifications when events happen in GrantSignal
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/settings/webhooks'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Manage Webhooks
          </Button>
        </div>

        {webhooksLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading webhooks...
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#0f172a] p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f8fafc] truncate">{webhook.name}</p>
                  <p className="text-xs text-slate-500 truncate font-mono">{webhook.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {webhook.subscribedEvents.length} event{webhook.subscribedEvents.length !== 1 ? 's' : ''}
                  </span>
                  {webhook.isActive ? (
                    <span className="rounded-full bg-[#22c55e]/10 px-2 py-1 text-xs font-medium text-[#22c55e]">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
                      Paused
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No webhooks configured yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Set up webhooks to integrate GrantSignal with your other tools.
            </p>
          </div>
        )}
      </div>

      {/* Environment Configuration Note */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-2">Environment Configuration</h3>
        <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
          <p className="text-sm text-[#94a3b8]">
            Service API keys (Anthropic, Pinecone, S3, etc.) are configured via environment variables
            in your deployment platform. These are securely stored server-side and are never exposed
            to the browser. To update these values, modify them in your Vercel or hosting provider
            dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
