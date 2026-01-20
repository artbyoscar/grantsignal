import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        {/* Sidebar will go here */}
        <aside className="w-64 min-h-screen bg-slate-800 border-r border-slate-700 p-4">
          <div className="text-xl font-bold text-white mb-8">GrantSignal</div>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded">Dashboard</a>
            <a href="/opportunities" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded">Opportunities</a>
            <a href="/pipeline" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded">Pipeline</a>
            <a href="/documents" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded">Documents</a>
            <a href="/compliance" className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded">Compliance</a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
