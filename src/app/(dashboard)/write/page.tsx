'use client';

import { api } from '@/lib/trpc/client';
import Link from 'next/link';
import { FileEdit, Clock, DollarSign } from 'lucide-react';

export default function WriterIndexPage() {
  const { data: grantsData, isLoading } = api.grants.list.useQuery({});
  const grants = grantsData?.grants || [];

  if (isLoading) {
    return <WriterSkeleton />;
  }

  // Filter to active grants (not declined/completed)
  const activeGrants = grants.filter(g =>
    !['DECLINED', 'COMPLETED', 'CLOSED'].includes(g.status)
  ) || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">AI Writing Studio</h1>
        <p className="text-slate-400 mt-1">Select a grant to start writing</p>
      </div>

      {activeGrants.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGrants.map((grant) => (
            <Link
              key={grant.id}
              href={`/write/${grant.id}`}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-blue-400" />
                </div>
                <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                  {grant.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 mb-1">{grant.title || 'Untitled Grant'}</h3>
              <p className="text-slate-400 text-sm mb-3">{grant.funder?.name || 'Unknown Funder'}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                {grant.amount && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ${(grant.amount / 1000).toFixed(0)}K
                  </span>
                )}
                {grant.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(grant.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const EmptyState = () => (
  <div className="text-center py-12">
    <FileEdit className="w-12 h-12 text-slate-600 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-slate-300 mb-2">No grants to write</h3>
    <p className="text-slate-500 mb-4">Add a grant to your pipeline first</p>
    <Link
      href="/pipeline"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
    >
      Go to Pipeline
    </Link>
  </div>
);

const WriterSkeleton = () => (
  <div className="p-6">
    <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mb-2" />
    <div className="h-4 w-64 bg-slate-700 rounded animate-pulse mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800/50 rounded-xl p-6 h-40 animate-pulse" />
      ))}
    </div>
  </div>
);
