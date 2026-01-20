import { Search, Upload, Zap, Database, Brain, ExternalLink } from 'lucide-react'

export default function OpportunitiesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Smart Discovery</h1>
        <p className="text-slate-400 mt-1">Find and analyze grant opportunities.</p>
      </div>

      {/* Main Input Area */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <h2 className="text-lg font-semibold text-white mb-4">Analyze Opportunity</h2>
        <p className="text-slate-400 text-sm mb-6">
          Paste a grant URL or upload an RFP document to get instant fit analysis.
        </p>

        {/* URL Input */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Paste grant URL or RFP link..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Analyze
          </button>
        </div>

        {/* Or divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-sm text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer">
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Drop RFP document here</p>
          <p className="text-sm text-slate-500 mt-1">PDF, DOCX up to 25MB</p>
        </div>
      </div>

      {/* Intelligence Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Active Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <Database className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">Grants.gov API</p>
              <p className="text-xs text-slate-500">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <ExternalLink className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">ProPublica 990</p>
              <p className="text-xs text-slate-500">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <Brain className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">Organizational Memory</p>
              <p className="text-xs text-slate-500">No documents yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State for Opportunities */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No opportunities analyzed yet</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Paste a grant URL or upload an RFP above to see fit scores, reusable content analysis, and funder intelligence.
        </p>
      </div>
    </div>
  )
}
