"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface Integration {
  name: string;
  connected: boolean;
  comingSoon?: boolean;
}

const integrations: Integration[] = [
  { name: "S3 Storage", connected: true },
  { name: "Pinecone", connected: true },
  { name: "OpenAI", connected: true },
  { name: "Anthropic", connected: true },
  { name: "Inngest", connected: true },
  { name: "Salesforce", connected: false, comingSoon: true },
  { name: "Google Calendar", connected: false, comingSoon: true },
  { name: "Submittable", connected: false, comingSoon: true },
  { name: "Fluxx", connected: false, comingSoon: true },
];

export default function IntegrationsSettingsPage() {
  const [showApiKeys, setShowApiKeys] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc]">Integrations</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage your connected services and API keys
        </p>
      </div>

      {/* Integration Status Cards */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">
          Service Status
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="rounded-lg border border-slate-700 bg-[#0f172a] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#f8fafc]">
                  {integration.name}
                </span>
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

      {/* API Keys Section */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#f8fafc]">API Keys</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="text-[#94a3b8] hover:text-[#3b82f6]"
          >
            {showApiKeys ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="openai-key"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              OpenAI API Key
            </label>
            <Input
              id="openai-key"
              type={showApiKeys ? "text" : "password"}
              value="sk-proj-••••••••••••••••••••••••••••••••"
              readOnly
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] font-mono text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="anthropic-key"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              Anthropic API Key
            </label>
            <Input
              id="anthropic-key"
              type={showApiKeys ? "text" : "password"}
              value="sk-ant-••••••••••••••••••••••••••••••••"
              readOnly
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] font-mono text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="pinecone-key"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              Pinecone API Key
            </label>
            <Input
              id="pinecone-key"
              type={showApiKeys ? "text" : "password"}
              value="••••••••-••••-••••-••••-••••••••••••"
              readOnly
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] font-mono text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="inngest-key"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              Inngest Event Key
            </label>
            <Input
              id="inngest-key"
              type={showApiKeys ? "text" : "password"}
              value="••••••••••••••••••••••••••••••••••••"
              readOnly
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] font-mono text-sm"
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-700 bg-[#0f172a] p-4">
          <p className="text-xs text-[#94a3b8]">
            <span className="font-medium text-[#f8fafc]">Note:</span> API keys
            are stored securely and encrypted. Contact your administrator to
            update these values.
          </p>
        </div>
      </div>
    </div>
  );
}
