'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type Grant = {
  id: string
  programId: string | null
  amountRequested: any // Decimal or number or null
  [key: string]: any
}

type Program = {
  id: string
  name: string
  _count: {
    grants: number
  }
}

type GrantsByProgramProps = {
  grants: Grant[]
  programs: Program[]
  isLoading?: boolean
}

// Color palette for programs
const PROGRAM_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
]

export function GrantsByProgram({ grants, programs, isLoading }: GrantsByProgramProps) {
  const router = useRouter()

  // Count grants by program
  const programStats = programs.map((program, index) => {
    const count = grants.filter(g => g.programId === program.id).length
    const value = grants
      .filter(g => g.programId === program.id)
      .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0)

    return {
      id: program.id,
      name: program.name,
      count,
      value,
      color: PROGRAM_COLORS[index % PROGRAM_COLORS.length],
    }
  }).filter(stat => stat.count > 0) // Only show programs with grants

  // Count grants without a program
  const unassignedCount = grants.filter(g => !g.programId).length
  const unassignedValue = grants
    .filter(g => !g.programId)
    .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0)

  if (unassignedCount > 0) {
    programStats.push({
      id: 'unassigned',
      name: 'Unassigned',
      count: unassignedCount,
      value: unassignedValue,
      color: 'bg-slate-500',
    })
  }

  const totalGrants = grants.length

  // Handle click to filter pipeline
  const handleProgramClick = (programId: string) => {
    if (programId === 'unassigned') {
      router.push('/pipeline') // Show all for unassigned
    } else {
      router.push(`/pipeline?program=${programId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Grants by Program</h2>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full animate-pulse" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    )
  }

  if (totalGrants === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Grants by Program</h2>
          <span className="text-sm text-slate-400">0 grants</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-slate-400 text-sm">No grants yet</p>
          <p className="text-slate-500 text-xs mt-1">Start adding grants to see the breakdown</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Grants by Program</h2>
        <span className="text-sm text-slate-400">{totalGrants} grants</span>
      </div>

      {/* Program bar - clickable segments */}
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
        {programStats.map((program) => (
          <button
            key={program.id}
            onClick={() => handleProgramClick(program.id)}
            className={cn(
              program.color,
              'hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            style={{ width: `${(program.count / totalGrants) * 100}%` }}
            title={`${program.name}: ${program.count} grants ($${program.value.toLocaleString()})`}
          />
        ))}
      </div>

      {/* Program list */}
      <div className="space-y-2 mt-4">
        {programStats.map((program) => (
          <button
            key={program.id}
            onClick={() => handleProgramClick(program.id)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn('w-3 h-3 rounded-full flex-shrink-0', program.color)} />
              <span className="text-sm text-white truncate">{program.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-slate-400">
                {program.count} {program.count === 1 ? 'grant' : 'grants'}
              </span>
              <span className="text-sm font-medium text-slate-300">
                ${program.value.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Total value */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">Total Pipeline Value</p>
        <p className="text-2xl font-bold text-white">
          ${grants.reduce((sum, g) => sum + Number(g.amountRequested || 0), 0).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
