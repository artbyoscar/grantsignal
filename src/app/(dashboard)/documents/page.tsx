import { FileText, Upload, Search, FolderOpen, File } from 'lucide-react'

const documentTypes = [
  { name: 'All Documents', count: 0, icon: FileText },
  { name: 'Proposals', count: 0, icon: File },
  { name: 'Reports', count: 0, icon: File },
  { name: 'Budgets', count: 0, icon: File },
  { name: 'Award Letters', count: 0, icon: File },
]

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 mt-1">Your organizational memory.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by content, name, or funder..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Document Types */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Document Types</h3>
            <nav className="space-y-1">
              {documentTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.name}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{type.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{type.count}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-slate-600 transition-colors cursor-pointer mb-6">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Drop files here to upload</h3>
            <p className="text-slate-400 text-sm mb-4">
              Upload proposals, reports, budgets, and other grant documents
            </p>
            <p className="text-xs text-slate-500">
              Supports PDF, DOCX, XLSX up to 25MB each
            </p>
          </div>

          {/* Empty State */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Upload your past grant proposals, reports, and organizational documents to build your memory bank.
            </p>
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Your First Document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
