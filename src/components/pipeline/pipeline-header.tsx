"use client";

import { LayoutList, Columns3, List, Calendar, ChevronDown, ArrowUpDown } from "lucide-react";

interface PipelineHeaderProps {
  totalValue: number;
  totalGrants: number;
  view: 'kanban' | 'list' | 'calendar';
  onViewChange: (view: 'kanban' | 'list' | 'calendar') => void;
  onAddGrant: () => void;
}

export function PipelineHeader({
  totalValue,
  totalGrants,
  view,
  onViewChange,
  onAddGrant,
}: PipelineHeaderProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Top row: View toggles and Add Grant button */}
      <div className="flex items-center justify-between">
        {/* View toggles */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              view === 'list'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            aria-label="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              view === 'kanban'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            aria-label="Kanban view"
          >
            <Columns3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              view === 'list'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            aria-label="List text view"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              view === 'calendar'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            aria-label="Calendar view"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Add Grant button */}
        <button
          onClick={onAddGrant}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-medium transition-colors"
        >
          Add Grant +
        </button>
      </div>

      {/* Second row: Filters and Total Value */}
      <div className="flex items-center justify-between">
        {/* Filter dropdowns */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Funder
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Program Area
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Assignee
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Deadline
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Sort
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Total Pipeline Value */}
        <div className="text-slate-100 font-semibold">
          Total Pipeline Value: {formatCurrency(totalValue)}
        </div>
      </div>
    </div>
  );
}
