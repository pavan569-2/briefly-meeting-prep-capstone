/**
 * Full-screen loading state shown while session restoration is in progress.
 * Shared by ProtectedRoute, LoginPage, and the catch-all RootRedirect.
 */
export function LoadingScreen() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    </main>
  )
}
