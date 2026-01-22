'use client'

import { useMemo } from 'react'
import { Filter, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Grant } from '@/types/client-types'
import type { FilterState } from './pipeline-kanban'

interface PipelineFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  grants: Grant[]
}

export function PipelineFilters({ filters, onFiltersChange, grants }: PipelineFiltersProps) {
  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const funders = new Set<{ id: string; name: string }>()
    const programAreas = new Set<{ id: string; name: string }>()
    const assignees = new Set<{ id: string; name: string }>()

    grants.forEach((grant) => {
      if (grant.funder) {
        funders.add({ id: grant.funderId!, name: grant.funder.name })
      }
      if (grant.program) {
        programAreas.add({ id: grant.programId!, name: grant.program.name })
      }
      if (grant.assignedTo) {
        assignees.add({
          id: grant.assignedToId!,
          name: grant.assignedTo.displayName || 'Unknown',
        })
      }
    })

    return {
      funders: Array.from(funders).sort((a, b) => a.name.localeCompare(b.name)),
      programAreas: Array.from(programAreas).sort((a, b) => a.name.localeCompare(b.name)),
      assignees: Array.from(assignees).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [grants])

  const hasActiveFilters = Object.values(filters).some((value) => value !== 'all')

  const clearFilters = () => {
    onFiltersChange({
      funder: 'all',
      programArea: 'all',
      assignee: 'all',
      deadline: 'all',
      sortBy: 'deadline',
    })
  }

  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-900/30">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Funder Filter */}
      <Select
        value={filters.funder}
        onValueChange={(value) => onFiltersChange({ ...filters, funder: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Funders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Funders</SelectItem>
          {filterOptions.funders.map((funder) => (
            <SelectItem key={funder.id} value={funder.id}>
              {funder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Program Area Filter */}
      <Select
        value={filters.programArea}
        onValueChange={(value) => onFiltersChange({ ...filters, programArea: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {filterOptions.programAreas.map((program) => (
            <SelectItem key={program.id} value={program.id}>
              {program.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select
        value={filters.assignee}
        onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {filterOptions.assignees.map((assignee) => (
            <SelectItem key={assignee.id} value={assignee.id}>
              {assignee.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Deadline Filter */}
      <Select
        value={filters.deadline}
        onValueChange={(value) => onFiltersChange({ ...filters, deadline: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Deadlines" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Deadlines</SelectItem>
          <SelectItem value="week">Next 7 Days</SelectItem>
          <SelectItem value="month">Next 30 Days</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select
        value={filters.sortBy}
        onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deadline">Deadline</SelectItem>
          <SelectItem value="amount">Amount</SelectItem>
          <SelectItem value="funder">Funder</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  )
}
