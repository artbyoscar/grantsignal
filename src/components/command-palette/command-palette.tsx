'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  Search,
  Kanban,
  PenTool,
  Calendar,
  FileText,
  Shield,
  BarChart3,
  Settings,
  Users,
  Plus,
  Upload,
  FileSearch,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [pages, setPages] = useState<string[]>([])

  // Track recent pages in localStorage
  useEffect(() => {
    if (pathname && open) {
      const recent = JSON.parse(localStorage.getItem('recentPages') || '[]') as string[]
      const updated = [pathname, ...recent.filter(p => p !== pathname)].slice(0, 3)
      localStorage.setItem('recentPages', JSON.stringify(updated))
    }
  }, [pathname, open])

  // Search grants when user types
  const { data: grants, isLoading: grantsLoading } = api.grants.list.useQuery(
    {
      search: search.length >= 2 ? search : undefined,
      limit: 5,
    },
    {
      enabled: open && search.length >= 2,
    }
  )

  // Search documents when user types
  const { data: documentsData, isLoading: documentsLoading } = api.documents.search.useQuery(
    {
      query: search,
      limit: 5,
    },
    {
      enabled: open && search.length >= 3,
    }
  )

  const documents = documentsData?.results || []

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', shortcut: 'G D' },
    { id: 'opportunities', label: 'Opportunities', icon: Search, href: '/opportunities', shortcut: 'G O' },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban, href: '/pipeline', shortcut: 'G P' },
    { id: 'writer', label: 'Writer', icon: PenTool, href: '/write', shortcut: 'G W' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', shortcut: 'G C' },
    { id: 'documents', label: 'Documents', icon: FileText, href: '/documents', shortcut: 'G D' },
    { id: 'compliance', label: 'Compliance', icon: Shield, href: '/compliance', shortcut: 'G M' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports', shortcut: 'G R' },
    { id: 'team', label: 'Team', icon: Users, href: '/team', shortcut: 'G T' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', shortcut: 'G S' },
  ]

  // Action items
  const actionItems = [
    { id: 'new-grant', label: 'New Grant', icon: Plus, action: () => router.push('/pipeline?action=new'), shortcut: 'N G' },
    { id: 'upload-document', label: 'Upload Document', icon: Upload, action: () => router.push('/documents?action=upload'), shortcut: 'N D' },
    { id: 'search-documents', label: 'Search Documents', icon: FileSearch, action: () => router.push('/documents'), shortcut: 'S D' },
  ]

  // Get recent pages
  const recentPages = JSON.parse(localStorage.getItem('recentPages') || '[]') as string[]
  const recentItems = recentPages
    .map(href => navigationItems.find(item => item.href === href))
    .filter(Boolean)
    .slice(0, 3)

  const handleSelect = useCallback((callback: () => void) => {
    callback()
    onOpenChange(false)
    setSearch('')
  }, [onOpenChange])

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
    onOpenChange(false)
    setSearch('')
  }, [router, onOpenChange])

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
        setSearch('')
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className="fixed inset-0 z-50"
      shouldFilter={false}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[560px] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-700 px-4">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search for grants, documents, or navigate..."
            className="w-full h-12 bg-transparent border-0 text-slate-100 placeholder:text-slate-500 focus:outline-none text-sm"
          />
          {(grantsLoading || documentsLoading) && (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Results */}
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-400">
            No results found.
          </Command.Empty>

          {/* Recent Pages */}
          {!search && recentItems.length > 0 && (
            <Command.Group heading="Recent" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                RECENT
              </div>
              {recentItems.map((item) => {
                if (!item) return null
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleNavigate(item.href)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </Command.Item>
                )
              })}
            </Command.Group>
          )}

          {/* Quick Navigation */}
          {!search && (
            <Command.Group heading="Navigation" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">QUICK NAVIGATION</div>
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    value={`nav-${item.id}`}
                    keywords={[item.label]}
                    onSelect={() => handleNavigate(item.href)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <kbd className="hidden md:inline-block px-2 py-0.5 text-xs font-mono bg-slate-900 text-slate-400 border border-slate-700 rounded">
                      {item.shortcut}
                    </kbd>
                  </Command.Item>
                )
              })}
            </Command.Group>
          )}

          {/* Actions */}
          {!search && (
            <Command.Group heading="Actions" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">ACTIONS</div>
              {actionItems.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    value={`action-${item.id}`}
                    keywords={[item.label]}
                    onSelect={() => handleSelect(item.action)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <kbd className="hidden md:inline-block px-2 py-0.5 text-xs font-mono bg-slate-900 text-slate-400 border border-slate-700 rounded">
                      {item.shortcut}
                    </kbd>
                  </Command.Item>
                )
              })}
            </Command.Group>
          )}

          {/* Grants Search Results */}
          {search.length >= 2 && grants && grants.grants.length > 0 && (
            <Command.Group heading="Grants" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">GRANTS</div>
              {grants.grants.map((grant) => {
                const grantName = grant.funder?.name || grant.opportunity?.title || 'Untitled Grant'
                const subtitle = grant.opportunity?.title || grant.notes?.substring(0, 100)

                return (
                  <Command.Item
                    key={grant.id}
                    value={`grant-${grant.id}-${grantName}-${subtitle || ''}`}
                    keywords={[grantName, subtitle || '', grant.status]}
                    onSelect={() => handleNavigate(`/write/${grant.id}`)}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="flex-1 text-sm font-medium">{grantName}</span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        grant.status === 'AWARDED' && "bg-green-500/20 text-green-400",
                        grant.status === 'SUBMITTED' && "bg-blue-500/20 text-blue-400",
                        grant.status === 'PROSPECT' && "bg-slate-600/20 text-slate-400",
                        grant.status === 'WRITING' && "bg-yellow-500/20 text-yellow-400",
                        grant.status === 'DECLINED' && "bg-red-500/20 text-red-400",
                      )}>
                        {grant.status}
                      </span>
                    </div>
                    {subtitle && (
                      <span className="text-xs text-slate-400 ml-7 line-clamp-1">{subtitle}</span>
                    )}
                  </Command.Item>
                )
              })}
            </Command.Group>
          )}

          {/* Documents Search Results */}
          {search.length >= 3 && documents && documents.length > 0 && (
            <Command.Group heading="Documents" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">DOCUMENTS</div>
              {documents.map((result) => (
                <Command.Item
                  key={result.document.id}
                  value={`doc-${result.document.id}-${result.document.name}`}
                  keywords={[result.document.name]}
                  onSelect={() => handleNavigate(`/documents?id=${result.document.id}`)}
                  className="flex flex-col gap-1 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-purple-400" />
                    <span className="flex-1 text-sm font-medium truncate">{result.document.name}</span>
                    <span className="text-xs text-slate-500">{result.relevanceScore}%</span>
                  </div>
                  {result.matchingChunks.length > 0 && (
                    <span className="text-xs text-slate-400 ml-7 line-clamp-1">
                      {result.matchingChunks[0].text}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Filtered Navigation Results */}
          {search.length >= 2 && (
            <Command.Group heading="Navigation" className="px-2 py-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">NAVIGATION</div>
              {navigationItems
                .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={`search-${item.id}`}
                      value={`search-nav-${item.id}`}
                      keywords={[item.label]}
                      onSelect={() => handleNavigate(item.href)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="flex-1 text-sm">{item.label}</span>
                    </Command.Item>
                  )
                })}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer */}
        <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </Command.Dialog>
  )
}
