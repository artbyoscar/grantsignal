'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import {
  FileText, Clock, CheckCircle, AlertTriangle,
  ChevronDown, Search, Filter, Download,
  Calendar, Building2, Tag
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import Link from 'next/link';
import Papa from 'papaparse';

const TYPE_LABELS: Record<string, string> = {
  DELIVERABLE: 'Deliverable',
  OUTCOME_METRIC: 'Outcome Metric',
  REPORT_DUE: 'Report Due',
  BUDGET_SPEND: 'Budget',
  STAFFING: 'Staffing',
  TIMELINE: 'Timeline'
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
};

export default function CommitmentsPage() {
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    search: ''
  });

  const { data, isLoading } = api.compliance.listCommitments.useQuery({
    status: filters.status as any,
    type: filters.type as any,
    limit: 100
  });

  const filteredCommitments = data?.commitments.filter(c => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return c.description.toLowerCase().includes(searchLower) ||
             c.metricName?.toLowerCase().includes(searchLower) ||
             c.grant?.funder?.name?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const getEffectiveStatus = (commitment: any) => {
    if (commitment.status === 'PENDING' && commitment.dueDate && isPast(new Date(commitment.dueDate))) {
      return 'OVERDUE';
    }
    return commitment.status;
  };

  const handleExportCSV = () => {
    if (!filteredCommitments) return;

    const csvData = filteredCommitments.map(c => ({
      'Grant': c.grant?.funder?.name || 'Unknown',
      'Description': c.description,
      'Type': TYPE_LABELS[c.type] || c.type,
      'Status': c.status,
      'Due Date': c.dueDate ? format(new Date(c.dueDate), 'yyyy-MM-dd') : '',
      'Metric Name': c.metricName || '',
      'Metric Value': c.metricValue || '',
      'Confidence': c.confidence || '',
      'Extracted By': c.extractedBy,
      'Verified': c.verifiedAt ? 'Yes' : 'No'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commitments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/compliance" className="hover:text-white">Compliance</Link>
            <span>/</span>
            <span className="text-white">Commitment Registry</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Commitment Registry</h1>
          <p className="text-slate-400 mt-1">All promises made to funders across your grants</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search commitments..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value || undefined }))}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Commitments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Commitment</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Grant / Funder</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Due Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Metric</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-6 bg-slate-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filteredCommitments?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No commitments found matching your filters.
                </td>
              </tr>
            ) : (
              filteredCommitments?.map((commitment) => {
                const status = getEffectiveStatus(commitment);
                const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={commitment.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-white font-medium">{commitment.description}</p>
                      {commitment.confidence && commitment.confidence < 80 && (
                        <span className="text-xs text-amber-400">
                          AI extracted ({commitment.confidence}% confidence)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">
                          {commitment.grant?.funder?.name || 'Unknown Funder'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                        {TYPE_LABELS[commitment.type] || commitment.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {commitment.dueDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className={`text-sm ${
                            isPast(new Date(commitment.dueDate)) ? 'text-red-400' :
                            differenceInDays(new Date(commitment.dueDate), new Date()) <= 14 ? 'text-amber-400' :
                            'text-slate-300'
                          }`}>
                            {format(new Date(commitment.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">No date</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {commitment.metricName && commitment.metricValue ? (
                        <div className="text-sm">
                          <span className="text-slate-400">{commitment.metricName}:</span>
                          <span className="text-white ml-1 font-medium">{commitment.metricValue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
