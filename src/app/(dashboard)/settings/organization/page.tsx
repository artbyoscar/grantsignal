"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrganizationSettingsPage() {
  const [organizationName, setOrganizationName] = useState("GrantSignal");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc]">
          Organization Settings
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage your organization details and preferences
        </p>
      </div>

      {/* Organization Name */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="org-name"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              Organization Name
            </label>
            <p className="mt-1 text-xs text-[#94a3b8]">
              This will be displayed across your dashboard
            </p>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f8fafc]">
              Organization Logo
            </label>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Upload a logo to personalize your organization
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-[#0f172a]">
                <span className="text-2xl text-[#94a3b8]">GS</span>
              </div>
              <Button
                variant="outline"
                className="border-slate-700 bg-[#0f172a] text-[#f8fafc] hover:bg-[#1e293b] hover:text-[#3b82f6]"
              >
                Upload Logo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-[#f8fafc]"
            >
              Timezone
            </label>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Used for deadline notifications and scheduling
            </p>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-slate-700">
                <SelectItem
                  value="America/New_York"
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  Eastern Time (ET)
                </SelectItem>
                <SelectItem
                  value="America/Chicago"
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  Central Time (CT)
                </SelectItem>
                <SelectItem
                  value="America/Denver"
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  Mountain Time (MT)
                </SelectItem>
                <SelectItem
                  value="America/Los_Angeles"
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  Pacific Time (PT)
                </SelectItem>
                <SelectItem
                  value="UTC"
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  UTC
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save Button */}
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
