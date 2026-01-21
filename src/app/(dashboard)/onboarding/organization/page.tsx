'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'

const PROGRAM_AREAS = [
  'Education',
  'Healthcare',
  'Environmental Conservation',
  'Arts & Culture',
  'Social Services',
  'Community Development',
  'Youth Development',
  'Workforce Development',
  'Housing',
  'Food Security',
  'Mental Health',
  'Disability Services',
  'Senior Services',
  'Animal Welfare',
  'Other',
]

export default function OrganizationSetupPage() {
  const router = useRouter()
  const { data: orgData } = api.onboarding.getStatus.useQuery()
  const updateOrg = api.onboarding.updateOrganization.useMutation()
  const updateStep = api.onboarding.updateStep.useMutation()

  const [formData, setFormData] = useState({
    name: orgData?.name || '',
    ein: orgData?.ein || '',
    mission: orgData?.mission || '',
    primaryProgramAreas: orgData?.primaryProgramAreas || [],
    geographicArea: orgData?.geographicArea || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleProgramAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryProgramAreas: prev.primaryProgramAreas.includes(area)
        ? prev.primaryProgramAreas.filter((a) => a !== area)
        : [...prev.primaryProgramAreas, area],
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    }

    if (formData.mission && formData.mission.trim().length < 10) {
      newErrors.mission = 'Mission statement should be at least 10 characters'
    }

    if (formData.primaryProgramAreas.length === 0) {
      newErrors.primaryProgramAreas = 'Select at least one program area'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateOrg.mutateAsync({
        name: formData.name,
        ein: formData.ein || undefined,
        mission: formData.mission || undefined,
        primaryProgramAreas: formData.primaryProgramAreas,
        geographicArea: formData.geographicArea || undefined,
      })

      router.push('/onboarding/documents')
    } catch (error) {
      console.error('Failed to update organization:', error)
    }
  }

  const handleBack = async () => {
    await updateStep.mutateAsync({ step: 1 })
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 2 of 4</span>
            <span className="text-slate-400">50% Complete</span>
          </div>
          <Progress value={50} />
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Tell us about your organization</h1>
            <p className="text-slate-400">
              This information helps us match you with relevant funding opportunities
            </p>
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your organization name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* EIN */}
          <div className="space-y-2">
            <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
            <Input
              id="ein"
              value={formData.ein}
              onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
              placeholder="XX-XXXXXXX (optional, enables 990 lookup)"
            />
            <p className="text-xs text-slate-500">
              Providing your EIN enables us to gather insights from IRS 990 filings
            </p>
          </div>

          {/* Mission Statement */}
          <div className="space-y-2">
            <Label htmlFor="mission">Mission Statement</Label>
            <Textarea
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              placeholder="Describe your organization's mission and primary goals..."
              rows={4}
              className={errors.mission ? 'border-red-500' : ''}
            />
            {errors.mission && <p className="text-sm text-red-500">{errors.mission}</p>}
          </div>

          {/* Program Areas */}
          <div className="space-y-3">
            <Label>
              Primary Program Areas <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PROGRAM_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleProgramAreaToggle(area)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.primaryProgramAreas.includes(area)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            {errors.primaryProgramAreas && (
              <p className="text-sm text-red-500">{errors.primaryProgramAreas}</p>
            )}
          </div>

          {/* Geographic Service Area */}
          <div className="space-y-2">
            <Label htmlFor="geographicArea">Geographic Service Area</Label>
            <Input
              id="geographicArea"
              value={formData.geographicArea}
              onChange={(e) => setFormData({ ...formData, geographicArea: e.target.value })}
              placeholder="e.g., Los Angeles County, California, National"
            />
            <p className="text-xs text-slate-500">
              Where does your organization primarily operate?
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={updateStep.isPending}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={updateOrg.isPending}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
