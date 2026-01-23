'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Plus, X, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'

type ProgramDraft = {
  name: string
  description: string
  budget: string
}

export default function ProgramsOnboardingPage() {
  const router = useRouter()
  const updateStep = api.onboarding.updateStep.useMutation()
  const createProgram = api.programs.create.useMutation()
  const { data: existingPrograms } = api.programs.list.useQuery()

  const [programs, setPrograms] = useState<ProgramDraft[]>([])
  const [currentProgram, setCurrentProgram] = useState<ProgramDraft>({
    name: '',
    description: '',
    budget: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddProgram = () => {
    // Validate current program
    const newErrors: Record<string, string> = {}

    if (!currentProgram.name.trim()) {
      newErrors.name = 'Program name is required'
    }

    if (currentProgram.budget && isNaN(parseFloat(currentProgram.budget))) {
      newErrors.budget = 'Budget must be a valid number'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Add to list
      setPrograms([...programs, currentProgram])
      // Reset form
      setCurrentProgram({ name: '', description: '', budget: '' })
    }
  }

  const handleRemoveProgram = (index: number) => {
    setPrograms(programs.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      // Save all programs
      await Promise.all(
        programs.map((program) =>
          createProgram.mutateAsync({
            name: program.name,
            description: program.description || undefined,
            budget: program.budget ? parseFloat(program.budget) : undefined,
          })
        )
      )

      await updateStep.mutateAsync({ step: 5 })
      router.push('/onboarding/team')
    } catch (error) {
      console.error('Failed to save programs:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      await updateStep.mutateAsync({ step: 5 })
      router.push('/onboarding/team')
    } catch (error) {
      console.error('Failed to skip:', error)
    }
  }

  const handleBack = async () => {
    await updateStep.mutateAsync({ step: 3 })
    router.push('/onboarding/documents')
  }

  const totalPrograms = programs.length + (existingPrograms?.length || 0)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 4 of 6</span>
          </div>
          <Progress value={67} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">What programs does your organization run?</h1>
            <p className="text-slate-400">
              Adding programs helps us understand your work and match you with relevant funding opportunities
            </p>
          </div>

          {/* Add Program Form */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Add a Program</h2>

            {/* Program Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Program Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={currentProgram.name}
                onChange={(e) => setCurrentProgram({ ...currentProgram, name: e.target.value })}
                placeholder="e.g., Youth Mentorship, Food Bank Services"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Brief Description</Label>
              <Textarea
                id="description"
                value={currentProgram.description}
                onChange={(e) => setCurrentProgram({ ...currentProgram, description: e.target.value })}
                placeholder="What does this program do?"
                rows={3}
              />
            </div>

            {/* Annual Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Annual Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="budget"
                  type="text"
                  value={currentProgram.budget}
                  onChange={(e) => setCurrentProgram({ ...currentProgram, budget: e.target.value })}
                  placeholder="50000"
                  className={`pl-9 ${errors.budget ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
            </div>

            <Button
              type="button"
              onClick={handleAddProgram}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              Add Program
            </Button>
          </div>

          {/* Programs List */}
          {totalPrograms > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                Added Programs ({totalPrograms})
              </h3>
              <div className="space-y-2">
                {existingPrograms?.map((program) => (
                  <div
                    key={program.id}
                    className="flex items-start justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{program.name}</div>
                      {program.description && (
                        <div className="text-sm text-slate-400 mt-1">{program.description}</div>
                      )}
                      {program.budget && (
                        <div className="text-sm text-slate-500 mt-1">
                          Budget: ${parseFloat(program.budget.toString()).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {programs.map((program, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{program.name}</div>
                      {program.description && (
                        <div className="text-sm text-slate-400 mt-1">{program.description}</div>
                      )}
                      {program.budget && (
                        <div className="text-sm text-slate-500 mt-1">
                          Budget: ${parseFloat(program.budget).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveProgram(index)}
                      className="ml-3 p-1 hover:bg-slate-800 rounded"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={updateStep.isPending || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={updateStep.isPending || isSubmitting}
              className="text-slate-400"
            >
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={updateStep.isPending || isSubmitting}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
