import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const userName = user?.firstName || user?.username || 'User'
  const userEmail = user?.emailAddresses[0]?.emailAddress || ''
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
        />

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
