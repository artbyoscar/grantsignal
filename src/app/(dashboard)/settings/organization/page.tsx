"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/ui/toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface ProgramFormData {
  id?: string;
  name: string;
  description: string;
  budget: string;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function OrganizationSettingsPage() {
  const utils = trpc.useUtils();

  // Fetch organization data
  const { data: org, isLoading: orgLoading } = trpc.organizations.getById.useQuery();
  const { data: programs = [], isLoading: programsLoading } = trpc.programs.list.useQuery();

  // Mutations
  const updateOrg = trpc.organizations.update.useMutation({
    onSuccess: () => {
      toast.success("Organization settings saved successfully");
      utils.organizations.getById.invalidate();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save organization settings");
    },
  });

  const createProgram = trpc.programs.create.useMutation({
    onSuccess: () => {
      toast.success("Program created successfully");
      utils.programs.list.invalidate();
      setShowProgramForm(false);
      setProgramFormData({ name: "", description: "", budget: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create program");
    },
  });

  const updateProgram = trpc.programs.update.useMutation({
    onSuccess: () => {
      toast.success("Program updated successfully");
      utils.programs.list.invalidate();
      setShowProgramForm(false);
      setEditingProgramId(null);
      setProgramFormData({ name: "", description: "", budget: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update program");
    },
  });

  const deleteProgram = trpc.programs.delete.useMutation({
    onSuccess: () => {
      toast.success("Program deleted successfully");
      utils.programs.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete program");
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    ein: "",
    website: "",
    phone: "",
    mission: "",
    theoryOfChange: "",
    fiscalYearStart: undefined as number | undefined,
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programFormData, setProgramFormData] = useState<ProgramFormData>({
    name: "",
    description: "",
    budget: "",
  });

  // Initialize form data when org loads
  useEffect(() => {
    if (org) {
      const address = org.address as { street?: string; city?: string; state?: string; zip?: string } | null;
      setFormData({
        name: org.name || "",
        ein: org.ein || "",
        website: org.website || "",
        phone: org.phone || "",
        mission: org.mission || "",
        theoryOfChange: org.theoryOfChange || "",
        fiscalYearStart: org.fiscalYearStart || undefined,
        address: {
          street: address?.street || "",
          city: address?.city || "",
          state: address?.state || "",
          zip: address?.zip || "",
        },
      });
    }
  }, [org]);

  const handleSave = async () => {
    updateOrg.mutate({
      name: formData.name || undefined,
      ein: formData.ein || undefined,
      website: formData.website || undefined,
      phone: formData.phone || undefined,
      mission: formData.mission || undefined,
      theoryOfChange: formData.theoryOfChange || undefined,
      fiscalYearStart: formData.fiscalYearStart,
      address: formData.address,
    });
  };

  const handleProgramSubmit = () => {
    const budget = programFormData.budget ? parseFloat(programFormData.budget) : undefined;

    if (editingProgramId) {
      updateProgram.mutate({
        id: editingProgramId,
        name: programFormData.name || undefined,
        description: programFormData.description || undefined,
        budget,
      });
    } else {
      createProgram.mutate({
        name: programFormData.name,
        description: programFormData.description || undefined,
        budget,
      });
    }
  };

  const handleEditProgram = (program: any) => {
    setEditingProgramId(program.id);
    setProgramFormData({
      id: program.id,
      name: program.name,
      description: program.description || "",
      budget: program.budget ? program.budget.toString() : "",
    });
    setShowProgramForm(true);
  };

  const handleDeleteProgram = (programId: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      deleteProgram.mutate({ id: programId });
    }
  };

  const handleCancelProgramForm = () => {
    setShowProgramForm(false);
    setEditingProgramId(null);
    setProgramFormData({ name: "", description: "", budget: "" });
  };

  if (orgLoading || programsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc]">
          Organization Settings
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage your organization profile and program details
        </p>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium text-[#f8fafc]">
              Organization Name
            </label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setHasChanges(true);
              }}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>

          <div>
            <label htmlFor="ein" className="block text-sm font-medium text-[#f8fafc]">
              EIN (Employer Identification Number)
            </label>
            <p className="mt-1 text-xs text-[#94a3b8]">Format: XX-XXXXXXX</p>
            <Input
              id="ein"
              value={formData.ein}
              onChange={(e) => {
                setFormData({ ...formData, ein: e.target.value });
                setHasChanges(true);
              }}
              placeholder="12-3456789"
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-[#f8fafc]">
              Website URL
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => {
                setFormData({ ...formData, website: e.target.value });
                setHasChanges(true);
              }}
              placeholder="https://example.org"
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#f8fafc]">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                setHasChanges(true);
              }}
              placeholder="(555) 123-4567"
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">Address</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-[#f8fafc]">
              Street Address
            </label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                });
                setHasChanges(true);
              }}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-[#f8fafc]">
                City
              </label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-[#f8fafc]">
                State
              </label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              />
            </div>
          </div>

          <div className="w-1/2 pr-2">
            <label htmlFor="zip" className="block text-sm font-medium text-[#f8fafc]">
              ZIP Code
            </label>
            <Input
              id="zip"
              value={formData.address.zip}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  address: { ...formData.address, zip: e.target.value },
                });
                setHasChanges(true);
              }}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>
        </div>
      </div>

      {/* Mission & Theory of Change */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">Mission & Impact</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="mission" className="block text-sm font-medium text-[#f8fafc]">
              Mission Statement
            </label>
            <Textarea
              id="mission"
              value={formData.mission}
              onChange={(e) => {
                setFormData({ ...formData, mission: e.target.value });
                setHasChanges(true);
              }}
              rows={4}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              placeholder="Your organization's mission statement..."
            />
          </div>

          <div>
            <label htmlFor="theoryOfChange" className="block text-sm font-medium text-[#f8fafc]">
              Theory of Change
            </label>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Critical for AI content generation - describe how your work creates change
            </p>
            <Textarea
              id="theoryOfChange"
              value={formData.theoryOfChange}
              onChange={(e) => {
                setFormData({ ...formData, theoryOfChange: e.target.value });
                setHasChanges(true);
              }}
              rows={6}
              className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              placeholder="Describe your theory of change: the pathway from activities to outcomes to long-term impact..."
            />
          </div>
        </div>
      </div>

      {/* Fiscal Settings */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#f8fafc]">Fiscal Settings</h3>
        <div>
          <label htmlFor="fiscalYear" className="block text-sm font-medium text-[#f8fafc]">
            Fiscal Year Start Month
          </label>
          <Select
            value={formData.fiscalYearStart?.toString() || ""}
            onValueChange={(value) => {
              setFormData({ ...formData, fiscalYearStart: parseInt(value) });
              setHasChanges(true);
            }}
          >
            <SelectTrigger className="mt-2 bg-[#0f172a] border-slate-700 text-[#f8fafc] focus:border-[#3b82f6] focus:ring-[#3b82f6]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-slate-700">
              {MONTHS.map((month) => (
                <SelectItem
                  key={month.value}
                  value={month.value.toString()}
                  className="text-[#f8fafc] focus:bg-[#0f172a] focus:text-[#3b82f6]"
                >
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Programs Management */}
      <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#f8fafc]">Programs</h3>
            <p className="text-sm text-[#94a3b8]">Manage your organization's programs for grant categorization</p>
          </div>
          <Button
            onClick={() => setShowProgramForm(true)}
            className="bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Button>
        </div>

        {showProgramForm && (
          <div className="mb-4 p-4 rounded-lg bg-[#0f172a] border border-slate-600">
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-3">
              {editingProgramId ? "Edit Program" : "New Program"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#f8fafc] mb-1">
                  Program Name *
                </label>
                <Input
                  value={programFormData.name}
                  onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                  className="bg-[#1e293b] border-slate-700 text-[#f8fafc]"
                  placeholder="e.g., Youth Education"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f8fafc] mb-1">
                  Description
                </label>
                <Textarea
                  value={programFormData.description}
                  onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                  className="bg-[#1e293b] border-slate-700 text-[#f8fafc]"
                  rows={2}
                  placeholder="Brief description of the program"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f8fafc] mb-1">
                  Annual Budget
                </label>
                <Input
                  type="number"
                  value={programFormData.budget}
                  onChange={(e) => setProgramFormData({ ...programFormData, budget: e.target.value })}
                  className="bg-[#1e293b] border-slate-700 text-[#f8fafc]"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleProgramSubmit}
                  disabled={!programFormData.name || createProgram.isPending || updateProgram.isPending}
                  className="bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                >
                  {editingProgramId ? "Update" : "Create"} Program
                </Button>
                <Button
                  onClick={handleCancelProgramForm}
                  variant="outline"
                  className="border-slate-700 bg-transparent text-[#f8fafc] hover:bg-[#0f172a]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {programs.length === 0 && !showProgramForm ? (
          <div className="text-center py-8 text-[#94a3b8]">
            No programs yet. Add one to start categorizing grants.
          </div>
        ) : (
          <div className="space-y-2">
            {programs.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0f172a] border border-slate-700"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-[#f8fafc]">{program.name}</h4>
                  {program.description && (
                    <p className="text-sm text-[#94a3b8] mt-1">{program.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-[#64748b]">
                    {program.budget && (
                      <span>Budget: ${parseFloat(program.budget.toString()).toLocaleString()}</span>
                    )}
                    <span>{program._count.grants} grants</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleEditProgram(program)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-transparent text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#3b82f6]"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteProgram(program.id)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-transparent text-[#94a3b8] hover:bg-[#1e293b] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button - Sticky */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-700 p-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateOrg.isPending}
          className="bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-50"
        >
          {updateOrg.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
