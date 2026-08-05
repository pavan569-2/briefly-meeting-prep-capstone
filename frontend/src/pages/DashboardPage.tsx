import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError(null)
    try {
      await signOut()
      // Navigation is handled automatically: onAuthStateChange fires with
      // a null session, ProtectedRoute detects the unauthenticated state,
      // and redirects to /login.
    } catch {
      // Never expose the raw Supabase error to the user.
      setSignOutError('Sign out failed. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white mb-3">Briefly</h1>
        <p className="text-xl text-gray-400 mb-10">AI Meeting Prep Assistant</p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 px-8 py-6 mb-8 inline-block text-left">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
            Signed in as
          </p>
          <p className="text-white font-medium text-sm">{user?.email ?? 'Unknown'}</p>
        </div>

        {signOutError && (
          <p role="alert" className="text-red-400 text-sm mb-4">
            {signOutError}
          </p>
        )}

        <div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950 text-sm"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </main>
  )
}
