"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function NotificationsSettingsPage() {
  const [grantDeadlines, setGrantDeadlines] = useState(true);
  const [documentProcessing, setDocumentProcessing] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [deadlineThreshold, setDeadlineThreshold] = useState([7]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc]">Notifications</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage your email preferences and alert settings
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">
          Email Notifications
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="grant-deadlines"
                className="text-sm font-medium text-[#f8fafc] cursor-pointer"
              >
                Grant Deadlines
              </label>
              <p className="text-xs text-[#94a3b8]">
                Receive alerts about upcoming grant application deadlines
              </p>
            </div>
            <Switch
              id="grant-deadlines"
              checked={grantDeadlines}
              onCheckedChange={setGrantDeadlines}
              className="data-[state=checked]:bg-[#3b82f6]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="document-processing"
                className="text-sm font-medium text-[#f8fafc] cursor-pointer"
              >
                Document Processing
              </label>
              <p className="text-xs text-[#94a3b8]">
                Get notified when document analysis is complete
              </p>
            </div>
            <Switch
              id="document-processing"
              checked={documentProcessing}
              onCheckedChange={setDocumentProcessing}
              className="data-[state=checked]:bg-[#3b82f6]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="team-updates"
                className="text-sm font-medium text-[#f8fafc] cursor-pointer"
              >
                Team Updates
              </label>
              <p className="text-xs text-[#94a3b8]">
                Receive updates when team members make changes
              </p>
            </div>
            <Switch
              id="team-updates"
              checked={teamUpdates}
              onCheckedChange={setTeamUpdates}
              className="data-[state=checked]:bg-[#3b82f6]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="weekly-digest"
                className="text-sm font-medium text-[#f8fafc] cursor-pointer"
              >
                Weekly Digest
              </label>
              <p className="text-xs text-[#94a3b8]">
                Get a weekly summary of your grant activity
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
              className="data-[state=checked]:bg-[#3b82f6]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">
          Alert Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#f8fafc]">
                Deadline Alert Threshold
              </label>
              <span className="text-sm font-medium text-[#3b82f6]">
                {deadlineThreshold[0]} days
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mb-4">
              Receive alerts when a deadline is within this many days
            </p>
            <Slider
              value={deadlineThreshold}
              onValueChange={setDeadlineThreshold}
              min={3}
              max={30}
              step={1}
              className="[&_[role=slider]]:bg-[#3b82f6] [&_[role=slider]]:border-[#3b82f6]"
            />
            <div className="mt-2 flex justify-between text-xs text-[#94a3b8]">
              <span>3 days</span>
              <span>30 days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">
          Notification Channels
        </h3>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#f8fafc]">Email</p>
                <p className="text-xs text-[#94a3b8]">
                  Notifications sent to your registered email
                </p>
              </div>
              <span className="rounded-full bg-[#22c55e]/10 px-2 py-1 text-xs font-medium text-[#22c55e]">
                Active
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#f8fafc]">Slack</p>
                <p className="text-xs text-[#94a3b8]">
                  Push notifications to your Slack workspace
                </p>
              </div>
              <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-[#94a3b8]">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#3b82f6] text-white hover:bg-[#2563eb]"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
